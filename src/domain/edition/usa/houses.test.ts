import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { HOUSES } from './houses'
import { findHouse } from '../lookup'

describe('houses catalog', () => {
  it('has enough rungs on the ladder for a late upgrade to mean something', () => {
    expect(HOUSES.length).toBeGreaterThanOrEqual(9)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const house of HOUSES) {
      expect(ALL_ICON_NAMES).toContain(house.icon)
    }
  })

  it('always leaves something to trade up to, short of the very top', () => {
    for (const house of HOUSES.slice(0, -1)) {
      expect(HOUSES.some((other) => other.price > house.price)).toBe(true)
    }
  })

  it('has unique ids', () => {
    const ids = HOUSES.map((house) => house.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('orders houses by ascending price', () => {
    for (let i = 1; i < HOUSES.length; i++) {
      const previous = HOUSES[i - 1]
      const current = HOUSES[i]
      expect(previous).toBeDefined()
      expect(current).toBeDefined()
      expect(current!.price).toBeGreaterThan(previous!.price)
    }
  })

  it('spans from a tiny cabin to a skyline penthouse', () => {
    const first = HOUSES[0]
    const last = HOUSES[HOUSES.length - 1]
    expect(first).toBeDefined()
    expect(last).toBeDefined()
    expect(first!.price).toBeGreaterThanOrEqual(50_000)
    expect(first!.price).toBeLessThanOrEqual(70_000)
    expect(last!.price).toBeGreaterThanOrEqual(600_000)
    expect(last!.price).toBeLessThanOrEqual(800_000)
  })

  it('keeps every resaleRange min at or below its max', () => {
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThanOrEqual(max)
    }
  })

  it('straddles the purchase price with the resale range, making it a real gamble', () => {
    for (const house of HOUSES) {
      const [min, max] = house.resaleRange
      expect(min).toBeLessThan(house.price)
      expect(max).toBeGreaterThan(house.price)
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
    it('finds a house by id', () => {
      const target = HOUSES[0]
      expect(target).toBeDefined()
      expect(findHouse(target!.id)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findHouse('not-a-real-house')).toBeUndefined()
    })
  })
})
