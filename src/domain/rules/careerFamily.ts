import type { IconName } from '../model/icons'

/**
 * The trades, sorted into families of work.
 *
 * Sixty-two careers across five editions, and eight kinds of working life
 * between them. The taxonomy started as a way of casting career plaques in
 * eight colours — a kitchen job in copper, a desk job in navy, so a fair
 * offering a line cook against an estate agent reads as two different worlds
 * before either name is read — and the presentation layer still spends it that
 * way, on plaques, on the Handbook catalogue and on the driver's own gear.
 *
 * It is here rather than there because the board now asks the same question.
 * A `tradeYear` tile deals a story that belongs to the work the player
 * actually does, and picking which story means knowing which family the job
 * sits in, in the domain, where the tile is resolved. Presentation still reads
 * this — via a re-export from `CareerPlaque/families.ts`, which keeps the
 * plaque's own palette — so there is exactly one answer to "what kind of work
 * is this" and both the colour and the story come from it.
 */
export type CareerIconName = Extract<IconName, `career:${string}`>

export type CareerFamily =
  | 'kitchen'
  | 'field'
  | 'works'
  | 'office'
  | 'studio'
  | 'care'
  | 'science'
  | 'pitch'

/**
 * Which family every trade belongs to. The `Record` over the full union is
 * the guarantee: a career drawn tomorrow without a family here is a compile
 * error, not a grey plaque discovered at a fair.
 */
export const CAREER_FAMILY: Record<CareerIconName, CareerFamily> = {
  'career:apprentice-baker': 'kitchen',
  'career:chai-wallah': 'kitchen',
  'career:food-truck-owner': 'kitchen',
  'career:grill-cook': 'kitchen',
  'career:line-cook': 'kitchen',
  'career:market-vendor': 'kitchen',
  'career:noodle-cook': 'kitchen',
  // The sushi ladder's bottom rung: two years of washing rice in a
  // restaurant, not a season in a paddy — `career:rice-farmer` is the one
  // in the fields.
  'career:rice-apprentice': 'kitchen',
  'career:pastry-chef': 'kitchen',
  'career:sweet-maker': 'kitchen',
  'career:agronomist': 'field',
  'career:marine-biologist': 'field',
  'career:market-gardener': 'field',
  'career:quinoa-farmer': 'field',
  'career:rice-farmer': 'field',
  'career:wheat-farmer': 'field',
  'career:apprentice-mechanic': 'works',
  'career:construction-foreman': 'works',
  'career:delivery-courier': 'works',
  'career:dispatcher': 'works',
  'career:logistics-lead': 'works',
  'career:mechanic': 'works',
  'career:minibus-owner': 'works',
  'career:site-labourer': 'works',
  'career:station-owner': 'works',
  'career:warehouse-picker': 'works',
  'career:workshop-owner': 'works',
  'career:actuary': 'office',
  'career:agency-owner': 'office',
  'career:bank-officer': 'office',
  'career:corporate-lawyer': 'office',
  'career:estate-agent': 'office',
  'career:import-trader': 'office',
  'career:investment-analyst': 'office',
  'career:ministry-official': 'office',
  'career:product-manager': 'office',
  'career:trading-generalist': 'office',
  'career:architect': 'studio',
  'career:brass-musician': 'studio',
  'career:game-designer': 'studio',
  'career:journalist': 'studio',
  'career:manga-artist': 'studio',
  'career:photographer': 'studio',
  'career:radio-host': 'studio',
  'career:radio-runner': 'studio',
  'career:record-producer': 'studio',
  'career:session-musician': 'studio',
  'career:writer': 'studio',
  'career:pet-groomer': 'care',
  'career:salon-apprentice': 'care',
  'career:salon-owner': 'care',
  'career:surgeon': 'care',
  'career:veterinarian': 'care',
  'career:aerospace-engineer': 'science',
  'career:geologist': 'science',
  'career:professor': 'science',
  'career:robotics-engineer': 'science',
  'career:rocket-engineer': 'science',
  'career:software-engineer': 'science',
  'career:baseball-coach': 'pitch',
  'career:cricket-coach': 'pitch',
  'career:soccer-coach': 'pitch',
}

/** Narrows any subject to a trade, which is what decides plaque-vs-glyph. */
export function isCareerIcon(name: IconName): name is CareerIconName {
  return name.startsWith('career:')
}

/** Every family, in the order the Handbook lists them. */
export const CAREER_FAMILIES: readonly CareerFamily[] = [
  'kitchen',
  'field',
  'works',
  'office',
  'studio',
  'care',
  'science',
  'pitch',
]
