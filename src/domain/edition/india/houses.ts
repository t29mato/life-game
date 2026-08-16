import type { House } from '../../model/types'

/**
 * Nine homes from an ancestral village house to a south-city penthouse.
 *
 * Unlike the yen board, this ladder keeps the USA catalogue's gentle
 * appreciation, every range at ×100 — deliberately, because it is the honest
 * Indian story: property in India is the family's proudest asset precisely
 * because it mostly goes up, and a depreciation tilt here would be Japan's
 * joke told in the wrong country. What is Indian is the ladder itself — the
 * deed with three siblings' names on it, the flat sold by brochure before the
 * tower exists, the farmhouse that grows weddings rather than crops.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-in-ancestral-village-house',
    name: 'Ancestral Village House',
    price: 6_000_000,
    resaleRange: [4_000_000, 9_500_000],
    icon: 'house:tiny-cabin',
    description: 'A courtyard, a mango tree, and a deed with three siblings\' names on it. Selling requires a family council; owning requires only love.',
  },
  {
    id: 'house-in-one-bhk-flat',
    name: 'One-BHK Suburb Flat',
    price: 11_000_000,
    resaleRange: [8_000_000, 15_500_000],
    icon: 'house:cozy-bungalow',
    description: 'One bedroom, one hall, one kitchen, and a local train at the end of the lane. The listing said "2 mins from station" and for once it was true.',
  },
  {
    id: 'house-in-row-house',
    name: 'Tier-2 City Row House',
    price: 17_500_000,
    resaleRange: [13_000_000, 23_500_000],
    icon: 'house:suburban-townhouse',
    description: 'Two floors in a gated society with a shared wall, a car porch, and neighbours who send over food on every festival, which is most days.',
  },
  {
    id: 'house-in-mill-loft',
    name: 'Converted Mill Loft',
    price: 20_500_000,
    resaleRange: [15_000_000, 28_000_000],
    icon: 'space:apartment-hunt',
    description: 'An old textile mill floor with iron pillars, twenty-foot ceilings, and one magnificently loud ceiling fan from another century.',
  },
  {
    id: 'house-in-duplex',
    name: 'Duplex with Parents Downstairs',
    price: 24_000_000,
    resaleRange: [18_000_000, 32_000_000],
    icon: 'house:modern-duplex',
    description: 'Your parents take the ground floor, you take the first, and the kitchen negotiations begin the day the boxes do.',
  },
  {
    id: 'house-in-goa-villa',
    name: 'Goa Villa',
    price: 31_000_000,
    resaleRange: [23_000_000, 41_000_000],
    icon: 'house:lakeside-villa',
    description: 'Red laterite walls, a verandah built for doing nothing well, and a rental listing that covers the year\'s costs while you are not there.',
  },
  {
    id: 'house-in-city-farmhouse',
    name: 'Farmhouse on the City\'s Edge',
    price: 40_000_000,
    resaleRange: [30_000_000, 54_000_000],
    icon: 'house:lavish-estate',
    description: 'Gates, a lawn the size of a cricket outfield, and not one thing farmed on it, ever. It grows weddings.',
  },
  {
    id: 'house-in-sea-facing-flat',
    name: 'Sea-Facing Tower Flat',
    price: 52_000_000,
    resaleRange: [38_000_000, 70_000_000],
    icon: 'space:sunset-ahead',
    description: 'The eighteenth floor, the whole Arabian Sea, and a monsoon that arrives at your window first. The words "sea-facing" are the whole reason for the price.',
  },
  {
    id: 'house-in-south-city-penthouse',
    name: 'South City Penthouse',
    price: 66_000_000,
    resaleRange: [47_000_000, 89_000_000],
    icon: 'space:corner-office',
    description: 'The whole top floor above the old bungalow district. The lift opens into the living room, and the living room looks down on the traffic you no longer sit in.',
  },
]
