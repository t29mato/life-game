import { useCallback, type ReactElement } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import styles from './UpdateBanner.module.css'

/** How often to ask the browser to re-check for a newer service worker while a tab stays open. */
const UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000

/**
 * The one place a newer build ever gets to interrupt anything — and even
 * then only by asking. `registerType: 'prompt'` (see `vite.config.ts`)
 * means a new service worker, and the freshly revisioned precache that
 * comes with it, sits waiting rather than taking over the instant it
 * finishes downloading; this is what turns that wait into something a
 * player can actually see and act on, rather than a tab quietly running a
 * build that already stopped shipping fixes for whatever it was that sent
 * them looking in the first place.
 *
 * A registered service worker never re-checks its own script on its own —
 * a browser's *own* automatic check, on navigation, turned out not to be
 * reliable enough on its own either, confirmed by hand against a real
 * deploy landing while a tab stayed open (see the PR this shipped in for
 * how). So this asks again itself: periodically for as long as the tab
 * stays open, and again the moment a backgrounded tab is switched back to
 * — the two moments a stale build is most likely to have gone unnoticed.
 */
export function UpdateBanner(): ReactElement | null {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = (): void => {
        void registration.update()
      }
      window.setInterval(check, UPDATE_CHECK_INTERVAL_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  const handleUpdate = useCallback(() => {
    void updateServiceWorker(true)
  }, [updateServiceWorker])

  if (!needRefresh) return null

  return (
    <div className={styles.banner} role="status">
      <p className={styles.text}>A new version is ready.</p>
      <ChunkyButton variant="primary" size="sm" icon="replay" onClick={handleUpdate}>
        Update
      </ChunkyButton>
    </div>
  )
}
