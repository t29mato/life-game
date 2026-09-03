import type { Difficulty, PlayerColor } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { allEditions, DEFAULT_EDITION_ID } from '@domain/edition/registry'
import { editionDisplayName, formatMoney, salaryPeriod, salaryRate } from '../../format'
import { PLAYER_COLORS } from '../Pawn/designs'

/**
 * --- the new-game draft ----------------------------------------------------
 *
 * Everything the three setup steps agree about, in one place because they are
 * now three separate components rather than three sections of one long form.
 * Nothing here renders anything or holds any state: it is the vocabulary the
 * steps share, so that moving a decision from one screen to another is an
 * edit to one file rather than a hunt through four.
 */

export const MIN_PLAYERS = 2
export const MAX_PLAYERS = 4

/** One seat at the table as the setup flow holds it, before it becomes a real player. */
export interface DraftPlayer {
  readonly name: string
  readonly color: PlayerColor
  readonly isCpu: boolean
}

export function nextAvailableColor(used: readonly PlayerColor[]): PlayerColor {
  return PLAYER_COLORS.find((color) => !used.includes(color)) ?? (PLAYER_COLORS[0] as PlayerColor)
}

export function defaultPlayers(): DraftPlayer[] {
  return [
    { name: 'Player 1', color: 'red', isCpu: false },
    { name: 'Player 2', color: 'blue', isCpu: false },
  ]
}

/**
 * The difference between difficulties is dramatic — measured over seeded
 * games, median retirements go roughly $591k → $349k → $40k, and on Very Hard
 * close to half the table finishes in the red. The copy here says so plainly:
 * a player should choose that fate, never discover it thirty minutes in.
 * `aria` carries the same warning on the control itself for screen readers.
 */
export const DIFFICULTY_COPY: Record<
  Difficulty,
  {
    readonly label: string
    readonly hint: string
    readonly detail: string
    readonly aria: string
    readonly tone: 'mint' | 'tangerine' | 'coral'
  }
> = {
  normal: {
    label: 'Normal',
    hint: 'a fair life',
    detail: "The standard journey: setbacks happen, but they won't ruin you.",
    aria: "Normal difficulty: setbacks happen, but they won't ruin you",
    tone: 'mint',
  },
  hard: {
    label: 'Hard',
    hint: 'money runs tight',
    detail: 'Twice the setbacks of Normal — about one player in ten retires in the red.',
    aria: 'Hard difficulty: twice the setbacks, about one player in ten retires in the red',
    tone: 'tangerine',
  },
  veryHard: {
    label: 'Very Hard',
    hint: 'survival is a win',
    detail:
      'Setbacks at nearly every turn, and finishing in the black at all is close to a coin flip. Retiring with anything is bragging rights.',
    aria: 'Very hard difficulty: finishing in the black at all is close to a coin flip',
    tone: 'coral',
  },
}

/**
 * Editions as the picker offers them: the classic USA game first — it is the
 * default, and the id every save without one resolves to — then the rest
 * alphabetically by place name, so the shelf reads the same however the
 * registry happened to be assembled. Computed per render rather than at module
 * load because the registry can grow after this module is imported (tests
 * register variants, and future editions may arrive the same way).
 *
 * The order is a reading order, not a ranking. Every country on this shelf is
 * a first-class board — a constraint the owner stated outright on #7 — and the
 * step that shows them gives each one the same card, the same size and the
 * same honest sentence of its own data. Nothing about being second in this
 * list may ever read as being second-best.
 */
export function editionOptions(): readonly Edition[] {
  return [...allEditions()].sort((a, b) => {
    if (a.id === DEFAULT_EDITION_ID) return b.id === DEFAULT_EDITION_ID ? 0 : -1
    if (b.id === DEFAULT_EDITION_ID) return 1
    return editionDisplayName(a).localeCompare(editionDisplayName(b))
  })
}

/**
 * One true sentence about an edition, derived from its own data — never
 * authored copy, so the editions being written in parallel get an honest line
 * here with no further edit. The three facts a player can size a country up by
 * before ever playing it: the money it counts in, what they start holding, and
 * what its careers pay.
 *
 * It used to be printed once, under the picker, for whichever country happened
 * to be selected. It is printed on *every* card now: a single shared line
 * makes four of the five countries mute until you commit to them, which is the
 * layout arguing that four of them are alternatives to a default rather than
 * five equal choices.
 */
export function editionBlurb(edition: Edition): string {
  const { currency, economy, careers } = edition
  const start = formatMoney(economy.startingMoney, currency)
  const salaries = [...careers.basic, ...careers.graduate].map((career) => career.salary)
  if (salaries.length === 0) return `Counts in ${currency.symbol} — start with ${start}.`
  const low = formatMoney(salaryRate(Math.min(...salaries), currency), currency)
  const high = formatMoney(salaryRate(Math.max(...salaries), currency), currency)
  return `Counts in ${currency.symbol} — start with ${start}; salaries run ${low} to ${high} a ${salaryPeriod(currency)}.`
}

/** `1970-01-01T00:00:00.000Z` → `'Jan 1, 12:00 AM'`. Always English, regardless of the host locale. */
export function formatSlotTimestamp(savedAt: string): string {
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
