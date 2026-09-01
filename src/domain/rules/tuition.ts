import type { Money, SpinValue } from '../model/types'
import { SPIN_FACES } from '../model/constants'
import type { EconomyConstants, TuitionOutcome, TuitionSpec } from '../edition/types'

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
 * Bands are written worst-first and named by the highest roll they cover, so
 * the first one the roll does not exceed is the answer. The last band catches
 * anything an edition forgot to cover, which is the only sane reading of a
 * table that does not reach the top face.
 */
/**
 * Which bill a `tuition` tile is sending.
 *
 * There are two of them on a board with a grad school on it, and the tile
 * names which — see `SpaceEffect`'s `tuition` variant. An edition that has not
 * written a doctoral bill falls back to its undergraduate one rather than
 * charging nothing, which is the same fallback the career shelves make and is
 * only ever reachable on a board that has a grad school without the economy to
 * price it; `validateRoute` refuses to ship one of those.
 */
export function tuitionSpecFor(
  bill: 'doctorate' | undefined,
  economy: Pick<EconomyConstants, 'tuition' | 'doctorateTuition'>,
): TuitionSpec {
  return bill === 'doctorate' ? (economy.doctorateTuition ?? economy.tuition) : economy.tuition
}

export function tuitionBandFor(outcomes: readonly TuitionOutcome[], spun: SpinValue): TuitionOutcome {
  return outcomes.find((band) => spun <= band.upTo) ?? (outcomes[outcomes.length - 1] as TuitionOutcome)
}

/** Every face of the die, so an average is an average and not an estimate. */
const EVERY_SPIN: readonly SpinValue[] = Array.from(
  { length: SPIN_FACES },
  (_, index) => (index + 1) as SpinValue,
)

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
