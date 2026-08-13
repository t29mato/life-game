import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function mockMatchMedia(initialMatches: boolean): {
  listeners: Set<() => void>
  setMatches: (matches: boolean) => void
} {
  const listeners = new Set<() => void>()
  let matches = initialMatches

  const mql: Partial<MediaQueryList> = {
    get matches() {
      return matches
    },
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_event: string, listener: unknown) => {
      listeners.add(listener as () => void)
    },
    removeEventListener: (_event: string, listener: unknown) => {
      listeners.delete(listener as () => void)
    },
  }

  window.matchMedia = vi.fn().mockReturnValue(mql)

  return {
    listeners,
    setMatches: (next: boolean) => {
      matches = next
    },
  }
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns false when the OS has no reduced-motion preference', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when the OS prefers reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('updates live when the media query changes', () => {
    const { listeners, setMatches } = mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)

    act(() => {
      setMatches(true)
      listeners.forEach((listener) => listener())
    })

    expect(result.current).toBe(true)
  })
})
