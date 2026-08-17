import type { Money, SpinValue } from '../model/types'
import type { TuitionOutcome, TuitionSpec } from '../edition/types'

/**
 * What the wheel does to the tuition bill.
 *
 * Tuition used to be the one one-time charge on the board still priced as a
 * certainty. This is the same treatment marriage and the household account
 * already got: the bands live in the edition, because a scholarship system
 * and what a bill runs to are local things, and both functions here are pure
 * so the rolling stays in the application layer.
 */

/**
 * Which band of `TuitionSpec.outcomes` a spin landed in.
 *
 * Bands are written worst-first and named by the highest spin they cover, so
 * the first one the spin does not exceed is the answer. The last band catches
 * anything an edition forgot to cover, which is the only sane reading of a
 * table that does not reach ten.
 */
export function tuitionBandFor(outcomes: readonly TuitionOutcome[], spun: SpinValue): TuitionOutcome {
  return outcomes.find((band) => spun <= band.upTo) ?? (outcomes[outcomes.length - 1] as TuitionOutcome)
}

/** Every face of the wheel, so an average is an average and not an estimate. */
const EVERY_SPIN: readonly SpinValue[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

/**
 * What the tuition bill costs on average, before anybody turns the wheel.
 *
 * The figure a computer seat prices the college fork by, and the one that has
 * to stay close to the flat sum tuition used to be: real variance is the
 * point, but the *mean* drifting from what the fork was tuned against is
 * exactly the regression `gameBalance.test.ts` exists to catch.
 */
export function expectedTuitionCost(tuition: TuitionSpec): Money {
  return (
    EVERY_SPIN.reduce((sum, spun) => sum + tuitionBandFor(tuition.outcomes, spun).cost, 0) / EVERY_SPIN.length
  )
}
