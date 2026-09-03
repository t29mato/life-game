import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { LIFE_TILE_DECK as FRANCE_DECK } from '../france/lifeTiles'
import { LIFE_TILE_DECK as JAPAN_RESEARCHER_DECK } from '../japan-researcher/lifeTiles'
import { LIFE_TILE_DECK } from './lifeTiles'
import { EDITION_RESEARCHER_FRANCE } from './index'
import { findLifeTile } from '../lookup'

describe('researcher france life tile deck', () => {
  it('has at least 36 tiles, so a long game rarely draws the same story twice', () => {
    expect(LIFE_TILE_DECK.length).toBeGreaterThanOrEqual(36)
  })

  it('keeps the tuned value curve, slot for slot', () => {
    // Which values are common and where the single outlier sits is measured
    // rather than chosen, so the deck inherits the curve and changes only the
    // stories. See `lifeTiles.ts`.
    expect(LIFE_TILE_DECK.map((tile) => tile.value)).toEqual(FRANCE_DECK.map((tile) => tile.value))
  })

  it('says everything in its own words — no country-board or sibling copy leaks through', () => {
    const elsewhere = new Set([
      ...FRANCE_DECK.map((tile) => tile.title),
      ...JAPAN_RESEARCHER_DECK.map((tile) => tile.title),
    ])
    expect(LIFE_TILE_DECK.filter((tile) => elsewhere.has(tile.title))).toEqual([])
  })

  it('has unique ids and titles', () => {
    expect(new Set(LIFE_TILE_DECK.map((t) => t.id)).size).toBe(LIFE_TILE_DECK.length)
    expect(new Set(LIFE_TILE_DECK.map((t) => t.title)).size).toBe(LIFE_TILE_DECK.length)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const tile of LIFE_TILE_DECK) expect(ALL_ICON_NAMES).toContain(tile.icon)
  })

  it('gives every tile a positive value roughly between €10,000 and €150,000', () => {
    for (const tile of LIFE_TILE_DECK) {
      expect(tile.value).toBeGreaterThanOrEqual(10_000)
      expect(tile.value).toBeLessThanOrEqual(150_000)
      expect(tile.title.length).toBeGreaterThan(0)
    }
  })

  describe('findLifeTile', () => {
    it('finds a tile by id in this edition', () => {
      const target = LIFE_TILE_DECK[0]!
      expect(findLifeTile(target.id, EDITION_RESEARCHER_FRANCE)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findLifeTile('not-a-real-tile', EDITION_RESEARCHER_FRANCE)).toBeUndefined()
    })
  })
})
