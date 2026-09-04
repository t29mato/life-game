import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpinValue } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { Wheel, type WheelProps } from './Wheel'

/*
 * What can and cannot be tested here, said plainly.
 *
 * jsdom has no layout engine and no compositor: it will happily run every
 * frame of the spin, but nothing is ever *drawn*, so nothing in this file can
 * check the one thing the wheel was built for — whether the deceleration
 * reads as tension, whether the ticker looks like it is straining, whether a
 * spin that dies against a peg makes anybody lean forward. That is a judgement
 * a person makes in a browser, and pretending otherwise with a test that
 * samples a transform and calls it "feel" would be worse than admitting it.
 *
 * What is testable is everything the feel is not allowed to cost: that the
 * wheel reports the domain's own value and reports it off its own geometry,
 * that the button is the screen's primary action and says what it is, that a
 * new turn stops the wheel claiming the last player's number, and that a
 * reduced-motion player is answered immediately rather than made to sit
 * through a mimed suspense. The physics has its own file
 * (`wheelPhysics.test.ts`), where the deceleration and the never-overshooting
 * *are* measured, because they are arithmetic.
 */

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function Harness(props: Partial<WheelProps> & { audio: ReturnType<typeof createFakeAudioPort> }) {
  const { audio, ...rest } = props
  return (
    <AudioProvider audio={audio}>
      <Wheel result={null} onSpin={() => {}} onSpinComplete={() => {}} spinDuration={0.05} {...rest} />
    </AudioProvider>
  )
}

/** The segment the ticker has come to rest in, read off the wheel's own
 *  settled angle rather than off the prop it was handed. */
function landedOn(container: HTMLElement): string | null {
  return container.querySelector('[data-landed]')?.getAttribute('data-landed') || null
}

describe('Wheel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls onSpin when the wheel is pressed', async () => {
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

  /**
   * The whole contract in one test. The store decided 5; the wheel has to
   * physically stop with its ticker in the 5, click past the pegs on the way,
   * and only then hand the turn back. `landedOn` reads the *drawing's*
   * opinion — if the animation ever came to rest somewhere else and the
   * component simply announced the prop, this is what would catch it.
   */
  it('turns to the domain’s value, clicks past the pegs, and reports where it actually stopped', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 5

    const { rerender, container } = render(<Harness audio={audio} onSpinComplete={onSpinComplete} />)
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={result} />)

    expect(screen.getByRole('button', { name: /spinning/i })).toBeDisabled()

    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(landedOn(container)).toBe(String(result))
    expect(screen.getByRole('status')).toHaveTextContent('Landed on 5')
    // A click at every peg the ticker passed, then the wheel dropping still.
    expect(audio.sfxLog.filter((sfx) => sfx === 'spin').length).toBeGreaterThan(10)
    expect(audio.sfxLog.at(-1)).toBe('spinStop')
  })

  /**
   * No motion, no suspense — and no pretending there was one. A reduced-motion
   * player gets the answer at once, standing in the middle of its segment,
   * with the ticker never having ridden a peg (so no clicks either).
   */
  it('settles at once and skips the clicks when reduced motion is preferred', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 4

    const { rerender, container } = render(<Harness audio={audio} onSpinComplete={onSpinComplete} />)
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={result} />)

    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1))
    expect(audio.sfxLog).toEqual(['confirm', 'spinStop'])
    expect(landedOn(container)).toBe(String(result))
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
    // wheel. If it does not, the parent never learns the wheel stopped and the
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
        <Harness audio={audio} onSpinComplete={onSpinComplete} result={3} />
      </StrictMode>,
    )

    // A restored game arrives with `lastSpin` already populated; the wheel
    // must sit still rather than replaying someone else's turn.
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(onSpinComplete).not.toHaveBeenCalled()
  })

  it('spins itself when a computer seat bumps the auto-spin token', async () => {
    mockReducedMotion(true)
    const onSpin = vi.fn()
    const onSpinComplete = vi.fn()
    const audio = createFakeAudioPort()

    const { rerender } = render(<Harness audio={audio} onSpin={onSpin} onSpinComplete={onSpinComplete} />)
    rerender(<Harness audio={audio} onSpin={onSpin} onSpinComplete={onSpinComplete} autoSpinToken={1} />)
    expect(onSpin).toHaveBeenCalledTimes(1)

    rerender(
      <Harness audio={audio} onSpin={onSpin} onSpinComplete={onSpinComplete} autoSpinToken={1} result={2} />,
    )
    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1))
  })

  /**
   * The reported bug (issue #23): the board's wheel is one object that
   * outlives every turn taken with it, and `result` is whatever the store last
   * spun — so the next player arrived at a die still showing the previous
   * player's number and read it as their own.
   *
   * A wheel cannot be blanked the way a die could be turned over: its ticker
   * is always resting in *some* segment, and moving it would be a lie about a
   * physical object. So what a new turn retires is the *claim* — the winning
   * segment stops being lit and the announcement stops naming a number.
   */
  it('stops claiming the last player’s number when the shell hands it a new turn', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const audio = createFakeAudioPort()
    const onSpinComplete = vi.fn()

    const { rerender, container } = render(
      <Harness audio={audio} onSpinComplete={onSpinComplete} resetKey="turn-1" />,
    )
    await user.click(screen.getByRole('button', { name: /spin/i }))
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={6} resetKey="turn-1" />)
    await waitFor(() => expect(onSpinComplete).toHaveBeenCalledTimes(1))
    expect(landedOn(container)).toBe('6')

    // The next turn opens. `result` has not changed — the store still holds
    // last turn's 6 — so nothing but this key can retire it.
    rerender(<Harness audio={audio} onSpinComplete={onSpinComplete} result={6} resetKey="turn-2" />)

    expect(landedOn(container)).toBeNull()
    expect(screen.getByRole('button', { name: 'Spin' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  /**
   * The other half of the same report: a wheel that is merely sitting there
   * says nothing about being what the game is waiting for. It names both ways
   * in — but only while the press is genuinely its own.
   */
  it('asks to be spun while it is the screen’s next input, and not otherwise', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()

    const { rerender } = render(<Harness audio={audio} primary />)
    expect(screen.getByText(/click to spin/i)).toBeInTheDocument()

    // A wheel on screen but not the screen's business — the board's, under a
    // modal — must not advertise a key that would not reach it.
    rerender(<Harness audio={audio} />)
    expect(screen.queryByText(/click to spin/i)).not.toBeInTheDocument()

    rerender(<Harness audio={audio} primary disabled />)
    expect(screen.queryByText(/click to spin/i)).not.toBeInTheDocument()
  })

  it('prints all six segments, each numbered, with a peg between every pair', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const { container } = render(<Harness audio={audio} />)
    for (const face of [1, 2, 3, 4, 5, 6] as const) {
      expect(container.querySelector(`[data-face="${face}"]`)?.textContent).toBe(String(face))
    }
    // Nothing has been spun, so nothing is claimed — the wheel is pointing
    // somewhere, as a wheel must, and saying nothing about it.
    expect(landedOn(container)).toBeNull()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })
})
