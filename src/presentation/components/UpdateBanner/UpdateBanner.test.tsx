import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { UpdateBanner } from './UpdateBanner'

const { useRegisterSWMock } = vi.hoisted(() => ({ useRegisterSWMock: vi.fn() }))

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: useRegisterSWMock,
}))

function renderBanner(): ReturnType<typeof render> {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <UpdateBanner />
    </AudioProvider>,
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('UpdateBanner', () => {
  it('shows nothing while no new build is waiting', () => {
    const updateServiceWorker = vi.fn()
    useRegisterSWMock.mockReturnValue({
      needRefresh: [false, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    })

    const { container } = renderBanner()

    expect(container).toBeEmptyDOMElement()
  })

  it('offers the update once a new service worker is waiting', () => {
    const updateServiceWorker = vi.fn()
    useRegisterSWMock.mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    })

    renderBanner()

    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument()
  })

  /**
   * `updateServiceWorker(true)` is what actually sends the waiting worker
   * `skipWaiting` and reloads once it has taken over — the one and only
   * moment any of this is allowed to touch the page a player is looking
   * at, and only because they themselves just clicked something.
   */
  it('hands control to the waiting service worker only when the player clicks update', async () => {
    const user = userEvent.setup()
    const updateServiceWorker = vi.fn()
    useRegisterSWMock.mockReturnValue({
      needRefresh: [true, vi.fn()],
      offlineReady: [false, vi.fn()],
      updateServiceWorker,
    })

    renderBanner()
    expect(updateServiceWorker).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: /update/i }))

    expect(updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('re-checks the registered service worker periodically while the tab stays open', () => {
    vi.useFakeTimers()
    try {
      const registration = { update: vi.fn().mockResolvedValue(undefined) } as unknown as ServiceWorkerRegistration
      let onRegisteredSW: ((url: string, reg: ServiceWorkerRegistration | undefined) => void) | undefined
      useRegisterSWMock.mockImplementation((options?: { onRegisteredSW?: typeof onRegisteredSW }) => {
        onRegisteredSW = options?.onRegisteredSW
        return { needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() }
      })

      renderBanner()
      onRegisteredSW?.('/sw.js', registration)

      expect(registration.update).not.toHaveBeenCalled()
      vi.advanceTimersByTime(5 * 60 * 1000)
      expect(registration.update).toHaveBeenCalledTimes(1)
    } finally {
      vi.useRealTimers()
    }
  })

  /**
   * A background tab is exactly where a browser's own automatic checks are
   * least reliable — switching back to it is also the single most likely
   * moment a player would actually want to know a new build landed while
   * they were away, rather than waiting out however much of the interval
   * above happens to be left.
   */
  it('re-checks immediately when a backgrounded tab is switched back to', () => {
    const registration = { update: vi.fn().mockResolvedValue(undefined) } as unknown as ServiceWorkerRegistration
    let onRegisteredSW: ((url: string, reg: ServiceWorkerRegistration | undefined) => void) | undefined
    useRegisterSWMock.mockImplementation((options?: { onRegisteredSW?: typeof onRegisteredSW }) => {
      onRegisteredSW = options?.onRegisteredSW
      return { needRefresh: [false, vi.fn()], offlineReady: [false, vi.fn()], updateServiceWorker: vi.fn() }
    })

    renderBanner()
    onRegisteredSW?.('/sw.js', registration)

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    document.dispatchEvent(new Event('visibilitychange'))

    expect(registration.update).toHaveBeenCalledTimes(1)
  })
})
