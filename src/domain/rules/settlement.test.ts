import { describe, expect, it } from 'vitest'
import { EDITION_USA } from '../edition/usa'
import { allEditions } from '../edition/registry'
import { SETTLEMENT_FACES, settlementValue } from './settlement'

const USA_UNIT = EDITION_USA.currency.payoutRounding

describe('the settlement ladder', () => {
  it('pays the bottom of the range on a 1 and the top on a 6', () => {
    expect(settlementValue([40_000, 95_000], 1, USA_UNIT)).toBe(40_000)
    expect(settlementValue([40_000, 95_000], 6, USA_UNIT)).toBe(95_000)
  })

  it('never lands outside the range on any face', () => {
    for (const face of SETTLEMENT_FACES) {
      const value = settlementValue([40_000, 95_000], face, USA_UNIT)
      expect(value).toBeGreaterThanOrEqual(40_000)
      expect(value).toBeLessThanOrEqual(95_000)
    }
  })

  it('climbs with the face and never doubles back', () => {
    const rungs = SETTLEMENT_FACES.map((face) => settlementValue([3_000, 77_000], face, USA_UNIT))
    for (let i = 1; i < rungs.length; i += 1) {
      expect(rungs[i]!).toBeGreaterThanOrEqual(rungs[i - 1]!)
    }
  })

  /*
   * The one number the whole change had to leave alone. Every rung is a round
   * figure in the edition's own payout unit, which is why the old draw was
   * made in whole thousands too: a house that sold for $187,333 read as a
   * glitch rather than as a market.
   */
  it('rounds every rung to the edition payout unit, in every edition', () => {
    for (const edition of allEditions()) {
      const unit = edition.currency.payoutRounding
      const ranges = [
        ...edition.houses.map((house) => house.resaleRange),
        ...edition.stocks.map((stock) => stock.payoutRange),
      ]
      for (const range of ranges) {
        for (const face of SETTLEMENT_FACES) {
          const value = settlementValue(range, face, unit)
          expect(value % unit).toBe(0)
          expect(value).toBeGreaterThanOrEqual(range[0])
          expect(value).toBeLessThanOrEqual(range[1])
        }
      }
    }
  })

  /*
   * What keeps this a re-grain rather than a retune. The old uniform draw
   * averaged to the midpoint of the range; six evenly spaced rungs average to
   * the same midpoint, which is also what `estimateNetWorth` has always priced
   * a holding at mid-game. The tolerance is half a payout unit, all the
   * rounding of the inner rungs can cost.
   */
  it('averages to the midpoint of the range, which is what it always averaged to', () => {
    for (const edition of allEditions()) {
      const unit = edition.currency.payoutRounding
      const ranges = [
        ...edition.houses.map((house) => house.resaleRange),
        ...edition.stocks.map((stock) => stock.payoutRange),
      ]
      for (const range of ranges) {
        const mean =
          SETTLEMENT_FACES.reduce((sum, face) => sum + settlementValue(range, face, unit), 0) /
          SETTLEMENT_FACES.length
        expect(Math.abs(mean - (range[0] + range[1]) / 2)).toBeLessThanOrEqual(unit / 2)
      }
    }
  })

  it('fails closed on a range with no width and on a nonsense unit', () => {
    expect(settlementValue([50_000, 50_000], 4, USA_UNIT)).toBe(50_000)
    expect(settlementValue([90_000, 40_000], 6, USA_UNIT)).toBe(90_000)
    expect(settlementValue([0, 50_000], 6, 0)).toBe(50_000)
  })
})
