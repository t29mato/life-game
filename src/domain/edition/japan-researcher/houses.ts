import type { House } from '../../model/types'

/**
 * Nine homes, bought on a research salary, and the same mechanical twist the
 * country Japan board carries: the wooden half of the ladder depreciates.
 *
 * The tilt is a fact about Japanese housing rather than about researchers —
 * timber loses most of its value in decades, concrete and location hold — so
 * it stays exactly as the country board measured it. What changes is who is
 * standing in the doorway. Every rung here is chosen by somebody who has moved
 * for a post at least twice and expects to again: the flat by the campus gate,
 * the house that came with the observatory, the tower flat bought the year the
 * appointment stopped having an end date on it.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-jpr-observatory-cottage',
    name: 'Observatory Cottage',
    price: 6_000_000,
    resaleRange: [1_500_000, 6_500_000],
    icon: 'house:tiny-cabin',
    description: 'A wooden house on a cold hill, forty minutes above the nearest shop, with the best night sky in the prefecture. Resale value: sentimental.',
  },
  {
    id: 'house-jpr-campus-gate-flat',
    name: 'Flat by the Campus Gate',
    price: 11_000_000,
    resaleRange: [8_000_000, 15_500_000],
    icon: 'house:cozy-bungalow',
    description: 'Nineteen square metres and ninety seconds from your bench, which over ten years is a year of your life given back to you.',
  },
  {
    id: 'house-jpr-institute-tract-house',
    name: 'Institute Tract House',
    price: 17_500_000,
    resaleRange: [10_000_000, 18_500_000],
    icon: 'house:suburban-townhouse',
    description: 'Built for the science city in one go, identical to its neighbours, and every neighbour is a colleague. New-build smell included; new-build value not retained.',
  },
  {
    id: 'house-jpr-warehouse-loft',
    name: 'Renovated Warehouse Loft',
    price: 20_500_000,
    resaleRange: [15_000_000, 28_000_000],
    icon: 'space:apartment-hunt',
    description: 'An old sake warehouse with beams overhead, room for a workshop, and one magnificently loud kerosene heater.',
  },
  {
    id: 'house-jpr-two-generation-house',
    name: 'Two-Generation House',
    price: 24_000_000,
    resaleRange: [18_000_000, 32_000_000],
    icon: 'house:modern-duplex',
    description: 'Your parents live downstairs and mind the children on conference weeks. This solves several problems and creates a similar number.',
  },
  {
    id: 'house-jpr-coastal-station-house',
    name: 'Coastal Station House',
    price: 31_000_000,
    resaleRange: [21_000_000, 36_500_000],
    icon: 'house:lakeside-villa',
    description: 'Twelve minutes from the pier and the survey boat. The view is eternal; the typhoon insurance is annual.',
  },
  {
    id: 'house-jpr-architect-built-house',
    name: 'Architect-Built House',
    price: 40_000_000,
    resaleRange: [26_000_000, 46_000_000],
    icon: 'house:lavish-estate',
    description: 'Built around a study with north light and eleven metres of shelving. Dreams, the market notes politely, are non-transferable.',
  },
  {
    id: 'house-jpr-tower-flat',
    name: 'Tower Flat, 38th Floor',
    price: 52_000_000,
    resaleRange: [42_000_000, 76_000_000],
    icon: 'space:corner-office',
    description: 'Bought the year the contract stopped having an end date on it. Concrete, a concierge, and towers are allowed to appreciate.',
  },
  {
    id: 'house-jpr-old-quarter-penthouse',
    name: 'Old Quarter Penthouse',
    price: 66_000_000,
    resaleRange: [50_000_000, 94_000_000],
    icon: 'space:corner-office',
    description: 'The whole top floor above the old moat district, ten minutes from the academy that finally elected you. The lift has a sofa.',
  },
]
