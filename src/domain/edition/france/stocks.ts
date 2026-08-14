import type { Stock } from '../../model/types'

/**
 * Five tickers off the Paris board, on the tuned ladder: the wider a payout
 * range spreads, the further its middle sits above the sticker price. A
 * player buying toll roads is buying a slightly better savings account; a
 * player buying the rocket line is buying a story they will either tell at
 * every family lunch or never mention again. Every figure is the USA ladder
 * at ×1, because the ladder is the balance and the names are the country.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-fr-toll-roads',
    name: 'Union of Toll Motorways',
    ticker: 'TOLL',
    price: 10_000,
    payoutRange: [9_000, 16_000],
    icon: 'stock:noodle-chain',
    description: 'Every August the entire country drives south through its cash registers. That is the whole pitch, and it never misses.',
  },
  {
    id: 'stock-fr-grid-power',
    name: 'Hexagon Power & Grid',
    ticker: 'WATT',
    price: 15_000,
    payoutRange: [13_000, 24_000],
    icon: 'stock:green-energy',
    description: 'Fifty-six reactors humming along the rivers, spinning out a boring and beautiful dividend.',
  },
  {
    id: 'stock-fr-cinema',
    name: 'New Wave Pictures',
    ticker: 'FILM',
    price: 12_000,
    payoutRange: [4_000, 34_000],
    icon: 'stock:studio-pictures',
    description: 'One festival prize from glory, one three-hour black-and-white passion project from the bargain bin. Nobody knows which.',
  },
  {
    id: 'stock-fr-vineyards',
    name: 'Grand Cru Vineyards',
    ticker: 'VINE',
    price: 20_000,
    payoutRange: [6_000, 46_000],
    icon: 'stock:robot-farms',
    description: 'Slopes that have made wine for eight centuries — as long as the April frost and the fashion for it behave.',
  },
  {
    id: 'stock-fr-rocket-lines',
    name: 'Equatorial Rocket Lines',
    ticker: 'RCKT',
    price: 25_000,
    payoutRange: [3_000, 77_000],
    icon: 'stock:orbital-freight',
    description: 'Cargo rockets from a jungle launch pad on a shoestring. Either the future of shipping or a very expensive firework.',
  },
]
