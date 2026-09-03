import type { Edition } from '../types'
import { ACADEMIA_CAREERS, INDUSTRY_CAREERS, PERMANENT_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_RESEARCHER_JAPAN } from './route'
import { STOCKS } from './stocks'
import { RESEARCHER_TRADE_YEAR_STORIES } from './tradeYearStories'
import { RESEARCHER_JAPAN_CURRENCY, RESEARCHER_JAPAN_ECONOMY } from './economy'

/**
 * LIFE JOURNEY: Researcher — Japan.
 *
 * The first board on a second axis. The five country editions are one life
 * told in five voices; this is a different life, and the country is still
 * Japan — because *which* road is the gamble turns out to be a fact about a
 * national labour market rather than a fact about research, and Japan's is the
 * clearest case in the world.
 *
 * Nothing about the five country editions changes. They stay registered, stay
 * selectable, and stay exactly the boards they were: this edition is strictly
 * additive, and `src/domain/edition/japan/` is untouched by it.
 *
 * What it changes about *this* board, against the skeleton every edition
 * shares:
 *
 * - **The shelves swap moral weight.** `basic` is corporate research entered
 *   with a master's — short ladders, a good floor, a low ceiling, and the
 *   safe road. `graduate` is the fixed-term academic posts a doctorate opens —
 *   the widest band in the game, nine rungs paid by the die, and the road that
 *   also pays the bill. `doctorate` is the permanent post at the far end of the
 *   gated road: the highest floor anywhere, and the only work in the game the
 *   Layoff Notice tile cannot touch.
 * - **The volatility moves to the tuition-paying lane.** Every other board in
 *   this repository asserts that the early-earning road is the wider one.
 *   `balance.test.ts` asserts the opposite here, measured, because that is the
 *   true shape of this life.
 * - **Leaving is charged for.** Two career redraws deal from the industry
 *   shelf at the bottom rung — the hiring calendar, made mechanical.
 *
 * `validateRoute` checks the route on every length and difficulty because it
 * is registered, `edition.test.ts` holds the mirror and lists the four tiles
 * that deliberately break it, and `balance.test.ts` is the measurement the
 * whole edition stands on.
 */
export const EDITION_RESEARCHER_JAPAN: Edition = {
  id: 'japan-researcher',
  name: 'LIFE JOURNEY: Researcher — Japan',
  currency: RESEARCHER_JAPAN_CURRENCY,
  economy: RESEARCHER_JAPAN_ECONOMY,
  route: ROUTE_RESEARCHER_JAPAN,
  careers: {
    basic: INDUSTRY_CAREERS,
    graduate: ACADEMIA_CAREERS,
    doctorate: PERMANENT_CAREERS,
  },
  /*
   * University is the premise here, not one of the roads.
   *
   * Both sides of the opening fork are graduates — the master's exit into a
   * manufacturer's research division against the doctoral course — and the
   * prose above and on the route has always said so. The engine did not: with
   * the degree awarded only on the doctoral lane, everybody who took the
   * national default finished the game recorded as a school-leaver, with no
   * cap and gown on the pawn and no degree on the panel. That is the road the
   * owner reported seeing and the one this edition was written to not have.
   *
   * `degreeOpens: 'basic'` is the other half, and it is what keeps every shelf
   * exactly where it was measured: on this board the `graduate` shelf is
   * academia, and academia is opened by the doctorate. A master's opens the
   * industry shelf, which is precisely what the fairs already deal.
   */
  schooling: { everyoneGraduates: true, degreeOpens: 'basic' },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
  tradeYearStories: RESEARCHER_TRADE_YEAR_STORIES,
}

export { ACADEMIA_CAREERS, INDUSTRY_CAREERS, PERMANENT_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_RESEARCHER_JAPAN } from './route'
export { STOCKS } from './stocks'
export { RESEARCHER_TRADE_YEAR_STORIES } from './tradeYearStories'
export { RESEARCHER_JAPAN_CURRENCY, RESEARCHER_JAPAN_ECONOMY } from './economy'
