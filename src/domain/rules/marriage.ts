import type { Money, SpinValue } from '../model/types'
import { SPIN_FACES } from '../model/constants'
import type { EconomyConstants, MarriageOutcome } from '../edition/types'
import { SPIN_VALUES } from './diePayout'

/**
 * What the wheel does at the altar.
 *
 * Marriage used to be the last uniformly good thing on the board — you married,
 * every rival handed you an envelope, and there was no version of it that cost
 * you anything. The wheel now decides *which* marriage as well as whether, and
 * the bands live in the edition, because what a wedding costs and what a partner
 * brings to it is one of the most local things a country has.
 *
 * Both functions here are pure and take the edition's `economy`, so the rolling
 * stays in the application layer and the arithmetic stays testable.
 */

/**
 * Which band of `MarriageSpec.outcomes` a spin landed in.
 *
 * Bands are written worst-first and named by the highest roll they cover, so the
 * first one the roll does not exceed is the answer. The last band catches
 * anything an edition forgot to cover, which is the only sane reading of a table
 * that does not reach the top face.
 */
export function marriageBandFor(
  outcomes: readonly MarriageOutcome[],
  spun: SpinValue,
): MarriageOutcome {
  return outcomes.find((band) => spun <= band.upTo) ?? (outcomes[outcomes.length - 1] as MarriageOutcome)
}

/** What one band hands the mover, given how many rivals are there to pay for it. */
export function marriageOutcomeValue(
  outcome: MarriageOutcome,
  economy: EconomyConstants,
  rivals: number,
): Money {
  return economy.weddingGift * outcome.giftMultiplier * rivals + outcome.windfall - outcome.cost
}

/** Every face of the die, so an average is an average and not an estimate. */
const EVERY_SPIN = SPIN_VALUES

/**
 * What marrying is worth on average, before anybody turns the wheel.
 *
 * The figure a computer seat prices the tile by, and the one that has to stay
 * **positive**: a marriage that loses money on average is one nobody sane takes,
 * and the entire family side of the board — children, the per-child bonus, the
 * whole scoring lane — hangs off this tile being worth reaching.
 *
 * Table size does real work in here. Every rival pays a gift, so a full table
 * makes marriage reliably good and a duel makes it a genuine gamble, which is
 * the right way round: a duel is where one swing decides everything.
 *
 * The LIFE tile a refusal pays out is deliberately not counted. It is not money,
 * the deck it comes from is the edition's rather than this table's, and leaving
 * it out keeps this a floor on what marrying is worth rather than a flattering
 * average.
 */
export function expectedMarriageValue(economy: EconomyConstants, rivals: number): Money {
  const { marriage } = economy
  const secondAskOdds = (SPIN_FACES + 1 - marriage.secondAskSpin) / SPIN_FACES

  return (
    EVERY_SPIN.reduce((sum, spun) => {
      if (spun >= marriage.proposalSpin) {
        return sum + marriageOutcomeValue(marriageBandFor(marriage.outcomes, spun), economy, rivals)
      }
      // Under the bar the wheel is asked once more: mostly a rescued proposal,
      // and otherwise a year spent single, which moves no money at all.
      return sum + secondAskOdds * marriageOutcomeValue(marriage.rescued, economy, rivals)
    }, 0) / EVERY_SPIN.length
  )
}
