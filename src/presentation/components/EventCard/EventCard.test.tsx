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
        <EventCard event={makeEvent({ moneyDelta: 5000, balanceAfter: 15_000 })} onDismiss={() => {}} />
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

  /*
   * D3: a playtest card carried a quote, a badge and three bullet lines, two
   * of which ("no promotion", "raised to $76,000") read as contradicting each
   * other at a glance. A card is a headline, one figure, and one footnote —
   * whatever a handler hands it, only the first line is on screen.
   */
  describe('one card, one message', () => {
    it('shows only the first note, and says how many are folded away', () => {
      mockReducedMotion(true)
      const event = makeEvent({ notes: ['A raise anyway: $76,000', 'Cleared the bar of 4.', 'Third thing'] })
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={event} onDismiss={() => {}} />
        </AudioProvider>,
      )

      expect(screen.getByText('A raise anyway: $76,000')).toBeInTheDocument()
      expect(screen.queryByText('Cleared the bar of 4.')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: '2 more' })).toBeInTheDocument()
    })

    it('unfolds the rest on a press, and folds them back', async () => {
      mockReducedMotion(true)
      const user = userEvent.setup()
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ notes: ['First', 'Second'] })} onDismiss={() => {}} />
        </AudioProvider>,
      )

      await user.click(screen.getByRole('button', { name: '1 more' }))
      expect(screen.getByText('Second')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Less' }))
      expect(screen.queryByText('Second')).not.toBeInTheDocument()
    })

    it('offers nothing to unfold when there is only one line', () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ notes: ['Salary raised to $65,000'] })} onDismiss={() => {}} />
        </AudioProvider>,
      )

      expect(screen.queryByRole('button', { name: /more/i })).not.toBeInTheDocument()
    })
  })

  /*
   * D2: the four kinds of card were told apart only by a small faint label.
   * A tile driven over now gets a card of its own shape.
   */
  describe('telling the four cards apart', () => {
    it('marks a landing card as a landing', () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent()} onDismiss={() => {}} />
        </AudioProvider>,
      )

      expect(screen.getByRole('dialog')).toHaveAttribute('data-variant', 'landing')
    })

    it('gives a tile driven past the lighter card, named for what it is', () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent()} onDismiss={() => {}} variant="passing" />
        </AudioProvider>,
      )

      const card = screen.getByRole('dialog')
      expect(card).toHaveAttribute('data-variant', 'passing')
      expect(card.className).toContain(styles.passing)
      expect(container.querySelector(`.${styles.passingRibbon}`)).toBeInTheDocument()
    })

    it('lets a milestone keep its gold even when driven past', () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({ emphasis: 'milestone' })}
            onDismiss={() => {}}
            variant="passing"
          />
        </AudioProvider>,
      )

      expect(screen.getByRole('dialog')).toHaveAttribute('data-variant', 'milestone')
      expect(container.querySelector(`.${styles.milestoneRibbon}`)).toBeInTheDocument()
      expect(container.querySelector(`.${styles.passingRibbon}`)).toBeNull()
    })
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

  it('prints the narration in place of the space description once a real story exists', () => {
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
    // The generic tile flavour already did its job before the roll — on the
    // popover, on the stakes line — and would only repeat the same beat in a
    // duller voice once the narration has the real, specific one to tell.
    expect(screen.queryByText('Your side project blows up overnight.')).not.toBeInTheDocument()
  })

  it('falls back to the space description on a card built with no narration', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('Your side project blows up overnight.')).toBeInTheDocument()
    expect(screen.queryByText(/^".*"$/)).not.toBeInTheDocument()
  })

  /*
   * The die is the one fact every wheel-decided handler used to write out
   * twice — "Rolled a 4." in the notes and "A 4!" opening the narration.
   * The card reads it off the event instead, which is why no handler spells
   * it out any more, so this is the only place it can now come from.
   */
  it('prints the die that decided the card', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ rolled: 4 })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('Rolled')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('prints no die on a card nothing was rolled for', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByText('Rolled')).not.toBeInTheDocument()
  })

  /*
   * The delta says how much moved; this says where it left them, on both
   * ends — before *and* after, not just the wallet it landed in. The plate
   * alone never answered the question a player at the table is actually
   * asking.
   */
  it('prints where the balance started and where it landed', async () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ moneyDelta: -2_000, balanceAfter: 8_000 })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    // The starting figure sits statically to the left of the arrow; the
    // rolling figure to its right also opens on that same starting number
    // until the reveal timer fires, so both are on screen at once here.
    expect(screen.getAllByText('$10,000').length).toBeGreaterThan(0)
    await waitFor(() => expect(screen.getByText('$8,000')).toBeInTheDocument())
  })

  it('prints no money plate on a card that moved no money', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ moneyDelta: 0 })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByText('$0')).not.toBeInTheDocument()
  })

  it('prints the standing this landing moved them to, before and after', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ rankBefore: 3, rankAfter: 1 })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('3rd')).toBeInTheDocument()
    expect(screen.getByText('1st')).toBeInTheDocument()
  })

  it('prints no standing line when this landing left the rank untouched', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByText(/^\d(st|nd|rd|th)$/)).not.toBeInTheDocument()
  })

  it('prints the trade a payday was earned at, as its own portrait', () => {
    mockReducedMotion(true)
    const { container } = render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent({ careerIcon: 'career:line-cook' })} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(container.querySelector('[data-family]')).not.toBeNull()
  })

  it('prints no career portrait on a card with nothing to show one for', () => {
    mockReducedMotion(true)
    const { container } = render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )
    expect(container.querySelector('[data-family]')).toBeNull()
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
          <EventCard event={makeEvent({ moneyDelta: 500, balanceAfter: 10_500, tone: 'blue' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      await waitFor(() => expect(screen.getByText('+$500')).toBeInTheDocument())
      expect(screen.getByText('▲')).toBeInTheDocument()
      expect(container.querySelector(`.${styles.deltaPositive}`)).not.toBeNull()
      expect(container.querySelector(`.${styles.deltaNegative}`)).toBeNull()
    })

    it('gives a negative delta the loss treatment: down arrow and the negative plate', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ moneyDelta: -500, balanceAfter: 9_500, tone: 'blue' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      await waitFor(() => expect(screen.getByText('-$500')).toBeInTheDocument())
      expect(screen.getByText('▼')).toBeInTheDocument()
      expect(container.querySelector(`.${styles.deltaNegative}`)).not.toBeNull()
      expect(container.querySelector(`.${styles.deltaPositive}`)).toBeNull()
    })

    it('skips the money plate entirely for a zero delta — a "$0" pill is clutter, not information', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent({ moneyDelta: 0, tone: 'blue', title: 'Graduation Day' })} onDismiss={() => {}} />
        </AudioProvider>,
      )
      // The rest of the card still renders in full.
      await waitFor(() => expect(screen.getByText('Graduation Day')).toBeInTheDocument())
      expect(screen.queryByText('$0')).not.toBeInTheDocument()
      expect(screen.queryByText('—')).not.toBeInTheDocument()
      expect(screen.queryByText('▼')).not.toBeInTheDocument()
      expect(screen.queryByText('▲')).not.toBeInTheDocument()
      expect(container.querySelector(`.${styles.moneyPlate}`)).toBeNull()
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
