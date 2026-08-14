import type { House } from '../../model/types'

/**
 * Nine homes, and the edition's one deliberate mechanical twist: in Japan the
 * wooden half of the ladder *depreciates*.
 *
 * A Japanese timber house loses most of its value within decades — the land
 * holds, the building does not — while a well-located concrete tower holds or
 * gains. `resaleRange` already expresses that perfectly, so on this board the
 * charming end of the ladder rolls its resale mostly *below* the sticker price
 * and the concrete-and-location end sits above it, where the USA ladder
 * appreciates gently all the way up. House choice becomes a real argument —
 * charm against asset — instead of a bigger-is-better staircase.
 *
 * Priced with care rather than abandon: every range still straddles its price
 * (a perfect spin rescues even the farmhouse, which keeps the buy a gamble
 * rather than a donation), and the tower end carries enough extra upside that
 * the catalogue's total expected value stays positive — below the USA board's,
 * measured and accepted, but nowhere near enough to move the balance bands.
 * `japan/balance.test.ts` is what holds that claim.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-jp-country-farmhouse',
    name: 'Country Farmhouse',
    price: 6_000_000,
    resaleRange: [1_500_000, 6_500_000],
    icon: 'house:tiny-cabin',
    description: 'A vast old wooden house in a village that will pay you to love it. Eight million such houses stand empty; resale value: sentimental.',
  },
  {
    id: 'house-jp-one-room-flat',
    name: 'One-Room City Flat',
    price: 11_000_000,
    resaleRange: [8_000_000, 15_500_000],
    icon: 'house:cozy-bungalow',
    description: 'Eighteen square metres, four minutes from the station, and a bathtub that is also the sink. The four minutes are what you are buying.',
  },
  {
    id: 'house-jp-suburban-tract-house',
    name: 'Suburban Tract House',
    price: 17_500_000,
    resaleRange: [10_000_000, 18_500_000],
    icon: 'house:suburban-townhouse',
    description: 'Identical to its neighbours down to the postbox, ninety minutes from your desk. New-build smell included; new-build value not retained.',
  },
  {
    id: 'house-jp-warehouse-loft',
    name: 'Renovated Warehouse Loft',
    price: 20_500_000,
    resaleRange: [15_000_000, 28_000_000],
    icon: 'space:apartment-hunt',
    description: 'An old sake warehouse with beams like ship keels, huge windows, and one magnificently loud kerosene heater.',
  },
  {
    id: 'house-jp-two-family-house',
    name: 'Two-Family House',
    price: 24_000_000,
    resaleRange: [18_000_000, 32_000_000],
    icon: 'house:modern-duplex',
    description: 'Your parents live downstairs. This solves several problems and creates a similar number.',
  },
  {
    id: 'house-jp-seaside-villa',
    name: 'Seaside Villa',
    price: 31_000_000,
    resaleRange: [21_000_000, 36_500_000],
    icon: 'house:lakeside-villa',
    description: 'The ocean view is eternal; the typhoon insurance is annual. The market has done this arithmetic before you.',
  },
  {
    id: 'house-jp-custom-built-house',
    name: 'Custom-Built House',
    price: 40_000_000,
    resaleRange: [26_000_000, 46_000_000],
    icon: 'house:lavish-estate',
    description: 'An architect built your dream exactly, down to the reading nook. Dreams, the market notes politely, are non-transferable.',
  },
  {
    id: 'house-jp-bayside-tower',
    name: 'Bayside Tower, 38th Floor',
    price: 52_000_000,
    resaleRange: [42_000_000, 76_000_000],
    icon: 'space:corner-office',
    description: 'Concrete, a concierge, and a nightly view of the bridge. Towers, unlike houses, are allowed to appreciate.',
  },
  {
    id: 'house-jp-central-penthouse',
    name: 'Central Penthouse',
    price: 66_000_000,
    resaleRange: [50_000_000, 94_000_000],
    icon: 'space:corner-office',
    description: 'The whole top floor above the old moat district. The elevator has a sofa, and the sofa has a view.',
  },
]
