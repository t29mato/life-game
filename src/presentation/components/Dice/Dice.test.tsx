import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { SpinValue } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { Dice, type DiceProps } from './Dice'
import { pipsFor } from './diceFaces'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function Harness(props: Partial<DiceProps> & { audio: ReturnType<typeof createFakeAudioPort> }) {
  const { audio, ...rest } = props
  return (
    <AudioProvider audio={audio}>
      <Dice
        result={null}
        onRoll={() => {}}
        onRollComplete={() => {}}
        rollDuration={0.02}
        settleDuration={0.02}
        {...rest}
      />
    </AudioProvider>
  )
}

/** The face the cube has come to rest pointing at the viewer. */
function shownFace(container: HTMLElement): string | null {
  return container.querySelector('[data-shown-face]')?.getAttribute('data-shown-face') ?? null
}

/** How many pips one face of the cube prints, counted off its drawing. */
function pipCount(container: HTMLElement, face: SpinValue): number {
  // Three circles per pip: the rim shadow, the lit bowl, and the dark disc.
  return container.querySelectorAll(`[data-face="${face}"] circle`).length / 3
}

describe('Dice', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls onRoll when the die is pressed', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onRoll = vi.fn()
    const audio = createFakeAudioPort()
    render(<Harness audio={audio} onRoll={onRoll} />)

    await user.click(screen.getByRole('button', { name: /roll/i }))
    expect(onRoll).toHaveBeenCalledTimes(1)
  })

  it('does not call onRoll when disabled', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onRoll = vi.fn()
    const audio = createFakeAudioPort()
    render(<Harness audio={audio} onRoll={onRoll} disabled />)

    await user.click(screen.getByRole('button', { name: /roll/i }))
    expect(onRoll).not.toHaveBeenCalled()
  })

  it('tumbles to the result, ticks, plays spinStop, and calls onRollComplete', async () => {
    mockReducedMotion(false)
    const user = userEvent.setup()
    const onRollComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 5

    const { rerender, container } = render(<Harness audio={audio} onRollComplete={onRollComplete} />)
    await user.click(screen.getByRole('button', { name: /roll/i }))
    rerender(<Harness audio={audio} onRollComplete={onRollComplete} result={result} />)

    expect(screen.getByRole('button', { name: /rolling/i })).toBeDisabled()

    await waitFor(() => expect(onRollComplete).toHaveBeenCalledTimes(1), { timeout: 3000 })
    expect(audio.sfxLog).toContain('spinStop')
    expect(audio.sfxLog).toContain('spin')
    // And it comes to rest showing the number it was asked to land on, which
    // is the one thing a die animation is actually for.
    expect(shownFace(container)).toBe(String(result))
    expect(screen.getByRole('status')).toHaveTextContent('Rolled a 5')
  })

  it('lands instantly and skips ticks when reduced motion is preferred', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onRollComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 4

    const { rerender, container } = render(<Harness audio={audio} onRollComplete={onRollComplete} />)
    await user.click(screen.getByRole('button', { name: /roll/i }))
    rerender(<Harness audio={audio} onRollComplete={onRollComplete} result={result} />)

    await waitFor(() => expect(onRollComplete).toHaveBeenCalledTimes(1))
    expect(audio.sfxLog).toEqual(['confirm', 'spinStop'])
    expect(shownFace(container)).toBe(String(result))
  })

  it('completes again when the store reports the same number twice in a row', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onRollComplete = vi.fn()
    const audio = createFakeAudioPort()
    const result: SpinValue = 6

    const { rerender } = render(<Harness audio={audio} onRollComplete={onRollComplete} />)
    await user.click(screen.getByRole('button', { name: /roll/i }))
    rerender(<Harness audio={audio} onRollComplete={onRollComplete} result={result} />)
    await waitFor(() => expect(onRollComplete).toHaveBeenCalledTimes(1))

    // `result` is unchanged, so nothing but the press itself can re-arm the
    // die. If it does not, the parent never learns the die landed and the
    // whole play loop stalls.
    await user.click(screen.getByRole('button', { name: /roll/i }))
    await waitFor(() => expect(onRollComplete).toHaveBeenCalledTimes(2))
  })

  /**
   * StrictMode runs every effect twice — mount, clean up, mount again — to
   * surface exactly this class of bug. The die animates asynchronously, so
   * the first pass is cancelled by its own cleanup; if arming is consumed by
   * that cancelled pass, the second never animates and `onRollComplete` is
   * never called. The app renders inside StrictMode, so this froze every roll.
   */
  it('still reports completion when effects are double-invoked (StrictMode)', async () => {
    const user = userEvent.setup()
    const onRollComplete = vi.fn()
    const audio = createFakeAudioPort()

    const { rerender } = render(
      <StrictMode>
        <Harness audio={audio} onRollComplete={onRollComplete} />
      </StrictMode>,
    )
    await user.click(screen.getByRole('button', { name: /roll/i }))
    rerender(
      <StrictMode>
        <Harness audio={audio} onRollComplete={onRollComplete} result={4} />
      </StrictMode>,
    )

    await waitFor(() => expect(onRollComplete).toHaveBeenCalled())
  })

  it('does not roll by itself when mounted with a result already set', async () => {
    const onRollComplete = vi.fn()
    const audio = createFakeAudioPort()

    render(
      <StrictMode>
        <Harness audio={audio} onRollComplete={onRollComplete} result={3} />
      </StrictMode>,
    )

    // A restored game arrives with `lastSpin` already populated; the die must
    // sit still rather than replaying someone else's turn.
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(onRollComplete).not.toHaveBeenCalled()
  })

  it('rolls itself when a computer seat bumps the auto-roll token', async () => {
    mockReducedMotion(true)
    const onRoll = vi.fn()
    const onRollComplete = vi.fn()
    const audio = createFakeAudioPort()

    const { rerender } = render(<Harness audio={audio} onRoll={onRoll} onRollComplete={onRollComplete} />)
    rerender(<Harness audio={audio} onRoll={onRoll} onRollComplete={onRollComplete} autoRollToken={1} />)
    expect(onRoll).toHaveBeenCalledTimes(1)

    rerender(
      <Harness audio={audio} onRoll={onRoll} onRollComplete={onRollComplete} autoRollToken={1} result={2} />,
    )
    await waitFor(() => expect(onRollComplete).toHaveBeenCalledTimes(1))
  })

  /**
   * The reported bug (issue #23): the board's die is one object that outlives
   * every turn taken with it, and `result` is whatever the store last rolled
   * — so the next player arrived at a die still showing the previous
   * player's number and read it as their own.
   */
  it('clears the last player’s number when the shell hands it a new turn', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const audio = createFakeAudioPort()
    const onRollComplete = vi.fn()

    const { rerender, container } = render(
      <Harness audio={audio} onRollComplete={onRollComplete} resetKey="turn-1" />,
    )
    await user.click(screen.getByRole('button', { name: /roll/i }))
    rerender(<Harness audio={audio} onRollComplete={onRollComplete} result={6} resetKey="turn-1" />)
    await waitFor(() => expect(onRollComplete).toHaveBeenCalledTimes(1))
    expect(shownFace(container)).toBe('6')

    // The next turn opens. `result` has not changed — the store still holds
    // last turn's 6 — so nothing but this key can put the die back.
    rerender(<Harness audio={audio} onRollComplete={onRollComplete} result={6} resetKey="turn-2" />)

    expect(shownFace(container)).toBe('1')
    // …and the accessible name stops claiming a roll that was not this
    // player's, which is the same lie in words.
    expect(screen.getByRole('button', { name: 'Roll' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('')
  })

  /**
   * The other half of the same report: a die that is merely sitting there
   * says nothing about being what the game is waiting for. It bobs, and it
   * names both ways in — but only while the press is genuinely its own.
   */
  it('asks to be thrown while it is the screen’s next input, and not otherwise', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()

    const { rerender } = render(<Harness audio={audio} primary />)
    expect(screen.getByText(/click to roll/i)).toBeInTheDocument()

    // A die on screen but not the screen's business — the board's, under a
    // modal — must not advertise a key that would not reach it.
    rerender(<Harness audio={audio} />)
    expect(screen.queryByText(/click to roll/i)).not.toBeInTheDocument()

    rerender(<Harness audio={audio} primary disabled />)
    expect(screen.queryByText(/click to roll/i)).not.toBeInTheDocument()
  })

  it('prints all six faces on the cube, each with exactly its own pips', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const { container } = render(<Harness audio={audio} />)
    // A real cube carries every face at once — the tumble shows them by
    // turning, not by repainting one square.
    for (const face of [1, 2, 3, 4, 5, 6] as const) {
      expect(pipCount(container, face)).toBe(pipsFor(face).length)
    }
    // An unrolled die rests showing a one — a face, not an empty square.
    expect(shownFace(container)).toBe('1')
  })
})
