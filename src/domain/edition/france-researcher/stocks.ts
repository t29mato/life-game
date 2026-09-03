import type { Stock } from '../../model/types'

/**
 * Five holdings, and every one of them is somebody's research.
 *
 * `stocks.ts` is edition-owned, so the reskin costs nothing: the ladder is the
 * country board's at exactly the same prices and payout bands — the wider a
 * band spreads, the further its middle sits above the sticker price — and what
 * changes is what a share *is*. A researcher does not buy the index. They buy
 * the spinout the person two benches along founded on a licence from their own
 * laboratory, the instrument company whose machine is in every platform in the
 * country, and the biotechnology that is nine years from approval and has been
 * for six.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-frr-consumables',
    name: 'Laboratory Consumables',
    ticker: 'LABO',
    price: 10_000,
    payoutRange: [9_000, 16_000],
    icon: 'stock:noodle-chain',
    description: 'Sells the buffer, the tips and the antibody to every laboratory in Europe at a price nobody has the energy to negotiate. That is the entire pitch.',
  },
  {
    id: 'stock-frr-instruments',
    name: 'Precision Instruments',
    ticker: 'PREC',
    price: 15_000,
    payoutRange: [13_000, 24_000],
    icon: 'stock:green-energy',
    description: 'Their machine is on every platform you have ever booked, it lasts twenty years, and the maintenance agreement lasts twenty-one.',
  },
  {
    id: 'stock-frr-campus-spinout',
    name: 'Campus Deep-Tech Spinout',
    ticker: 'SPIN',
    price: 12_000,
    payoutRange: [4_000, 34_000],
    icon: 'stock:studio-pictures',
    description: 'Founded on a licence from a public laboratory by somebody you shared an office with. One order from an aerospace group away from being a real company.',
  },
  {
    id: 'stock-frr-biotech',
    name: 'Nine-Year Biotech',
    ticker: 'BIOT',
    price: 20_000,
    payoutRange: [6_000, 46_000],
    icon: 'stock:robot-farms',
    description: 'One molecule, in phase two, nine years from approval — as it has been for six years. The science is genuinely beautiful.',
  },
  {
    id: 'stock-frr-fusion',
    name: 'Fusion Venture',
    ticker: 'FUSN',
    price: 25_000,
    payoutRange: [3_000, 77_000],
    icon: 'stock:orbital-freight',
    description: 'Either the thing your grandchildren plug the country into, or the most expensive magnet anybody ever built. You have read the papers and still cannot say which.',
  },
]
