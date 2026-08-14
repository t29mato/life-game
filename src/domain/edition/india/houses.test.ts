import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { EDITION_INDIA } from './index'
import { findHouse } from '../lookup'

const midpoint = (house: (typeof HOUSES)[number]): number =>
  (house.resaleRange[0] + house.resaleRange[1]) / 2

describe('india houses catalog', () => {
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

  it('spans from an ancestral village house to a south-city penthouse', () => {
    expect(HOUSES[0]!.price).toBeGreaterThanOrEqual(5_000_000)
    expect(HOUSES[0]!.price).toBeLessThanOrEqual(7_000_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeGreaterThanOrEqual(60_000_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeLessThanOrEqual(80_000_000)
  })

  it('keeps every resaleRange ordered, and straddling the price', () => {
    // Even the village house can sell at a loss on a bad spin — a buy stays a
    // gamble on every rung, never a certificate.
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
    }
  })

  /*
   * The deliberate non-deviation, asserted so nobody imports Japan's tilt by
   * analogy: Indian property appreciates, so every rung's expected resale sits
   * above its price, exactly as the measured USA ladder's does. The mirror in
   * `edition.test.ts` pins the numbers; this pins the story.
   */
  it('lets every rung appreciate — property is the family asset here', () => {
    for (const house of HOUSES) {
      expect(midpoint(house), house.id).toBeGreaterThan(house.price)
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
    it('finds a house by id in the india edition', () => {
      const target = HOUSES[0]!
      expect(findHouse(target.id, EDITION_INDIA)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house', EDITION_INDIA)).toBeUndefined()
    })
  })
})
