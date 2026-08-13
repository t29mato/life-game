import type { Edition } from '../types'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_USA } from './route'
import { STOCKS } from './stocks'
import { USA_CURRENCY, USA_ECONOMY } from './economy'

/**
 * The game as it shipped, named.
 *
 * Nothing here is new content: every number and every string in this edition
 * is the one the board has always used. That is what makes it useful — the
 * whole test suite is an assertion about `EDITION_USA`, so if the extraction
 * had moved so much as a wedding gift, the suite would say so.
 */
export const EDITION_USA: Edition = {
  id: 'usa',
  name: 'LIFE JOURNEY',
  currency: USA_CURRENCY,
  economy: USA_ECONOMY,
  route: ROUTE_USA,
  careers: { basic: BASIC_CAREERS, graduate: GRADUATE_CAREERS },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
}

export { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_USA } from './route'
export { STOCKS } from './stocks'
export { USA_CURRENCY, USA_ECONOMY } from './economy'
