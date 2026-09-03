import {
  CAREER_FAMILY,
  isCareerIcon,
  type CareerFamily,
  type CareerIconName,
} from '@domain/rules/careerFamily'
import { EN, type UiText } from '../../i18n/en'

/**
 * The moulded colour each family of work is cast in.
 *
 * The taxonomy itself — which of the eight families a trade belongs to — moved
 * down to `@domain/rules/careerFamily` when the board started asking the same
 * question: a `tradeYear` tile deals a story that belongs to the work a player
 * actually does, and it is resolved in the domain. Both names are re-exported
 * from here so every component that already reads a family off this module
 * keeps working, and so there is exactly one answer to "what kind of work is
 * this" behind the plaque's colour and the tile's story alike.
 *
 * What stays here is the part that is genuinely about the *look* of a plaque.
 * A career used to render as a bare icon at list size, which is fine in a
 * cramped panel row and nothing more than that anywhere bigger. The plaque
 * treatment gives every trade a manufactured object to be: the portrait set
 * into a tile of coloured plastic, and the colour doing real work — every
 * kitchen job in copper, every desk job in navy, so a fair offering a line
 * cook against an estate agent reads as two different worlds before either
 * name is read. Sixty-two trades in sixty-two colours would say nothing;
 * eight families say where each one lives.
 */
export { CAREER_FAMILY, isCareerIcon }
export type { CareerFamily, CareerIconName }

/**
 * What a family is called, in the reader's language.
 *
 * The English name stays on the palette below as the fallback and as what the
 * catalogue's own keys are named after; this is what anything printing one
 * should call.
 */
export function familyLabel(family: CareerFamily, t: UiText = EN): string {
  return t.families[family] ?? FAMILY_PALETTE[family].label
}

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
