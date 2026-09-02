import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LandingEvent } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { PassingPop } from './PassingPop'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function makeEvent(overrides: Partial<LandingEvent> = {}): LandingEvent {
  return {
    spaceId: 'payday-3',
    title: 'Payday',
    description: 'Collect your pay.',
    icon: 'space:payday',
    tone: 'green',
    moneyDelta: 37_000,
    lifeTilesGained: [],
    notes: [],
    ...overrides,
  }
}

function renderPop(event: LandingEvent) {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <PassingPop event={event} />
    </AudioProvider>,
  )
}

describe('PassingPop', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('names the tile and what it was worth', () => {
    mockReducedMotion(true)
    renderPop(makeEvent())
    expect(screen.getByText('Payday')).toBeInTheDocument()
    expect(screen.getByText('+$37,000')).toBeInTheDocument()
  })

  it('shows a signed loss as a loss', () => {
    mockReducedMotion(true)
    renderPop(makeEvent({ title: 'Moving Out', moneyDelta: -8_000 }))
    expect(screen.getByText('-$8,000')).toBeInTheDocument()
  })

  /*
   * The whole point of demoting a passing event: it is not a thing to be
   * dismissed. A dialog would trap focus and imply a press; a status is
   * announced and left behind.
   */
  it('is a status, never a dialog, and offers nothing to press', () => {
    mockReducedMotion(true)
    renderPop(makeEvent())
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('falls back to the tile’s own story when no money changed hands', () => {
    mockReducedMotion(true)
    renderPop(makeEvent({ title: 'Cap and Gown', moneyDelta: 0, narration: 'You graduate at last.' }))
    expect(screen.getByText('You graduate at last.')).toBeInTheDocument()
  })

  it('plays the coin the card used to play, so money is never silent', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    render(
      <AudioProvider audio={audio}>
        <PassingPop event={makeEvent()} />
      </AudioProvider>,
    )
    expect(audio.sfxLog).toContain('coinGain')
  })
})
