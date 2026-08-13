import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpinValue } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { Spinner, type SpinnerProps } from './Spinner'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function Harness(props: Partial<SpinnerProps> & { audio: ReturnType<typeof createFakeAudioPort> }) {
  const { audio, ...rest } = props
  return (
    <AudioProvider audio={audio}>
      <Spinner
        result={null}
        onSpin={() => {}}
        onSpinComplete={() => {}}
        spinDuration={0.02}
        settleDuration={0.02}
        {...rest}
      />
    </AudioProvider>
  )
}

describe('Spinner', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders all ten wedge numbers', () => {
    mockReducedMotion(false)
    const audio = createFakeAudioPort()
    render(<Harness audio={audio} />)
    for (let n = 1; n <= 10; n++) {
      expect(screen.getByText(String(n))).toBeInTheDocument()
    }
  })

  it('calls onSpin when the spin button is pressed', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onSpin = vi.fn()
    const audio = createFakeAudioPort()
    render(<Harness audio={audio} onSpin={onSpin} />)

    await user.click(screen.getByRole('button', { name: /spin/i }))
    expect(onSpin).toHaveBeenCalledTimes(1)
  })

  it('does not call onSpin when disabled', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onSpin = vi.fn()
    const audio = createFakeAudioPort()
    render(<Harness audio={audio} onSpin={onSpin} disabled />)

    await user.click(screen.getByRole('button', { name: /spin/i }))
    expect(onSpin).not.toHaveBeenCalled()
  })

  it('animates to the result, ticks, plays spinStop, and calls onSpinComplete', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 7

    const { rerender } = render(<Harness audio={audio} onSpinComplete={onSpinComplete} />)
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={result} />)

    expect(screen.getByRole('button', { name: /spinning/i })).toBeDisabled()

    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(audio.sfxLog).toContain('spinStop')
    expect(audio.sfxLog).toContain('spin')
  })

  it('lands instantly and skips ticks when reduced motion is preferred', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 4

    const { rerender } = render(<Harness audio={audio} onSpinComplete={onSpinComplete} />)
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={result} />)

    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1))
    expect(audio.sfxLog).toEqual(['confirm', 'spinStop'])
  })

  it('completes again when the store reports the same number twice in a row', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 6

    const { rerender } = render(<Harness audio={audio} onSpinComplete={onSpinComplete} />)
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={result} />)
    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1))

    // `result` is unchanged, so nothing but the press itself can re-arm the
    // wheel. If it does not, the parent never learns the wheel landed and the
    // whole play loop stalls.
    await user.click(screen.getByRole('button', { name: /spin/i }))
    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(2))
  })

  /**
   * StrictMode runs every effect twice — mount, clean up, mount again — to
   * surface exactly this class of bug. The wheel animates asynchronously, so
   * the first pass is cancelled by its own cleanup; if arming is consumed by
   * that cancelled pass, the second never animates and `onSpinComplete` is
   * never called. The app renders inside StrictMode, so this froze every spin.
   */
  it('still reports completion when effects are double-invoked (StrictMode)', async () => {
    const user = userEvent.setup()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()

    const { rerender } = render(
      <StrictMode>
        <Harness audio={audio} onSpinComplete={onSpinComplete} />
      </StrictMode>,
    )
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(
      <StrictMode>
        <Harness audio={audio} onSpinComplete={onSpinComplete} result={4} />
      </StrictMode>,
    )

    await waitFor(() => expect(onSpinComplete).toHaveBeenCalled())
  })

  it('does not spin by itself when mounted with a result already set', async () => {
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()

    render(
      <StrictMode>
        <Harness audio={audio} onSpinComplete={onSpinComplete} result={9} />
      </StrictMode>,
    )

    // A restored game arrives with `lastSpin` already populated; the wheel must
    // sit still rather than replaying someone else's turn.
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(onSpinComplete).not.toHaveBeenCalled()
  })
})
