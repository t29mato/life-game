import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { EDITION_RESEARCHER_JAPAN } from './index'
import { findHouse } from '../lookup'

const midpoint = (house: (typeof HOUSES)[number]): number =>
  (house.resaleRange[0] + house.resaleRange[1]) / 2

describe('researcher japan houses catalog', () => {
  it('has enough rungs on the ladder for a late upgrade to mean something', () => {
    expect(HOUSES.length).toBeGreaterThanOrEqual(9)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const house of HOUSES) expect(ALL_ICON_NAMES).toContain(house.icon)
  })

  it('has unique ids and names', () => {
    expect(new Set(HOUSES.map((h) => h.id)).size).toBe(HOUSES.length)
    expect(new Set(HOUSES.map((h) => h.name)).size).toBe(HOUSES.length)
  })

  it('orders houses by ascending price', () => {
    for (let i = 1; i < HOUSES.length; i++) {
      expect(HOUSES[i]!.price).toBeGreaterThan(HOUSES[i - 1]!.price)
    }
  })

  it('spans from a cold hill to the old moat district', () => {
    expect(HOUSES[0]!.price).toBeGreaterThanOrEqual(5_000_000)
    expect(HOUSES[0]!.price).toBeLessThanOrEqual(7_000_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeGreaterThanOrEqual(60_000_000)
    expect(HOUSES[HOUSES.length - 1]!.price).toBeLessThanOrEqual(80_000_000)
  })

  it('keeps every resaleRange ordered, and straddling the price', () => {
    // Even the observatory cottage can break even on a perfect spin — a buy
    // stays a gamble on every rung, never a donation.
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
    }
  })

  /*
   * The country board's mechanical twist, kept because it is a fact about
   * Japanese housing rather than about researchers: the wooden half of the
   * ladder depreciates and the concrete half holds.
   */
  it('makes the wooden end of the ladder depreciate', () => {
    const depreciating = HOUSES.filter((house) => midpoint(house) < house.price)
    expect(depreciating.length).toBeGreaterThanOrEqual(3)
    expect(midpoint(HOUSES[0]!)).toBeLessThan(HOUSES[0]!.price * 0.8)
  })

  it('lets the towers appreciate — concrete and location hold', () => {
    const tower = HOUSES[HOUSES.length - 2]!
    const penthouse = HOUSES[HOUSES.length - 1]!
    expect(midpoint(tower)).toBeGreaterThan(tower.price)
    expect(midpoint(penthouse)).toBeGreaterThan(penthouse.price)
  })

  it('keeps the whole catalogue worth buying into on average', () => {
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
    it('finds a house by id in this edition', () => {
      const target = HOUSES[0]!
      expect(findHouse(target.id, EDITION_RESEARCHER_JAPAN)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house', EDITION_RESEARCHER_JAPAN)).toBeUndefined()
    })
  })
})
