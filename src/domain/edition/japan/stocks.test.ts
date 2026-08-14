import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { STOCKS } from './stocks'
import { EDITION_JAPAN } from './index'
import { findStock } from '../lookup'

const midpoint = (stock: (typeof STOCKS)[number]): number =>
  (stock.payoutRange[0] + stock.payoutRange[1]) / 2

describe('japan stocks catalog', () => {
  it('offers five stocks to pick between', () => {
    expect(STOCKS).toHaveLength(5)
  })

  it('has unique ids and unique tickers', () => {
    const ids = STOCKS.map((stock) => stock.id)
    const tickers = STOCKS.map((stock) => stock.ticker)
    expect(new Set(ids).size).toBe(ids.length)
    expect(new Set(tickers).size).toBe(tickers.length)
  })

  it('prints a short board ticker of two to four capital letters', () => {
    for (const stock of STOCKS) {
      expect(stock.ticker).toMatch(/^[A-Z]{2,4}$/)
    }
  })

  it('prices every share somewhere a mid-game player can actually afford', () => {
    for (const stock of STOCKS) {
      expect(stock.price).toBeGreaterThanOrEqual(500_000)
      expect(stock.price).toBeLessThanOrEqual(3_000_000)
    }
  })

  it('keeps every payoutRange ordered min-to-max', () => {
    for (const stock of STOCKS) {
      expect(stock.payoutRange[0]).toBeLessThanOrEqual(stock.payoutRange[1])
    }
  })

  it('rewards risk: a wider spread carries a higher expected payout', () => {
    const bySpread = [...STOCKS].sort(
      (a, b) => a.payoutRange[1] - a.payoutRange[0] - (b.payoutRange[1] - b.payoutRange[0]),
    )
    const expectations = bySpread.map(midpoint)
    expect([...expectations].sort((a, b) => a - b)).toEqual(expectations)
  })

  it('holds at least two safe stocks whose range barely dips under the price', () => {
    // The konbini and the railway: never close, never miss, never surprise.
    const safe = STOCKS.filter((stock) => stock.payoutRange[0] >= stock.price * 0.8)
    expect(safe.length).toBeGreaterThanOrEqual(2)
  })

  it('holds at least two stocks that can lose most of the money put in', () => {
    const risky = STOCKS.filter((stock) => stock.payoutRange[0] <= stock.price * 0.4)
    expect(risky.length).toBeGreaterThanOrEqual(2)
  })

  it('can always beat its own price on a good roll', () => {
    for (const stock of STOCKS) {
      expect(stock.payoutRange[1]).toBeGreaterThan(stock.price)
    }
  })

  it('gives every stock a name, a described story, and a real icon', () => {
    for (const stock of STOCKS) {
      expect(stock.name.length).toBeGreaterThan(0)
      expect(stock.description.length).toBeGreaterThan(10)
      expect(ALL_ICON_NAMES).toContain(stock.icon)
    }
  })

  describe('findStock', () => {
    it('finds a stock by id in the japan edition', () => {
      const target = STOCKS[0]!
      expect(findStock(target.id, EDITION_JAPAN)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findStock('not-a-real-stock', EDITION_JAPAN)).toBeUndefined()
    })
  })
})
