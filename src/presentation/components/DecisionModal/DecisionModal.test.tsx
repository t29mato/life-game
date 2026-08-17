import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Board, Decision, Space } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { DecisionModal } from './DecisionModal'

function makeDecision(): Decision {
  return {
    kind: 'house',
    prompt: 'Choose your career',
    options: [
      { id: 'a', label: 'Chef', description: 'Cook amazing food.', icon: 'space:payday', detail: '$40,000' },
      { id: 'b', label: 'Pilot', description: 'Fly the skies.', icon: 'space:payday', detail: '$70,000' },
      { id: 'c', label: 'Artist', description: 'Paint the town.', icon: 'space:payday', detail: '$35,000' },
    ],
  }
}

function space(overrides: Partial<Space> & { id: string }): Space {
  return {
    id: overrides.id,
    kind: overrides.kind ?? 'normal',
    title: overrides.title ?? overrides.id,
    description: overrides.description ?? 'A space.',
    effect: overrides.effect ?? { type: 'none' },
    next: overrides.next ?? [],
    layout: overrides.layout ?? { x: 0, y: 0 },
    tone: overrides.tone ?? 'blue',
    icon: overrides.icon ?? 'space:payday',
  }
}

function makeBoard(spaces: readonly Space[] = [space({ id: 'a' }), space({ id: 'b' }), space({ id: 'c' })]): Board {
  const record: Record<string, Space> = {}
  for (const s of spaces) record[s.id] = s
  return { spaces: record, startSpaceId: 'a', retirementSpaceId: 'retirement', width: 100, height: 100 }
}

function makeBranchDecision(): Decision {
  return {
    kind: 'branch',
    prompt: 'Which way?',
    options: [
      { id: 'left-1', label: 'Left lane', description: 'Head left.', icon: 'space:payday' },
      { id: 'right-1', label: 'Right lane', description: 'Head right.', icon: 'space:payday' },
    ],
  }
}

function makeBranchBoard(): Board {
  const spaces = [
    space({ id: 'left-1', kind: 'payday', effect: { type: 'payday' }, next: ['left-2'] }),
    space({ id: 'left-2', kind: 'payday', effect: { type: 'payday' }, next: [] }),
    space({
      id: 'right-1',
      effect: { type: 'gainMoney', amount: 500, reason: 'Bonus' },
      icon: 'space:lucky-find',
      next: ['right-2'],
    }),
    space({
      id: 'right-2',
      effect: { type: 'payMoney', amount: 200, reason: 'Toll' },
      icon: 'space:car-trouble',
      next: [],
    }),
  ]
  return makeBoard(spaces)
}

describe('DecisionModal', () => {
  it('renders the prompt and every option', () => {
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('Choose your career')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Chef/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Pilot/ })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Artist/ })).toBeInTheDocument()
    expect(screen.getByText('$70,000')).toBeInTheDocument()
  })

  it('focuses the first option on mount', () => {
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByRole('option', { name: /Chef/ })).toHaveFocus()
  })

  it('moves focus forward with ArrowDown and wraps at the end', async () => {
    const user = userEvent.setup()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Pilot/ })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Artist/ })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByRole('option', { name: /Chef/ })).toHaveFocus()
  })

  it('moves focus backward with ArrowUp and wraps at the start', async () => {
    const user = userEvent.setup()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    await user.keyboard('{ArrowUp}')
    expect(screen.getByRole('option', { name: /Artist/ })).toHaveFocus()
  })

  it('calls onChoose with the option id when Enter confirms the focused option', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={onChoose} />
      </AudioProvider>,
    )
    await user.keyboard('{ArrowDown}{Enter}')
    expect(onChoose).toHaveBeenCalledWith('b')
  })

  it('calls onChoose when an option is clicked', async () => {
    const user = userEvent.setup()
    const onChoose = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={onChoose} />
      </AudioProvider>,
    )
    await user.click(screen.getByRole('option', { name: /Artist/ }))
    expect(onChoose).toHaveBeenCalledWith('c')
  })

  it('renders a lane preview of the upcoming spaces for a branch decision', () => {
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeBranchDecision()} board={makeBranchBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    // Two paydays in the left lane read as payday-heavy...
    expect(screen.getByText(/payday-heavy/i)).toBeInTheDocument()
    // ...and the right lane, all eventful spaces, reads as event-heavy.
    expect(screen.getByText(/event-heavy/i)).toBeInTheDocument()
  })

  it('does not render a lane preview for a non-branch decision', () => {
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.queryByText(/heavy|mixed route/i)).not.toBeInTheDocument()
  })

  it('renders a stock decision with each option’s price impossible to miss', () => {
    const decision: Decision = {
      kind: 'stock',
      prompt: 'Buy shares?',
      options: [
        { id: 'buy-orbt', label: 'Orbital Freight', description: 'A shipping upstart.', icon: 'stock:orbital-freight', detail: '$120' },
        { id: 'decline', label: 'Stay in cash', description: 'Buy nothing this time.', icon: 'space:quiet-savings' },
      ],
    }
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={decision} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('Trading floor')).toBeInTheDocument()
    expect(screen.getByText('$120')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: /Stay in cash/ })).toBeInTheDocument()
  })

  it('renders an insurance decision with the premium shown', () => {
    const decision: Decision = {
      kind: 'insurance',
      prompt: 'Take out a policy?',
      options: [
        { id: 'home', label: 'Home policy', description: 'Waives fire damage.', icon: 'finance:policy-home', detail: '$25,000' },
        { id: 'decline', label: 'No thanks', description: 'Skip insurance.', icon: 'space:quiet-savings' },
      ],
    }
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={decision} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('Insurance office')).toBeInTheDocument()
    expect(screen.getByText('$25,000')).toBeInTheDocument()
  })

  it('traps focus within a human decision (Tab wraps back to the first option)', async () => {
    const user = userEvent.setup()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByRole('option', { name: /Chef/ })).toHaveFocus()
    await user.tab()
    await user.tab()
    await user.tab()
    expect(screen.getByRole('option', { name: /Chef/ })).toHaveFocus()
  })

  describe('isCpu', () => {
    it('shows a thinking notice naming the active player instead of the human prompt', () => {
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} isCpu cpuPlayerName="Jordan" />
        </AudioProvider>,
      )
      expect(screen.getByText(/Jordan is choosing/)).toBeInTheDocument()
      expect(screen.queryByText('Choose your career')).not.toBeInTheDocument()
    })

    it('falls back to generic phrasing when no player name is given', () => {
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} isCpu />
        </AudioProvider>,
      )
      expect(screen.getByText(/The computer is choosing/)).toBeInTheDocument()
    })

    it('announces the thinking status politely to assistive tech', () => {
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} isCpu cpuPlayerName="Jordan" />
        </AudioProvider>,
      )
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('exposes no clickable, focusable, or listbox-role option', () => {
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} isCpu cpuPlayerName="Jordan" />
        </AudioProvider>,
      )
      expect(screen.queryByRole('option')).not.toBeInTheDocument()
      expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(document.querySelector('button')).not.toBeInTheDocument()
      expect(screen.getByText('Chef').closest('div')).not.toHaveAttribute('tabindex')
    })

    it('does not show the keyboard hint', () => {
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} isCpu cpuPlayerName="Jordan" />
        </AudioProvider>,
      )
      expect(screen.queryByText(/to browse/)).not.toBeInTheDocument()
    })

    it('never calls onChoose, even via click or keyboard', async () => {
      const user = userEvent.setup()
      const onChoose = vi.fn()
      render(
        <AudioProvider audio={createFakeAudioPort()}>
          <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={onChoose} isCpu cpuPlayerName="Jordan" />
        </AudioProvider>,
      )
      await user.click(screen.getByText('Chef'))
      await user.keyboard('{ArrowDown}{Enter}')
      expect(onChoose).not.toHaveBeenCalled()
    })

    it('does not trap focus: nothing is auto-focused and Tab leaves the card', async () => {
      const user = userEvent.setup()
      render(
        <div>
          <button type="button">Outside</button>
          <AudioProvider audio={createFakeAudioPort()}>
            <DecisionModal decision={makeDecision()} board={makeBoard()} onChoose={() => {}} isCpu cpuPlayerName="Jordan" />
          </AudioProvider>
        </div>,
      )
      expect(document.body).toHaveFocus()
      await user.tab()
      expect(screen.getByRole('button', { name: 'Outside' })).toHaveFocus()
    })
  })

  it('renders a bank decision with loan and repayment options', () => {
    const decision: Decision = {
      kind: 'bank',
      prompt: 'What would you like to do?',
      options: [
        { id: 'borrow', label: 'Take a loan', description: 'Borrow from the bank.', icon: 'finance:bank-visit', detail: '+$20,000' },
        { id: 'repay', label: 'Repay a loan', description: 'Pay one off early.', icon: 'finance:bank-visit', detail: '-$22,000' },
        { id: 'walk', label: 'Walk on', description: 'Do nothing.', icon: 'space:quiet-savings' },
      ],
    }
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={decision} board={makeBoard()} onChoose={() => {}} />
      </AudioProvider>,
    )
    expect(screen.getByText('The bank')).toBeInTheDocument()
    expect(screen.getByText('+$20,000')).toBeInTheDocument()
    expect(screen.getByText('-$22,000')).toBeInTheDocument()
  })

  it('renders a value-spin decision as a single button naming the rate, and presses it like any other option', async () => {
    const user = userEvent.setup()
    const decision: Decision = {
      kind: 'valueSpin',
      prompt: 'The Crêpe Van Bet',
      options: [
        {
          id: 'value-spin',
          label: 'Spin',
          description: 'What the crêpe van took $2,000 a pip you roll, 1 to 10 — higher is always better.',
          icon: 'space:payday',
        },
      ],
    }
    const onChoose = vi.fn()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <DecisionModal decision={decision} board={makeBoard()} onChoose={onChoose} />
      </AudioProvider>,
    )
    expect(screen.getByText('The wheel')).toBeInTheDocument()
    expect(screen.getByText('The Crêpe Van Bet')).toBeInTheDocument()
    expect(screen.getByText(/higher is always better/)).toBeInTheDocument()
    await user.click(screen.getByRole('option', { name: /spin/i }))
    expect(onChoose).toHaveBeenCalledWith('value-spin')
  })
})
