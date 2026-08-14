import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { EDITION_FRANCE } from './index'
import { findHouse } from '../lookup'

const midpoint = (house: (typeof HOUSES)[number]): number =>
  (house.resaleRange[0] + house.resaleRange[1]) / 2

describe('france houses catalog', () => {
  it('has enough rungs on the ladder for a late upgrade to mean something', () => {
    expect(HOUSES.length).toBeGreaterThanOrEqual(9)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const house of HOUSES) {
      expect(ALL_ICON_NAMES).toContain(house.icon)
    }
  })

  it('has unique ids', () => {
    const ids = HOUSES.map((house) => house.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('orders houses by ascending price', () => {
    for (let i = 1; i < HOUSES.length; i++) {
      expect(HOUSES[i]!.price).toBeGreaterThan(HOUSES[i - 1]!.price)
    }
  })

  it('spans from a village cottage to a Haussmann top floor', () => {
    expect(HOUSES[0]!.price).toBeGreaterThanOrEqual(50_000)
    expect(HOUSES[0]!.price).toBeLessThanOrEqual(70_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeGreaterThanOrEqual(600_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeLessThanOrEqual(800_000)
  })

  it('keeps every resaleRange ordered, and straddling the price', () => {
    // A buy stays a gamble on every rung, never a donation and never a gift:
    // even the village cottage can lose money, and even the top floor can gain.
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
    }
  })

  /*
   * The deliberate non-deviation, stated as a property rather than left as an
   * accident: France keeps the USA ladder's gentle appreciation on every rung
   * (the market story fits without a tilt), where Japan tilted its wooden
   * half downward. The exact figure-for-figure pin lives in `edition.test.ts`;
   * this holds the *shape* even if that pin is ever renegotiated.
   */
  it('appreciates gently on every rung — no depreciation tilt here', () => {
    for (const house of HOUSES) {
      expect(midpoint(house)).toBeGreaterThan(house.price)
    }
  })

  it('gives every house a name, icon, and description', () => {
    for (const house of HOUSES) {
      expect(house.name.length).toBeGreaterThan(0)
      expect(house.icon.length).toBeGreaterThan(0)
      expect(house.description.length).toBeGreaterThan(0)
    }
  })

  describe('findHouse', () => {
    it('finds a house by id in the france edition', () => {
      const target = HOUSES[0]!
      expect(findHouse(target.id, EDITION_FRANCE)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house', EDITION_FRANCE)).toBeUndefined()
    })
  })
})
