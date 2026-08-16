import { describe, expect, it } from 'vitest'
import type { CurrencySpec } from '@domain/edition/types'
import { formatAmount, formatMoney, loanNote, paydayReceipt, raiseNote, salaryPeriod, salaryRate } from './format'

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

describe('loanNote', () => {
  it('says how much was borrowed, not just how many loans', () => {
    expect(loanNote(1, 20_000, 25_000)).toBe(
      'Took out 1 loan — $20,000 borrowed, $25,000 due at retirement.',
    )
  })

  it('multiplies both sums by the number of loans forced', () => {
    expect(loanNote(3, 20_000, 25_000)).toBe(
      'Took out 3 loans — $60,000 borrowed, $75,000 due at retirement.',
    )
  })

  it('prices the settlement the caller passes, so a harder game reads harder', () => {
    // Very Hard settles a loan at $46,000 against the same $20,000 principal.
    expect(loanNote(1, 20_000, 46_000)).toContain('$46,000 due at retirement')
  })

  it('counts in the edition currency', () => {
    expect(loanNote(2, 2_000_000, 2_500_000, YEN)).toBe(
      'Took out 2 loans — ¥4,000,000 borrowed, ¥5,000,000 due at retirement.',
    )
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

describe('raiseNote', () => {
  it('names the new total, where an edition names no period of its own', () => {
    expect(raiseNote(80_000, 92_000)).toBe('Salary raised to $92,000')
  })

  it('leads with the period-sized delta, where an edition reads salary by one', () => {
    expect(raiseNote(4_000_000, 4_240_000, YEN_MONTHLY)).toBe('Monthly pay up ¥20,000 — now ¥353,333 a month')
  })
})
