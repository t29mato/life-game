import type { House } from '../../model/types'

/**
 * Nine homes from a first tiny cabin to a skyline penthouse.
 *
 * The ladder matters as much as the rungs: a home-upgrade space only means
 * something if there is always something better a few steps up, so the top of
 * the list sits well above what anyone buys on their first house-hunting stop.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-tiny-cabin',
    name: 'Tiny Cabin',
    price: 60_000,
    resaleRange: [40_000, 95_000],
    icon: 'house:tiny-cabin',
    description: 'One room, one hammock, and a porch made for slow mornings.',
  },
  {
    id: 'house-cozy-bungalow',
    name: 'Cozy Bungalow',
    price: 110_000,
    resaleRange: [80_000, 155_000],
    icon: 'house:cozy-bungalow',
    description: 'A snug starter home with a garden gnome nobody remembers buying.',
  },
  {
    id: 'house-suburban-townhouse',
    name: 'Suburban Townhouse',
    price: 175_000,
    resaleRange: [130_000, 235_000],
    icon: 'house:suburban-townhouse',
    description: 'Two floors, a shared fence, and neighbours who wave every morning.',
  },
  {
    id: 'house-converted-loft',
    name: 'Converted Loft',
    price: 205_000,
    resaleRange: [150_000, 280_000],
    icon: 'space:apartment-hunt',
    description: 'An old button factory with brick walls, huge windows, and one very loud radiator.',
  },
  {
    id: 'house-modern-duplex',
    name: 'Modern Duplex',
    price: 240_000,
    resaleRange: [180_000, 320_000],
    icon: 'house:modern-duplex',
    description: 'Clean lines, a rooftop deck, and just enough room to rent out a floor.',
  },
  {
    id: 'house-lakeside-villa',
    name: 'Lakeside Villa',
    price: 310_000,
    resaleRange: [230_000, 410_000],
    icon: 'house:lakeside-villa',
    description: 'Wakes you up with a view of the water and loons at dawn.',
  },
  {
    id: 'house-lavish-estate',
    name: 'Lavish Estate',
    price: 400_000,
    resaleRange: [300_000, 540_000],
    icon: 'house:lavish-estate',
    description: 'Gates, a fountain, and a dining hall built for very tall stories.',
  },
  {
    id: 'house-cliffside-retreat',
    name: 'Cliffside Retreat',
    price: 520_000,
    resaleRange: [380_000, 700_000],
    icon: 'space:sunset-ahead',
    description: 'Glass on three sides, the sea below, and a road up that guests complain about happily.',
  },
  {
    id: 'house-skyline-penthouse',
    name: 'Skyline Penthouse',
    price: 660_000,
    resaleRange: [470_000, 890_000],
    icon: 'space:corner-office',
    description: 'The whole top floor, a private lift, and a city that looks like spilled jewellery at night.',
  },
]
