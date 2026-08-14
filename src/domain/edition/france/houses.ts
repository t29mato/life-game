import type { House } from '../../model/types'

/**
 * Nine homes from a village ruin with potential to the top of a Haussmann
 * building.
 *
 * Every price and resale range is the tuned USA ladder at ×1 — unlike Japan,
 * France's market tells the same broad story the dollar board does (property
 * mostly holds and gently appreciates), so the catalogue keeps the measured
 * numbers exactly and spends its whole budget on the copy. What is French
 * here is the notary at every closing: the fee that is not a fee so much as a
 * tax with a wig on, and it turns up in the descriptions the way it turns up
 * in life — every single time.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-fr-village-cottage',
    name: 'Village Stone Cottage',
    price: 60_000,
    resaleRange: [40_000, 95_000],
    icon: 'house:tiny-cabin',
    description: 'Thick walls, a well, and a village that has been quietly waiting for somebody to love it. The notary\'s fee is a startling share of the total.',
  },
  {
    id: 'house-fr-suburban-pavilion',
    name: 'Suburban Pavilion',
    price: 110_000,
    resaleRange: [80_000, 155_000],
    icon: 'house:cozy-bungalow',
    description: 'A tidy little house behind a tidy little gate, with a gnome the previous owners swore was staying.',
  },
  {
    id: 'house-fr-terraced-townhouse',
    name: 'Terraced Townhouse',
    price: 175_000,
    resaleRange: [130_000, 235_000],
    icon: 'house:suburban-townhouse',
    description: 'Two floors, painted shutters, and neighbours who have opinions about how often you repaint them.',
  },
  {
    id: 'house-fr-converted-atelier',
    name: 'Converted Atelier',
    price: 205_000,
    resaleRange: [150_000, 280_000],
    icon: 'space:apartment-hunt',
    description: 'An old furniture workshop with north light the estate agent mentioned eleven times, and one very loud radiator.',
  },
  {
    id: 'house-fr-modern-duplex',
    name: 'Modern Duplex',
    price: 240_000,
    resaleRange: [180_000, 320_000],
    icon: 'house:modern-duplex',
    description: 'Clean lines, a roof terrace, and just enough room to rent out a floor to a student who plays the cello beautifully.',
  },
  {
    id: 'house-fr-riverside-longhouse',
    name: 'Riverside Longhouse',
    price: 310_000,
    resaleRange: [230_000, 410_000],
    icon: 'house:lakeside-villa',
    description: 'A long low farmhouse on the river bend, herons at dawn, and a cellar the previous owner left mysteriously full.',
  },
  {
    id: 'house-fr-country-manor',
    name: 'Country Manor',
    price: 400_000,
    resaleRange: [300_000, 540_000],
    icon: 'house:lavish-estate',
    description: 'Gates, a gravelled court, and a dining hall built for arguments that last until two in the morning and settle nothing.',
  },
  {
    id: 'house-fr-clifftop-villa',
    name: 'Clifftop Villa',
    price: 520_000,
    resaleRange: [380_000, 700_000],
    icon: 'space:sunset-ahead',
    description: 'Glass on three sides, the sea below, and a steep coastal road up that guests complain about happily.',
  },
  {
    id: 'house-fr-haussmann-top-floor',
    name: 'Haussmann Top Floor',
    price: 660_000,
    resaleRange: [470_000, 890_000],
    icon: 'space:corner-office',
    description: 'The whole top floor of a stone building with wrought-iron balconies, herringbone parquet, and a city that looks like spilled jewellery at night.',
  },
]
