const SEEN_KEY = 'life-journey:legend-seen'

/**
 * Whether this browser has already been shown the key to the board.
 *
 * Deliberately not a field on the save file: it is about the person, not the
 * game, and somebody starting their second game has not forgotten what a coin
 * means. Kept in its own module, free of React, so the test setup can mark it
 * seen without dragging a component tree into every suite.
 *
 * Every access is wrapped. A browser with storage switched off should show the
 * card every game rather than refuse to start one.
 */
export function hasSeenBoardLegend(): boolean {
  try {
    return localStorage.getItem(SEEN_KEY) === 'yes'
  } catch {
    return false
  }
}

export function markBoardLegendSeen(): void {
  try {
    localStorage.setItem(SEEN_KEY, 'yes')
  } catch {
    // A browser that will not remember is a browser that gets told twice.
  }
}

/** Test-only: put the browser back to never having seen the card. */
export function forgetBoardLegend(): void {
  try {
    localStorage.removeItem(SEEN_KEY)
  } catch {
    // Nothing to forget.
  }
}
