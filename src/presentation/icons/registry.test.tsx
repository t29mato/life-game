import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ALL_ICON_NAMES } from '@domain/model/icons'
import { createBoard } from '@domain/board/createBoard'
import { BASIC_CAREERS, GRADUATE_CAREERS } from '@domain/edition/usa'
import { HOUSES } from '@domain/edition/usa'
import { LIFE_TILE_DECK } from '@domain/edition/usa'

import { glyphArt } from './art/glyphs'
import { categoryOf } from './categories'
import { GameIcon } from './GameIcon'
import { iconRegistry } from './registry'

describe('icon registry', () => {
  it('has a drawing for every name the domain can ask for', () => {
    const missing = ALL_ICON_NAMES.filter((name) => !iconRegistry[name])
    expect(missing).toEqual([])
  })

  it('has no drawings the domain never asks for', () => {
    const known = new Set<string>(ALL_ICON_NAMES)
    const orphans = Object.keys(iconRegistry).filter((name) => !known.has(name))
    expect(orphans).toEqual([])
  })

  it('covers every space, career, house, and life tile in the game', () => {
    const used = [
      ...Object.values(createBoard().spaces).map((s) => s.icon),
      ...[...BASIC_CAREERS, ...GRADUATE_CAREERS].map((c) => c.icon),
      ...HOUSES.map((h) => h.icon),
      ...LIFE_TILE_DECK.map((t) => t.icon),
    ]

    for (const name of used) {
      expect(iconRegistry[name], `no drawing for "${name}"`).toBeDefined()
    }
  })

  it('renders every drawing without throwing', () => {
    for (const name of ALL_ICON_NAMES) {
      const { container, unmount } = render(<GameIcon name={name} />)
      expect(container.querySelector('svg'), `"${name}" drew nothing`).toBeInTheDocument()
      unmount()
    }
  })

  it('maps every name onto a category with a glyph', () => {
    const unmapped = ALL_ICON_NAMES.filter((name) => !glyphArt[categoryOf[name]])
    expect(unmapped).toEqual([])
  })

  it('keeps the small-size vocabulary small enough to read at tile size', () => {
    expect(Object.keys(glyphArt).length).toBeLessThanOrEqual(16)
  })

  it('renders every category glyph at small sizes without throwing', () => {
    for (const name of ALL_ICON_NAMES) {
      const { container, unmount } = render(<GameIcon name={name} size={16} />)
      expect(container.querySelector('svg'), `"${name}" drew no glyph`).toBeInTheDocument()
      unmount()
    }
  })

  it('labels an icon for assistive technology only when given a title', () => {
    const labelled = render(<GameIcon name="space:payday" title="Payday" />)
    expect(labelled.container.querySelector('svg')).toHaveAttribute('aria-label', 'Payday')
    labelled.unmount()

    const decorative = render(<GameIcon name="space:payday" />)
    expect(decorative.container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
