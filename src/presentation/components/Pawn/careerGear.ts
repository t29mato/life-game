import type { IconName } from '@domain/model/icons'
import { CAREER_FAMILY, isCareerIcon, type CareerFamily } from '../CareerPlaque/families'

/**
 * What the driver wears, as the board shows it: the peg at the wheel.
 *
 * A player's trade is otherwise a line in a stats panel; this is the rule
 * that turns it into headwear, so a job-fair hire or a mid-life switch is
 * visible on the board the moment it lands — the same bargain `wealthTier.ts`
 * strikes for the bodywork. The gear is cut per *family*, not per career:
 * sixty-two bespoke hats would say nothing at peg scale, but eight — one for
 * each plaque family, cast in that family's own plastic — let a rival's car
 * read its trade's world at a glance, exactly as the plaques already do.
 *
 * Fails closed: no career yet (still in school, between jobs) or an icon
 * that names no trade means the familiar bare-headed peg, never a crash.
 */
export function driverGearFamily(icon: IconName | null | undefined): CareerFamily | null {
  if (icon === null || icon === undefined) return null
  return isCareerIcon(icon) ? CAREER_FAMILY[icon] : null
}
