import type { Edition } from '../types'
import { CADRE_CAREERS, CONTRACT_CAREERS, FONCTIONNAIRE_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_RESEARCHER_FRANCE } from './route'
import { STOCKS } from './stocks'
import { RESEARCHER_FRANCE_TRADE_YEAR_STORIES } from './tradeYearStories'
import { RESEARCHER_FRANCE_CURRENCY, RESEARCHER_FRANCE_ECONOMY } from './economy'

/**
 * LIFE JOURNEY: Researcher — France.
 *
 * The second board on the researcher axis, and the one that has to earn the
 * axis. The first (Researcher: Japan) proved a researcher's life can be told
 * on this skeleton; this one has to prove that *where* the life is lived
 * changes the game rather than the prose — because if two researcher boards
 * play the same, the country dimension is decoration and should not have been
 * built.
 *
 * Nothing about the five country editions changes. They stay registered, stay
 * selectable, and stay exactly the boards they were: this edition is strictly
 * additive, and `src/domain/edition/france/` is untouched by it.
 *
 * Held against its sibling, tile for tile, these are the differences a player
 * would feel without reading a word:
 *
 * - **The opening fork is not about a degree.** Japan's safe road is the
 *   master's exit — a considered decision, taken by nearly everybody. France's
 *   is the grande école, which is not a decision about doctorates at all: it
 *   is a different institution, entered at eighteen by competition, and
 *   nobody on it ever weighed a thesis against a salary.
 * - **The bill can pay.** One face of this board's stipend-years die is an
 *   industrial doctorate, done inside a company on a salary. It is the only
 *   tuition tile in the game whose die can put money into a pocket, and it is
 *   what makes the underdog road survivable.
 * - **The gate is at the entrance, not at the end.** Japan's gated road is a
 *   ten-year treadmill ending in a guaranteed appointment; France's is two
 *   sittings of a national competition that appoints on a five or a six, with
 *   nothing at all happening on the other four faces. All of this life's risk
 *   sits in one competition in the player's early thirties.
 * - **The shelf behind the gate is the opposite shape.** Japan's permanent
 *   shelf has a floor *above* the industry shelf's ceiling: safety and a
 *   raise. France's fonctionnaire shelf has the highest floor and the lowest
 *   ceiling in the game, and every second rung of the cadre shelf out-earns
 *   the best post on it: safety, bought monthly, for thirty years. Late-game
 *   France plays academia-safe and industry-volatile — the mirror of Japan.
 * - **Leaving costs nothing.** Japan charges a mover the whole climb
 *   (`startsOver`); France does not, because the diploma travels and the
 *   years count. One field, present on one board and absent on the other.
 *
 * `validateRoute` checks the route at every length and difficulty because it
 * is registered, `edition.test.ts` holds the mirror and lists the two tiles
 * that deliberately break it, and `balance.test.ts` is the measurement the
 * whole edition stands on.
 */
export const EDITION_RESEARCHER_FRANCE: Edition = {
  id: 'france-researcher',
  name: 'LIFE JOURNEY: Researcher — France',
  currency: RESEARCHER_FRANCE_CURRENCY,
  economy: RESEARCHER_FRANCE_ECONOMY,
  route: ROUTE_RESEARCHER_FRANCE,
  careers: {
    basic: CADRE_CAREERS,
    graduate: CONTRACT_CAREERS,
    doctorate: FONCTIONNAIRE_CAREERS,
  },
  /*
   * What a first degree buys here — and no longer who starts holding one.
   *
   * `everyoneGraduates` used to sit alongside this, and it is gone with the
   * road that needed it. It was there because the opening fork's other side
   * was la grande école, which awarded no degree: the *prestigious* road was
   * the one the game recorded as unschooled, on every pawn, all game. There
   * was no honest tile on which to fix that, so higher education was stated as
   * a premise instead.
   *
   * There is no such player now. Everybody walks the university, and the
   * university awards the degree on The Research Master's and the doctorate on
   * The Defence — both `event` tiles, so both fire for everybody, landed on or
   * swept past. Keeping the premise would hand every seat a degree in a lycée
   * corridor, six tiles before the board says it is earned.
   *
   * `degreeOpens: 'basic'` stays. The `graduate` shelf here is the contract
   * shelf — the hourly lecturer, the postdoc, the private laboratory — and it
   * is what a *doctorate* opens; a research master's opens the cadre shelf and
   * nothing above it. Between the master's and the defence that is the rule
   * that applies. No fair sits in that one-tile window today, so it is not
   * exercised in play — it is kept because it is the true statement, and
   * because it is what stops the Industry Fair (capped at the contract shelf so
   * that no career fair can hand out a permanent state post) from ever
   * offering an engineering cadre work as an hourly lecturer.
   */
  schooling: { degreeOpens: 'basic' },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
  tradeYearStories: RESEARCHER_FRANCE_TRADE_YEAR_STORIES,
}

export { CADRE_CAREERS, CONTRACT_CAREERS, FONCTIONNAIRE_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_RESEARCHER_FRANCE } from './route'
export { STOCKS } from './stocks'
export { RESEARCHER_FRANCE_TRADE_YEAR_STORIES } from './tradeYearStories'
export { RESEARCHER_FRANCE_CURRENCY, RESEARCHER_FRANCE_ECONOMY } from './economy'
