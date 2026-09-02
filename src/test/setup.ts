import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

import { markBoardLegendSeen } from '@presentation/components/BoardLegend/seen'

/**
 * The board's key is a once-in-a-lifetime card: it goes up over the board on
 * a player's very first game and never again. In a fresh jsdom every test is
 * a first game, so without this every test that mounts the app would open
 * with a modal it never asked for.
 *
 * Marked seen by default, and any test that actually cares about the card
 * clears the flag itself — the same shape as starting a game on a browser
 * that has played before, which is what almost every test is really about.
 */
beforeEach(() => {
  markBoardLegendSeen()
})
