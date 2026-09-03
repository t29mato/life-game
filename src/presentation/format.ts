import type { CurrencySpec, Edition } from '@domain/edition/types'
import { USA_CURRENCY } from '@domain/edition/usa'
import { EN, type UiText } from './i18n/en'

/**
 * Pure display formatters. No React, and no hooks — the language is passed in
 * as `t` rather than read from a context, so these stay callable from the
 * board's layout maths and from a test that names no locale at all.
 *
 * Two different things decide how a figure comes out here, and keeping them
 * apart is the whole design:
 *
 * - **The edition decides the money.** The symbol and the digit grouping come
 *   from `CurrencySpec`, because they are what a *country* changes. A player
 *   reading the game in Japanese on the India board still sees ₹, grouped the
 *   Indian way. Changing the language must never change what the board counts
 *   in.
 * - **The language decides the words around it.** The ordinal (`3rd` /
 *   `3位`), the period a wage is quoted by, and the join between the two are
 *   the game's own voice, and they follow the reader rather than the board.
 *
 * `t` defaults to English and `currency` to dollars, so a component with
 * neither a game nor a provider around it still renders.
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

/**
 * The period an edition's salary reads by: a payday normally, or
 * `currency.salaryDisplay.unit` where an edition reads salary by its own
 * period instead — put into the reader's own language on the way out.
 *
 * The edition names the period in English (`'month'`), which is the id of a
 * period rather than a word for one; `t.format.unit` is what turns it into
 * something to print.
 */
export function salaryPeriod(currency: CurrencySpec = USA_CURRENCY, t: UiText = EN): string {
  return t.format.unit(currency.salaryDisplay?.unit ?? 'payday')
}

/** A raw salary figure scaled to how its edition actually reads it — unchanged normally, or divided down and rounded to a whole unit where an edition reads salary by its own period. */
export function salaryRate(amount: number, currency: CurrencySpec = USA_CURRENCY): number {
  return currency.salaryDisplay ? Math.round(amount / currency.salaryDisplay.periods) : amount
}

/** `65000` -> `'$65,000 / payday'`, or `4200000` on the Japan board -> `'¥350,000 / month'`. */
export function formatSalary(
  amount: number,
  currency: CurrencySpec = USA_CURRENCY,
  t: UiText = EN,
): string {
  return t.format.salary(formatMoney(salaryRate(amount, currency), currency), salaryPeriod(currency, t))
}

/**
 * The short place-name a picker or a records card calls an edition by.
 *
 * A country's own name in the reader's language where the catalogue has one
 * (`t.editions`) — 「日本」 is not a translation of the string "Japan", it is
 * a different word for the same place, which is why it is a table rather than
 * anything derived.
 *
 * The fallback is what this always did, and it still runs for an edition the
 * catalogue has never heard of. Editions name themselves `'LIFE JOURNEY:
 * Japan'` — the box title plus the place — and a control that repeats the box
 * title once per country says nothing, so only the part after the colon is
 * shown. The USA edition predates the convention (its `name` *is* the box
 * title), so it answers to its country here like everyone else; an edition
 * with no colon in its name is shown as written, which keeps an
 * unconventionally named one legible rather than blank.
 */
export function editionDisplayName(edition: Pick<Edition, 'id' | 'name'>, t: UiText = EN): string {
  const named = (t.editions as Readonly<Record<string, string | undefined>>)[edition.id]
  if (named !== undefined) return named
  if (edition.id === 'usa') return 'USA'
  const colon = edition.name.indexOf(':')
  return colon === -1 ? edition.name : edition.name.slice(colon + 1).trim() || edition.name
}

/** `1` -> `'1st'`, `11` -> `'11th'`, `22` -> `'22nd'` — or `'1位'` in Japanese. */
export function formatOrdinal(n: number, t: UiText = EN): string {
  return t.format.ordinal(n)
}
