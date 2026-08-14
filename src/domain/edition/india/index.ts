import type { Edition } from '../types'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_INDIA } from './route'
import { STOCKS } from './stocks'
import { INDIA_CURRENCY, INDIA_ECONOMY } from './economy'

/**
 * The India edition: a data file, like every edition after the seam was cut.
 *
 * The board's measured skeleton (tiers, stops, hardships, hazard density,
 * payday placement) is the shipped one, at ×100 in rupees; the life on it is
 * Indian from the entrance-exam hall to the retirement shawl. `validateRoute`
 * checks the route on every length and difficulty once it is registered, and
 * `india/balance.test.ts` holds the same measured bands the USA board holds,
 * in rupees.
 */
export const EDITION_INDIA: Edition = {
  id: 'india',
  name: 'LIFE JOURNEY: India',
  currency: INDIA_CURRENCY,
  economy: INDIA_ECONOMY,
  route: ROUTE_INDIA,
  careers: { basic: BASIC_CAREERS, graduate: GRADUATE_CAREERS },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
}

export { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_INDIA } from './route'
export { STOCKS } from './stocks'
export { INDIA_CURRENCY, INDIA_ECONOMY } from './economy'
