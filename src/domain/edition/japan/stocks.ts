import type { Stock } from '../../model/types'

/**
 * Five tickers off the Tokyo board, on the tuned ladder: the wider a payout
 * range spreads, the further its middle sits above the sticker price. A player
 * buying konbini shares is buying a slightly better savings account; a player
 * buying the robotics moonshot is buying a story they will either tell at
 * every New Year gathering or never mention again. Every figure is the USA
 * ladder at ×100, because the ladder is the balance and the names are the
 * country.
 */
export const STOCKS: readonly Stock[] = [
  {
    id: 'stock-jp-konbini',
    name: 'Nationwide Konbini Holdings',
    ticker: 'KNBI',
    price: 1_000_000,
    payoutRange: [900_000, 1_600_000],
    icon: 'stock:noodle-chain',
    description: 'Fifty-eight thousand stores that never close, never miss, and never surprise anyone. That is the entire pitch.',
  },
  {
    id: 'stock-jp-rail',
    name: 'Sunrise Rail & Property',
    ticker: 'RAIL',
    price: 1_500_000,
    payoutRange: [1_300_000, 2_400_000],
    icon: 'stock:green-energy',
    description: 'The trains run on time to the second, and the company owns every shop you pass while it apologises for a forty-second delay anyway.',
  },
  {
    id: 'stock-jp-animation',
    name: 'Lantern Animation Studio',
    ticker: 'ANIM',
    price: 1_200_000,
    payoutRange: [400_000, 3_400_000],
    icon: 'stock:studio-pictures',
    description: 'One global streaming hit from glory, one troubled production from starring in the documentary about it.',
  },
  {
    id: 'stock-jp-gacha',
    name: 'Gacha Games Guild',
    ticker: 'GCHA',
    price: 2_000_000,
    payoutRange: [600_000, 4_600_000],
    icon: 'stock:robot-farms',
    description: 'Free to play, mysteriously profitable. Revenue depends entirely on how this quarter\'s collectible characters are received by teenagers.',
  },
  {
    id: 'stock-jp-robotics',
    name: 'Orbital Springs Robotics',
    ticker: 'ORBS',
    price: 2_500_000,
    payoutRange: [300_000, 7_700_000],
    icon: 'stock:orbital-freight',
    description: 'Humanoid caregivers for an ageing nation — either the next national champion or the world\'s most expensive way to fold a towel.',
  },
]
