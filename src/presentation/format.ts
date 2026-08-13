import type { CurrencySpec } from '@domain/edition/types'
import { USA_CURRENCY } from '@domain/edition/usa'

/**
 * Pure display formatters. No React — every string in the game is English, so
 * the words are hand-rolled and only the digits go through `toLocaleString`,
 * which keeps the output perfectly predictable in tests.
 *
 * The symbol and the grouping come from the edition's `CurrencySpec`, because
 * they are the one thing about a printed amount that a country changes.
 * Everything else — the sign, the ordinal suffixes, "/ payday" — is the
 * game's own voice and is shared by every edition. `currency` defaults to
 * dollars so a component with no game state around it still renders.
 */

/** `1234` -> `'$1,234'`, `-1234` -> `'-$1,234'`. Rounds to whole units. */
export function formatMoney(amount: number, currency: CurrencySpec = USA_CURRENCY): string {
  const rounded = Math.round(amount)
  const safe = rounded === 0 ? 0 : rounded
  const sign = safe < 0 ? '-' : ''
  const digits = Math.abs(safe).toLocaleString(currency.locale)
  return `${sign}${currency.symbol}${digits}`
}

/** Like `formatMoney`, but always signed: `+$500`, `-$500`, `$0`. */
export function formatMoneyDelta(amount: number, currency: CurrencySpec = USA_CURRENCY): string {
  const rounded = Math.round(amount)
  if (rounded === 0) return `${currency.symbol}0`
  if (rounded > 0) return `+${formatMoney(rounded, currency)}`
  return formatMoney(rounded, currency)
}

/** `65000` -> `'$65,000 / payday'`. */
export function formatSalary(amount: number, currency: CurrencySpec = USA_CURRENCY): string {
  return `${formatMoney(amount, currency)} / payday`
}

/** `1` -> `'1st'`, `11` -> `'11th'`, `22` -> `'22nd'`. */
export function formatOrdinal(n: number): string {
  const abs = Math.abs(n)
  const lastTwo = abs % 100
  if (lastTwo >= 11 && lastTwo <= 13) return `${n}th`
  switch (abs % 10) {
    case 1:
      return `${n}st`
    case 2:
      return `${n}nd`
    case 3:
      return `${n}rd`
    default:
      return `${n}th`
  }
}
