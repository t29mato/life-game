import type { Stock } from '../../model/types'

/**
 * Five tickers off Dalal Street, on the tuned ladder: the wider a payout
 * range spreads, the further its middle sits above the sticker price. A player
 * buying the dairy cooperative is buying a slightly better savings account; a
 * player buying the rocket startup is buying a story they will either tell at
 * every wedding or never mention again. Every figure is the USA ladder at
 * ×100, because the ladder is the balance and the names are the country.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-in-dairy',
    name: 'Everyday Dairy Cooperative',
    ticker: 'MILK',
    price: 1_000_000,
    payoutRange: [900_000, 1_600_000],
    icon: 'stock:noodle-chain',
    description: 'Three million farmers, one brand on every breakfast table in the country, and a dividend as regular as the morning doorbell.',
  },
  {
    id: 'stock-in-solar',
    name: 'Thar Desert Solar Parks',
    ticker: 'SOLR',
    price: 1_500_000,
    payoutRange: [1_300_000, 2_400_000],
    icon: 'stock:green-energy',
    description: 'Panels to the horizon in a desert with three hundred and thirty sunny days, spinning out a boring and beautiful dividend.',
  },
  {
    id: 'stock-in-pictures',
    name: 'Marine Lines Pictures',
    ticker: 'FLIM',
    price: 1_200_000,
    payoutRange: [400_000, 3_400_000],
    icon: 'stock:studio-pictures',
    description: 'One festival-weekend blockbuster from glory, one three-hundred-crore flop from starring in the news about it.',
  },
  {
    id: 'stock-in-fintech',
    name: 'Cashless Bazaar Fintech',
    ticker: 'UPAY',
    price: 2_000_000,
    payoutRange: [600_000, 4_600_000],
    icon: 'stock:robot-farms',
    description: 'Every vegetable cart in the country scans its QR code; whether that ever becomes profit depends entirely on this quarter\'s regulator circular.',
  },
  {
    id: 'stock-in-rocketry',
    name: 'Peninsular Rocketry',
    ticker: 'RCKT',
    price: 2_500_000,
    payoutRange: [300_000, 7_700_000],
    icon: 'stock:orbital-freight',
    description: 'Small satellites on a tiny budget from a launch pad by the sea — either the next national pride or a very expensive Diwali rocket.',
  },
]
