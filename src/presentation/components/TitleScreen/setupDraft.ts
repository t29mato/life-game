import type { Difficulty, PlayerColor } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { allEditions, DEFAULT_EDITION_ID } from '@domain/edition/registry'
import { editionDisplayName, formatMoney, salaryPeriod, salaryRate } from '../../format'
import { EN, type UiText } from '../../i18n/en'
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

export function defaultPlayers(t: UiText = EN): DraftPlayer[] {
  return [
    { name: t.title.defaultPlayerName(1), color: 'red', isCpu: false },
    { name: t.title.defaultPlayerName(2), color: 'blue', isCpu: false },
  ]
}

/**
 * The difference between difficulties is dramatic — measured over seeded
 * games, median retirements go roughly $591k → $349k → $40k, and on Very Hard
 * close to half the table finishes in the red. The copy here says so plainly:
 * a player should choose that fate, never discover it thirty minutes in.
 * `aria` carries the same warning on the control itself for screen readers.
 */
export interface DifficultyCopy {
  readonly label: string
  readonly hint: string
  readonly detail: string
  readonly aria: string
  readonly tone: 'mint' | 'tangerine' | 'coral'
}

export function difficultyCopy(t: UiText = EN): Record<Difficulty, DifficultyCopy> {
  return {
    normal: {
      label: t.difficulty.normalLabel,
      hint: t.difficulty.normalHint,
      detail: t.difficulty.normalDetail,
      aria: t.difficulty.normalAria,
      tone: 'mint',
    },
    hard: {
      label: t.difficulty.hardLabel,
      hint: t.difficulty.hardHint,
      detail: t.difficulty.hardDetail,
      aria: t.difficulty.hardAria,
      tone: 'tangerine',
    },
    veryHard: {
      label: t.difficulty.veryHardLabel,
      hint: t.difficulty.veryHardHint,
      detail: t.difficulty.veryHardDetail,
      aria: t.difficulty.veryHardAria,
      tone: 'coral',
    },
  }
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
export function editionBlurb(edition: Edition, t: UiText = EN): string {
  const { currency, economy, careers } = edition
  const start = formatMoney(economy.startingMoney, currency)
  const salaries = [...careers.basic, ...careers.graduate].map((career) => career.salary)
  if (salaries.length === 0) return t.country.blurb(currency.symbol, start)
  const low = formatMoney(salaryRate(Math.min(...salaries), currency), currency)
  const high = formatMoney(salaryRate(Math.max(...salaries), currency), currency)
  return t.country.blurbWithSalaries(currency.symbol, start, low, high, salaryPeriod(currency, t))
}

/**
 * `1970-01-01T00:00:00.000Z` → `'Jan 1, 12:00 AM'`.
 *
 * Formatted in the language the player chose rather than in the host's, on
 * the same reasoning as the hall of records' dates: a timestamp printed on a
 * save slot is part of the game's own voice.
 */
export function formatSlotTimestamp(savedAt: string, t: UiText = EN): string {
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return t.format.unknownTime
  return date.toLocaleString(t.format.dateLocale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
