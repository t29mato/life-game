import type { IconName } from '@domain/model/icons'

/**
 * The trades, sorted into families of work — and the moulded colour each
 * family's plaque is cast in.
 *
 * A career used to render as a bare icon at list size, which is fine in a
 * cramped panel row and nothing more than that anywhere bigger. The plaque
 * treatment gives every trade a manufactured object to be: the portrait set
 * into a tile of coloured plastic, and the *colour* doing real work — every
 * kitchen job is cast in copper, every desk job in navy, so a fair offering
 * a line cook against an estate agent reads as two different worlds before
 * either name is read. Sixty-two trades in sixty-two colours would say
 * nothing; eight families say where each one lives.
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

export interface FamilyPalette {
  /** Printed on a manual card so the grouping is legible, not just visible. */
  readonly label: string
  readonly light: string
  readonly base: string
  readonly dark: string
}

/**
 * Each family's plastic, mixed to sit beside the `--candy-*` pigments without
 * repeating them — these are object colours, not UI accents, and two greens
 * or two ambers side by side in one fair would blur the very distinction the
 * families exist to draw.
 */
export const FAMILY_PALETTE: Record<CareerFamily, FamilyPalette> = {
  kitchen: { label: 'Food & market', light: '#e89a63', base: '#c96f3a', dark: '#96491d' },
  field: { label: 'Field & harvest', light: '#8cc45f', base: '#619e38', dark: '#3f7220' },
  works: { label: 'Trades & transport', light: '#93a2b4', base: '#67788d', dark: '#46556a' },
  office: { label: 'Desk & ledger', light: '#7d95c4', base: '#4e69a0', dark: '#334a7b' },
  studio: { label: 'Studio & stage', light: '#af8fdd', base: '#8562c0', dark: '#5f4198' },
  care: { label: 'Care & clinic', light: '#6dbfae', base: '#3f9c8d', dark: '#25736a' },
  science: { label: 'Lab & launchpad', light: '#68aede', base: '#3684bd', dark: '#1f5f92' },
  pitch: { label: 'The sporting life', light: '#e3b354', base: '#c68f25', dark: '#94670e' },
}

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
