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
      // Landing on a fork so soon after passing a payday is rare enough that
      // this is the one place the note is simply dropped rather than carried
      // further — the log line survives regardless.
      passedPaydayNote: null,
    }
  }

  const { state: nextState, event } = applyEffect(state, space, deps)

  if (nextState.pendingDecision) {
    return {
      ...nextState,
      phase: 'awaitingDecision',
      movementPath: [],
      stepsRemaining: 0,
      passedPaydayNote: null,
    }
  }

  /*
   * A payday or two the pawn swept past on the way here used to be visible
   * only in the log — folded into this landing's own notes now, so pressing
   * Spin and passing straight through a payday is not indistinguishable from
   * never having one at all.
   */
  const notes = state.passedPaydayNote ? [state.passedPaydayNote, ...event.notes] : event.notes

  return {
    ...nextState,
    lastEvent: { ...event, notes },
    phase: 'resolved',
    movementPath: [],
    stepsRemaining: 0,
    passedPaydayNote: null,
  }
}
