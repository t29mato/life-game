import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { LandingEvent } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { EventCard } from './EventCard'
import styles from './EventCard.module.css'

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
    spaceId: 's1',
    title: 'Podcast Goes Viral',
    description: 'Your side project blows up overnight.',
    icon: 'space:payday',
    tone: 'green',
    moneyDelta: 5000,
    lifeTilesGained: [],
    notes: [],
    ...overrides,
  }
}

describe('EventCard', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the illustration, title, and description', () => {
    mockReducedMotion(true)
    const { container } = render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(container.querySelector('svg')).toBeInTheDocument()
    expect(screen.getByText('Podcast Goes Viral')).toBeInTheDocument()
    expect(screen.getByText('Your side project blows up overnight.')).toBeInTheDocument()
  })

  it('reveals the money delta shortly after mounting', async () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ moneyDelta: 5000 })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    await waitFor(() => expect(screen.getByText('+$5,000')).toBeInTheDocument())
  })

  it('renders life tiles gained', () => {
    mockReducedMotion(true)
    const event = makeEvent({
      lifeTilesGained: [{ id: 't1', title: 'World Trip', value: 8000, icon: 'space:payday' }],
    })
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={event} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText(/World Trip/)).toBeInTheDocument()
  })

  it('renders notes', () => {
    mockReducedMotion(true)
    const event = makeEvent({ notes: ['Salary raised to $65,000'] })
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={event} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('Salary raised to $65,000')).toBeInTheDocument()
  })

  it('calls onDismiss when Continue is clicked', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={onDismiss} />
      </AudioProvider>,
    )
    await user.click(screen.getByRole('button', { name: 'Continue' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('calls onDismiss when Escape is pressed', async () => {
    mockReducedMotion(true)
    const user = userEvent.setup()
    const onDismiss = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={onDismiss} />
      </AudioProvider>,
    )
    await user.keyboard('{Escape}')
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('is a labelled dialog', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByRole('dialog', { name: 'Podcast Goes Viral' })).toBeInTheDocument()
  })

  it('bursts confetti for a gold-tone milestone event', async () => {
    mockReducedMotion(false)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ tone: 'gold' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('confetti-field')).toBeInTheDocument(), {
      timeout: 2000,
    })
  })

  it('does not burst confetti for a non-milestone tone', async () => {
    mockReducedMotion(false)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ tone: 'blue' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
  })

  it('renders the narration line distinctly from the space description', () => {
    mockReducedMotion(true)
    const event = makeEvent({
      description: 'Your side project blows up overnight.',
      narration: "That's the lead gone, just like that!",
    })
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={event} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText(/That's the lead gone, just like that!/)).toBeInTheDocument()
    expect(screen.getByText('Your side project blows up overnight.')).toBeInTheDocument()
  })

  it('renders no narration line when the event carries none', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByText(/^".*"$/)).not.toBeInTheDocument()
  })

  it('renders a transfer lane for every player whose balance this landing moved', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard
          event={makeEvent({
            moneyDelta: 400,
            transfers: [
              { playerId: 'p2', playerName: 'Bo', playerColor: 'blue', amount: -200 },
              { playerId: 'p3', playerName: 'Cy', playerColor: 'green', amount: -200 },
            ],
          })}
          onDismiss={() => {}}
        />
      </AudioProvider>,
    )
    expect(screen.getByText('Bo')).toBeInTheDocument()
    expect(screen.getByText('Cy')).toBeInTheDocument()
    // Signed from the viewing player's own side: they gained both $200s.
    expect(screen.getAllByText('+$200')).toHaveLength(2)
  })

  it('renders no transfer lanes when the landing never moved another player\'s balance', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByText(/^[+−]\$/)).not.toBeInTheDocument()
  })

  it('bursts confetti for emphasis "milestone" regardless of tone', async () => {
    mockReducedMotion(false)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ tone: 'blue', emphasis: 'milestone' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    await waitFor(() => expect(screen.getByTestId('confetti-field')).toBeInTheDocument(), {
      timeout: 2000,
    })
  })

  it('does not burst confetti for emphasis "big"', async () => {
    mockReducedMotion(false)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ tone: 'gold', emphasis: 'big' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    await new Promise((resolve) => setTimeout(resolve, 700))
    expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
  })

  it('honours reduced motion by settling instantly with no flash overlay', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ emphasis: 'big' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
    // The dialog is present and interactive immediately, with nothing left animating in.
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('keeps the calm settle for a "normal" emphasis event', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ emphasis: 'normal' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  describe('money delta presentation', () => {
    it('gives a positive delta the gain treatment: up arrow and the positive plate', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ moneyDelta: 500, tone: 'blue' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      await waitFor(() => expect(screen.getByText('+$500')).toBeInTheDocument())
      expect(screen.getByText('▲')).toBeInTheDocument()
      expect(container.querySelector(`.${styles.deltaPositive}`)).not.toBeNull()
      expect(container.querySelector(`.${styles.deltaNegative}`)).toBeNull()
      expect(container.querySelector(`.${styles.deltaZero}`)).toBeNull()
    })

    it('gives a negative delta the loss treatment: down arrow and the negative plate', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ moneyDelta: -500, tone: 'blue' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      await waitFor(() => expect(screen.getByText('-$500')).toBeInTheDocument())
      expect(screen.getByText('▼')).toBeInTheDocument()
      expect(container.querySelector(`.${styles.deltaNegative}`)).not.toBeNull()
      expect(container.querySelector(`.${styles.deltaPositive}`)).toBeNull()
      expect(container.querySelector(`.${styles.deltaZero}`)).toBeNull()
    })

    it('gives a zero delta a neutral treatment, never the loss styling', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ moneyDelta: 0, tone: 'blue' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      await waitFor(() => expect(screen.getByText('$0')).toBeInTheDocument())
      expect(screen.getByText('—')).toBeInTheDocument()
      expect(screen.queryByText('▼')).not.toBeInTheDocument()
      expect(screen.queryByText('▲')).not.toBeInTheDocument()
      expect(container.querySelector(`.${styles.deltaZero}`)).not.toBeNull()
      expect(container.querySelector(`.${styles.deltaNegative}`)).toBeNull()
      expect(container.querySelector(`.${styles.deltaPositive}`)).toBeNull()
    })

    it('does not burst confetti for a zero-delta, non-milestone event', async () => {
      mockReducedMotion(false)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ moneyDelta: 0, tone: 'blue' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      await new Promise((resolve) => setTimeout(resolve, 700))
      expect(screen.queryByTestId('confetti-field')).not.toBeInTheDocument()
    })
  })
})
