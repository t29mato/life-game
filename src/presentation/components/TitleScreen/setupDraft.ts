import type { Difficulty, EditionId, PlayerColor } from '@domain/model/types'
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
 * --- the two axes ----------------------------------------------------------
 *
 * A researcher board is not a sixth country. It is a *different life* that
 * happens to be set in one — `docs/researcher-edition-concept.md` §7 and §10
 * argue that at length, and the setup flow now asks the two questions
 * separately: which country, then which life in it.
 *
 * The registry is flat, so the pairing has to be read off something. It is
 * read off the id: a researcher board is its country's id plus this suffix
 * (`japan` → `japan-researcher`), which is the convention the two shipped
 * boards were already written to. That keeps the picker registry-driven the
 * way it has always been — register `usa-researcher` tomorrow and the USA
 * country grows a life choice with no edit here — rather than pinning the
 * pairs to a hand-written table in the UI that a new board would have to
 * remember to update.
 */
const RESEARCHER_SUFFIX = '-researcher'

/**
 * The countries the picker offers: the classic USA game first — it is the
 * default, and the id every save without one resolves to — then the rest
 * alphabetically by place name, so the shelf reads the same however the
 * registry happened to be assembled. Computed per render rather than at module
 * load because the registry can grow after this module is imported (tests
 * register variants, and future editions may arrive the same way).
 *
 * The order is a reading order, not a ranking. Every country on this shelf is
 * a first-class board — a constraint the owner stated outright on #7 and #8 —
 * and the step that shows them gives each one the same card, the same size and
 * the same row of its own data. Nothing about being second in this list may
 * ever read as being second-best.
 *
 * Researcher boards are *not* on this shelf, and that is the fix rather than a
 * withdrawal: they used to sit here as siblings of the countries, which put
 * Japan on the screen twice and quietly claimed that "Researcher — Japan" was
 * somewhere you could live. They are offered a step later, against the country
 * they belong to, and every one of them is still exactly one press further in.
 */
export function countryOptions(): readonly Edition[] {
  return [...allEditions()]
    .filter((edition) => !edition.id.endsWith(RESEARCHER_SUFFIX))
    .sort((a, b) => {
      if (a.id === DEFAULT_EDITION_ID) return b.id === DEFAULT_EDITION_ID ? 0 : -1
      if (b.id === DEFAULT_EDITION_ID) return 1
      return editionDisplayName(a).localeCompare(editionDisplayName(b))
    })
}

/**
 * The researcher board set in this country, if one has been written.
 *
 * `undefined` is the honest answer for three of the five countries today, and
 * the flow reads it as "do not ask": a question with one possible answer is a
 * label, not a step. The country step says so out loud in its own table rather
 * than letting the absence be a surprise.
 */
export function researcherEditionFor(countryId: EditionId): Edition | undefined {
  if (countryId.endsWith(RESEARCHER_SUFFIX)) return undefined
  return allEditions().find((edition) => edition.id === `${countryId}${RESEARCHER_SUFFIX}`)
}

/**
 * The two answers, resolved to the one id a game is actually played on.
 *
 * Deliberately total: a player who picks Japan, chooses the researcher life,
 * then walks back and picks Bolivia keeps their answer to a question Bolivia
 * does not ask, and gets Bolivia's own board rather than an id nothing can
 * resolve. The flag survives so that going back to Japan finds it as it was
 * left — the same promise the rest of the draft makes.
 */
export function resolveEditionId(countryId: EditionId, researcher: boolean): EditionId {
  if (!researcher) return countryId
  return researcherEditionFor(countryId)?.id ?? countryId
}

/**
 * The facts a board can be sized up by before it is ever played, each derived
 * from its own data — never authored copy, so the editions being written in
 * parallel get honest figures here with no further edit.
 *
 * `salaries` is `null` for a board with no careers written yet, which is a
 * real state during a rollout and reads as an empty cell rather than as a
 * range from nothing to nothing.
 */
export interface EditionFacts {
  /** What it counts in: `'$'`, `'¥'`. */
  readonly money: string
  /** What every player starts holding, in that money. */
  readonly start: string
  /** `'$24,000–$148,500 / payday'`, or `null` where no career is written. */
  readonly salaries: string | null
}

/**
 * The lowest and highest a career fair can ever offer on this board, already
 * scaled to how the edition reads a wage (Japan quotes a month, the USA a
 * payday). `null` where the board has no careers written yet.
 */
function salaryRangeOf(edition: Edition): { readonly low: string; readonly high: string } | null {
  const { currency, careers } = edition
  const salaries = [...careers.basic, ...careers.graduate].map((career) => career.salary)
  if (salaries.length === 0) return null
  return {
    low: formatMoney(salaryRate(Math.min(...salaries), currency), currency),
    high: formatMoney(salaryRate(Math.max(...salaries), currency), currency),
  }
}

export function editionFacts(edition: Edition): EditionFacts {
  const { currency, economy } = edition
  const range = salaryRangeOf(edition)
  return {
    money: currency.symbol,
    start: formatMoney(economy.startingMoney, currency),
    salaries: range === null ? null : `${range.low}–${range.high} / ${salaryPeriod(currency)}`,
  }
}

/**
 * The same facts as one spoken sentence.
 *
 * The country cards print the comparable figures as a table now — five cards
 * each carrying their own paragraph is exactly the shape the owner found hard
 * to compare — but a card still has to *say* something when it is the only
 * thing a screen reader is on. So this rides in the card's `aria-label`: the
 * facts a sighted player reads across the table's columns, spoken in the order
 * they are printed.
 */
export function editionBlurb(edition: Edition): string {
  const { currency } = edition
  const { money, start } = editionFacts(edition)
  const range = salaryRangeOf(edition)
  if (range === null) return `Counts in ${money} — start with ${start}.`
  return `Counts in ${money} — start with ${start}; salaries run ${range.low} to ${range.high} a ${salaryPeriod(currency)}.`
}

/**
 * What a board's work pays, as a sentence — the one figure that genuinely
 * separates a country's board from the researcher board set in it, since the
 * two share a currency and a starting purse by construction.
 */
export function editionSalarySentence(edition: Edition): string {
  const range = salaryRangeOf(edition)
  if (range === null) return 'Its careers are still being written.'
  return `Salaries run ${range.low} to ${range.high} a ${salaryPeriod(edition.currency)}.`
}

/** `1970-01-01T00:00:00.000Z` → `'Jan 1, 12:00 AM'`. Always English, regardless of the host locale. */
export function formatSlotTimestamp(savedAt: string): string {
  const date = new Date(savedAt)
  if (Number.isNaN(date.getTime())) return 'unknown time'
  return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}
