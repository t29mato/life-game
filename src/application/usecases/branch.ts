import type { Board, Decision, DecisionOption, GameState, Player, SpaceId, SpinValue } from '@domain/model/types'
import { SPIN_FACES } from '@domain/model/constants'

/**
 * Choosing which road to take — the wheel's, not the player's.
 *
 * A fork used to be a choice a player made deliberately, which experience
 * could load: whoever already knew which road paid better always took it,
 * an advantage a first-time player never had. `resolveForkBranch` is what a
 * fork is now instead — a roll decides *which* road, 1-3 the first, 4-6 the
 * second, so a fork costs nobody a choice to get right or wrong.
 *
 * That roll settles the road and nothing else: a second press decides how far
 * down it the player actually travels. One roll doing both jobs meant the far
 * road could only ever be entered on a 4, 5 or 6 — which is also four, five or
 * six tiles of it swept past unseen, so its opening tiles were unreachable by
 * construction. See `spin.ts`, where the two presses live.
 */

export function isFork(board: Board, spaceId: SpaceId): boolean {
  return (board.spaces[spaceId]?.next.length ?? 0) > 1
}

/**
 * Whether this road is open to this player at all.
 *
 * The board's one conditional road is grad school, and the condition is the
 * degree — see `LaneIdentity.requires`, where the vocabulary lives and why it
 * is a property of the lane rather than of a country's route. Every other road
 * ever written is open to everybody, so this answers `true` for all of them
 * without the lane having to say anything.
 *
 * `'doctorate'` reads narrower than `'degree'`: a lane gated on it stays
 * closed to a player who holds any lesser degree, and opens only once
 * `hasDoctorate` is set — which the engine only ever does at the one tile
 * gated behind `'degree'` already, so this can never be the *only* gate a
 * player clears on their way in.
 *
 * A missing space answers `true` rather than `false`, deliberately: a road
 * that is not on the board is somebody else's bug to report, and failing
 * *open* here degrades to exactly the behaviour that shipped before gates
 * existed rather than quietly stranding a player at a junction.
 */
export function roadIsOpenTo(board: Board, roadId: SpaceId, player: Player): boolean {
  const requires = board.spaces[roadId]?.lane?.requires
  if (requires === undefined) return true
  return requires === 'doctorate' ? player.hasDoctorate : player.hasDegree
}

/**
 * The roads out of `spaceId` this player may actually be sent down, in roll
 * order. Empty when `spaceId` is not a fork.
 *
 * This is the one place the gate is applied, and everything else about a fork
 * — which road a roll picks, which names the rail prints — is expressed in
 * terms of it, so a closed road cannot be offered by one and taken by the
 * other. If a route ever gates both roads of a fork the whole list survives:
 * a junction nobody can leave is a broken board, not a player's problem, and
 * `validateRoute` refuses one long before anybody plays it.
 */
function roadsOpenTo(board: Board, spaceId: SpaceId, player: Player): readonly SpaceId[] {
  const space = board.spaces[spaceId]
  if (!space || space.next.length < 2) return []
  const open = space.next.filter((roadId) => roadIsOpenTo(board, roadId, player))
  return open.length > 0 ? open : space.next
}

/**
 * What a road calls itself: the lane's own name where it has one, and the
 * first tile's title where it does not, which is all an unnamed branch has to
 * offer. Every place that has to say which way somebody went — the log, the
 * dock, the fork rail — says it in exactly these words.
 */
export function roadName(board: Board, spaceId: SpaceId): string {
  const target = board.spaces[spaceId]
  return target?.lane?.name ?? target?.title ?? 'a new road'
}

/**
 * The two road names a fork at `spaceId` leads to, in roll order (1-3 the
 * first, 4-6 the second) — or `undefined` when `spaceId` isn't a fork.
 *
 * A fork's own significance went dark the moment `turnStart` stopped raising
 * a `branch` decision for it: the player used to be told "which way do you
 * go?" with both roads named before the wheel was even pressed, and losing
 * that framing left the fork-resolving spin looking identical to an
 * ordinary movement roll — nothing on screen said this particular press
 * also settled a road, so the result read as decided *for* the player
 * rather than *by* the press they had just made. This is what the rail
 * shows instead, ahead of the spin, so a fork stays visibly a fork.
 */
export function forkRoadNames(
  board: Board,
  spaceId: SpaceId,
  player: Player,
): readonly [string, string] | undefined {
  const open = roadsOpenTo(board, spaceId, player)
  // A player only one of whose roads is open is not standing at a fork, they
  // are standing on the road. Naming two of them would promise a choice the
  // die has already been told not to make — the exact misreading this rail
  // was built to prevent, arriving from the other direction.
  if (open.length < 2) return undefined
  const [firstId, secondId] = open
  return [roadName(board, firstId!), roadName(board, secondId!)]
}

/**
 * The road `roll` sends a player at `spaceId` down, or `undefined` when
 * `spaceId` is not a fork at all.
 *
 * `spin` is the only caller, and that is the point. A junction reached
 * mid-move used to be settled by `settle` instead, on `state.stepsRemaining`
 * — the distance left over from a roll that had already spent pips getting
 * there. A leftover is not a die: it is never 6, it is 5 only on a 6 thrown
 * from the tile next door, and its mass sits on 1, 2 and 3, which this
 * function reads as the first road. Measured across every board and
 * difficulty, that sent 73-86% of everyone who reached the mid-career
 * junction that way up the same road, which is what the owner reported as
 * "the second fork always goes up". So a junction now pauses the move and
 * comes back through here on a press of its own; see `settle.ts` and
 * `src/test/forkReality.test.ts`, which is the guard.
 */
export function resolveForkBranch(
  board: Board,
  spaceId: SpaceId,
  roll: SpinValue,
  player: Player,
): SpaceId | undefined {
  const open = roadsOpenTo(board, spaceId, player)
  /*
   * The whole gate, in one line, and this is the only line it needs.
   *
   * `spin` resolves *any* tile with two exits through here, whether the pawn
   * began the turn on it or was parked there by a move that ran into it —
   * there is no other way onto a road anywhere in the game — so a road
   * filtered out here is a road that cannot be reached, full stop. Somebody
   * who never went to college is left with one road, and
   * one road is not a fork: they take it whatever the die says, which is
   * exactly what "grad school was never on the table" means mechanically.
   */
  if (open.length < 2) return open[0] ?? board.spaces[spaceId]?.next[0]
  // An even split over the die's six faces: the low half takes the first road,
  // the high half the second, exactly as the low and high halves of the old
  // ten-wedge wheel did.
  return open[roll <= SPIN_FACES / 2 ? 0 : 1]
}

/**
 * The decision offered at a fork. `steps` is the distance already rolled when
 * the fork interrupts a move in progress, and null when the choice is being
 * made before the wheel is spun at all.
 */
export function branchDecision(
  board: Board,
  spaceId: SpaceId,
  steps: number | null,
  player: Player,
): Decision {
  const space = board.spaces[spaceId]
  if (!space) throw new Error(`branchDecision: unknown space "${spaceId}"`)

  // Gated the same way the die is. Nothing reaches this in the live game any
  // more, but a fallback that offered a road `resolveForkBranch` refuses is a
  // fallback that would hand out the very thing the gate exists to withhold.
  const roads = roadsOpenTo(board, spaceId, player)
  const options: DecisionOption[] = (roads.length > 0 ? roads : space.next).map((nextId) => {
    const target = board.spaces[nextId]
    if (!target) throw new Error(`branchDecision: fork points to unknown space "${nextId}"`)
    return {
      id: target.id,
      // A lane names itself where it can; otherwise fall back to the first
      // tile, which is all an unnamed branch has to offer.
      label: target.lane?.name ?? target.title,
      description: target.lane?.summary ?? target.description,
      icon: target.icon,
    }
  })

  const prompt =
    steps === null
      ? 'Which way do you go?'
      : steps > 0
        ? `Which way do you go? You'll travel ${steps} space${steps === 1 ? '' : 's'} down it.`
        : 'Which way do you go?'

  return { kind: 'branch', prompt, options }
}

/**
 * What a player faces the moment their turn begins: the wheel, always.
 *
 * A fork used to stop here and ask which road first — see `spin.ts` for
 * where that choice moved to, and why. Standing on a fork is no longer
 * special at the *start* of a turn; `spin` reads the board itself and
 * settles it the moment the wheel is actually pressed.
 */
export function turnStart(
  _state: GameState,
  _playerIndex: number,
): Pick<GameState, 'phase' | 'pendingDecision'> {
  return { phase: 'awaitingSpin', pendingDecision: null }
}
