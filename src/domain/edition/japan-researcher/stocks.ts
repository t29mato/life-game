import type { Stock } from '../../model/types'

/**
 * Five holdings, and every one of them is somebody's research.
 *
 * `stocks.ts` is edition-owned, so the reskin costs nothing: the ladder is the
 * country board's at exactly the same prices and payout ranges — the wider a
 * range spreads, the further its middle sits above the sticker price — and
 * what changes is what a share *is*. A researcher does not buy the market;
 * they buy the spinout their old labmate founded, the instrument company whose
 * machine is in every core facility in the country, and the drug that is nine
 * years from approval and always will be.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-jpr-reagents',
    name: 'Standard Reagents',
    ticker: 'RGNT',
    price: 1_000_000,
    payoutRange: [900_000, 1_600_000],
    icon: 'stock:noodle-chain',
    description: 'Sells the buffer, the pipette tips and the antibody to every laboratory in the country, at a price nobody has the energy to negotiate. That is the entire pitch.',
  },
  {
    id: 'stock-jpr-instruments',
    name: 'Precision Instruments',
    ticker: 'PREC',
    price: 1_500_000,
    payoutRange: [1_300_000, 2_400_000],
    icon: 'stock:green-energy',
    description: 'Their machine is in every core facility you have ever booked, it lasts twenty years, and the service contract lasts twenty-one.',
  },
  {
    id: 'stock-jpr-sensor-spinout',
    name: 'Campus Sensor Spinout',
    ticker: 'SNSR',
    price: 1_200_000,
    payoutRange: [400_000, 3_400_000],
    icon: 'stock:studio-pictures',
    description: 'Your old labmate\'s company, built on the patent you both remember arguing about. One purchase order from a car maker away from glory.',
  },
  {
    id: 'stock-jpr-biotech',
    name: 'Nine-Year Biotech',
    ticker: 'BIOT',
    price: 2_000_000,
    payoutRange: [600_000, 4_600_000],
    icon: 'stock:robot-farms',
    description: 'One drug, in phase two, nine years from approval — as it has been for six years. The science is genuinely beautiful.',
  },
  {
    id: 'stock-jpr-fusion',
    name: 'Fusion Venture',
    ticker: 'FUSN',
    price: 2_500_000,
    payoutRange: [300_000, 7_700_000],
    icon: 'stock:orbital-freight',
    description: 'Either the thing your grandchildren plug the country into, or the most expensive magnet anybody ever built. You have read the papers and you still cannot say which.',
  },
]
