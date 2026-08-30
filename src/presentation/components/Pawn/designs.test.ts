import { describe, expect, it } from 'vitest'
import { PLAYER_COLORS } from './designs'

describe('the design catalogue', () => {
  it('offers each colour exactly once', () => {
    expect(new Set(PLAYER_COLORS).size).toBe(PLAYER_COLORS.length)
  })

  it('keeps the original six colours first, in their historical order', () => {
    // Existing tables know "Player 1 is red, Player 2 is blue" by heart;
    // growing the tray must not reshuffle the front of it.
    expect(PLAYER_COLORS.slice(0, 6)).toEqual(['red', 'blue', 'green', 'yellow', 'purple', 'orange'])
  })
})
