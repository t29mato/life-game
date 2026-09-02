import { SPIN_FACES } from '../model/constants'
import type { EconomyConstants } from '../edition/types'
import type { Money, Player, SpinValue } from '../model/types'
import { expectedPayday } from './player'

/**
 * What the die is worth, face by face.
 *
 * The owner's complaint, in his own words: 自分で計算するのみんな大変 — doing the
 * multiplication yourself is a pain for everyone. A card that says "¥750,000 a
 * pip you roll, 1 to 6" is asking four people around one screen to run six
 * multiplications in their heads before anybody presses anything, and most of
 * them do not bother. So every die that decides money now publishes its own
 * outcome table, and this is the file the numbers on that table come from.
 *
 * Which means the rule for everything in here: **the resolver and the table
 * must call the same function.** A table built by re-deriving `perPip × spin`
 * in the card is not a table, it is a second opinion about the game's own
 * arithmetic, and the day the two disagree the game has lied to the player
 * about what they were rolling for.
 */

/**
 * Every face of the die, low to high.
 *
 * One list. `marriage.ts`, `tradeYear.ts` and `settlement.ts` had each grown
 * their own copy of the same `Array.from({ length: SPIN_FACES })` before this
 * existed, so a die with a different number of faces would have had to be
 * found in three places and is now found in one — and, more to the point, the
 * table a player reads is walked off the same list the averages the game is
 * balanced on are summed over.
 */
export const SPIN_VALUES: readonly SpinValue[] = Array.from(
  { length: SPIN_FACES },
  (_, index) => (index + 1) as SpinValue,
)

/**
 * The one multiplication behind every per-pip tile: an unsteady payday, casual
 * shifts, a spin-for-money windfall, the gift envelopes at a birth, the fund a
 * player retires early on.
 *
 * A single line, and it earns a name anyway — see the note at the top of this
 * file. Five callers previously wrote `rate * spin` by hand, and a sixth was
 * about to write it again in the card that publishes the answer.
 */
export function perPipPayout(perPip: Money, spin: SpinValue): Money {
  return perPip * spin
}

/**
 * What the joint account settles for on `spin`. Signed: positive is a month
 * two incomes carried, negative is a month the spending outran them.
 *
 * Priced as a share of what *this* player's own payday is worth rather than as
 * a flat sum, for the same reason `tradeYearSwing` is: a bad month has to mean
 * the same thing to a courier and to an agency owner. `breakEvenSpin` is the
 * face that lands exactly nowhere, and it sits below the middle of the die on
 * purpose — two incomes should be worth having overall.
 *
 * Lifted out of `resolveHouseholdSpin` in `choose.ts`, which is still its only
 * caller that moves money. The other caller only prints it, which is the whole
 * point: the six months on the card are the six months the resolver will pay.
 */
export function householdSwing(
  player: Player,
  economy: EconomyConstants,
  spin: SpinValue,
): Money {
  const { household } = economy
  return Math.round(
    (spin - household.breakEvenSpin) * expectedPayday(player, economy) * household.shareOfPayday,
  )
}
