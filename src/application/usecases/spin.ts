import type { GameState } from '@domain/model/types'
import { planMovement, planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { appendLog } from './logging'
import { editionOf } from '@domain/edition/registry'
import { collectPaydays, passedPaydayLine } from './payday'
import type { UseCaseDeps } from './types'

/** Spins for the current player, plans their movement, and pays out any paydays passed along the way. */
export function spin(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'awaitingSpin') {
    throw new Error(`spin: only valid in 'awaitingSpin', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('spin: no current player')

  const spinValue = deps.random.spin()
  /*
   * A player standing on a fork picks their road before spinning, so the wheel
   * only decides how far they get down a road already committed to.
   */
  const plan = state.chosenExit
    ? planMovementVia(state.board, player.spaceId, state.chosenExit, spinValue)
    : planMovement(state.board, player.spaceId, spinValue)

  let movedPlayer = movePlayerTo(player, plan.destinationId)
  let log = appendLog(state, player.id, `${player.name} spins a ${spinValue}.`, 'info')

  if (plan.paydaysPassed > 0) {
    // Each payday passed is its own week, so each one is rolled separately.
    const collection = collectPaydays(movedPlayer, plan.paydaysPassed, deps, editionOf(state).economy)
    movedPlayer = collection.player
    if (collection.total !== 0) {
      log = appendLog({ ...state, log }, player.id, passedPaydayLine(player.name, collection, editionOf(state).currency), 'money-in')
    }
  }

  const players = state.players.map((candidate) => (candidate.id === movedPlayer.id ? movedPlayer : candidate))

  return {
    ...state,
    players,
    chosenExit: null,
    lastSpin: spinValue,
    movementPath: plan.path,
    stepsRemaining: plan.stepsRemaining,
    phase: 'moving',
    log,
  }
}
