import type { Money, SpinValue } from '../model/types'

/**
 * The closing settlement: reading a house's resale or a share's payout off the
 * face of a die.
 *
 * Every other number in this game that a die decides is read off a die. The
 * final valuations were the one exception — they drew a uniform integer across
 * the catalogue's own range, dozens of possible values wide, which no six-sided
 * die can ever land on. So the results screen could truthfully say a house
 * "sold for $187,000" while there was no die anywhere in the game that could
 * have produced it, and the player was simply told the number. Reported as the
 * game deciding a life's biggest asset behind their back — the same complaint,
 * on the same grounds, as the decision-card roll fixed just before this.
 *
 * A die cannot be made to have fifty-six faces, so the range is made to have
 * six bands instead: the catalogue's `[min, max]` laid out as six rungs, `1`
 * paying the bottom of the range and `6` the top. That is exactly the shape
 * every other rolled outcome in the game already has — see `RollTableRow`,
 * which is how a tuition bill or a career fair has always shown its bands —
 * so the settlement can publish its ladder before the throw and the player can
 * read off what they are hoping for. The die then genuinely decides it.
 *
 * What this deliberately does *not* change is what any of it is worth. The
 * ladder spans the catalogue's own range, unchanged, and its rungs are evenly
 * spaced, so the average outcome is the midpoint of the range — the same
 * midpoint the uniform draw averaged to, and the same one `estimateNetWorth`
 * has always priced a holding at mid-game. Only the grain changed: six rungs
 * instead of a smooth spread across the same span.
 */
export const SETTLEMENT_FACES: readonly SpinValue[] = [1, 2, 3, 4, 5, 6]

/**
 * What `face` is worth on the ladder spanning `range`, rounded to `unit`.
 *
 * `unit` is the edition's payout rounding — whole thousands on the USA board,
 * hundred-thousands in yen. Every price, salary and prize in the game is a
 * round number, so an offer of $187,333 read as a glitch rather than as a
 * market; the rungs are rounded for exactly the reason the old uniform draw
 * was rolled in that unit rather than in single dollars.
 *
 * Both ends are the range's own endpoints untouched (they are already
 * multiples of the unit, everywhere in every edition's catalogue), so a rung
 * can never land outside the range whatever the rounding does in between. A
 * range narrower than six units of its own currency yields rungs that repeat,
 * which is honest rather than broken: two faces really are worth the same
 * there, and the published table says so.
 */
export function settlementValue(
  range: readonly [Money, Money],
  face: SpinValue,
  unit: Money,
): Money {
  const [min, max] = range
  if (max <= min) return min
  const reach = ((face - 1) / (SETTLEMENT_FACES.length - 1)) * (max - min)
  if (unit <= 0) return min + reach
  return min + Math.round(reach / unit) * unit
}
