import { describe, expect, it } from 'vitest'
import type { CurrencySpec } from '@domain/edition/types'
import { formatAmount, formatMoney, loanNote } from './format'

/** A ×100 currency, to prove the symbol and grouping are the edition's. */
const YEN: CurrencySpec = { symbol: '¥', locale: 'en-US', tileRounding: 10_000, payoutRounding: 100_000 }

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
