import { fireEvent, render, screen, waitFor } from '@testing-library/react'
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

  /*
   * Continue is this card's A button — issue #33. The card already put focus
   * here through its focus trap; what is new is that the *key* reaches it
   * whether or not focus stayed, and that Space works as well as Enter, so a
   * player who has just rolled with Space carries on with Space.
   */
  it('puts focus on Continue as the card lands', () => {
    mockReducedMotion(true)
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={() => {}} />
      </AudioProvider>,
    )

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveFocus()
  })

  it.each([' ', 'Enter'])('dismisses on %s even when focus has drifted off the button', (key) => {
    mockReducedMotion(true)
    const onDismiss = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <EventCard event={makeEvent()} onDismiss={onDismiss} />
      </AudioProvider>,
    )
    screen.getByRole('button', { name: 'Continue' }).blur()

    fireEvent.keyDown(window, { key })

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

  /*
   * B1. The card a real playtester read back: "$10,000 → $18,000 ▲ +$8,000"
   * in a green band, over a $52,000 tuition bill settled by a $60,000 loan.
   * The player was told they had profited from tuition. These tests are the
   * ones a regression would hurt most, so they check both halves: the two
   * signed rows are there, and the single merged green number is not.
   */
  describe('a bill the bank had to cover', () => {
    const TUITION = makeEvent({
      title: 'Tuition Bill',
      tone: 'blue',
      moneyDelta: 8_000,
      balanceAfter: 18_000,
      borrowing: { loans: 1, borrowed: 60_000, dueAtRetirement: 75_000, charge: 52_000 },
    })

    it('prints the payment and the loan as two separately signed rows', async () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={TUITION} onDismiss={() => {}} />
        </AudioProvider>,
      )

      await waitFor(() => expect(screen.getByText('Paid')).toBeInTheDocument())
      expect(screen.getByText('-$52,000')).toBeInTheDocument()
      expect(screen.getByText('Borrowed')).toBeInTheDocument()
      expect(screen.getByText('+$60,000')).toBeInTheDocument()
    })

    it('never shows the net of the two as a gain', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={TUITION} onDismiss={() => {}} />
        </AudioProvider>,
      )

      await waitFor(() => expect(screen.getByText('Paid')).toBeInTheDocument())
      // The exact string the playtest reported, and the arrow beside it.
      expect(screen.queryByText('+$8,000')).not.toBeInTheDocument()
      expect(screen.queryByText('▲')).not.toBeInTheDocument()
      expect(container.querySelector(`.${styles.moneyDeltaChip}`)).toBeNull()
    })

    it('does not paint the plate green', async () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={TUITION} onDismiss={() => {}} />
        </AudioProvider>,
      )

      await waitFor(() => expect(screen.getByText('Paid')).toBeInTheDocument())
      const plate = container.querySelector(`.${styles.moneyPlate}`)
      expect(plate).not.toBeNull()
      expect(plate?.className).not.toContain(styles.deltaPositive)
      expect(plate?.className).toContain(styles.deltaBorrowed)
    })

    it('says what the loan costs to settle, beside the loan', async () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={TUITION} onDismiss={() => {}} />
        </AudioProvider>,
      )

      await waitFor(() =>
        expect(screen.getByText('1 loan — $75,000 to repay at retirement')).toBeInTheDocument(),
      )
    })

    it('counts the loans when one bill forced several', async () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({
              moneyDelta: 4_000,
              balanceAfter: 4_000,
              borrowing: { loans: 3, borrowed: 60_000, dueAtRetirement: 75_000, charge: 56_000 },
            })}
            onDismiss={() => {}}
          />
        </AudioProvider>,
      )

      await waitFor(() =>
        expect(screen.getByText('3 loans — $75,000 to repay at retirement')).toBeInTheDocument(),
      )
    })

    it('shows only the borrow when nobody was billed for it', async () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({
              title: 'The Bank',
              moneyDelta: 60_000,
              balanceAfter: 70_000,
              borrowing: { loans: 1, borrowed: 60_000, dueAtRetirement: 75_000, charge: 0 },
            })}
            onDismiss={() => {}}
          />
        </AudioProvider>,
      )

      await waitFor(() => expect(screen.getByText('Borrowed')).toBeInTheDocument())
      expect(screen.queryByText('Paid')).not.toBeInTheDocument()
    })

    it('leaves an ordinary payment alone', async () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({ moneyDelta: -52_000, balanceAfter: 48_000 })}
            onDismiss={() => {}}
          />
        </AudioProvider>,
      )

      await waitFor(() => expect(screen.getByText('-$52,000')).toBeInTheDocument())
      expect(screen.queryByText('Borrowed')).not.toBeInTheDocument()
    })
  })

  /* B5. A figure that looks wrong beside the salary the player was just quoted. */
  describe('the tile footnote', () => {
    it('prints the tile\'s own explanation of a figure that looks wrong', () => {
      mockReducedMotion(true)
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({
              title: 'First Paycheck',
              footnote: 'Part of a month, not a whole one — the first full packet is the next Payday square.',
            })}
            onDismiss={() => {}}
          />
        </AudioProvider>,
      )

      expect(
        screen.getByText(/Part of a month, not a whole one/),
      ).toBeInTheDocument()
    })

    it('says nothing on a tile whose figure needs no defending', () => {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard event={makeEvent()} onDismiss={() => {}} />
        </AudioProvider>,
      )

      expect(container.querySelector(`.${styles.footnote}`)).toBeNull()
    })
  })

  /* B4. The strip behind the card must not print the answer first. */
  describe('telling the strip when the count-up has landed', () => {
    it('reports once the digits have stopped, not when the card mounts', async () => {
      mockReducedMotion(false)
      const onMoneyLanded = vi.fn()
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({ moneyDelta: 5_000, balanceAfter: 15_000 })}
            onDismiss={() => {}}
            onMoneyLanded={onMoneyLanded}
          />
        </AudioProvider>,
      )

      expect(onMoneyLanded).not.toHaveBeenCalled()
      await waitFor(() => expect(onMoneyLanded).toHaveBeenCalled(), { timeout: 4000 })
    })

    it('reports at once when the player has asked for no motion', async () => {
      mockReducedMotion(true)
      const onMoneyLanded = vi.fn()
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <EventCard
            event={makeEvent({ moneyDelta: 5_000, balanceAfter: 15_000 })}
            onDismiss={() => {}}
            onMoneyLanded={onMoneyLanded}
          />
        </AudioProvider>,
      )

      await waitFor(() => expect(onMoneyLanded).toHaveBeenCalled())
    })
  })
})
