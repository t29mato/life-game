import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { EDITION_JAPAN } from './index'
import { findHouse } from '../lookup'

const midpoint = (house: (typeof HOUSES)[number]): number =>
  (house.resaleRange[0] + house.resaleRange[1]) / 2

describe('japan houses catalog', () => {
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

  it('spans from an empty farmhouse to a central penthouse', () => {
    expect(HOUSES[0]!.price).toBeGreaterThanOrEqual(5_000_000)
    expect(HOUSES[0]!.price).toBeLessThanOrEqual(7_000_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeGreaterThanOrEqual(60_000_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeLessThanOrEqual(80_000_000)
  })

  it('keeps every resaleRange ordered, and straddling the price', () => {
    // Even the akiya can break even on a perfect spin — a buy stays a gamble
    // on every rung, never a donation.
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
    }
  })

  /*
   * The edition's mechanical twist, asserted so it cannot quietly regress:
   * the wooden half of the ladder depreciates and the concrete half holds.
   * House choice is charm against asset, not bigger-is-better.
   */
  it('makes the wooden end of the ladder depreciate', () => {
    const depreciating = HOUSES.filter((house) => midpoint(house) < house.price)
    expect(depreciating.length).toBeGreaterThanOrEqual(3)
    // The farmhouse — Japan's eight million empty houses — is the clearest case.
    expect(midpoint(HOUSES[0]!)).toBeLessThan(HOUSES[0]!.price * 0.8)
  })

  it('lets the towers appreciate — concrete and location hold', () => {
    const tower = HOUSES[HOUSES.length - 2]!
    const penthouse = HOUSES[HOUSES.length - 1]!
    expect(midpoint(tower)).toBeGreaterThan(tower.price)
    expect(midpoint(penthouse)).toBeGreaterThan(penthouse.price)
  })

  it('keeps the whole catalogue worth buying into on average', () => {
    // The tilt is a story about *which* house, not a tax on owning one: the
    // expected value across the ladder stays positive, merely leaner than the
    // USA catalogue's, which the balance suite absorbs and measures.
    const totalEdge = HOUSES.reduce((sum, house) => sum + (midpoint(house) - house.price), 0)
    expect(totalEdge).toBeGreaterThan(0)
  })

  it('gives every house a name, icon, and description', () => {
    for (const house of HOUSES) {
      expect(house.name.length).toBeGreaterThan(0)
      expect(house.icon.length).toBeGreaterThan(0)
      expect(house.description.length).toBeGreaterThan(0)
    }
  })

  describe('findHouse', () => {
    it('finds a house by id in the japan edition', () => {
      const target = HOUSES[0]!
      expect(findHouse(target.id, EDITION_JAPAN)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house', EDITION_JAPAN)).toBeUndefined()
    })
  })
})
