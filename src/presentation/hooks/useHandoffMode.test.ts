import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useHandoffMode } from './useHandoffMode'

describe('useHandoffMode', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    window.localStorage.clear()
  })

  it('defaults to auto — the card only when the device changes hands', () => {
    const { result } = renderHook(() => useHandoffMode())
    expect(result.current[0]).toBe('auto')
  })

  it('remembers a table that asked for the card every turn', () => {
    const first = renderHook(() => useHandoffMode())
    act(() => first.result.current[1]('always'))
    expect(first.result.current[0]).toBe('always')

    // A fresh mount reads the same preference back off the device.
    const second = renderHook(() => useHandoffMode())
    expect(second.result.current[0]).toBe('always')
  })

  it('treats anything it does not recognise as auto', () => {
    window.localStorage.setItem('life-journey:handoff-mode', 'sometimes')
    const { result } = renderHook(() => useHandoffMode())
    expect(result.current[0]).toBe('auto')
  })

  /*
   * `localStorage` does not politely return null in a private window or an
   * embedding that blocks storage — it throws. A preference about when to
   * show a card is not worth taking the game down over, so it degrades to
   * a setting that works for this session and is forgotten after it.
   */
  it('survives storage being unavailable, in both directions', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('denied')
    })

    const { result } = renderHook(() => useHandoffMode())
    expect(result.current[0]).toBe('auto')
    act(() => result.current[1]('always'))
    expect(result.current[0]).toBe('always')
  })
})
