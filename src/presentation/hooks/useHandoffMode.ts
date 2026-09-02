import { useCallback, useState } from 'react'

/**
 * How the game should open a turn.
 *
 * `'auto'` — the default — shows the full "I'm ready" card only when the
 * device genuinely has to change hands, and announces every other turn with a
 * banner nobody has to press. `'always'` restores the old behaviour: every
 * human turn opens on the card.
 *
 * Two values rather than a boolean because the third possible answer
 * ("never ask, even between two people") is one nobody should be able to
 * choose by accident: it hands the next player's screen to whoever is still
 * holding the device, which is the exact failure the card exists to prevent.
 */
export type HandoffMode = 'auto' | 'always'

const STORAGE_KEY = 'life-journey:handoff-mode'

/**
 * Read once, lazily, and defensively. `localStorage` throws outright rather
 * than returning null in a Safari private window and in any embedding that
 * blocks storage, and a preference about *when to show a card* is not worth
 * taking the whole game down over.
 */
function readMode(): HandoffMode {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'always' ? 'always' : 'auto'
  } catch {
    return 'auto'
  }
}

/**
 * The turn-opening preference, persisted per device.
 *
 * Per *device* and not per save, deliberately: it describes the table this
 * game is being played at — one screen being passed around, or one person
 * with the computer seats — and that is a property of where you are sitting,
 * not of the game you happen to have loaded.
 */
export function useHandoffMode(): readonly [HandoffMode, (mode: HandoffMode) => void] {
  const [mode, setMode] = useState<HandoffMode>(readMode)

  const update = useCallback((next: HandoffMode): void => {
    setMode(next)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // A preference that cannot be remembered still has to work for the rest
      // of this session, so the state above stands regardless.
    }
  }, [])

  return [mode, update]
}
