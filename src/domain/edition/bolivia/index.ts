import type { Edition } from '../types'
import { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
import { HOUSES } from './houses'
import { LIFE_TILE_DECK } from './lifeTiles'
import { ROUTE_BOLIVIA } from './route'
import { STOCKS } from './stocks'
import { BOLIVIA_CURRENCY, BOLIVIA_ECONOMY } from './economy'

/**
 * The Bolivia edition: the third country through the seam, and the one where
 * the informal economy is the story — the market stall as an ambition, the
 * house that grows a floor at a time, the savings pool, the godparent
 * obligations, and a cholet at the top of the housing ladder.
 *
 * The board's measured skeleton (stops, hardships, hazard density,
 * payday placement) is the shipped one at ×1 — the exchange rate and the
 * income gap between the two countries almost exactly cancel, so the dollar
 * board's numerals already read as boliviano sums (see `economy.ts`). The
 * life on it is Bolivian from the entrance exam to the confetti on the last
 * day. `bolivia/edition.test.ts` pins the mirror mechanically, and
 * `bolivia/balance.test.ts` holds the same measured bands the USA board
 * holds, in bolivianos.
 */
export const EDITION_BOLIVIA: Edition = {
  id: 'bolivia',
  name: 'LIFE JOURNEY: Bolivia',
  currency: BOLIVIA_CURRENCY,
  economy: BOLIVIA_ECONOMY,
  route: ROUTE_BOLIVIA,
  careers: { basic: BASIC_CAREERS, graduate: GRADUATE_CAREERS },
  houses: HOUSES,
  lifeTiles: LIFE_TILE_DECK,
  stocks: STOCKS,
}

export { BASIC_CAREERS, GRADUATE_CAREERS } from './careers'
export { HOUSES } from './houses'
export { LIFE_TILE_DECK } from './lifeTiles'
export { ROUTE_BOLIVIA } from './route'
export { STOCKS } from './stocks'
export { BOLIVIA_CURRENCY, BOLIVIA_ECONOMY } from './economy'
