import type { Stock } from '../../model/types'

/**
 * Five tickers off the Bolivian board, on the tuned ladder: the wider a
 * payout range spreads, the further its middle sits above the sticker price.
 * A player buying brewery shares is buying a slightly better savings
 * account; a player buying the lithium moonshot is buying a story they will
 * either tell at every fiesta or never mention again. Every figure is the
 * USA ladder at ×1, because the ladder is the balance and the names are the
 * country.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-bo-brewery',
    name: 'Highland Brewing Company',
    ticker: 'BREW',
    price: 10_000,
    payoutRange: [9_000, 16_000],
    icon: 'stock:noodle-chain',
    description: 'The lager every fiesta in the country pours, at every altitude, at every graduation. That is the entire pitch, and it has never once missed.',
  },
  {
    id: 'stock-bo-cement',
    name: 'Condor Cement Works',
    ticker: 'CMNT',
    price: 15_000,
    payoutRange: [13_000, 24_000],
    icon: 'stock:green-energy',
    description: 'A country that builds its houses one floor at a time, as the money arrives, never stops buying cement. Boring, beautiful, bagged by the million.',
  },
  {
    id: 'stock-bo-costume-works',
    name: 'Festival Costume Works',
    ticker: 'FEST',
    price: 12_000,
    payoutRange: [4_000, 34_000],
    icon: 'stock:studio-pictures',
    description: 'Embroiders the great carnival parades in sequins and gold thread. One record year from glory, one rained-out season from a very full storeroom.',
  },
  {
    id: 'stock-bo-quinoa-export',
    name: 'Royal Quinoa Export Collective',
    ticker: 'QNOA',
    price: 20_000,
    payoutRange: [6_000, 46_000],
    icon: 'stock:robot-farms',
    description: 'Feeds the world\'s breakfast bowls from the high plains — as long as the rains and the food fashions of three continents behave.',
  },
  {
    id: 'stock-bo-lithium',
    name: 'Salt Flat Lithium Ventures',
    ticker: 'LITH',
    price: 25_000,
    payoutRange: [3_000, 77_000],
    icon: 'stock:orbital-freight',
    description: 'Half of every future battery is sitting under the salt flat as brine. Either the national champion of the century or the world\'s most scenic evaporation pond.',
  },
]
