import type { Money } from '@domain/model/types'
import type { CurrencySpec } from '@domain/edition/types'
import { USA_CURRENCY } from '@domain/edition/usa'

/**
 * `10000 -> "$10,000"`, `-5000 -> "-$5,000"`. Used for log lines and notes.
 *
 * The symbol and the grouping belong to the edition; the shape of the string —
 * sign, symbol, digits — is the game's, and is the same everywhere. `currency`
 * defaults to dollars so a caller with no game in hand still reads the way it
 * always did.
 */
export function formatMoney(amount: Money, currency: CurrencySpec = USA_CURRENCY): string {
  const sign = amount < 0 ? '-' : ''
  return `${sign}${currency.symbol}${Math.abs(amount).toLocaleString(currency.locale)}`
}

/** Grouped digits with no symbol, for a sentence that has already said "wins with". */
export function formatAmount(amount: Money, currency: CurrencySpec = USA_CURRENCY): string {
  return amount.toLocaleString(currency.locale)
}

/** The period an edition's salary reads by: `'payday'` normally, or `currency.salaryDisplay.unit` where an edition reads salary by its own period instead. */
export function salaryPeriod(currency: CurrencySpec = USA_CURRENCY): string {
  return currency.salaryDisplay?.unit ?? 'payday'
}

/**
 * A raw salary figure scaled to how its edition actually reads it —
 * unchanged normally, or divided down and rounded to a whole unit where an
 * edition reads salary by its own period. Rounded because a career's salary
 * is not guaranteed to divide evenly (¥10,450,000 / 12 is not a whole yen),
 * and this is the one place in the engine that ever does that division.
 */
export function salaryRate(amount: Money, currency: CurrencySpec = USA_CURRENCY): Money {
  return currency.salaryDisplay ? Math.round(amount / currency.salaryDisplay.periods) : amount
}

/**
 * What a salaried payday actually paid, spelled out the way its edition reads
 * salary: the lump by itself, or — where an edition reads salary by its own
 * period — the rate times the period count, equalling the lump, so the
 * player sees exactly where the number came from rather than a total that
 * does not match the monthly figure quoted everywhere else.
 */
export function paydayReceipt(amount: Money, currency: CurrencySpec = USA_CURRENCY): string {
  if (!currency.salaryDisplay) return formatMoney(amount, currency)
  const { unit, periods } = currency.salaryDisplay
  return `${formatMoney(salaryRate(amount, currency), currency)} × ${periods} ${unit}s = ${formatMoney(amount, currency)}`
}

/**
 * The same receipt with the answer torn off: `"¥333,333 × 12 months"`, and
 * nothing where the total would be.
 *
 * `paydayReceipt` is right for a log line, which has no plate beside it and
 * has to carry the sum itself. On the card it was one figure too many — the
 * receipt ends in the lump, and the lump is already the delta chip and the
 * number the balance counts up to, so an owner reading a single payday card
 * found the same ¥2,800,000 printed twice. The working is the half a plate
 * genuinely cannot show; the plate is the half a note should not.
 *
 * `undefined` where there is no working to show — an edition that reads
 * salary as one lump has no rate and no period, and "the lump = the lump" is
 * not a note.
 */
export function paydayWorking(amount: Money, currency: CurrencySpec = USA_CURRENCY): string | undefined {
  if (!currency.salaryDisplay) return undefined
  const { unit, periods } = currency.salaryDisplay
  return `${formatMoney(salaryRate(amount, currency), currency)} × ${periods} ${unit}s`
}

/**
 * A raise, read the way its edition reads salary: "Salary raised to $92,000"
 * by itself, or — where an edition reads salary by its own period — the
 * period-sized delta first, since that is the number the player actually
 * felt: "Monthly pay up ¥20,000 — now ¥370,000 a month".
 */
export function raiseNote(previousSalary: Money, newSalary: Money, currency: CurrencySpec = USA_CURRENCY): string {
  if (!currency.salaryDisplay) return `Salary raised to ${formatMoney(newSalary, currency)}`
  const { adjective, unit } = currency.salaryDisplay
  const delta = salaryRate(newSalary, currency) - salaryRate(previousSalary, currency)
  const rate = salaryRate(newSalary, currency)
  return `${adjective} pay up ${formatMoney(delta, currency)} — now ${formatMoney(rate, currency)} a ${unit}`
}
