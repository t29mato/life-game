import { describe, expect, it } from 'vitest'
import { DEFAULT_DRIVER_FACE, DRIVER_FACES, PLAYER_COLORS, faceLabel } from './designs'

describe('the design catalogue', () => {
  it('offers each colour and face exactly once', () => {
    expect(new Set(PLAYER_COLORS).size).toBe(PLAYER_COLORS.length)
    expect(new Set(DRIVER_FACES).size).toBe(DRIVER_FACES.length)
  })

  it('leads every tray with the default, so "no choice" and "first option" agree', () => {
    expect(DRIVER_FACES[0]).toBe(DEFAULT_DRIVER_FACE)
  })

  it('keeps the original six colours first, in their historical order', () => {
    // Existing tables know "Player 1 is red, Player 2 is blue" by heart;
    // growing the tray must not reshuffle the front of it.
    expect(PLAYER_COLORS.slice(0, 6)).toEqual(['red', 'blue', 'green', 'yellow', 'purple', 'orange'])
  })

  it('has a spoken name for every face', () => {
    for (const face of DRIVER_FACES) {
      expect(faceLabel(face)).toMatch(/\S/)
    }
  })

  it('never repeats a spoken name — a picker of twins is unusable by ear', () => {
    const spoken = DRIVER_FACES.map(faceLabel)
    expect(new Set(spoken).size).toBe(spoken.length)
  })
})
