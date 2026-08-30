import type { Money } from '@domain/model/types'

/**
 * How well a player is doing, as the board shows it: the car itself.
 *
 * A player's fortunes are otherwise a number in a side panel; this is the
 * rule that turns that number into bodywork, so a promotion or a bad month
 * is visible on the board the moment it lands. Kept here, pure and tested,
 * rather than inlined in the component that paints it — the same bargain
 * `passengers.ts` already strikes for the back seat.
 */

/** Battered → familiar → polished → grand. */
export type WealthTier = 1 | 2 | 3 | 4

/**
 * The two sums the banding is measured against — a `Pick` of the edition's
 * own `EconomyConstants`, never a dollar figure written here. Both run
 * through `scaleEconomy`, so an edition counting in a 100× unit tiers its
 * cars on exactly the same footing.
 */
export interface WealthScale {
  /** What that edition already treats as a sum worth stopping the table for. */
  readonly bigMoney: Money
  /** That edition's financial-independence bar — "never work again" money. */
  readonly fireNumber: Money
}

/**
 * Which car a player has earned, from their live net worth.
 *
 * The bands lean on thresholds the game has already priced rather than
 * inventing new ones: in the red at all is the battered runabout — debt is
 * the one state every player recognises on sight; `bigMoney` (the "big
 * moment" cut-in threshold) is where the familiar roadster picks up its
 * brightwork; and `fireNumber` — rich enough to retire on the spot — is
 * where the grand tourer rolls out. Roughly half the table ever reaches
 * that last number, which is exactly how rare the top car should be.
 */
export function wealthTier(netWorth: Money, scale: WealthScale): WealthTier {
  if (netWorth < 0) return 1
  if (netWorth < scale.bigMoney) return 2
  if (netWorth < scale.fireNumber) return 3
  return 4
}
