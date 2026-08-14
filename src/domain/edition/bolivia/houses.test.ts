import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { EDITION_BOLIVIA } from './index'
import { findHouse } from '../lookup'

const midpoint = (house: (typeof HOUSES)[number]): number =>
  (house.resaleRange[0] + house.resaleRange[1]) / 2

describe('bolivia houses catalog', () => {
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

  it('spans from an adobe village house to the crown of a cholet', () => {
    expect(HOUSES[0]!.price).toBeGreaterThanOrEqual(50_000)
    expect(HOUSES[0]!.price).toBeLessThanOrEqual(70_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeGreaterThanOrEqual(600_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeLessThanOrEqual(800_000)
  })

  it('keeps every resaleRange ordered, and straddling the price', () => {
    // A buy stays a gamble on every rung, never a donation.
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
    }
  })

  /*
   * Where Japan's edition tilts the wooden half of its ladder into
   * depreciation, Bolivia deliberately does not: property here is the
   * savings account — mortgages are rare, brick is trusted, and a house
   * grows a floor when the money arrives. So the whole ladder appreciates
   * gently, exactly as the tuned USA ladder does, and this test is what
   * says the sameness is a decision rather than an oversight.
   */
  it('lets every rung appreciate on an average roll — brick is the bank here', () => {
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
    it('finds a house by id in the bolivia edition', () => {
      const target = HOUSES[0]!
      expect(findHouse(target.id, EDITION_BOLIVIA)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house', EDITION_BOLIVIA)).toBeUndefined()
    })
  })
})
