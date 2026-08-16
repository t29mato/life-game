import type { House } from '../../model/types'

/**
 * Nine homes, from an adobe house in a village to the crown of a cholet.
 *
 * The ladder's numbers are the tuned USA ladder at ×1 — every range straddles
 * its price and the catalogue appreciates gently all the way up — and that
 * mirror is *not* a compromise here, because it happens to be how Bolivian
 * property genuinely works: mortgages are rare, a house is the savings
 * account, and brick holds value the way a bank is only trusted to. Japan's
 * edition needed a depreciation tilt to be honest; Bolivia's needs the
 * original ladder left alone.
 *
 * What is Bolivian is the story each rung tells, and the top of the ladder
 * most of all. The mansion here is not a villa behind a gate: it is the
 * *cholet*, the exuberant multi-storey palace of the high city — shops on
 * the ground floor paying rent, a mirrored ballroom above them earning its
 * keep every weekend, the family home on top like a little chalet on the
 * roof. A building that works for a living is exactly what wealth looks like
 * on this board.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-bo-adobe-village-house',
    name: 'Adobe Village House',
    price: 60_000,
    resaleRange: [40_000, 95_000],
    icon: 'house:tiny-cabin',
    description: 'Thick mud-brick walls that hold the day\'s warmth all night, a courtyard, and a view of the mountains that never once repeats itself.',
  },
  {
    id: 'house-bo-red-brick-starter',
    name: 'Red-Brick City House',
    price: 110_000,
    resaleRange: [80_000, 155_000],
    icon: 'house:cozy-bungalow',
    description: 'One finished floor and rebar standing hopeful on the roof — not unfinished, ambitious. Every house here plans to grow.',
  },
  {
    id: 'house-bo-suburban-row-house',
    name: 'Suburban Row House',
    price: 175_000,
    resaleRange: [130_000, 235_000],
    icon: 'house:suburban-townhouse',
    description: 'Two floors on the city\'s newest ring road, identical to its neighbours down to the gate, with a mango tree that predates the whole street.',
  },
  {
    id: 'house-bo-colonial-courtyard',
    name: 'Colonial Courtyard Flat',
    price: 205_000,
    resaleRange: [150_000, 280_000],
    icon: 'space:apartment-hunt',
    description: 'Half of a whitewashed colonial house older than the republic, wrapped around a shared courtyard, with balconies the heritage office keeps trying to regulate.',
  },
  {
    id: 'house-bo-shopfront-house',
    name: 'House with a Shopfront',
    price: 240_000,
    resaleRange: [180_000, 320_000],
    icon: 'house:modern-duplex',
    description: 'You live upstairs; the ground floor is a shop that pays for itself. The commute is one staircase, and the building goes to work with you.',
  },
  {
    id: 'house-bo-lakeside-villa',
    name: 'Lakeside Villa',
    price: 310_000,
    resaleRange: [230_000, 410_000],
    icon: 'house:lakeside-villa',
    description: 'Wakes you with the highest great lake in the world out the window, reed boats at dawn, and air so clear the far shore looks touchable.',
  },
  {
    id: 'house-bo-garden-estate',
    name: 'Valley Garden Estate',
    price: 400_000,
    resaleRange: [300_000, 540_000],
    icon: 'house:lavish-estate',
    description: 'Down in the valley of eternal spring: a walled garden that fruits all year, a long veranda, and a dining table built for stories that get bigger with every telling.',
  },
  {
    id: 'house-bo-canyon-ridge-house',
    name: 'Canyon Ridge House',
    price: 520_000,
    resaleRange: [380_000, 700_000],
    icon: 'space:sunset-ahead',
    description: 'Glass on three sides in the city\'s deep southern canyon, moon-coloured rock spires below, and a driveway so long every guest jokes about the walk up.',
  },
  {
    id: 'house-bo-cholet-crown',
    name: 'The Cholet Crown',
    price: 660_000,
    resaleRange: [470_000, 890_000],
    icon: 'space:corner-office',
    description: 'Six storeys of mirrored green and gold: shops below, a chandeliered ballroom booked every weekend, and your own house sitting on the roof like a crown.',
  },
]
