import { StrictMode } from 'react'
import { render, cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBackDismiss } from './useBackDismiss'

function Overlay({ onClose }: { onClose: () => void }) {
  useBackDismiss(onClose)
  return null
}

beforeEach(() => {
  // jsdom's `history.back()` never actually lands (no async navigation task
  // ever runs to update `history.state`), so a marker left behind by one
  // test's real, unmocked push would otherwise read as already-present to
  // the next test's mount. Real browsers don't have this problem — only
  // the test double does.
  history.replaceState(null, '')
})

afterEach(async () => {
  cleanup()
  // A test that never explicitly waited out its own deferred pop (see the
  // hook's doc comment) leaves that `setTimeout(0)` pending — draining it
  // here keeps it from firing during a *later* test, where a real
  // `history.back()` call could land on a component that test never meant
  // it for.
  await new Promise((resolve) => setTimeout(resolve, 0))
  vi.restoreAllMocks()
})

describe('useBackDismiss', () => {
  it('pushes a history entry on mount', () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    render(<Overlay onClose={() => {}} />)

    expect(pushState).toHaveBeenCalledTimes(1)
  })

  it('calls onClose when the browser back button fires a popstate', () => {
    const onClose = vi.fn()
    render(<Overlay onClose={onClose} />)

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('consumes its own history entry on unmount when closed some other way', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const { unmount } = render(<Overlay onClose={() => {}} />)

    unmount()
    // The pop is deferred a tick — see the doc comment on the hook.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(back).toHaveBeenCalledTimes(1)
  })

  it('does not consume history a second time when the back button already closed it', async () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {})
    const onClose = vi.fn()
    const { unmount } = render(<Overlay onClose={onClose} />)

    window.dispatchEvent(new PopStateEvent('popstate'))
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onClose).toHaveBeenCalledTimes(1)
    expect(back).not.toHaveBeenCalled()
  })

  /**
   * StrictMode (dev only) runs mount, its cleanup, and mount again, all
   * synchronously in the same tick, to flush out effects that assume they
   * only ever run once. A naive version of this hook pushed a second history
   * entry on the second mount, or fired a stray `history.back()` whose late
   * `popstate` the still-listening second mount read as a real back press —
   * either way the screen this hook backs closed itself instantly, unopened
   * in effect.
   */
  it('survives StrictMode double-invoking its effect as a no-op', async () => {
    const pushState = vi.spyOn(window.history, 'pushState')
    const back = vi.spyOn(window.history, 'back')
    const onClose = vi.fn()

    render(
      <StrictMode>
        <Overlay onClose={onClose} />
      </StrictMode>,
    )
    // Long enough for a stray deferred pop to have fired, had the second
    // mount not cancelled it.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(pushState).toHaveBeenCalledTimes(1)
    expect(back).not.toHaveBeenCalled()
    expect(onClose).not.toHaveBeenCalled()
  })
})
