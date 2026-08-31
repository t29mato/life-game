import type { CareerFamily } from '../CareerPlaque/families'

/**
 * What the driver's education puts on their head: academic regalia.
 *
 * A degree is otherwise a flag in a stats panel; this is the rule that turns
 * it into a mortarboard on the peg at the wheel, so walking off the Cap and
 * Gown tile changes the car on the very next paint — the same bargain
 * `wealthTier.ts` and `careerGear.ts` strike for bodywork and trade.
 *
 * The head holds one silhouette. At peg scale a hat is two or three pixels,
 * so stacking a mortarboard on a toque would blur both into nothing — and
 * career gear carries a live gameplay signal (the family's colour) that must
 * stay unambiguous. So the cap yields: it is worn for exactly the stretch a
 * real one is, from commencement to the first day of work. `hasDegree` with
 * no career gear is the fresh graduate driving to the job fair; the moment a
 * hire lands, the trade's gear takes the head and the diploma rides in the
 * glovebox. A union rather than a boolean so a fancier doctoral variant can
 * join as a second member without touching the callers.
 */
export type Regalia = 'mortarboard'

/** Fails closed: no degree — or a head already wearing its trade — is bare. */
export function driverRegalia(
  hasDegree: boolean,
  careerFamily: CareerFamily | null,
): Regalia | null {
  if (!hasDegree) return null
  return careerFamily === null ? 'mortarboard' : null
}
