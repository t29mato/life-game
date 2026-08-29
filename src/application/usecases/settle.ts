import type { GameState, PassedQueueItem, Player, SpinValue } from '@domain/model/types'
import { planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { applyEffect } from './applyEffect'
import { appendLog } from './logging'
import { branchDecision, resolveForkBranch } from './branch'
import { applyPassedEvent } from './passedEvents'
import type { UseCaseDeps } from './types'

/**
 * Resolves whatever the pawn's move still owes: a payday or `event` tile
 * swept past that hasn't had its own card yet, a fork choice, a landing
 * effect, or some of each in sequence. Called once per card — the UI
 * dispatches it again every time a `passingEvent` card is dismissed, the
 * same way it already dispatches `settle` again for a fork reached with
 * distance still owed.
 */
export function settle(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'moving' && state.phase !== 'passingEvent') {
    throw new Error(`settle: only valid in 'moving' or 'passingEvent', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('settle: no current player')

  /*
   * The queue drains before anything else does — a payday or an `event`
   * tile this move already crossed, each getting its own card, named for
   * the tile it actually happened on, before play can reach the fork
   * choice or the landing still further down the road. `movementPath`
   * clears here: the pawn has already finished the hop that crossed this
   * queue, and showing a card is not a moment that hops it anywhere else.
   */
  if (state.pendingPassedItems.length > 0) {
    const [next, ...rest] = state.pendingPassedItems
    const space = state.board.spaces[next!.spaceId]
    if (!space) throw new Error(`settle: unknown space "${next!.spaceId}" in the passed-item queue`)

    const { state: afterEvent, event } = applyPassedEvent(state, space, deps)
    return {
      ...afterEvent,
      pendingPassedItems: rest,
      activePassedEvent: event,
      phase: 'passingEvent',
      movementPath: [],
    }
  }

  const space = state.board.spaces[player.spaceId]
  if (!space) throw new Error(`settle: player stands on unknown space "${player.spaceId}"`)

  /*
   * A fork reached with distance still owed — a longer roll that started a
   * few tiles back rather than the ordinary case of standing on one already
   * (see `spin.ts`). Resolved the same way, with the *same* roll: the
   * distance still owed is what decides the road and carries the player
   * down it, so nothing about a fork depends on where in a move it happens
   * to land. Whatever this next leg itself sweeps past joins the queue
   * rather than resolving here, same as the first leg did in `spin.ts`.
   */
  if (state.stepsRemaining > 0 && space.next.length > 1) {
    const roll = state.stepsRemaining as SpinValue
    const branchTaken = resolveForkBranch(state.board, space.id, roll)
    if (branchTaken === undefined) {
      // Defensive only: `resolveForkBranch` returns a road whenever `next`
      // actually holds one, which a fork (`next.length > 1`) always does.
      return {
        ...state,
        pendingDecision: branchDecision(state.board, space.id, state.stepsRemaining),
        phase: 'awaitingDecision',
      }
    }

    const plan = planMovementVia(state.board, space.id, branchTaken, roll)
    const movedPlayer = movePlayerTo(player, plan.destinationId)
    const target = state.board.spaces[branchTaken]
    const label = target?.lane?.name ?? target?.title ?? 'a new road'
    const log = appendLog(state, player.id, `${player.name}'s roll carries them onto ${label}.`, 'info')
    const players: readonly Player[] = state.players.map((candidate) =>
      candidate.id === movedPlayer.id ? movedPlayer : candidate,
    )
    const pendingPassedItems: PassedQueueItem[] = [
      ...plan.paydaysPassed.map((spaceId): PassedQueueItem => ({ kind: 'payday', spaceId })),
      ...plan.eventsPassed.map((spaceId): PassedQueueItem => ({ kind: 'event', spaceId })),
    ]

    return {
      ...state,
      players,
      pendingPassedItems,
      movementPath: plan.path,
      stepsRemaining: plan.stepsRemaining,
      phase: 'moving',
      log,
    }
  }

  const { state: nextState, event } = applyEffect(state, space, deps)

  if (nextState.pendingDecision) {
    return {
      ...nextState,
      phase: 'awaitingDecision',
      movementPath: [],
      stepsRemaining: 0,
    }
  }

  return {
    ...nextState,
    lastEvent: event,
    phase: 'resolved',
    movementPath: [],
    stepsRemaining: 0,
  }
}
