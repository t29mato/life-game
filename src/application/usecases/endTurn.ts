import type { GameState, House, Money, Stock } from '@domain/model/types'
import { editionOf } from '@domain/edition/registry'
import { scaleResale, scaleStockPayout } from '@domain/rules/difficulty'
import { computeResults } from '@domain/rules/scoring'
import { turnStart } from './branch'
import { formatAmount } from './format'
import { appendLog } from './logging'
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

  const edition = editionOf(state)

  if (state.players.every((player) => player.isRetired)) {
    /*
     * Rolled in the edition's payout unit — whole thousands on the USA board.
     * Every price, salary and prize in the game is a round number, so a house
     * that sold for $241,333 read as a glitch rather than as a market. Both
     * catalogue ranges are themselves multiples of that unit, so rolling in it
     * cannot land outside the range.
     */
    const unit = edition.currency.payoutRounding
    const rollUnits = (min: Money, max: Money): Money =>
      deps.random.int(Math.ceil(min / unit), Math.floor(max / unit)) * unit
    /*
     * A harder game meets a thinner market. The dice are rolled over the
     * catalogue's own range either way — the ranges are the story of what each
     * home and each holding is — and then a fraction of the result is what
     * actually reaches the seller. On Very Hard that turns a house from a
     * reliable store of value into a purchase that has to justify itself.
     */
    const rollResale = (house: House): Money =>
      scaleResale(rollUnits(house.resaleRange[0], house.resaleRange[1]), state.difficulty, edition)
    const rollStock = (stock: Stock): Money =>
      scaleStockPayout(rollUnits(stock.payoutRange[0], stock.payoutRange[1]), state.difficulty, edition)
    /*
     * Every child gets a spin, one at a time, and one in ten of them turns out
     * to be a star. This is the last wheel of the game and the loudest: a
     * quarter of a million dollars can arrive on the results screen from a
     * child somebody had eleven turns ago on Family Lane.
     */
    const results = computeResults(
      state.players,
      rollResale,
      rollStock,
      state.difficulty,
      edition,
      () => deps.random.spin(),
    )
    const winner = results.standings.find((standing) => standing.playerId === results.winnerId)
    const total = winner ? formatAmount(winner.total, edition.currency) : '?'
    let log = cleared.log
    // Announced before the result, because it is usually why the result is what it is.
    for (const standing of results.standings) {
      const stars = standing.childStars ?? 0
      if (stars === 0) continue
      const bonus = formatAmount(edition.economy.childOutcome.starPayout * stars, edition.currency)
      log = appendLog(
        { ...cleared, log },
        standing.playerId,
        stars === 1
          ? `One of ${standing.name}'s children turned out to be a star — ${bonus} into the final total!`
          : `${stars} of ${standing.name}'s children turned out to be stars — ${bonus} into the final total!`,
        'milestone',
      )
    }
    log = appendLog(
      { ...cleared, log },
      null,
      `The game is over! ${winner?.name ?? 'A player'} wins with ${total}.`,
      'milestone',
    )
    return { ...cleared, phase: 'gameOver', results, log }
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
