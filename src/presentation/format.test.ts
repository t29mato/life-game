import { describe, expect, it } from 'vitest'
import { editionDisplayName, formatMoney, formatMoneyDelta, formatOrdinal, formatSalary } from './format'
import type { CurrencySpec } from '@domain/edition/types'

/** A ×100 currency, to prove the symbol and grouping are the edition's. */
const YEN: CurrencySpec = { symbol: '¥', locale: 'en-US', tileRounding: 10_000, payoutRounding: 100_000 }

describe('formatMoney', () => {
  it('formats a positive amount with a dollar sign and thousands separators', () => {
    expect(formatMoney(1234)).toBe('$1,234')
  })

  it('formats zero as $0', () => {
    expect(formatMoney(0)).toBe('$0')
  })

  it('formats a negative amount with the minus before the dollar sign', () => {
    expect(formatMoney(-1234)).toBe('-$1,234')
  })

  it('formats large numbers with multiple separators', () => {
    expect(formatMoney(1234567)).toBe('$1,234,567')
  })

  it('rounds fractional dollars to the nearest whole dollar', () => {
    expect(formatMoney(1234.6)).toBe('$1,235')
  })

  it('never renders a negative zero', () => {
    expect(formatMoney(-0.2)).toBe('$0')
  })
})

describe('formatMoneyDelta', () => {
  it('prefixes a positive delta with a plus sign', () => {
    expect(formatMoneyDelta(500)).toBe('+$500')
  })

  it('prefixes a negative delta with a minus sign', () => {
    expect(formatMoneyDelta(-500)).toBe('-$500')
  })

  it('treats zero as a plain, unsigned amount', () => {
    expect(formatMoneyDelta(0)).toBe('$0')
  })
})

describe('formatSalary', () => {
  it('formats a salary as money per payday', () => {
    expect(formatSalary(65000)).toBe('$65,000 / payday')
  })

  it('formats a zero salary', () => {
    expect(formatSalary(0)).toBe('$0 / payday')
  })
})

describe('formatOrdinal', () => {
  it('formats 1 as 1st', () => {
    expect(formatOrdinal(1)).toBe('1st')
  })

  it('formats 2 as 2nd', () => {
    expect(formatOrdinal(2)).toBe('2nd')
  })

  it('formats 3 as 3rd', () => {
    expect(formatOrdinal(3)).toBe('3rd')
  })

  it('formats 4 as 4th', () => {
    expect(formatOrdinal(4)).toBe('4th')
  })

  it('formats 11 as 11th (not 11st)', () => {
    expect(formatOrdinal(11)).toBe('11th')
  })

  it('formats 12 as 12th', () => {
    expect(formatOrdinal(12)).toBe('12th')
  })

  it('formats 13 as 13th', () => {
    expect(formatOrdinal(13)).toBe('13th')
  })

  it('formats 21 as 21st', () => {
    expect(formatOrdinal(21)).toBe('21st')
  })

  it('formats 22 as 22nd', () => {
    expect(formatOrdinal(22)).toBe('22nd')
  })

  it('formats 23 as 23rd', () => {
    expect(formatOrdinal(23)).toBe('23rd')
  })

  it('formats 101 as 101st', () => {
    expect(formatOrdinal(101)).toBe('101st')
  })
})

describe('every money formatter takes its symbol from the edition', () => {
  it('formats an amount in the edition currency', () => {
    expect(formatMoney(4_200_000, YEN)).toBe('¥4,200,000')
  })

  it('signs a delta in the edition currency', () => {
    expect(formatMoneyDelta(80_000, YEN)).toBe('+¥80,000')
    expect(formatMoneyDelta(-80_000, YEN)).toBe('-¥80,000')
    expect(formatMoneyDelta(0, YEN)).toBe('¥0')
  })

  it("quotes a salary in the edition currency, in the game's own words", () => {
    expect(formatSalary(6_200_000, YEN)).toBe('¥6,200,000 / payday')
  })

  it('still reads in dollars when no edition is supplied', () => {
    expect(formatMoney(1_234)).toBe('$1,234')
    expect(formatMoneyDelta(0)).toBe('$0')
    expect(formatSalary(65_000)).toBe('$65,000 / payday')
  })
})

describe('editionDisplayName', () => {
  it('answers with the place after the colon', () => {
    expect(editionDisplayName({ id: 'japan', name: 'LIFE JOURNEY: Japan' })).toBe('Japan')
  })

  it('calls the founding edition by its country, not the box title', () => {
    expect(editionDisplayName({ id: 'usa', name: 'LIFE JOURNEY' })).toBe('USA')
  })

  it('shows an unconventional name as written rather than blank', () => {
    expect(editionDisplayName({ id: 'atlantis', name: 'Atlantis Deluxe' })).toBe('Atlantis Deluxe')
    expect(editionDisplayName({ id: 'odd', name: 'Trailing colon:' })).toBe('Trailing colon:')
  })
})
