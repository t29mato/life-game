import type { GameState } from '@domain/model/types'
import { nextMovementLeg, planMovement, planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { appendLog } from './logging'
import { isFork, resolveForkBranch, roadName } from './branch'
import type { UseCaseDeps } from './types'

/** Spins for the current player: the road out of a fork, or the distance travelled. */
export function spin(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'awaitingSpin' && state.phase !== 'awaitingDistanceSpin') {
    throw new Error(`spin: only valid in 'awaitingSpin' or 'awaitingDistanceSpin', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('spin: no current player')

  const spinValue = deps.random.spin()

  /*
   * A fork used to be a choice, made before this spin, by whoever was
   * experienced enough to already know which road paid better — a real
   * advantage a first-time player never had. It is the die's own call now:
   * 1-3 takes the first road, 4-6 the second.
   *
   * And that is *all* this press decides. It used to be the distance as
   * well, which quietly cost the far road its own opening: the smallest
   * roll that sends anybody down it is a 4, and a 4 carries them four
   * tiles past the tile they were sent there to reach. Straight to Work's
   * career fair sits on tile one precisely so it is the first thing that
   * happens to whoever takes that road, and nobody had ever landed on it.
   * So the road is settled here and the distance is a press of its own,
   * which is what makes every tile on both roads reachable — exactly as
   * every tile on the trunk road already is.
   */
  // Asked of the board first, and only then of the roll: a low roll picks the
  // first exit off *any* tile, so `resolveForkBranch` alone would answer for
  // an ordinary one-road tile too — and read that road as a fork settled.
  if (state.chosenExit === null && isFork(state.board, player.spaceId)) {
    const branchTaken = resolveForkBranch(state.board, player.spaceId, spinValue, player)
    if (branchTaken !== undefined) {
      const label = roadName(state.board, branchTaken)
      const forkLog = `${player.name} spins a ${spinValue} — the fork sends them onto ${label}.`
      return {
        ...state,
        chosenExit: branchTaken,
        lastSpin: spinValue,
        phase: 'awaitingDistanceSpin',
        log: appendLog(state, player.id, forkLog, 'info'),
      }
    }
  }

  const plan = state.chosenExit
    ? planMovementVia(state.board, player.spaceId, state.chosenExit, spinValue)
    : planMovement(state.board, player.spaceId, spinValue)

  const movedPlayer = movePlayerTo(player, plan.destinationId)
  const log = appendLog(state, player.id, `${player.name} spins a ${spinValue}.`, 'info')
  const players = state.players.map((candidate) => (candidate.id === movedPlayer.id ? movedPlayer : candidate))

  /*
   * Every payday and every `event` tile this move sweeps past — named,
   * queued in the order the road actually crosses them, and left entirely
   * unresolved here. `settle` works through the queue one card at a time
   * once the pawn has actually finished animating there; resolving any of
   * it early would let the store know an outcome the screen has not shown
   * anyone yet, the exact spoiler the wheel-settling machinery elsewhere in
   * this file exists to prevent.
   *
   * The road itself is handed over one leg at a time to match: the pawn hops
   * as far as the first of those tiles and stops *on* it, and `settle` gives
   * back the next leg once its card has been read.
   */
  const { leg, rest } = nextMovementLeg(plan.path, plan.passed)

  return {
    ...state,
    players,
    chosenExit: null,
    pendingPassedItems: plan.passed,
    activePassedEvent: null,
    lastSpin: spinValue,
    movementPath: leg,
    pendingPath: rest,
    stepsRemaining: plan.stepsRemaining,
    phase: 'moving',
    log,
  }
}
