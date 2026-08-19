import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useDeployedVersion } from './useDeployedVersion'

function htmlFor(bundleSrc: string): string {
  return `<!doctype html><html><head><script type="module" crossorigin src="${bundleSrc}"></script></head><body></body></html>`
}

function mockFetchReturning(bundleSrc: string): ReturnType<typeof vi.fn> {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    text: () => Promise.resolve(htmlFor(bundleSrc)),
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('useDeployedVersion', () => {
  let script: HTMLScriptElement

  beforeEach(() => {
    vi.useFakeTimers()
    script = document.createElement('script')
    script.type = 'module'
    script.src = '/life-game/assets/index-AAAAAA.js'
    document.head.appendChild(script)
  })

  afterEach(() => {
    document.head.removeChild(script)
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('stays false when the deployed bundle still matches the running one', async () => {
    mockFetchReturning('/life-game/assets/index-AAAAAA.js')
    const { result } = renderHook(() => useDeployedVersion())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    expect(result.current).toBe(false)
  })

  it('flips true once the deployed bundle points at a different file', async () => {
    mockFetchReturning('/life-game/assets/index-BBBBBB.js')
    const { result } = renderHook(() => useDeployedVersion())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    expect(result.current).toBe(true)
  })

  it('checks again the moment a hidden tab becomes visible, not just on the interval', async () => {
    const fetchMock = mockFetchReturning('/life-game/assets/index-AAAAAA.js')
    renderHook(() => useDeployedVersion())
    // Let the effect's listeners attach.
    await act(async () => {
      await vi.advanceTimersByTimeAsync(0)
    })
    fetchMock.mockClear()

    Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true })
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
      await vi.advanceTimersByTimeAsync(0)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('quietly tries again next tick when the check fails, rather than throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    const { result } = renderHook(() => useDeployedVersion())

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000)
    })

    expect(result.current).toBe(false)
  })
})
