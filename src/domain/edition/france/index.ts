import type { Edition } from '../types'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_FRANCE } from './route'
import { STOCKS } from './stocks'
import { FRANCE_CURRENCY, FRANCE_ECONOMY } from './economy'

/**
 * The France edition: the same measured skeleton as the USA board at ×1 — the
 * euro sits close enough to the dollar that only the symbol moves — and the
 * life on it is French from the concours to the notary's reading of the deed.
 *
 * The board's mechanical shape (tiers, stops, hardships, hazard density,
 * payday placement) is the shipped one; `france/edition.test.ts` pins the
 * mirror tile for tile, and `france/balance.test.ts` holds the same measured
 * bands the USA board holds, in euros.
 */
export const EDITION_FRANCE: Edition = {
  id: 'france',
  name: 'LIFE JOURNEY: France',
  currency: FRANCE_CURRENCY,
  economy: FRANCE_ECONOMY,
  route: ROUTE_FRANCE,
  careers: { basic: BASIC_CAREERS, graduate: GRADUATE_CAREERS },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
}

export { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_FRANCE } from './route'
export { STOCKS } from './stocks'
export { FRANCE_CURRENCY, FRANCE_ECONOMY } from './economy'
