import type { ChildArrivalBand, Money, Player, SpinValue } from '../model/types'
import { SPIN_FACES } from '../model/constants'
import type { EconomyConstants } from '../edition/types'
import { USA_ECONOMY } from '../edition/usa/economy'
import { SPIN_VALUES } from './diePayout'
import { expectedPayday } from './player'

/**
 * The distribution every New Baby tile on every board is written to.
 *
 * The owner's call, from a play session: 1〜2だと0人、3〜5で一人、6で双子 —
 * two faces in six where no child arrives, three where one does, one where two
 * do. It lives here rather than in each edition's route because it is not a
 * local fact: what a wedding costs and what a child pays back differ by
 * country, and the odds a pregnancy happens at all do not. Only the money on
 * the tile is edition data.
 *
 * The empty faces are the point of the whole shape. Family Lane was the one
 * road whose headline could not miss, and "you took the lane, so you have the
 * children" is a claim the board has no business making. Mean arrivals per
 * tile: 5/6.
 */
export const NEW_BABY_ARRIVALS: readonly ChildArrivalBand[] = [
  { upTo: 2, children: 0 },
  { upTo: 5, children: 1 },
  { upTo: 6, children: 2 },
]

/** A scan that has already happened: two, whatever the die says. */
export const TWINS_ARRIVALS: readonly ChildArrivalBand[] = [{ upTo: 6, children: 2 }]

/**
 * How many arrive on this face — the first band the face fits in, worst-first,
 * exactly the way a tuition bill is read.
 *
 * Falls back to the last band rather than to zero if a malformed table somehow
 * stops short of six: a tile that quietly hands out nothing is a far worse
 * failure here than one that repeats its best band.
 */
export function childrenArrivingOn(
  arrivals: readonly ChildArrivalBand[],
  face: SpinValue,
): number {
  const band = arrivals.find((candidate) => face <= candidate.upTo) ?? arrivals[arrivals.length - 1]
  return band?.children ?? 0
}

/**
 * The count when every face agrees, or `null` when the die actually decides
 * something.
 *
 * This is what separates the two tiles the effect covers. A scan has already
 * shown two, so asking a player to roll a die whose six faces read the same is
 * theatre — `applyEffect` settles a certain tile on the spot. A New Baby tile
 * has a real distribution and gets a real press.
 */
export function certainArrivals(arrivals: readonly ChildArrivalBand[]): number | null {
  const first = childrenArrivingOn(arrivals, SPIN_VALUES[0]!)
  return SPIN_VALUES.every((face) => childrenArrivingOn(arrivals, face) === first) ? first : null
}

/** Mean arrivals per press — what a computer seat prices the tile at. */
export function expectedArrivals(arrivals: readonly ChildArrivalBand[]): number {
  const total = SPIN_VALUES.reduce((sum, face) => sum + childrenArrivingOn(arrivals, face), 0)
  return total / SPIN_FACES
}

/**
 * What a grown-up child pays back, and why it is two different things.
 *
 * A child used to be worth a flat sum: the same money to a groomer on $34,000
 * and to an agency owner on $148,500. That is the one thing on this board whose
 * payoff ignores what you earn, and it turned out to matter far more than it
 * looks. Straight to Work is the volatile road *because* the basic ladders run
 * three rungs from $24,000 to $148,500 while a graduate's run two inside a band
 * a third as wide — so every part of the board that scales with income widens
 * the gap between a school-leaver's best and worst life, and every part that
 * does not, flattens it. A flat child bonus large enough to make Family Lane
 * worth choosing measurably erased that difference: the computer would take the
 * lane, and Straight to Work would stop being the most volatile road.
 *
 * So the return splits in two, and the split is the design:
 *
 * - **The ordinary life scales with the family's income.** What a household can
 *   put behind a child — schools, lessons, a trade to walk into, a deposit —
 *   depends on what the household has. This is the half that restores the
 *   lane's participation in the board's spread.
 * - **The star is flat, and anybody's child can be one.** A courier's kid
 *   making it big is the better story and the better game, and a jackpot only
 *   the rich can win is both worse design and worse taste. It is also safe to
 *   leave flat: measured, shrinking the star moved the volatility ratio from
 *   0.883 to 0.896, so it is simply not where that problem lives.
 */

/**
 * What one child hands back, given the spin their grown-up life rolled.
 *
 * `parent` is read for one thing only: what a payday is worth to them. That is
 * `expectedPayday`, so an unsteady trade counts at what it really averages and
 * a player who never worked counts at the casual wage rather than at nothing.
 */
export function childReturnFor(
  parent: Player,
  spin: SpinValue,
  economy: EconomyConstants = USA_ECONOMY,
): Money {
  const { perPipOfPayday, starSpin, starPayout } = economy.childOutcome
  if (spin >= starSpin) return starPayout
  return Math.round(spin * perPipOfPayday * expectedPayday(parent, economy))
}

/**
 * What one child is worth on average — the figure to plan against.
 *
 * Everything that has to quote a single number quotes this one: the computer's
 * valuation of Family Lane, the live net-worth readout, and the scoring path
 * for a caller with no dice to hand. It depends on the parent now, which is the
 * whole point, so there is no longer a single edition-wide figure to drift
 * away from.
 */
export function expectedChildValue(parent: Player, economy: EconomyConstants = USA_ECONOMY): Money {
  const { perPipOfPayday, starSpin, starPayout } = economy.childOutcome
  // Worked out in closed form rather than by summing the faces one at a time:
  // rounding each face first would make the average drift by a unit, and an
  // edition counting in a hundred-times unit would then disagree with this one
  // by a hundred. `scaleInvariance.test.ts` is what noticed.
  const ordinarySpinTotal = ((starSpin - 1) * starSpin) / 2
  const starFaces = SPIN_FACES + 1 - starSpin
  return (
    (ordinarySpinTotal * perPipOfPayday * expectedPayday(parent, economy) + starFaces * starPayout) /
    SPIN_FACES
  )
}
