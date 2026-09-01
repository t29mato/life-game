import type { GameState } from '@domain/model/types'
import { turnStart } from './branch'
import { appendLog } from './logging'
import { buildScoreRolls } from './settlement'
import { finishScoring } from './scoreRoll'
import type { UseCaseDeps } from './types'

/** Dismisses `lastEvent` and hands play to the next non-retired player, or ends the game. */
export function endTurn(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'resolved') {
    throw new Error(`endTurn: only valid in 'resolved', got '${state.phase}'`)
  }

  const cleared: GameState = {
    ...state,
    lastEvent: null,
    lastSpin: null,
    movementPath: [],
    pendingPath: [],
  }

  if (state.players.every((player) => player.isRetired)) {
    /*
     * The last retirement opens the closing settlement rather than finishing
     * the game outright.
     *
     * This is where every house and every share used to be valued — one
     * synchronous `computeResults` call, drawing a uniform integer per asset
     * straight out of the random port, in the same tick the last player
     * retired. The player was then dropped onto the results screen with a
     * house "sold for" a figure no die in the game could have landed on and
     * nothing ever on screen to press or watch. Now the queue of dice those
     * valuations are owed is built here (see `buildScoreRolls`) and thrown
     * one at a time in `phase: 'scoring'`; `scoreRoll` assembles the results
     * from the faces once the last of them lands.
     *
     * A table where nobody holds a home or a share owes no dice at all, and
     * goes straight to the results screen rather than through an empty
     * ceremony — the same thing `finishScoring` does on the last real throw.
     */
    const scoreRolls = buildScoreRolls(cleared)
    const opened: GameState = { ...cleared, scoreRolls }
    if (scoreRolls.length === 0) return finishScoring(opened, deps)

    const log = appendLog(
      opened,
      null,
      'Everybody has retired. Time to find out what it was all worth.',
      'milestone',
    )
    return { ...opened, phase: 'scoring', log }
  }

  let nextIndex = state.currentPlayerIndex
  let turn = state.turn
  do {
    nextIndex = (nextIndex + 1) % state.players.length
    if (nextIndex === 0) turn += 1
  } while (state.players[nextIndex]?.isRetired)

  const nextPlayer = state.players[nextIndex]
  const log = appendLog(cleared, nextPlayer?.id ?? null, `${nextPlayer?.name ?? 'Next player'}'s turn.`, 'info')

  const handedOver: GameState = { ...cleared, currentPlayerIndex: nextIndex, turn, log }
  return { ...handedOver, ...turnStart(handedOver, nextIndex) }
}
