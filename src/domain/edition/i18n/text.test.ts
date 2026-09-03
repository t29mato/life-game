import { describe, expect, it } from 'vitest'

import { EDITION_JAPAN } from '../japan'
import { EDITION_USA } from '../usa'
import { editionTextFor } from './text'
import { translationFor } from './registry'

/**
 * The reading end of a translation, and mostly one question: does a tile get
 * the translation of the sentence it is actually carrying?
 *
 * `overlays.test.ts` already proves the tables are complete. What it cannot
 * prove is that the lookup finds the right entry at the right difficulty, or
 * that it correctly *declines* to answer for a card the engine composed — and
 * both of those are the failure modes that would put the wrong Japanese in
 * front of a player rather than no Japanese at all.
 */

const JAPAN_TILE = 'jp-uni-move-in'
const JAPAN_TILE_EN =
  'Your first solo apartment is measured in straw mats. It holds a futon, a rice cooker, and every ambition you have.'
const JAPAN_TILE_HARSHER_EN =
  'Your first solo apartment is measured in straw mats — and the landlord wants a deposit, plus a non-refundable payment called "gratitude money" for the privilege of renting to you.'

describe('editionTextFor', () => {
  it('is a passthrough in English — every lookup answers "read what you have"', () => {
    const text = editionTextFor(EDITION_JAPAN, 'en')
    expect(text.passthrough).toBe(true)
    expect(text.space(JAPAN_TILE)).toBeUndefined()
    expect(text.career('anything')).toBeUndefined()
    expect(text.lane('College Lane')).toBeUndefined()
    expect(text.tuitionNote(0)).toBeUndefined()
  })

  it('is a passthrough for an edition the locale has not reached', () => {
    // Registered but with no overlay written — the honest answer is English,
    // and it has to be the *same* answer as English's own, not an error.
    expect(translationFor('france-researcher', 'ja')).toBeUndefined()
    expect(editionTextFor(EDITION_USA, 'en').passthrough).toBe(true)
  })

  it('caches per edition and locale, so a render loop is a hash probe', () => {
    expect(editionTextFor(EDITION_JAPAN, 'ja')).toBe(editionTextFor(EDITION_JAPAN, 'ja'))
    expect(editionTextFor(EDITION_JAPAN, 'ja')).not.toBe(editionTextFor(EDITION_JAPAN, 'fr'))
  })

  describe('a tile, matched to the sentence it is carrying', () => {
    const text = editionTextFor(EDITION_JAPAN, 'ja')

    it('reads the tile as written when no sentence is offered', () => {
      expect(text.space(JAPAN_TILE)?.title).toBe('六畳一間')
    })

    it('reads the tile as written when the English matches the tile as written', () => {
      expect(text.space(JAPAN_TILE, JAPAN_TILE_EN)?.title).toBe('六畳一間')
      expect(text.space(JAPAN_TILE, JAPAN_TILE_EN)?.description).toContain('布団')
    })

    /*
     * The whole reason the lookup takes a sentence at all. On Hard this tile
     * is a different tile — new sentence, new reason — and the difficulty
     * that made it so is nowhere on the object by the time it reaches a
     * screen.
     */
    it('reads the hardship when the English is the hardship’s', () => {
      const harsher = text.space(JAPAN_TILE, JAPAN_TILE_HARSHER_EN)
      expect(harsher?.description).toContain('礼')
      expect(harsher?.description).not.toBe(text.space(JAPAN_TILE, JAPAN_TILE_EN)?.description)
      expect(harsher?.reason).toBeTruthy()
    })

    /*
     * A hardship that writes no title of its own is still the same tile, so
     * the translated base title stands over the new sentence — the mirror of
     * `atDifficulty`'s `harsher.title ?? content.title`.
     */
    it('keeps the tile’s own title over a hardship that renamed nothing', () => {
      expect(text.space(JAPAN_TILE, JAPAN_TILE_HARSHER_EN)?.title).toBe('六畳一間')
    })

    it('declines a sentence that is neither of the tile’s own', () => {
      expect(text.space(JAPAN_TILE, 'A sentence the engine composed on the spot.')).toBeUndefined()
    })

    it('declines an id the edition has never heard of', () => {
      expect(text.space('no-such-tile')).toBeUndefined()
    })
  })

  it('translates the catalogues by id, with no sentence to match', () => {
    const text = editionTextFor(EDITION_JAPAN, 'ja')
    const house = EDITION_JAPAN.houses[0]!
    const stock = EDITION_JAPAN.stocks[0]!
    const career = EDITION_JAPAN.careers.basic[0]!
    const tile = EDITION_JAPAN.lifeTiles[0]!
    expect(text.house(house.id)?.name).toBeTruthy()
    expect(text.house(house.id)?.name).not.toBe(house.name)
    expect(text.stock(stock.id)?.name).toBeTruthy()
    expect(text.career(career.id)?.title).toBeTruthy()
    expect(text.lifeTile(tile.id)?.title).toBeTruthy()
  })

  it('translates the economy’s bands by position, in the order they are dealt', () => {
    const text = editionTextFor(EDITION_JAPAN, 'ja')
    const bands = EDITION_JAPAN.economy.tuition.outcomes.length
    for (let index = 0; index < bands; index += 1) {
      expect(text.tuitionNote(index)).toBeTruthy()
    }
    expect(text.tuitionNote(bands)).toBeUndefined()
    expect(text.marriageRescuedNote()).toBeTruthy()
  })
})
