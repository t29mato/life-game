import { describe, expect, it } from 'vitest'
import { ALL_ICON_NAMES } from '../../model/icons'
import { LIFE_TILE_DECK } from './lifeTiles'
import { EDITION_BOLIVIA } from './index'
import { findLifeTile } from '../lookup'

describe('bolivia life tile deck', () => {
  it('has at least 36 tiles, so a long game rarely draws the same story twice', () => {
    expect(LIFE_TILE_DECK.length).toBeGreaterThanOrEqual(36)
  })

  it('has unique titles', () => {
    const titles = LIFE_TILE_DECK.map((tile) => tile.title)
    expect(new Set(titles).size).toBe(titles.length)
  })

  it('only names art the icon registry can actually draw', () => {
    for (const tile of LIFE_TILE_DECK) {
      expect(ALL_ICON_NAMES).toContain(tile.icon)
    }
  })

  it('has unique ids', () => {
    const ids = LIFE_TILE_DECK.map((tile) => tile.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('gives every tile a positive value roughly between Bs 10,000 and Bs 150,000', () => {
    for (const tile of LIFE_TILE_DECK) {
      expect(tile.value).toBeGreaterThanOrEqual(10_000)
      expect(tile.value).toBeLessThanOrEqual(150_000)
    }
  })

  it('gives every tile a title and icon', () => {
    for (const tile of LIFE_TILE_DECK) {
      expect(tile.title.length).toBeGreaterThan(0)
      expect(tile.icon.length).toBeGreaterThan(0)
    }
  })

  describe('findLifeTile', () => {
    it('finds a tile by id in the bolivia edition', () => {
      const target = LIFE_TILE_DECK[0]!
      expect(findLifeTile(target.id, EDITION_BOLIVIA)).toEqual(target)
    })

    it('returns undefined for an unknown id', () => {
      expect(findLifeTile('not-a-real-tile', EDITION_BOLIVIA)).toBeUndefined()
    })
  })
})
