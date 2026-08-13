import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Player } from '@domain/model/types'
import { CASUAL_WAGE_PER_PIP } from '@domain/model/constants'
import { formatMoney } from '../../format'
import { PlayerPanel } from './PlayerPanel'

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    color: 'blue',
    spaceId: 'start',
    money: 10000,
    loans: 0,
    career: null,
    hasDegree: false,
    isMarried: false,
    children: 0,
    house: null,
    lifeTiles: [],
    stocks: [],
    insurance: [],
    isCpu: false,
    isRetired: false,
    retirementRank: null,
    ...overrides,
  }
}

describe('PlayerPanel', () => {
  it('shows the player name and an unemployed fallback when there is no career', () => {
    render(<PlayerPanel player={makePlayer()} isActive={false} />)
    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText(/unemployed/i)).toBeInTheDocument()
  })

  it('shows the career title and salary when employed', () => {
    const player = makePlayer({
      career: {
        id: 'c1',
        title: 'Software Engineer',
        salary: 65000,
        raiseStep: 5000,
        requiresDegree: true,
        icon: 'space:payday',
        description: 'Builds things.',
      },
    })
    render(<PlayerPanel player={player} isActive={false} />)
    expect(screen.getByText(/Software Engineer/)).toBeInTheDocument()
    expect(screen.getByText('$65,000 / payday')).toBeInTheDocument()
  })

  it('says a wage the wheel decides is an average, so it is not read as a promise', () => {
    const player = makePlayer({
      career: {
        id: 'c2',
        title: 'Food Truck Owner',
        salary: 66_000,
        payPerPip: 12_000,
        raiseStep: 6_600,
        requiresDegree: false,
        icon: 'space:payday',
        description: 'Parks in the perfect spot.',
      },
    })
    render(<PlayerPanel player={player} isActive={false} />)
    expect(screen.getByText('$66,000 / payday on average')).toBeInTheDocument()
  })

  it('quotes the casual rate a player between jobs is picking up shifts at', () => {
    render(<PlayerPanel player={makePlayer({ career: null })} isActive={false} />)
    expect(screen.getByText(`Casual shifts: ${formatMoney(CASUAL_WAGE_PER_PIP)} a pip`)).toBeInTheDocument()
  })

  it('renders the formatted cash amount exactly once', () => {
    render(<PlayerPanel player={makePlayer({ money: 12345 })} isActive={false} />)
    // Exactly once. A player holding nothing but cash is worth exactly their
    // cash, and printing the same figure twice under two labels invites
    // "why is this here twice?" — so the net worth band holds its number
    // back until it has something different to say.
    expect(screen.getAllByText('$12,345')).toHaveLength(1)
  })

  it('shows a retirement badge with rank once retired', () => {
    render(<PlayerPanel player={makePlayer({ isRetired: true, retirementRank: 2 })} isActive={false} />)
    expect(screen.getByText('Retired #2')).toBeInTheDocument()
  })

  it('shows the life tile count', () => {
    render(
      <PlayerPanel
        player={makePlayer({
          lifeTiles: [{ id: 't1', title: 'Trip', value: 5000, icon: 'space:payday' }],
        })}
        isActive={false}
      />,
    )
    expect(screen.getByText(/1 tile/)).toBeInTheDocument()
  })

  it('only shows the married pip when married', () => {
    const { rerender } = render(<PlayerPanel player={makePlayer()} isActive={false} />)
    expect(screen.queryByText(/married/i)).not.toBeInTheDocument()
    rerender(<PlayerPanel player={makePlayer({ isMarried: true })} isActive={false} />)
    expect(screen.getByText(/married/i)).toBeInTheDocument()
  })

  it('shows the children pip with the right count', () => {
    render(<PlayerPanel player={makePlayer({ children: 2 })} isActive={false} />)
    expect(screen.getByText(/2 kids/)).toBeInTheDocument()
  })

  it('shows the house pip when a house is owned', () => {
    render(
      <PlayerPanel
        player={makePlayer({
          house: { id: 'h1', name: 'Cosy Cottage', price: 100000, resaleRange: [90000, 120000], icon: 'space:payday', description: 'x' },
        })}
        isActive={false}
      />,
    )
    expect(screen.getByText(/Cosy Cottage/)).toBeInTheDocument()
  })

  it('shows a loan pip only when loans are outstanding', () => {
    const { rerender } = render(<PlayerPanel player={makePlayer()} isActive={false} />)
    expect(screen.queryByText(/loan/i)).not.toBeInTheDocument()
    rerender(<PlayerPanel player={makePlayer({ loans: 2 })} isActive={false} />)
    expect(screen.getByText(/2 loans/)).toBeInTheDocument()
  })

  it('surfaces what outstanding loans will cost at retirement, not just the count', () => {
    render(<PlayerPanel player={makePlayer({ loans: 2 })} isActive={false} />)
    // LOAN_REPAYMENT is 25,000 per loan — two loans cost 50,000 at retirement.
    expect(screen.getByText(/\$50,000/)).toBeInTheDocument()
    expect(screen.getByText(/at retirement/i)).toBeInTheDocument()
  })

  it('marks the active player with aria-current', () => {
    render(<PlayerPanel player={makePlayer()} isActive />)
    expect(screen.getByRole('article')).toHaveAttribute('aria-current', 'true')
  })

  it('shows total shares held only once shares are bought', () => {
    const { rerender } = render(<PlayerPanel player={makePlayer()} isActive={false} />)
    expect(screen.queryByText(/share/i)).not.toBeInTheDocument()
    rerender(
      <PlayerPanel
        player={makePlayer({ stocks: [{ stockId: 's1', shares: 2 }, { stockId: 's2', shares: 1 }] })}
        isActive={false}
      />,
    )
    expect(screen.getByText('3 shares')).toBeInTheDocument()
  })

  it('shows a badge per policy held', () => {
    render(<PlayerPanel player={makePlayer({ insurance: ['home', 'life'] })} isActive={false} />)
    expect(screen.getByText(/Home policy/)).toBeInTheDocument()
    expect(screen.getByText(/Life policy/)).toBeInTheDocument()
    expect(screen.queryByText(/Auto policy/)).not.toBeInTheDocument()
  })

  // A player once mistook a net-worth drop for the game miscounting their
  // cash after buying a house — the number was right, the label was missing.
  // Now that both figures live on one card, each must carry its own label so
  // neither can be read as the other.
  describe('net worth', () => {
    it('shows net worth beside cash, each under its own label', () => {
      const player = makePlayer({
        money: 10_000,
        house: { id: 'h1', name: 'Cosy Cottage', price: 100_000, resaleRange: [90_000, 120_000], icon: 'space:payday', description: 'x' },
      })
      render(<PlayerPanel player={player} isActive={false} />)
      expect(screen.getByText('Cash')).toBeInTheDocument()
      expect(screen.getByText('Net worth')).toBeInTheDocument()
      // Cash is untouched by the purchase price…
      expect(screen.getByText('$10,000')).toBeInTheDocument()
      // …while net worth counts the house at what was paid for it.
      expect(screen.getByText('$110,000')).toBeInTheDocument()
    })

    it('says "same as cash" instead of repeating the number while nothing is owned', () => {
      const { rerender } = render(
        <PlayerPanel player={makePlayer({ money: 10_000 })} isActive={false} />,
      )
      // Worth equals cash, so the band explains the relationship rather than
      // duplicating the figure — one number on the card, not two identical.
      expect(screen.getByText(/same as cash/i)).toBeInTheDocument()
      expect(screen.getAllByText('$10,000')).toHaveLength(1)

      // The first acquisition is what makes the second number appear — the
      // band gaining a figure is itself the signal that worth and wallet
      // have parted company.
      rerender(
        <PlayerPanel
          player={makePlayer({
            money: 10_000,
            house: { id: 'h1', name: 'Cosy Cottage', price: 100_000, resaleRange: [90_000, 120_000], icon: 'space:payday', description: 'x' },
          })}
          isActive={false}
        />,
      )
      expect(screen.queryByText(/same as cash/i)).not.toBeInTheDocument()
      expect(screen.getByText('$110,000')).toBeInTheDocument()
    })

    it('prices outstanding loans at the difficulty actually being played', () => {
      const player = makePlayer({ money: 100_000, loans: 2 })
      render(<PlayerPanel player={player} isActive={false} difficulty="hard" />)
      // Hard settles a loan at $38,000, not normal's $25,000 — so two loans
      // leave $24,000 of net worth, not $50,000.
      expect(screen.getByText('$24,000')).toBeInTheDocument()
      expect(screen.queryByText('$50,000')).not.toBeInTheDocument()
    })
  })

  describe('standing', () => {
    it('announces the rank next to net worth', () => {
      render(<PlayerPanel player={makePlayer()} isActive={false} rank={1} />)
      expect(screen.getByText(/1st place/)).toBeInTheDocument()
    })

    it('shows the ordinal for a rank off the podium', () => {
      render(<PlayerPanel player={makePlayer()} isActive={false} rank={4} />)
      expect(screen.getByText('4th')).toBeInTheDocument()
    })

    it('shows no standing badge when no rank is supplied', () => {
      render(<PlayerPanel player={makePlayer()} isActive={false} />)
      expect(screen.queryByText(/place/)).not.toBeInTheDocument()
    })
  })
})
