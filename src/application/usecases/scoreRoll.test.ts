import { describe, expect, it } from 'vitest'
import type { GameState, SpinValue } from '@domain/model/types'
import { HOUSES, STOCKS } from '@domain/edition/usa'
import { allEditions } from '@domain/edition/registry'
import { settlementValue } from '@domain/rules/settlement'
import { fixturePlayer, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { endTurn } from './endTurn'
import { scoreRoll } from './scoreRoll'
import { buildScoreRolls, describeScoreRoll, nextScoreRoll } from './settlement'

const HOUSE = HOUSES[0]!
const STOCK = STOCKS[0]!
const UNIT = 1_000

/** A finished game sitting in `scoring`, with whatever holdings are asked for. */
function retiredTable(overrides?: Partial<Parameters<typeof fixturePlayer>[0]>): GameState {
  const players = [
    fixturePlayer({ id: 'p1', isRetired: true, retirementRank: 1, ...overrides }),
    fixturePlayer({ id: 'p2', isRetired: true, retirementRank: 2 }),
  ]
  const resolved = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved' })
  return endTurn(resolved, { random: createFakeRandom() })
}

describe('scoreRoll', () => {
  it('throws when the phase is not scoring', () => {
    const state = fixtureState({ phase: 'awaitingSpin' })
    expect(() => scoreRoll(state, { random: createFakeRandom() })).toThrow(/scoring/)
  })

  it('throws rather than rolling again once every die has landed', () => {
    const opened = retiredTable({ house: HOUSE })
    const settled = scoreRoll(opened, { random: createFakeRandom({ spins: [4] }) })
    expect(settled.phase).toBe('gameOver')
    expect(() => scoreRoll(settled, { random: createFakeRandom() })).toThrow(/scoring/)
  })

  /*
   * The heart of it. A house's final value used to be a uniform integer drawn
   * inside `endTurn`, dozens of values wide — a number no six-sided die could
   * land on, which is exactly why nobody could be shown one. Now the face is
   * the whole story: it is `random.spin()`, it is stamped on `lastSpin` for
   * the die on screen to animate towards, and the money is read off the rung
   * it landed on.
   */
  it('decides the house price with one die face, and nothing else', () => {
    const opened = retiredTable({ house: HOUSE })
    const random = createFakeRandom({ spins: [2] })
    const next = scoreRoll(opened, { random })

    expect(random.calls.spins).toBe(1)
    // Not one integer drawn. The die is the only thing that decided this.
    expect(random.calls.ints).toEqual([])
    expect(next.lastSpin).toBe(2)
    expect(next.scoreRolls[0]).toEqual({ playerId: 'p1', kind: 'house', face: 2 })

    const seller = next.results!.standings.find((standing) => standing.playerId === 'p1')!
    expect(seller.houseValue).toBe(settlementValue(HOUSE.resaleRange, 2, UNIT))
  })

  it('lands the whole ladder: face 1 pays the bottom, face 6 the top', () => {
    for (const face of [1, 2, 3, 4, 5, 6] as SpinValue[]) {
      const next = scoreRoll(retiredTable({ house: HOUSE }), {
        random: createFakeRandom({ spins: [face] }),
      })
      const seller = next.results!.standings.find((standing) => standing.playerId === 'p1')!
      expect(seller.houseValue).toBe(settlementValue(HOUSE.resaleRange, face, UNIT))
    }
  })

  it('cashes a whole shareholding out on one closing face', () => {
    const opened = retiredTable({ stocks: [{ stockId: STOCK.id, shares: 3 }] })
    const next = scoreRoll(opened, { random: createFakeRandom({ spins: [6] }) })

    const holder = next.results!.standings.find((standing) => standing.playerId === 'p1')!
    expect(holder.stockValue).toBe(settlementValue(STOCK.payoutRange, 6, UNIT) * 3)
    expect(holder.stockValue).toBe(STOCK.payoutRange[1] * 3)
  })

  /*
   * The results are assembled from the faces already on the queue, not from a
   * fresh set of numbers. If they were re-rolled at the end, the player would
   * have watched dice that decided nothing — the exact bug this whole phase
   * exists to close, wearing a different hat.
   */
  it('scores from the faces that were actually thrown, never a fresh set', () => {
    const opened = retiredTable({ house: HOUSE, stocks: [{ stockId: STOCK.id, shares: 2 }] })
    const afterHouse = scoreRoll(opened, { random: createFakeRandom({ spins: [1] }) })
    expect(afterHouse.phase).toBe('scoring')
    expect(afterHouse.results).toBeNull()

    const afterMarket = scoreRoll(afterHouse, { random: createFakeRandom({ spins: [5] }) })
    expect(afterMarket.phase).toBe('gameOver')
    expect(afterMarket.scoreRolls.map((roll) => roll.face)).toEqual([1, 5])

    const scored = afterMarket.results!.standings.find((standing) => standing.playerId === 'p1')!
    expect(scored.houseValue).toBe(settlementValue(HOUSE.resaleRange, 1, UNIT))
    expect(scored.stockValue).toBe(settlementValue(STOCK.payoutRange, 5, UNIT) * 2)
  })

  it('leaves every other queue entry identical, so a die in the air keeps its card', () => {
    const opened = retiredTable({ house: HOUSE, stocks: [{ stockId: STOCK.id, shares: 1 }] })
    const next = scoreRoll(opened, { random: createFakeRandom({ spins: [3] }) })
    expect(next.scoreRolls[1]).toBe(opened.scoreRolls[1])
  })

  it('writes what the die was worth into the log', () => {
    const opened = retiredTable({ house: HOUSE })
    const next = scoreRoll(opened, { random: createFakeRandom({ spins: [6] }) })
    const line = next.log[next.log.length - 2]!.message
    expect(line).toContain('Rolled a 6')
    expect(line).toContain(HOUSE.resaleRange[1].toLocaleString('en-US'))
  })

  it('still names a winner and files the star children', () => {
    const opened = retiredTable({ house: HOUSE, children: 3 })
    const next = scoreRoll(opened, { random: createFakeRandom({ spins: [6] }) })
    expect(next.results!.winnerId).toBeTruthy()
    expect(next.log[next.log.length - 1]!.message).toContain('The game is over!')
  })
})

describe('the settlement queue', () => {
  it('skips a player with nothing to value', () => {
    const players = [fixturePlayer({ id: 'p1', house: null, stocks: [] })]
    expect(buildScoreRolls(fixtureState({ players }))).toEqual([])
  })

  it('skips a holding whose stock has left the catalogue', () => {
    const players = [fixturePlayer({ id: 'p1', house: null, stocks: [{ stockId: 'ghost', shares: 4 }] })]
    expect(buildScoreRolls(fixtureState({ players }))).toEqual([])
  })

  it('reports the next die owed, and nothing once they have all landed', () => {
    const opened = retiredTable({ house: HOUSE })
    expect(nextScoreRoll(opened.scoreRolls)).toEqual({ playerId: 'p1', kind: 'house', face: null })
    const next = scoreRoll(opened, { random: createFakeRandom({ spins: [3] }) })
    expect(nextScoreRoll(next.scoreRolls)).toBeNull()
  })
})

describe('the card around a settlement die', () => {
  /*
   * The published ladder is what makes this honest rather than theatre: the
   * player reads all six rungs before the throw and reads their own number off
   * the row the die landed on. A table that disagreed with what the roll
   * actually paid would be worse than no table at all.
   */
  it('publishes six rungs that match what the roll will actually pay', () => {
    for (const edition of allEditions()) {
      const house = edition.houses[0]!
      const stock = edition.stocks[0]!
      const players = [
        fixturePlayer({ id: 'p1', house, stocks: [{ stockId: stock.id, shares: 2 }] }),
      ]
      const state = fixtureState({ players, editionId: edition.id })

      for (const roll of buildScoreRolls(state)) {
        const card = describeScoreRoll(state, roll)!
        expect(card.table).toHaveLength(6)
        expect(card.table.map((row) => row.range)).toEqual(['1', '2', '3', '4', '5', '6'])
        for (const row of card.table) {
          expect(row.amount).toContain(edition.currency.symbol)
        }
      }
    }
  })

  it('names the seat the die belongs to, not whoever went last', () => {
    const opened = retiredTable({ house: HOUSE })
    const card = describeScoreRoll(opened, opened.scoreRolls[0]!)!
    expect(card.playerId).toBe('p1')
    expect(card.prompt).toContain(opened.players[0]!.name)
    expect(card.stakes).toContain(HOUSE.name)
  })

  it('counts the shares and the companies riding on a market die', () => {
    const opened = retiredTable({
      stocks: [
        { stockId: STOCKS[0]!.id, shares: 2 },
        { stockId: STOCKS[1]!.id, shares: 1 },
      ],
    })
    const card = describeScoreRoll(opened, opened.scoreRolls[0]!)!
    expect(card.stakes).toContain('3 shares')
    expect(card.stakes).toContain('2 companies')
  })

  it('says nothing for a roll whose player is gone', () => {
    const state = fixtureState({ players: [fixturePlayer({ id: 'p1' })] })
    expect(describeScoreRoll(state, { playerId: 'ghost', kind: 'house', face: null })).toBeNull()
  })
})
