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
