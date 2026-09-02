import type {
  Difficulty,
  GameResults,
  House,
  Money,
  Player,
  PlayerResult,
  SpinValue,
  Stock,
} from '../model/types'
import type { Edition } from '../edition/types'
import { EDITION_USA } from '../edition/usa'
import { findStock } from '../edition/lookup'
import { childReturnFor, expectedChildValue } from './children'
import { loanRepaymentFor } from './difficulty'

function retirementBonusFor(rank: number | null, edition: Edition): Money {
  if (rank === null) return 0
  return edition.economy.firstRetirementBonus / 2 ** (rank - 1)
}

/**
 * A caller's own dice for the final valuations.
 *
 * Both take the player they are valuing for, which the caller cannot recover
 * any other way: the closing settlement throws one die per *player* per asset
 * class and then reads the results back off those recorded faces, so "whose
 * house is this" is the question it has to be able to answer. A caller with a
 * flat rate, or a genuinely per-asset roll, simply ignores the argument.
 */
export type ResaleRoll = (house: House, player: Player) => Money
export type StockRoll = (stock: Stock, player: Player) => Money

/**
 * What a player's life policy matured into, on the caller's own die.
 *
 * Optional everywhere, and for the same reason `rollChildSpin` is: the domain
 * owns no randomness, and a caller with no dice to hand — a panel, a test —
 * is answered with the midpoint of the edition's maturity range rather than
 * with a number nobody threw. See `maturityMidpoint`.
 */
export type PolicyRoll = (player: Player) => Money

/** The maturity a caller with no die gets: the middle of the edition's range. */
export function maturityMidpoint(edition: Edition): Money {
  const [low, high] = edition.economy.lifeInsuranceMaturity
  return (low + high) / 2
}

/**
 * Cashes out every share at whatever the caller's roll says it is worth today.
 *
 * A holding whose stock has vanished from the catalogue is worth nothing rather
 * than throwing: a stale save should cost a player their shares, not the whole
 * results screen.
 */
function cashOutStocks(player: Player, rollStock: StockRoll, edition: Edition): Money {
  return player.stocks.reduce((sum, holding) => {
    const stock = findStock(holding.stockId, edition)
    if (!stock) return sum
    return sum + rollStock(stock, player) * holding.shares
  }, 0)
}

/**
 * What every child grew up to be, spun one at a time.
 *
 * A flat figure per child made the whole family arc arithmetic — and cheap
 * arithmetic at that. Each child gets its own roll: most do decently, and one
 * in six turns out to be a star worth more than the rest of the scoring lines
 * put together. The bills on Family Lane are what keep it a gamble rather than
 * free money, and they are already paid by the time this runs.
 *
 * With no wheel to hand — a panel, a test, any caller with no dice — every
 * child is worth what one is worth to *that player* on an average life, which
 * is what `expectedChildValue` is for.
 */
function scoreChildren(
  player: Player,
  rollChildSpin: (() => SpinValue) | undefined,
  edition: Edition,
): { readonly childrenBonus: Money; readonly childStars: number | undefined } {
  const { economy } = edition
  if (!rollChildSpin) {
    return {
      childrenBonus: Math.round(player.children * expectedChildValue(player, economy)),
      childStars: undefined,
    }
  }

  let childrenBonus = 0
  let childStars = 0
  for (let child = 0; child < player.children; child += 1) {
    const spin = rollChildSpin()
    childrenBonus += childReturnFor(player, spin, economy)
    if (spin >= economy.childOutcome.starSpin) childStars += 1
  }
  return { childrenBonus, childStars }
}

function scorePlayer(
  player: Player,
  rollResale: ResaleRoll,
  rollStock: StockRoll,
  difficulty: Difficulty | undefined,
  edition: Edition,
  rollChildSpin?: () => SpinValue,
  rollPolicy?: PolicyRoll,
): Omit<PlayerResult, 'rank'> {
  const cash = player.money
  const lifeTileValue = player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
  const houseValue = player.house ? rollResale(player.house, player) : 0
  const stockValue = cashOutStocks(player, rollStock, edition)
  const insurancePayout = player.insurance.includes('life')
    ? (rollPolicy ?? (() => maturityMidpoint(edition)))(player)
    : 0
  const { childrenBonus, childStars } = scoreChildren(player, rollChildSpin, edition)
  const retirementBonus = retirementBonusFor(player.retirementRank, edition)
  const loanPenalty = -(player.loans * loanRepaymentFor(difficulty, edition))
  const total =
    cash +
    lifeTileValue +
    houseValue +
    stockValue +
    insurancePayout +
    childrenBonus +
    retirementBonus +
    loanPenalty

  return {
    playerId: player.id,
    name: player.name,
    color: player.color,
    cash,
    lifeTileValue,
    houseValue,
    stockValue,
    insurancePayout,
    childrenBonus,
    ...(childStars === undefined ? {} : { childStars }),
    retirementBonus,
    loanPenalty,
    total,
  }
}

/**
 * `difficulty` only decides what a loan costs to settle — the resale and share
 * rolls are already difficulty-adjusted by whoever supplied them, because they
 * are the caller's dice. Omitting it scores the game at `normal`, and omitting
 * `edition` scores it on the USA board.
 *
 * `rollChildSpin` is the wheel every child's grown-up life is decided on, and
 * it is last and optional for the same reason the others are injected at all:
 * the domain owns no randomness. A caller with no dice scores every child at
 * what one is worth to that player on an average life.
 *
 * `rollPolicy` is the same bargain for the life policy's maturity, and it is
 * last for the same reason: it arrived after everything above it, and a caller
 * with no die is answered at the middle of the range rather than at the top.
 */
export function computeResults(
  players: readonly Player[],
  rollResale: ResaleRoll,
  rollStock: StockRoll,
  difficulty?: Difficulty,
  edition: Edition = EDITION_USA,
  rollChildSpin?: () => SpinValue,
  rollPolicy?: PolicyRoll,
): GameResults {
  if (players.length === 0) {
    throw new Error('computeResults requires at least one player')
  }

  const scored = players.map((player) =>
    scorePlayer(player, rollResale, rollStock, difficulty, edition, rollChildSpin, rollPolicy),
  )
  const sorted = [...scored].sort((a, b) => b.total - a.total)

  const standings: PlayerResult[] = []
  sorted.forEach((result, index) => {
    const previous = index > 0 ? sorted[index - 1] : undefined
    const previousRanked = index > 0 ? standings[index - 1] : undefined
    const rank = previous && previousRanked && result.total === previous.total ? previousRanked.rank : index + 1
    standings.push({ ...result, rank })
  })

  const winner = standings.find((result) => result.rank === 1)
  if (!winner) {
    throw new Error('computeResults: no rank-1 player found')
  }

  return { standings, winnerId: winner.playerId }
}

/**
 * What a player is worth right now, for the in-game rank readout.
 *
 * Final scoring rolls dice — resale values, share payouts — and a HUD that
 * flickered every time it re-rendered would be useless. So this values the
 * house at what was paid for it and every share at the middle of its payout
 * range: no randomness, no retirement bonus nobody has earned yet, just a
 * steady number that moves only when something really happens.
 *
 * `difficulty` is what a loan will cost to settle, which is the one term here
 * that a harder game changes. It defaults to `normal`, so a caller that has no
 * game state to hand — a panel rendering a single player, say — still gets a
 * sensible number rather than a required argument it cannot supply.
 */
export function estimateNetWorth(
  player: Player,
  difficulty?: Difficulty,
  edition: Edition = EDITION_USA,
): Money {
  const lifeTileValue = player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
  const houseValue = player.house ? player.house.price : 0
  const stockValue = player.stocks.reduce((sum, holding) => {
    const stock = findStock(holding.stockId, edition)
    if (!stock) return sum
    const [min, max] = stock.payoutRange
    return sum + ((min + max) / 2) * holding.shares
  }, 0)

  return (
    player.money +
    lifeTileValue +
    houseValue +
    stockValue +
    player.children * expectedChildValue(player, edition.economy) -
    player.loans * loanRepaymentFor(difficulty, edition)
  )
}
