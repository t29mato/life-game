import type { SpaceEffect } from '@domain/model/types'

import type { GlyphCategory } from './art/glyphs'

/**
 * The board's promise, written down: **one picture, one meaning.**
 *
 * A playtester landed on a rising chart and was asked "The Bank: borrow a
 * loan?"; drove past a gold coin and was charged $1,800; and could find
 * nothing in the game that said what the red-and-white stripe meant. Each of
 * those is the same failure — a mark on a tile that does not predict what the
 * tile does — and each was fixed by changing the picture, never the effect.
 *
 * Fixing them once is not enough, because the mapping in `categories.ts` is
 * three hundred lines long and the boards are five. So the rule is stated here
 * as data: for each effect, the glyphs that may honestly stand for it.
 * `effectVocabulary.test.ts` walks every tile of every edition at every
 * difficulty against this table, which is what makes a new tile with a lying
 * icon a failing test rather than a playtest note six months later.
 *
 * How to read a row:
 *
 *   • A **money mover** may only wear a mark of the right direction — the
 *     mint arrow and the coin mean money in, the coral arrow and the hazard
 *     triangle mean money out. Where the tile is really about *where* the
 *     money went, the place is allowed to speak instead: the bank, the
 *     insurance office, the market, a gamble's clover.
 *   • A **milestone** keeps its reserved glyph and nothing else — the
 *     mortarboard, the heart, the pram, the house, the sunset.
 *   • A tile where **nothing happens** may wear no money mark at all. A red
 *     arrow over a tile that charges nothing is the same lie as a coin over a
 *     tile that charges $1,800, told the other way round.
 *
 * Adding a glyph to a row is a design decision, not a way to make the test
 * pass. If a tile fails, the tile's icon is usually what is wrong.
 */
export const GLYPHS_FOR_EFFECT: Readonly<Record<SpaceEffect['type'], readonly GlyphCategory[]>> = {
  /*
   * Nothing happens. Any subject glyph is fine; no money mark is, and neither
   * is a hazard triangle.
   */
  none: ['career', 'study', 'grad', 'love', 'child', 'home', 'life', 'travel', 'retire', 'luck'],

  // --- money, one direction, no press ------------------------------------
  gainMoney: ['gain', 'luck', 'life'],
  payMoney: ['expense', 'hazard', 'bank', 'insurance'],
  payEach: ['expense', 'hazard'],
  payPerChild: ['expense', 'child'],
  collectFromEach: ['gain', 'luck'],
  collectPerChild: ['gain', 'child'],
  spinForMoney: ['gain', 'luck'],
  stockDividend: ['invest', 'gain'],
  tuition: ['expense'],

  // Salary. The coin is payday's alone — it is the one mark on the board a
  // player is allowed to read as "this is my wage".
  payday: ['payday'],
  payRaise: ['career', 'gain'],
  promotion: ['career'],

  /*
   * A year in the trade the player already holds. Symmetric about the die's
   * middle and worth nothing on average, so it may never wear a money mark:
   * the briefcase, or the sunset on the last one.
   */
  tradeYear: ['career', 'retire'],

  // --- the milestones, each reserved for its own beat ---------------------
  graduate: ['grad'],
  doctorate: ['grad'],
  getMarried: ['love'],
  haveChildren: ['child'],
  buyHouse: ['home'],
  upgradeHouse: ['home'],
  retire: ['retire'],

  // --- a question, put to the player -------------------------------------
  bank: ['bank'],
  buyStock: ['invest'],
  buyInsurance: ['insurance'],
  chooseCareer: ['career'],
  careerChange: ['career'],
  // The Number: the choice to stop working decades early. The sunset, or the
  // bank the fund is being drawn from — never a coin, since nobody knows what
  // leaving costs until they have said they are leaving.
  retireEarly: ['retire', 'bank'],

  // --- the rest ----------------------------------------------------------
  loseCareer: ['hazard', 'career'],
  household: ['bank', 'love', 'life'],
  divorce: ['hazard', 'love'],
  gainLifeTiles: ['life', 'luck'],
  swapMoneyWithLeader: ['luck'],
  stealLifeTile: ['luck'],
}

/** The glyphs that may honestly stand for `effect`. */
export function glyphsForEffect(effect: SpaceEffect): readonly GlyphCategory[] {
  return GLYPHS_FOR_EFFECT[effect.type]
}
