import { SPIN_FACES } from '../model/constants'
import type { SpinValue } from '../model/types'

/**
 * How a gated career die is read — the whole rule, in one place, so the card
 * that publishes the table and the code that resolves the roll cannot come to
 * two different conclusions about the same face.
 *
 * A gate is a `careerChange` carrying `passSpin` (see `SpaceEffect`): a
 * national entrance competition rather than a hall of booths. Under the bar
 * nothing happens; at it or above, one of the two posts on the table is
 * yours. Which of the two is decided by splitting the *passing* faces the
 * same way an ungated die splits all six — the lower of them takes the first
 * offer, the upper the second — so a player who has read one career table on
 * this board has read them all.
 */

/**
 * Whether this face clears the bar.
 *
 * Written out rather than inlined at both call sites because "the bar" is the
 * one fact about a gate a reader has to be sure of, and a `<` in one file and
 * a `>=` in another is exactly how a die comes to disagree with the table
 * printed above it.
 */
export function gatePassed(spun: SpinValue, passSpin: SpinValue): boolean {
  return spun >= passSpin
}

/**
 * The lowest passing face that takes the *second* offer.
 *
 * With a bar at five, two faces pass and the cut is six: five appoints the
 * first, six the second. With a bar at four, three faces pass and the cut is
 * still six — four and five appoint the first, six the second — because a
 * half of an odd span has to fall somewhere, and it falls the way the whole
 * die falls, with the larger half low.
 */
export function passingCut(passSpin: SpinValue): SpinValue {
  const span = SPIN_FACES - passSpin + 1
  return (passSpin + Math.ceil(span / 2)) as SpinValue
}

/**
 * Which of the two offers a passing face deals: 0 for the first, 1 for the
 * second. Meaningless for a face that did not pass, and the caller is
 * expected to have asked `gatePassed` first.
 */
export function gateOfferIndex(spun: SpinValue, passSpin: SpinValue): 0 | 1 {
  return spun >= passingCut(passSpin) ? 1 : 0
}
