import type { Edition } from '../types'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_JAPAN } from './route'
import { STOCKS } from './stocks'
import { JAPAN_CURRENCY, JAPAN_ECONOMY } from './economy'

/**
 * The Japan edition: the first country after the seam was cut, and the proof
 * the seam holds — an edition is a data file, and this is the whole file.
 *
 * The board's measured skeleton (tiers, stops, hardships, hazard density,
 * payday placement) is the shipped one, at ×100; the life on it is Japanese
 * from the exam hall to the bouquet on the last desk. `validateRoute` checks
 * the route on every length and difficulty because it is registered, and
 * `japan/balance.test.ts` holds the same measured bands the USA board holds,
 * in yen.
 */
export const EDITION_JAPAN: Edition = {
  id: 'japan',
  name: 'LIFE JOURNEY: Japan',
  currency: JAPAN_CURRENCY,
  economy: JAPAN_ECONOMY,
  route: ROUTE_JAPAN,
  careers: { basic: BASIC_CAREERS, graduate: GRADUATE_CAREERS },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
}

export { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_JAPAN } from './route'
export { STOCKS } from './stocks'
export { JAPAN_CURRENCY, JAPAN_ECONOMY } from './economy'
