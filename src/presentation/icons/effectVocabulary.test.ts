import { describe, expect, it } from 'vitest'

import { createBoard } from '@domain/board/createBoard'
import { allEditions } from '@domain/edition/registry'
import type { Difficulty, Space } from '@domain/model/types'
import { effectSign } from '@domain/rules/effectSign'

import { categoryOf } from './categories'
import { GLYPHS_FOR_EFFECT, glyphsForEffect } from './effectVocabulary'

const DIFFICULTIES: readonly Difficulty[] = ['normal', 'hard', 'veryHard']

/**
 * Every tile the game can ever print, once each: five countries × three
 * difficulties, since `appearsFrom` puts tiles on the hard boards that the
 * normal one never shows.
 */
function everyTile(): readonly (readonly [string, Space])[] {
  const seen = new Set<string>()
  const tiles: (readonly [string, Space])[] = []
  for (const edition of allEditions()) {
    for (const difficulty of DIFFICULTIES) {
      for (const space of Object.values(createBoard(difficulty, edition).spaces)) {
        const key = `${edition.id}:${space.id}`
        if (seen.has(key)) continue
        seen.add(key)
        tiles.push([`${edition.id} / ${space.title} (${space.id})`, space])
      }
    }
  }
  return tiles
}

describe('the board’s icon vocabulary', () => {
  it('draws a picture on every tile that predicts what the tile does', () => {
    const lies = everyTile()
      .filter(([, space]) => !glyphsForEffect(space.effect).includes(categoryOf[space.icon]))
      .map(
        ([where, space]) =>
          `${where}: "${space.icon}" draws the ${categoryOf[space.icon]} glyph, but the tile’s effect is ` +
          `${space.effect.type} — allowed: ${glyphsForEffect(space.effect).join(', ')}`,
      )

    expect(lies).toEqual([])
  })

  /*
   * The sharpest half of the rule above, kept as its own test because it is
   * the one a playtester actually caught: a mark that promises money in on a
   * tile that takes money out, or the reverse. If this fails, the tile is
   * telling a player the opposite of the truth.
   */
  it('never points the money arrow the wrong way', () => {
    const inverted = everyTile()
      .filter(([, space]) => {
        const glyph = categoryOf[space.icon]
        const sign = effectSign(space.effect)
        if (glyph === 'gain' || glyph === 'payday') return sign === 'cost'
        if (glyph === 'expense' || glyph === 'hazard') return sign === 'gain' || sign === 'neutral'
        return false
      })
      .map(([where, space]) => `${where}: ${categoryOf[space.icon]} glyph on a ${space.effect.type} tile`)

    expect(inverted).toEqual([])
  })

  it('keeps the coin for payday and the bank for the bank', () => {
    for (const [where, space] of everyTile()) {
      if (space.effect.type === 'payday') {
        expect(categoryOf[space.icon], `${where} is a payday`).toBe('payday')
      }
      if (space.effect.type === 'bank') {
        expect(categoryOf[space.icon], `${where} is the bank`).toBe('bank')
      }
    }
  })

  it('states a vocabulary for every effect the domain can put on a tile', () => {
    for (const [where, space] of everyTile()) {
      expect(
        GLYPHS_FOR_EFFECT[space.effect.type],
        `no glyphs are allowed for "${space.effect.type}" (${where})`,
      ).toBeDefined()
      expect(GLYPHS_FOR_EFFECT[space.effect.type].length).toBeGreaterThan(0)
    }
  })
})
