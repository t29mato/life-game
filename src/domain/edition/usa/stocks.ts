import type { Stock } from '../../model/types'

/**
 * Five shares the board's trading floor deals in.
 *
 * The list is deliberately a ladder rather than a menu: the wider a stock's
 * payout range spreads, the further its middle sits above the sticker price. A
 * player buying noodles is buying a slightly better savings account; a player
 * buying rocket freight is buying a story they will either brag about or never
 * mention again.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-noodle-chain',
    name: 'Midnight Noodle Co.',
    ticker: 'NDL',
    price: 10_000,
    payoutRange: [9_000, 16_000],
    icon: 'stock:noodle-chain',
    description: 'Forty little shops that sell soup at two in the morning and never miss a rent cheque.',
  },
  {
    id: 'stock-green-energy',
    name: 'Bright Ridge Energy',
    ticker: 'GRN',
    price: 15_000,
    payoutRange: [13_000, 24_000],
    icon: 'stock:green-energy',
    description: 'Wind turbines along the ridge road, spinning out a boring and beautiful dividend.',
  },
  {
    id: 'stock-studio-pictures',
    name: 'Lantern Row Pictures',
    ticker: 'FLIK',
    price: 12_000,
    payoutRange: [4_000, 34_000],
    icon: 'stock:studio-pictures',
    description: 'One summer blockbuster from glory, one flop from the bargain bin. Nobody knows which.',
  },
  {
    id: 'stock-robot-farms',
    name: 'Tractor & Bolt Farms',
    ticker: 'FARM',
    price: 20_000,
    payoutRange: [6_000, 46_000],
    icon: 'stock:robot-farms',
    description: 'Robot harvesters that feed a whole valley — as long as the rain and the software behave.',
  },
  {
    id: 'stock-orbital-freight',
    name: 'Orbital Freight Lines',
    ticker: 'ORBT',
    price: 25_000,
    payoutRange: [3_000, 77_000],
    icon: 'stock:orbital-freight',
    description: 'Cargo rockets on a shoestring. Either the future of shipping or a very expensive firework.',
  },
]
