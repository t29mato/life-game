import type { ChildArrivalBand, LandingEmphasis, Money, RollAmountRow } from '@domain/model/types'
import type { CurrencySpec } from '@domain/edition/types'
import type { NarrationText } from '../i18n/en'
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
 * one short sentence. Every translation inherits that rule; the Japanese
 * catalogue restates it where the strings live.
 * ---------------------------------------------------------------------------
 */

/** What the envelopes come to, given how many arrived. Nobody arrives, nobody gives. */
export function celebrationFor(children: number, perChild: Money): Money {
  return children * perChild
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
  say: NarrationText,
): readonly RollAmountRow[] {
  let previousUpTo = 0
  return arrivals.map((band) => {
    const range = band.upTo === previousUpTo + 1 ? `${band.upTo}` : `${previousUpTo + 1}-${band.upTo}`
    previousUpTo = band.upTo
    return { range, amount: arrivalOutcome(band.children, perChild, currency, say) }
  })
}

/** One band's news, as the single line the table's Outcome column shows. */
function arrivalOutcome(
  children: number,
  perChild: Money,
  currency: CurrencySpec,
  say: NarrationText,
): string {
  const gift = formatMoney(celebrationFor(children, perChild), currency)
  if (children === 0) return say.roll.noChild
  if (children === 1) return say.roll.oneChild(gift)
  if (children === 2) return say.roll.twins(gift)
  return say.roll.manyChildren(children, gift)
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
 * asked for one — the log says "spins a 2" only where a 2 was actually spun.
 * The two shapes are separate catalogue entries rather than a lead clause
 * glued onto a sentence, because a language that puts the verb last cannot
 * take an English opening and finish it.
 */
export function arrivalCopy(
  playerName: string,
  children: number,
  face: number | null,
  gift: Money,
  money: (amount: Money) => string,
  say: NarrationText,
): ArrivalCopy {
  if (children === 0) {
    return {
      // No note. A chip reading "no child" would be the card underlining the
      // one thing it has just said plainly, which is how a neutral tile turns
      // into a consolation card.
      notes: [],
      emphasis: 'normal',
      narration: say.baby.noneNarration,
      logMessage: face === null ? say.baby.noneLog(playerName) : say.baby.noneSpunLog(playerName, face),
    }
  }
  const narration = children === 1 ? say.baby.oneNarration(playerName) : say.baby.twinsNarration(playerName)
  return {
    notes: [say.baby.arrivalNote(children), say.baby.giftNote(money(gift))],
    emphasis: 'milestone',
    narration,
    logMessage:
      face === null
        ? say.baby.arrivedLog(playerName, children, money(gift))
        : say.baby.arrivedSpunLog(playerName, face, children, money(gift)),
  }
}
