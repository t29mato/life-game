import type { House } from '../../model/types'

/**
 * Nine homes, bought on a research salary, on the country board's own tuned
 * ladder.
 *
 * The prices and the resale bands are the France board's exactly, and
 * deliberately: how much a home costs and what it comes back as at the end is
 * a fact about French property, not about the person holding the keys, and
 * that ladder is measured. Every rung of it appreciates, gently, which is the
 * quiet reason a French household with a salary buys as early as the bank
 * will let them.
 *
 * What changes is who is standing in the doorway. Every home here is chosen
 * by somebody whose posts have been in four different towns and whose next
 * one might be a national competition away: the flat by the tram terminus
 * bought because the laboratory is three stops down, the ruin in the Cévennes
 * that is a summer's work every summer for twenty years, the top floor on the
 * boulevard bought the year the post stopped having an end date on it.
 */
export const HOUSES: readonly House[] = [
  {
    id: 'house-frr-cevennes-ruin',
    name: 'Cévennes Ruin',
    price: 60_000,
    resaleRange: [40_000, 95_000],
    icon: 'house:tiny-cabin',
    description: 'Two rooms, a chestnut roof and no neighbours for a kilometre. Every August is spent repointing a wall, and every September you say it was a holiday.',
  },
  {
    id: 'house-frr-tram-terminus-flat',
    name: 'Flat by the Tram Terminus',
    price: 110_000,
    resaleRange: [80_000, 155_000],
    icon: 'house:cozy-bungalow',
    description: 'Forty square metres, three stops from the laboratory, and a balcony exactly wide enough for a chair and a pile of things to read.',
  },
  {
    id: 'house-frr-science-park-terrace',
    name: 'Science Park Terrace',
    price: 175_000,
    resaleRange: [130_000, 235_000],
    icon: 'house:suburban-townhouse',
    description: 'Built in one go for the science park, identical to its neighbours, and every neighbour works in the same three buildings you do.',
  },
  {
    id: 'house-frr-silk-workshop',
    name: 'Converted Silk Workshop',
    price: 205_000,
    resaleRange: [150_000, 280_000],
    icon: 'space:apartment-hunt',
    description: 'Four-metre ceilings, a window made for looms and now made for a drawing board, and heating bills to match the volume.',
  },
  {
    id: 'house-frr-campus-duplex',
    name: 'New-Build Duplex by the Campus',
    price: 240_000,
    resaleRange: [180_000, 320_000],
    icon: 'house:modern-duplex',
    description: 'Two floors, a garage, and a syndic meeting every March at which somebody raises the question of the hedge for the fourth year running.',
  },
  {
    id: 'house-frr-estuary-longhouse',
    name: 'Estuary Longhouse',
    price: 310_000,
    resaleRange: [230_000, 410_000],
    icon: 'house:lakeside-villa',
    description: 'Low, long and stone, eleven minutes from the marine station\'s pier. The view is eternal; the storm shutters are annual.',
  },
  {
    id: 'house-frr-vineyard-farmhouse',
    name: 'Vineyard Farmhouse',
    price: 400_000,
    resaleRange: [300_000, 540_000],
    icon: 'house:lavish-estate',
    description: 'A hectare of vines you did not plant and cannot bring yourself to grub up, and a cellar that turns out to be the best office you have ever had.',
  },
  {
    id: 'house-frr-observatory-villa',
    name: 'Villa Above the Observatory',
    price: 520_000,
    resaleRange: [380_000, 700_000],
    icon: 'space:sunset-ahead',
    description: 'Fifteen hundred metres up, on the road to the dome, with a sky the whole country stopped being able to see forty years ago.',
  },
  {
    id: 'house-frr-boulevard-top-floor',
    name: 'Top Floor on the Boulevard',
    price: 660_000,
    resaleRange: [470_000, 890_000],
    icon: 'space:corner-office',
    description: 'The whole top floor, plane trees at eye level, and a walk to the institute that takes eleven minutes and is the best part of the day.',
  },
]
