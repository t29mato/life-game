import type { GameState } from '@domain/model/types'
import { applyEffect } from './applyEffect'
import { branchDecision } from './branch'
import type { UseCaseDeps } from './types'

/** Resolves whatever the pawn's destination requires: a fork choice, a landing effect, or both in sequence. */
export function settle(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'moving') {
    throw new Error(`settle: only valid in 'moving', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('settle: no current player')

  const space = state.board.spaces[player.spaceId]
  if (!space) throw new Error(`settle: player stands on unknown space "${player.spaceId}"`)

  if (state.stepsRemaining > 0 && space.next.length > 1) {
    return {
      ...state,
      pendingDecision: branchDecision(state.board, space.id, state.stepsRemaining),
      phase: 'awaitingDecision',
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
