import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { HOUSES as FRANCE_HOUSES } from '../france/houses'
import { EDITION_RESEARCHER_FRANCE } from './index'
import { findHouse } from '../lookup'

const midpoint = (house: (typeof HOUSES)[number]): number =>
  (house.resaleRange[0] + house.resaleRange[1]) / 2

describe('researcher france houses catalog', () => {
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

  it('keeps the country board\'s tuned ladder, price for price', () => {
    // How much a home costs and what it comes back as is a fact about French
    // property, not about the person holding the keys, and that ladder is
    // measured. Only the doorways change.
    expect(HOUSES.map((h) => h.price)).toEqual(FRANCE_HOUSES.map((h) => h.price))
    expect(HOUSES.map((h) => h.resaleRange)).toEqual(FRANCE_HOUSES.map((h) => h.resaleRange))
    const theirs = new Set(FRANCE_HOUSES.map((h) => h.description))
    expect(HOUSES.filter((h) => theirs.has(h.description))).toEqual([])
  })

  it('keeps every resaleRange ordered, and straddling the price', () => {
    // Even the ruin can break even on a perfect spin — a buy stays a gamble on
    // every rung, never a donation.
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
    }
  })

  it('lets every rung appreciate gently, the way French property does', () => {
    // The quiet reason a French household with a salary buys as early as the
    // bank will let them, and the mechanical opposite of the Japan board's
    // depreciating timber.
    for (const house of HOUSES) expect(midpoint(house)).toBeGreaterThan(house.price)
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
      expect(findHouse(target.id, EDITION_RESEARCHER_FRANCE)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house', EDITION_RESEARCHER_FRANCE)).toBeUndefined()
    })
  })
})
