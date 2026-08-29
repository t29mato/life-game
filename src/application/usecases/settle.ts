import type { GameState, Player, SpinValue } from '@domain/model/types'
import { planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { editionOf } from '@domain/edition/registry'
import { applyEffect } from './applyEffect'
import { appendLog } from './logging'
import { branchDecision, resolveForkBranch } from './branch'
import { collectPaydays, passedPaydayLine } from './payday'
import { applyPassedEvents } from './passedEvents'
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

  /*
   * A fork reached with distance still owed — a longer roll that started a
   * few tiles back rather than the ordinary case of standing on one already
   * (see `spin.ts`). Resolved the same way, with the *same* roll: the
   * distance still owed is what decides the road and carries the player
   * down it, so nothing about a fork depends on where in a move it happens
   * to land.
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
        passedNotes: [],
      }
    }

    const plan = planMovementVia(state.board, space.id, branchTaken, roll)
    let movedPlayer = movePlayerTo(player, plan.destinationId)
    const target = state.board.spaces[branchTaken]
    const label = target?.lane?.name ?? target?.title ?? 'a new road'
    let log = appendLog(state, player.id, `${player.name}'s roll carries them onto ${label}.`, 'info')
    const passedNotes: string[] = []

    if (plan.paydaysPassed > 0) {
      const collection = collectPaydays(movedPlayer, plan.paydaysPassed, deps, editionOf(state).economy)
      movedPlayer = collection.player
      if (collection.total !== 0) {
        const line = passedPaydayLine(player.name, collection, editionOf(state).currency)
        log = appendLog({ ...state, log }, player.id, line, 'money-in')
        passedNotes.push(line)
      }
    }

    let players: readonly Player[] = state.players.map((candidate) =>
      candidate.id === movedPlayer.id ? movedPlayer : candidate,
    )

    if (plan.eventsPassed.length > 0) {
      const passedState = { ...state, players, log }
      const { state: afterEvents, notes } = applyPassedEvents(passedState, plan.eventsPassed, deps)
      players = afterEvents.players
      log = afterEvents.log
      passedNotes.push(...notes)
    }

    return {
      ...state,
      players,
      passedNotes,
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
      passedNotes: [],
    }
  }

  /*
   * Every payday or `event` milestone the pawn swept past on the way here
   * used to be visible only in the log — folded into this landing's own
   * notes now, so pressing Spin and passing straight through one is not
   * indistinguishable from never having one at all.
   */
  const notes = state.passedNotes.length > 0 ? [...state.passedNotes, ...event.notes] : event.notes

  return {
    ...nextState,
    lastEvent: { ...event, notes },
    phase: 'resolved',
    movementPath: [],
    stepsRemaining: 0,
    passedNotes: [],
  }
}
