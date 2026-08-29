import type { Board, Decision, DecisionOption, GameState, SpaceId, SpinValue } from '@domain/model/types'

/**
 * Choosing which road to take — the wheel's, not the player's.
 *
 * A fork used to be a choice a player made deliberately, which experience
 * could load: whoever already knew which road paid better always took it,
 * an advantage a first-time player never had. `resolveForkBranch` is what a
 * fork is now instead — the same roll that decides how far a player travels
 * also decides *which* road they travel it down, 1-5 the first, 6-10 the
 * second, so a fork costs nobody a choice to get right or wrong.
 */

export function isFork(board: Board, spaceId: SpaceId): boolean {
  return (board.spaces[spaceId]?.next.length ?? 0) > 1
}

/**
 * The two road names a fork at `spaceId` leads to, in roll order (1-5 the
 * first, 6-10 the second) — or `undefined` when `spaceId` isn't a fork.
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
export function forkRoadNames(board: Board, spaceId: SpaceId): readonly [string, string] | undefined {
  const space = board.spaces[spaceId]
  if (!space || space.next.length < 2) return undefined
  const [firstId, secondId] = space.next
  const nameOf = (id: SpaceId): string => {
    const target = board.spaces[id]
    return target?.lane?.name ?? target?.title ?? 'a new road'
  }
  return [nameOf(firstId!), nameOf(secondId!)]
}

/**
 * The road `roll` sends a player at `spaceId` down, or `undefined` when
 * `spaceId` is not a fork at all. Shared by `spin` (the ordinary case: a
 * player standing on a fork at the top of their turn) and `settle` (the
 * rarer one: a longer roll started elsewhere and reaches the fork with
 * distance still owed) so both resolve a fork exactly the same way.
 */
export function resolveForkBranch(board: Board, spaceId: SpaceId, roll: SpinValue): SpaceId | undefined {
  const space = board.spaces[spaceId]
  return space?.next[roll <= 5 ? 0 : 1]
}

/**
 * The decision offered at a fork. `steps` is the distance already rolled when
 * the fork interrupts a move in progress, and null when the choice is being
 * made before the wheel is spun at all.
 */
export function branchDecision(board: Board, spaceId: SpaceId, steps: number | null): Decision {
  const space = board.spaces[spaceId]
  if (!space) throw new Error(`branchDecision: unknown space "${spaceId}"`)

  const options: DecisionOption[] = space.next.map((nextId) => {
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
      ? 'Which way do you go? Choose your road, then spin.'
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
