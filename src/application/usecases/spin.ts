import type { GameState, PassedQueueItem } from '@domain/model/types'
import { planMovement, planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { appendLog } from './logging'
import { resolveForkBranch } from './branch'
import type { UseCaseDeps } from './types'

/** Spins for the current player and plans their movement. */
export function spin(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'awaitingSpin') {
    throw new Error(`spin: only valid in 'awaitingSpin', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('spin: no current player')

  const spinValue = deps.random.spin()

  /*
   * A fork used to be a choice, made before this spin, by whoever was
   * experienced enough to already know which road paid better — a real
   * advantage a first-time player never had. It is this same spin's own
   * roll now: 1-5 takes the first road, 6-10 the second, and the number
   * that picked the road is also how far it carries you down it — exactly
   * the distance an ordinary spin already averages, so a fork costs a
   * player nothing they would not have spun anyway.
   */
  const branchTaken = resolveForkBranch(state.board, player.spaceId, spinValue)
  const plan =
    branchTaken !== undefined
      ? planMovementVia(state.board, player.spaceId, branchTaken, spinValue)
      : state.chosenExit
        ? planMovementVia(state.board, player.spaceId, state.chosenExit, spinValue)
        : planMovement(state.board, player.spaceId, spinValue)

  const movedPlayer = movePlayerTo(player, plan.destinationId)
  const forkNote =
    branchTaken !== undefined
      ? (() => {
          const target = state.board.spaces[branchTaken]
          const label = target?.lane?.name ?? target?.title ?? 'a new road'
          return ` and the fork sends them onto ${label}`
        })()
      : ''
  const log = appendLog(state, player.id, `${player.name} spins a ${spinValue}${forkNote}.`, 'info')
  const players = state.players.map((candidate) => (candidate.id === movedPlayer.id ? movedPlayer : candidate))

  /*
   * Every payday and every `event` tile this move sweeps past — named,
   * queued in the order the road actually crosses them, and left entirely
   * unresolved here. `settle` works through the queue one card at a time
   * once the pawn has actually finished animating there; resolving any of
   * it early would let the store know an outcome the screen has not shown
   * anyone yet, the exact spoiler the wheel-settling machinery elsewhere in
   * this file exists to prevent.
   */
  const pendingPassedItems: PassedQueueItem[] = [
    ...plan.paydaysPassed.map((spaceId): PassedQueueItem => ({ kind: 'payday', spaceId })),
    ...plan.eventsPassed.map((spaceId): PassedQueueItem => ({ kind: 'event', spaceId })),
  ]

  return {
    ...state,
    players,
    chosenExit: null,
    pendingPassedItems,
    activePassedEvent: null,
    lastSpin: spinValue,
    movementPath: plan.path,
    stepsRemaining: plan.stepsRemaining,
    phase: 'moving',
    log,
  }
}
