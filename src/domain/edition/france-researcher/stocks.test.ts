import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { STOCKS } from './stocks'
import { STOCKS as FRANCE_STOCKS } from '../france/stocks'
import { EDITION_RESEARCHER_FRANCE } from './index'
import { findStock } from '../lookup'

const midpoint = (stock: (typeof STOCKS)[number]): number =>
  (stock.payoutRange[0] + stock.payoutRange[1]) / 2

describe('researcher france stocks catalog', () => {
  it('offers five holdings to pick between', () => {
    expect(STOCKS).toHaveLength(5)
  })

  it('has unique ids and unique tickers', () => {
    expect(new Set(STOCKS.map((s) => s.id)).size).toBe(STOCKS.length)
    expect(new Set(STOCKS.map((s) => s.ticker)).size).toBe(STOCKS.length)
  })

  it('prints a short board ticker of two to four capital letters', () => {
    for (const stock of STOCKS) expect(stock.ticker).toMatch(/^[A-Z]{2,4}$/)
  })

  it('keeps the country board\'s tuned prices and payout bands', () => {
    // A pure reskin: `stocks.ts` is edition-owned, so what a share *is* can
    // change for nothing while the measured risk ladder stays exactly where
    // it was.
    expect(STOCKS.map((s) => s.price)).toEqual(FRANCE_STOCKS.map((s) => s.price))
    expect(STOCKS.map((s) => s.payoutRange)).toEqual(FRANCE_STOCKS.map((s) => s.payoutRange))
    const theirs = new Set(FRANCE_STOCKS.map((s) => s.name))
    expect(STOCKS.filter((s) => theirs.has(s.name))).toEqual([])
  })

  it('prices every share somewhere a mid-game player can actually afford', () => {
    for (const stock of STOCKS) {
      expect(stock.price).toBeGreaterThanOrEqual(5_000)
      expect(stock.price).toBeLessThanOrEqual(30_000)
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

  it('holds at least two safe holdings whose range barely dips under the price', () => {
    // The consumables supplier and the instrument maker: every laboratory in
    // Europe buys from both, every year, without negotiating.
    const safe = STOCKS.filter((stock) => stock.payoutRange[0] >= stock.price * 0.8)
    expect(safe.length).toBeGreaterThanOrEqual(2)
  })

  it('holds at least two that can lose most of the money put in', () => {
    const risky = STOCKS.filter((stock) => stock.payoutRange[0] <= stock.price * 0.4)
    expect(risky.length).toBeGreaterThanOrEqual(2)
  })

  it('can always beat its own price on a good roll', () => {
    for (const stock of STOCKS) expect(stock.payoutRange[1]).toBeGreaterThan(stock.price)
  })

  it('gives every holding a name, a described story, and a real icon', () => {
    for (const stock of STOCKS) {
      expect(stock.name.length).toBeGreaterThan(0)
      expect(stock.description.length).toBeGreaterThan(10)
      expect(ALL_ICON_NAMES).toContain(stock.icon)
    }
  })

  describe('findStock', () => {
    it('finds a holding by id in this edition', () => {
      const target = STOCKS[0]!
      expect(findStock(target.id, EDITION_RESEARCHER_FRANCE)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findStock('not-a-real-stock', EDITION_RESEARCHER_FRANCE)).toBeUndefined()
    })
  })
})
