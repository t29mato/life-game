import type { ChildArrivalBand, LandingEmphasis, Money, RollAmountRow } from '@domain/model/types'
import type { CurrencySpec } from '@domain/edition/types'
import { formatMoney } from './format'

/*
 * ---------------------------------------------------------------------------
 * The New Baby tile, in one place.
 *
 * Two callers settle a `haveChildren` tile — `applyEffect` when the arrivals
 * are certain (the Twins scan, already done by the time anybody reads the
 * tile) and `choose.ts` when the die actually decides — and both of them have
 * to say the same three things: the roll table before the press, the card
 * after it, and the log line. This is the tile most likely to land on somebody
 * personally, so the copy gets exactly one home rather than two that can drift
 * apart.
 *
 * The house rule for the empty face: state it, do not soften it. No "sadly",
 * no "better luck next time", no consolation prize. Two faces in six are a
 * year in which no child arrived, which is a thing that happens to real
 * families and is not a losing roll — so it is not painted as one. Nothing is
 * deducted, the emphasis stays `normal`, and the card says what happened in
 * one short sentence.
 * ---------------------------------------------------------------------------
 */

/** What the envelopes come to, given how many arrived. Nobody arrives, nobody gives. */
export function celebrationFor(children: number, perChild: Money): Money {
  return children * perChild
}

/** `child` / `children`, so no caller writes the plural by hand. */
function childLabel(children: number): string {
  return children === 1 ? 'child' : 'children'
}

/**
 * The arrival die, band by band, published before the press.
 *
 * One row per band rather than one per face — the same shape `tuitionBands`
 * uses, and for the same reason: three rows a player reads once beats six that
 * say the same thing twice over. Each row carries both halves of the news,
 * because they are one piece of news: who arrived, and what the envelopes came
 * to for them.
 */
export function arrivalBands(
  arrivals: readonly ChildArrivalBand[],
  perChild: Money,
  currency: CurrencySpec,
): readonly RollAmountRow[] {
  let previousUpTo = 0
  return arrivals.map((band) => {
    const range = band.upTo === previousUpTo + 1 ? `${band.upTo}` : `${previousUpTo + 1}-${band.upTo}`
    previousUpTo = band.upTo
    return { range, amount: arrivalOutcome(band.children, perChild, currency) }
  })
}

/** One band's news, as the single line the table's Outcome column shows. */
function arrivalOutcome(children: number, perChild: Money, currency: CurrencySpec): string {
  const gift = formatMoney(celebrationFor(children, perChild), currency)
  if (children === 0) return 'No child this year'
  if (children === 1) return `One child, +${gift} in gifts`
  if (children === 2) return `Twins, +${gift} in gifts`
  return `${children} children, +${gift} in gifts`
}

/** Everything a settled arrival has to say, whoever settled it. */
export interface ArrivalCopy {
  readonly notes: readonly string[]
  readonly emphasis: LandingEmphasis
  readonly narration: string
  readonly logMessage: string
}

/**
 * The card and the log line for an arrival that has happened.
 *
 * `face` is the die that decided it, or `null` for a certain tile that never
 * asked for one — the log says "rolls a 2" only where a 2 was actually rolled.
 */
export function arrivalCopy(
  playerName: string,
  children: number,
  face: number | null,
  gift: Money,
  money: (amount: Money) => string,
): ArrivalCopy {
  const lead = face === null ? playerName : `${playerName} spins a ${face} and`
  if (children === 0) {
    return {
      // No note. A chip reading "no child" would be the card underlining the
      // one thing it has just said plainly, which is how a neutral tile turns
      // into a consolation card.
      notes: [],
      emphasis: 'normal',
      narration: 'No child this year. The house stays the size it is.',
      logMessage: `${lead} has no child this year.`,
    }
  }
  const label = childLabel(children)
  const narration =
    children === 1
      ? `Congratulations ${playerName} — the family just got bigger!`
      : `Two at once! ${playerName}'s family just got a good deal bigger.`
  return {
    notes: [`+${children} ${label}`, `${money(gift)} in gifts`],
    emphasis: 'milestone',
    narration,
    logMessage: `${lead} welcomes ${children} ${label}, and ${money(gift)} in gifts.`,
  }
}
