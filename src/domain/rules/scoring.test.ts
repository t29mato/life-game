import { describe, expect, it } from 'vitest'
import type { Difficulty, House, LifeTile, Player, Stock } from '../model/types'
import {
  CHILD_BONUS,
  LIFE_INSURANCE_PAYOUT,
  LOAN_REPAYMENT,
  STARTING_MONEY,
} from '../model/constants'
import { STOCKS } from '../edition/usa'
import { DIFFICULTIES, loanRepaymentFor } from './difficulty'
import { createPlayer } from './player'
import { computeResults, estimateNetWorth } from './scoring'

const HOUSE: House = {
  id: 'house-test',
  name: 'Test House',
  price: 100_000,
  resaleRange: [80_000, 130_000],
  icon: 'space:payday',
  description: 'A house used only in tests.',
}

const TILE_A: LifeTile = { id: 'tile-a', title: 'Tile A', value: 10_000, icon: 'space:payday' }
const TILE_B: LifeTile = { id: 'tile-b', title: 'Tile B', value: 15_000, icon: 'space:payday' }

function player(overrides: Partial<Player> = {}): Player {
  return { ...createPlayer('p1', 'Alex', 'red', 'start', false), ...overrides }
}

const fixedResale = (value: number) => () => value
/** Every share cashes out flat, so a total can be reasoned about by hand. */
const noStocks = () => 0

describe('computeResults', () => {
  it('computes the full formula for a single retired player', () => {
    const p = player({
      id: 'p1',
      money: 12_000,
      lifeTiles: [TILE_A, TILE_B],
      house: HOUSE,
      children: 2,
      loans: 2,
      isRetired: true,
      retirementRank: 1,
    })
    const results = computeResults([p], fixedResale(90_000), noStocks)

    const expectedTotal =
      12_000 + // cash
      25_000 + // life tiles (10k + 15k)
      90_000 + // house resale
      2 * CHILD_BONUS + // children bonus
      80_000 - // first retirement bonus
      2 * LOAN_REPAYMENT // loan penalty

    expect(results.standings).toEqual([
      {
        playerId: 'p1',
        name: 'Alex',
        color: 'red',
        cash: 12_000,
        lifeTileValue: 25_000,
        houseValue: 90_000,
        stockValue: 0,
        insurancePayout: 0,
        childrenBonus: 2 * CHILD_BONUS,
        retirementBonus: 80_000,
        loanPenalty: -2 * LOAN_REPAYMENT,
        total: expectedTotal,
        rank: 1,
      },
    ])
    expect(results.winnerId).toBe('p1')
  })

  it('gives zero house value when the player never bought a house', () => {
    const p = player({ house: null, retirementRank: 1 })
    const results = computeResults([p], fixedResale(90_000), noStocks)
    expect(results.standings[0]?.houseValue).toBe(0)
  })

  it('applies retirement bonus by rank: 80k / 40k / 20k / 10k, 0 for null', () => {
    const p1 = player({ id: 'p1', retirementRank: 1 })
    const p2 = player({ id: 'p2', retirementRank: 2 })
    const p3 = player({ id: 'p3', retirementRank: 3 })
    const p4 = player({ id: 'p4', retirementRank: 4 })
    const p5 = player({ id: 'p5', retirementRank: null })
    const results = computeResults([p1, p2, p3, p4, p5], fixedResale(0), noStocks)
    const byId = new Map(results.standings.map((r) => [r.playerId, r]))
    expect(byId.get('p1')?.retirementBonus).toBe(80_000)
    expect(byId.get('p2')?.retirementBonus).toBe(40_000)
    expect(byId.get('p3')?.retirementBonus).toBe(20_000)
    expect(byId.get('p4')?.retirementBonus).toBe(10_000)
    expect(byId.get('p5')?.retirementBonus).toBe(0)
  })

  it('deducts LOAN_REPAYMENT for every outstanding loan', () => {
    const p = player({ loans: 5, retirementRank: null })
    const results = computeResults([p], fixedResale(0), noStocks)
    expect(results.standings[0]?.loanPenalty).toBe(-5 * LOAN_REPAYMENT)
  })

  it('settles a debt at the rate of the difficulty it was run up on', () => {
    const p = player({ loans: 5, retirementRank: null })
    const penaltyAt = (difficulty: Difficulty): number =>
      computeResults([p], fixedResale(0), noStocks, difficulty).standings[0]!.loanPenalty

    expect(penaltyAt('normal')).toBe(-5 * LOAN_REPAYMENT)
    expect(penaltyAt('hard')).toBeLessThan(penaltyAt('normal'))
    expect(penaltyAt('veryHard')).toBeLessThan(penaltyAt('hard'))
    for (const difficulty of DIFFICULTIES) {
      expect(penaltyAt(difficulty)).toBe(-5 * loanRepaymentFor(difficulty))
    }
  })

  it('scores at normal when no difficulty is named', () => {
    const p = player({ loans: 3, retirementRank: null })
    expect(computeResults([p], fixedResale(0), noStocks).standings[0]).toEqual(
      computeResults([p], fixedResale(0), noStocks, 'normal').standings[0],
    )
  })

  it('adds CHILD_BONUS per child', () => {
    const p = player({ children: 4, retirementRank: null })
    const results = computeResults([p], fixedResale(0), noStocks)
    expect(results.standings[0]?.childrenBonus).toBe(4 * CHILD_BONUS)
  })

  it('sorts standings by total descending', () => {
    const rich = player({ id: 'rich', money: 500_000, retirementRank: null })
    const poor = player({ id: 'poor', money: 0, retirementRank: null })
    const middling = player({ id: 'mid', money: 100_000, retirementRank: null })
    const results = computeResults([poor, rich, middling], fixedResale(0), noStocks)
    expect(results.standings.map((r) => r.playerId)).toEqual(['rich', 'mid', 'poor'])
    expect(results.standings.map((r) => r.rank)).toEqual([1, 2, 3])
  })

  it('gives tied players the same, lower rank number and skips ahead for the next distinct total', () => {
    const a = player({ id: 'a', money: STARTING_MONEY, retirementRank: null })
    const b = player({ id: 'b', money: STARTING_MONEY, retirementRank: null })
    const c = player({ id: 'c', money: STARTING_MONEY - 1_000, retirementRank: null })
    const results = computeResults([a, b, c], fixedResale(0), noStocks)
    const byId = new Map(results.standings.map((r) => [r.playerId, r]))
    expect(byId.get('a')?.rank).toBe(1)
    expect(byId.get('b')?.rank).toBe(1)
    expect(byId.get('c')?.rank).toBe(3)
  })

  it('sets winnerId to the first player at rank 1 when there is a tie', () => {
    const a = player({ id: 'a', name: 'Ana', money: STARTING_MONEY, retirementRank: null })
    const b = player({ id: 'b', name: 'Bo', money: STARTING_MONEY, retirementRank: null })
    const results = computeResults([a, b], fixedResale(0), noStocks)
    expect(results.winnerId).toBe('a')
  })

  it('passes each player house to rollResale so it can be house-specific', () => {
    const houseA: House = { ...HOUSE, id: 'house-a' }
    const houseB: House = { ...HOUSE, id: 'house-b' }
    const p1 = player({ id: 'p1', house: houseA, retirementRank: null })
    const p2 = player({ id: 'p2', house: houseB, retirementRank: null })
    const rollResale = (house: House) => (house.id === 'house-a' ? 111 : 222)
    const results = computeResults([p1, p2], rollResale, noStocks)
    const byId = new Map(results.standings.map((r) => [r.playerId, r]))
    expect(byId.get('p1')?.houseValue).toBe(111)
    expect(byId.get('p2')?.houseValue).toBe(222)
  })
})

describe('computeResults cashing out shares', () => {
  const FIRST = STOCKS[0]!
  const SECOND = STOCKS[1]!

  it('pays the rolled value for every share of every holding', () => {
    const p = player({
      money: 0,
      stocks: [
        { stockId: FIRST.id, shares: 3 },
        { stockId: SECOND.id, shares: 2 },
      ],
      retirementRank: null,
    })
    const results = computeResults([p], fixedResale(0), () => 1_000)
    expect(results.standings[0]?.stockValue).toBe(5_000)
    expect(results.standings[0]?.total).toBe(5_000)
  })

  it('passes each stock to rollStock so the payout can be stock-specific', () => {
    const p = player({
      money: 0,
      stocks: [
        { stockId: FIRST.id, shares: 1 },
        { stockId: SECOND.id, shares: 1 },
      ],
      retirementRank: null,
    })
    const rollStock = (stock: Stock) => (stock.id === FIRST.id ? 7 : 300)
    expect(computeResults([p], fixedResale(0), rollStock).standings[0]?.stockValue).toBe(307)
  })

  it('gives a player who never invested a stock value of zero', () => {
    const p = player({ stocks: [], retirementRank: null })
    expect(computeResults([p], fixedResale(0), () => 999).standings[0]?.stockValue).toBe(0)
  })

  it('writes off a holding in a stock the catalogue no longer lists', () => {
    const p = player({ money: 0, stocks: [{ stockId: 'stock-vanished', shares: 5 }], retirementRank: null })
    const results = computeResults([p], fixedResale(0), () => 1_000)
    expect(results.standings[0]?.stockValue).toBe(0)
  })
})

describe('computeResults maturing the life policy', () => {
  it('pays LIFE_INSURANCE_PAYOUT to a player holding the life policy', () => {
    const p = player({ money: 0, insurance: ['life'], retirementRank: null })
    const results = computeResults([p], fixedResale(0), noStocks)
    expect(results.standings[0]?.insurancePayout).toBe(LIFE_INSURANCE_PAYOUT)
    expect(results.standings[0]?.total).toBe(LIFE_INSURANCE_PAYOUT)
  })

  it('pays nothing for home or auto cover, which only ever waived a bill', () => {
    const p = player({ money: 0, insurance: ['home', 'auto'], retirementRank: null })
    expect(computeResults([p], fixedResale(0), noStocks).standings[0]?.insurancePayout).toBe(0)
  })

  it('pays out once for a player holding every policy there is', () => {
    const p = player({ money: 0, insurance: ['home', 'auto', 'life'], retirementRank: null })
    expect(computeResults([p], fixedResale(0), noStocks).standings[0]?.insurancePayout).toBe(
      LIFE_INSURANCE_PAYOUT,
    )
  })

  it('pays nothing to an uninsured player', () => {
    const p = player({ insurance: [], retirementRank: null })
    expect(computeResults([p], fixedResale(0), noStocks).standings[0]?.insurancePayout).toBe(0)
  })

  it('can lift a player past a rival on the strength of shares and a policy alone', () => {
    const investor = player({
      id: 'investor',
      money: 0,
      insurance: ['life'],
      stocks: [{ stockId: STOCKS[0]!.id, shares: 2 }],
      retirementRank: null,
    })
    const saver = player({ id: 'saver', money: 120_000, retirementRank: null })
    const results = computeResults([saver, investor], fixedResale(0), () => 20_000)
    expect(results.winnerId).toBe('investor')
  })
})

describe('estimateNetWorth', () => {
  it('adds cash, tiles, the house price and the children bonus', () => {
    const p = player({ money: 25_000, lifeTiles: [TILE_A, TILE_B], house: HOUSE, children: 2 })
    expect(estimateNetWorth(p)).toBe(25_000 + 25_000 + HOUSE.price + 2 * CHILD_BONUS)
  })

  it('values the house at what was paid for it, never at a rolled resale', () => {
    const p = player({ money: 0, house: HOUSE })
    expect(estimateNetWorth(p)).toBe(HOUSE.price)
  })

  it('subtracts the full retirement cost of every outstanding loan', () => {
    const p = player({ money: 0, loans: 3 })
    expect(estimateNetWorth(p)).toBe(-3 * LOAN_REPAYMENT)
  })

  it('prices that debt at the difficulty being played, defaulting to normal', () => {
    const p = player({ money: 0, loans: 3 })
    expect(estimateNetWorth(p, 'normal')).toBe(estimateNetWorth(p))
    for (const difficulty of DIFFICULTIES) {
      expect(estimateNetWorth(p, difficulty)).toBe(-3 * loanRepaymentFor(difficulty))
    }
    expect(estimateNetWorth(p, 'veryHard')).toBeLessThan(estimateNetWorth(p, 'hard'))
  })

  it('values shares at the middle of their payout range', () => {
    const stock = STOCKS[0]!
    const [min, max] = stock.payoutRange
    const p = player({ money: 0, stocks: [{ stockId: stock.id, shares: 3 }] })
    expect(estimateNetWorth(p)).toBe(((min + max) / 2) * 3)
  })

  it('ignores a holding in a stock the catalogue does not know', () => {
    const p = player({ money: 1_000, stocks: [{ stockId: 'stock-vanished', shares: 4 }] })
    expect(estimateNetWorth(p)).toBe(1_000)
  })

  it('counts no life-insurance payout, which is only ever earned at the end', () => {
    const p = player({ money: 0, insurance: ['life'] })
    expect(estimateNetWorth(p)).toBe(0)
  })

  it('counts no retirement bonus, which nobody has earned mid-game', () => {
    const p = player({ money: 0, retirementRank: 1 })
    expect(estimateNetWorth(p)).toBe(0)
  })

  it('is a flat number for a brand-new player', () => {
    expect(estimateNetWorth(player())).toBe(STARTING_MONEY)
  })

  it('returns the same answer every time it is asked', () => {
    const p = player({ house: HOUSE, stocks: [{ stockId: STOCKS[1]!.id, shares: 2 }] })
    expect(estimateNetWorth(p)).toBe(estimateNetWorth(p))
  })

  it('ranks a richer player above a poorer one without any randomness', () => {
    const ahead = player({ money: 200_000 })
    const behind = player({ money: 10_000, loans: 4 })
    expect(estimateNetWorth(ahead)).toBeGreaterThan(estimateNetWorth(behind))
  })
})
