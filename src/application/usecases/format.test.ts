import { describe, expect, it } from 'vitest'
import type { CurrencySpec } from '@domain/edition/types'
import {
  formatAmount,
  formatMoney,
  paydayReceipt,
  paydayWorking,
  raiseNote,
  salaryPeriod,
  salaryRate,
} from './format'

/** A ×100 currency, to prove the symbol and grouping are the edition's. */
const YEN: CurrencySpec = { symbol: '¥', locale: 'en-US', tileRounding: 10_000, payoutRounding: 100_000 }

/** Japan's actual currency shape: salary reads monthly even though the lump underneath is still ×100 the USA figure. */
const YEN_MONTHLY: CurrencySpec = { ...YEN, salaryDisplay: { unit: 'month', adjective: 'Monthly', periods: 12 } }

describe('formatMoney', () => {
  it('formats a positive amount with a dollar sign and thousands separators', () => {
    expect(formatMoney(10_000)).toBe('$10,000')
  })

  it('formats zero without a sign', () => {
    expect(formatMoney(0)).toBe('$0')
  })

  it('formats a negative amount with a leading minus before the dollar sign', () => {
    expect(formatMoney(-5_000)).toBe('-$5,000')
  })

  it('formats small amounts without separators', () => {
    expect(formatMoney(500)).toBe('$500')
  })
})

describe('formatMoney in another edition', () => {
  it('prints the edition symbol rather than a dollar sign', () => {
    expect(formatMoney(1_000_000, YEN)).toBe('¥1,000,000')
  })

  it('keeps the sign outside the symbol', () => {
    expect(formatMoney(-500_000, YEN)).toBe('-¥500,000')
  })

  it('defaults to dollars for a caller with no edition to hand', () => {
    expect(formatMoney(10_000)).toBe('$10,000')
  })
})

describe('formatAmount', () => {
  it('groups the digits without a symbol, for a sentence that already said what it is', () => {
    expect(formatAmount(310_000)).toBe('310,000')
    expect(formatAmount(31_000_000, YEN)).toBe('31,000,000')
  })
})

describe('salaryPeriod and salaryRate', () => {
  it('read salary by the payday itself, unchanged, when an edition names no period of its own', () => {
    expect(salaryPeriod()).toBe('payday')
    expect(salaryPeriod(YEN)).toBe('payday')
    expect(salaryRate(4_200_000, YEN)).toBe(4_200_000)
  })

  it('divide the salary down and name the period, where an edition reads it by one', () => {
    expect(salaryPeriod(YEN_MONTHLY)).toBe('month')
    expect(salaryRate(4_200_000, YEN_MONTHLY)).toBe(350_000)
  })
})

describe('paydayReceipt', () => {
  it('is just the total, where an edition names no period of its own', () => {
    expect(paydayReceipt(86_000)).toBe('$86,000')
  })

  it('spells out the rate times the period count, where an edition reads salary by one', () => {
    expect(paydayReceipt(4_200_000, YEN_MONTHLY)).toBe('¥350,000 × 12 months = ¥4,200,000')
  })
})

describe('paydayWorking', () => {
  /*
   * The card's half of the receipt. The delta plate beside it is already
   * printing the total, signed, and counting the balance up to it — so a note
   * ending "= ¥4,200,000" put the same figure on one card twice, which is
   * exactly what an owner reading a single payday card reported.
   */
  it('is the rate times the period count, and stops before the total', () => {
    expect(paydayWorking(4_200_000, YEN_MONTHLY)).toBe('¥350,000 × 12 months')
  })

  it('has nothing to say where an edition reads salary as one lump', () => {
    expect(paydayWorking(86_000)).toBeUndefined()
  })
})

describe('raiseNote', () => {
  it('names the new total, where an edition names no period of its own', () => {
    expect(raiseNote(80_000, 92_000)).toBe('Salary raised to $92,000')
  })

  it('leads with the period-sized delta, where an edition reads salary by one', () => {
    expect(raiseNote(4_000_000, 4_240_000, YEN_MONTHLY)).toBe('Monthly pay up ¥20,000 — now ¥353,333 a month')
  })
})
