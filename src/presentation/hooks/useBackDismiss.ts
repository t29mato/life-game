import { useEffect, useRef } from 'react'

const MARKER = '__lifeJourneyOverlay'

function hasMarker(): boolean {
  const state = history.state as Record<string, unknown> | null
  return typeof state === 'object' && state !== null && state[MARKER] === true
}

/**
 * Gives a full-screen overlay its own stop on the browser's back button —
 * pressing back (or an OS back gesture) closes the screen and returns to
 * whatever was showing underneath, rather than leaving the game entirely,
 * which is what happened when a screen with no history entry of its own let
 * a back press fall straight through to the page before it.
 *
 * Mount pushes one history entry; a real `popstate` (the back button) calls
 * `onClose`. Unmounting for any other reason — a "Back to title" button
 * inside the screen — consumes that same entry so the stack never carries a
 * dead one, and a second back press is never spent closing nothing.
 *
 * The pop is deferred a tick rather than called straight from cleanup, and
 * cancelled if a new mount claims it first. `history.back()` does not take
 * effect the instant it is called — the actual navigation, and the
 * `popstate` it fires, land at least a tick later regardless — so React
 * StrictMode's dev-only mount → clean up → mount, all synchronous, would
 * otherwise still have a pop in flight when the second mount believes the
 * entry is its own to keep. That stray pop's `popstate` would arrive after
 * the second mount had already attached its own listener, and get read as
 * a real back press closing a screen the player never actually backed out
 * of. Deferring costs nothing in the one-mount case a real unmount always
 * is, and gives the phantom remount before it a tick to cancel it in.
 */
export function useBackDismiss(onClose: () => void): void {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const pendingPopRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (pendingPopRef.current !== null) {
      clearTimeout(pendingPopRef.current)
      pendingPopRef.current = null
    } else if (!hasMarker()) {
      history.pushState({ [MARKER]: true }, '')
    }

    let dismissedByPopState = false
    const handlePopState = (): void => {
      dismissedByPopState = true
      onCloseRef.current()
    }
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (!dismissedByPopState && hasMarker()) {
        pendingPopRef.current = setTimeout(() => {
          pendingPopRef.current = null
          history.back()
        }, 0)
      }
    }
  }, [])
}
