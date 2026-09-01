import type { GameState } from '@domain/model/types'
import { editionOf } from '@domain/edition/registry'
import { formatAmount } from './format'
import { appendLog } from './logging'
import { nextScoreRoll, resultsFromScoreRolls, scoreRollLogLine } from './settlement'
import type { UseCaseDeps } from './types'

/**
 * Closes the game: the standings, the star children, the winner's line in the
 * log. Split out of `endTurn` because two roads reach it now — the last die of
 * the settlement landing, and a table that owed no dice at all — and both must
 * end the game the same way.
 */
export function finishScoring(state: GameState, deps: UseCaseDeps): GameState {
  const edition = editionOf(state)
  const results = resultsFromScoreRolls(state, deps)
  const winner = results.standings.find((standing) => standing.playerId === results.winnerId)
  const total = winner ? formatAmount(winner.total, edition.currency) : '?'

  let log = state.log
  // Announced before the result, because it is usually why the result is what it is.
  for (const standing of results.standings) {
    const stars = standing.childStars ?? 0
    if (stars === 0) continue
    const bonus = formatAmount(edition.economy.childOutcome.starPayout * stars, edition.currency)
    log = appendLog(
      { ...state, log },
      standing.playerId,
      stars === 1
        ? `One of ${standing.name}'s children turned out to be a star — ${bonus} into the final total!`
        : `${stars} of ${standing.name}'s children turned out to be stars — ${bonus} into the final total!`,
      'milestone',
    )
  }
  log = appendLog(
    { ...state, log },
    null,
    `The game is over! ${winner?.name ?? 'A player'} wins with ${total}.`,
    'milestone',
  )

  return { ...state, phase: 'gameOver', results, log }
}

/**
 * Throws the next die of the closing settlement.
 *
 * One press, one die, one holding settled — the same shape as every other
 * roll in the game: the press dispatches this, this stamps `lastSpin`, and the
 * die on screen animates towards the face it finds there. Nothing is decided
 * before the press and nothing is decided after the landing, which is what
 * makes the number the player watches the number they actually get. A house's
 * final value used to be drawn inside `endTurn` with no die anywhere; see
 * `@domain/rules/settlement` for why a six-band ladder is what lets a
 * six-sided die decide it honestly.
 *
 * The face is recorded on the queue item rather than banked as money, because
 * the results are assembled from the whole set of faces at the end — a player
 * is never paid twice for the same die however this is re-entered, and a
 * settled roll can be re-read for the log line without re-rolling it.
 */
export function scoreRoll(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'scoring') {
    throw new Error(`scoreRoll: only valid in 'scoring', got '${state.phase}'`)
  }

  const pending = nextScoreRoll(state.scoreRolls)
  if (!pending) {
    throw new Error('scoreRoll: every closing die has already been thrown')
  }

  const face = deps.random.spin()
  /*
   * Only the one item is replaced, so every other queue entry keeps its
   * object identity. The shell latches the die currently on screen by that
   * identity — the same trick `watchedPassedEvent` uses — and a queue rebuilt
   * wholesale each throw would make every entry look new and could swap the
   * card out from under a die still in the air.
   */
  const scoreRolls = state.scoreRolls.map((roll) => (roll === pending ? { ...roll, face } : roll))
  const thrown: GameState = {
    ...state,
    scoreRolls,
    lastSpin: face,
    log: appendLog(state, pending.playerId, scoreRollLogLine(state, pending, face), 'money-in'),
  }

  return nextScoreRoll(scoreRolls) ? thrown : finishScoring(thrown, deps)
}
