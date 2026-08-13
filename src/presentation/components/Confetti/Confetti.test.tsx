import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Confetti } from './Confetti'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

describe('Confetti', () => {
  beforeEach(() => {
    mockReducedMotion(false)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('renders nothing on mount before any burst is requested', () => {
    render(<Confetti burstKey={0} />)
    expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
  })

  it('bursts when burstKey changes', () => {
    const { rerender } = render(<Confetti burstKey={0} />)
    rerender(<Confetti burstKey={1} />)
    expect(screen.getByTestId('confetti-field')).toBeInTheDocument()
  })

  it('clears itself after the burst finishes', () => {
    vi.useFakeTimers()
    const { rerender } = render(<Confetti burstKey={0} />)
    rerender(<Confetti burstKey={1} />)
    expect(screen.getByTestId('confetti-field')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(2300)
    })
    expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
  })

  it('never renders anything when reduced motion is preferred', () => {
    mockReducedMotion(true)
    const { rerender } = render(<Confetti burstKey={0} />)
    rerender(<Confetti burstKey={1} />)
    expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
  })
})
