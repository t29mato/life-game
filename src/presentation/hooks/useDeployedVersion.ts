import { useEffect, useState } from 'react'

/** How often to poll once the page has settled. */
const CHECK_INTERVAL_MS = 5 * 60 * 1000
/** First check, once — soon enough to catch a tab reopened onto a stale
 *  cache, but after the page's own load traffic has had a moment to clear. */
const FIRST_CHECK_DELAY_MS = 10_000

const MODULE_SCRIPT_SRC = /<script[^>]+type="module"[^>]+src="([^"]+)"/

/** The bundle this page is actually running, read off its own `<script>` tag. */
function runningBundleSrc(): string | null {
  return document.querySelector('script[type="module"]')?.getAttribute('src') ?? null
}

/**
 * True once the page currently loaded and the page GitHub Pages would now
 * serve disagree on which JS bundle to run.
 *
 * A single-page app never re-fetches its own `index.html` once loaded — the
 * only way a tab left open (or one just re-focused after a while) finds out
 * a new version shipped is by asking. This re-fetches the same URL the page
 * itself was loaded from, `cache: 'no-store'` so a stale browser cache entry
 * can't hide a real deploy, and compares the `<script type="module">` src it
 * points at against the one already running. It never reloads anything
 * itself — see `App.tsx` for why that has to wait for a safe moment.
 */
export function useDeployedVersion(): boolean {
  const [staleBuild, setStaleBuild] = useState(false)

  useEffect(() => {
    const running = runningBundleSrc()
    if (!running) return

    let cancelled = false
    const check = async (): Promise<void> => {
      try {
        const res = await fetch(window.location.href, { cache: 'no-store' })
        if (!res.ok) return
        const html = await res.text()
        const latest = MODULE_SCRIPT_SRC.exec(html)?.[1]
        if (!cancelled && latest && latest !== running) setStaleBuild(true)
      } catch {
        // Offline, or the request was blocked — quietly try again next tick.
      }
    }

    const firstCheck = window.setTimeout(check, FIRST_CHECK_DELAY_MS)
    const timer = window.setInterval(check, CHECK_INTERVAL_MS)
    const onVisible = (): void => {
      if (document.visibilityState === 'visible') void check()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      cancelled = true
      window.clearTimeout(firstCheck)
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return staleBuild
}
