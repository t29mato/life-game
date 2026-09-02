import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Player } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { StatusModal } from './StatusModal'

function renderModal(ui: ReactElement): ReturnType<typeof render> {
  return render(<AudioProvider audio={createFakeAudioPort()}>{ui}</AudioProvider>)
}

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alice',
    color: 'blue',
    spaceId: 'start',
    money: 10_000,
    loans: 0,
    career: null,
    hasDegree: false,
    hasDoctorate: false,
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

describe('StatusModal', () => {
  it("renders every listed player's cash and net worth", () => {
    const players = [makePlayer({ id: 'p1', name: 'Alice', money: 10_000 }), makePlayer({ id: 'p2', name: 'Bo', money: 5_000 })]
    renderModal(<StatusModal players={players} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bo')).toBeInTheDocument()
    expect(screen.getAllByText('Net worth')).toHaveLength(2)
  })

  it('marks the active player as now playing', () => {
    const players = [makePlayer({ id: 'p1', name: 'Alice' }), makePlayer({ id: 'p2', name: 'Bo' })]
    renderModal(<StatusModal players={players} activePlayerId="p2" onClose={vi.fn()} />)

    const bo = screen.getByLabelText("Bo's status")
    expect(bo).toHaveTextContent('Now playing')
    const alice = screen.getByLabelText("Alice's status")
    expect(alice).not.toHaveTextContent('Now playing')
  })

  it('lists a house, its loans, and its children each as their own ledger line', () => {
    const player = makePlayer({
      house: {
        id: 'house-tiny-cabin',
        name: 'Tiny Cabin',
        price: 60_000,
        resaleRange: [40_000, 95_000],
        icon: 'house:tiny-cabin',
        description: 'One room, one hammock.',
      },
      loans: 1,
      children: 2,
    })
    renderModal(<StatusModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByText(/House — Tiny Cabin/)).toBeInTheDocument()
    expect(screen.getByText(/Loans — 1 outstanding/)).toBeInTheDocument()
    expect(screen.getByText(/Children — 2,/)).toBeInTheDocument()
  })

  it('itemises each stock holding by name, ticker and share count under the group total', () => {
    const player = makePlayer({ stocks: [{ stockId: 'stock-noodle-chain', shares: 3 }] })
    renderModal(<StatusModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByText(/Shares — at the middle of what each pays out/)).toBeInTheDocument()
    // Midnight Noodle Co. pays 9,000–16,000 a share: mid 12,500, times three.
    expect(screen.getByText('Midnight Noodle Co. (NDL) — 3 shares')).toBeInTheDocument()
    expect(screen.getAllByText('$37,500').length).toBeGreaterThan(0)
  })

  it('itemises each life tile by its own title and value under the group total', () => {
    const player = makePlayer({
      lifeTiles: [
        { id: 'tile-ran-a-marathon', title: 'Ran a Marathon', value: 15_000, icon: 'tile:marathon' },
        { id: 'tile-wrote-a-novel', title: 'Wrote a Novel', value: 40_000, icon: 'tile:novel' },
      ],
    })
    renderModal(<StatusModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByText('Life tiles — 2 earned')).toBeInTheDocument()
    expect(screen.getByText('Ran a Marathon')).toBeInTheDocument()
    expect(screen.getByText('Wrote a Novel')).toBeInTheDocument()
    expect(screen.getByText('$15,000')).toBeInTheDocument()
    expect(screen.getByText('$40,000')).toBeInTheDocument()
  })

  it('names each insurance policy instead of comma-joining them', () => {
    const player = makePlayer({ insurance: ['home', 'life'] })
    renderModal(<StatusModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />)

    const card = screen.getByLabelText("Alice's status")
    expect(card).toHaveTextContent('Insured')
    expect(card).toHaveTextContent('Home')
    expect(card).toHaveTextContent('Life')
  })

  it('states marital status, children and degree as their own facts', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Alice', isMarried: true, children: 2, hasDegree: true }),
      makePlayer({ id: 'p2', name: 'Bo' }),
    ]
    renderModal(<StatusModal players={players} activePlayerId="p1" onClose={vi.fn()} />)

    const alice = screen.getByLabelText("Alice's status")
    expect(alice).toHaveTextContent('Married')
    expect(alice).toHaveTextContent('2 children')
    expect(alice).toHaveTextContent('Graduate')
    const bo = screen.getByLabelText("Bo's status")
    expect(bo).toHaveTextContent('Single')
    expect(bo).not.toHaveTextContent('Graduate')
  })

  it('marks a computer seat', () => {
    const players = [makePlayer({ id: 'p1', name: 'Alice', isCpu: true }), makePlayer({ id: 'p2', name: 'Bo' })]
    renderModal(<StatusModal players={players} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByLabelText("Alice's status")).toHaveTextContent('Computer')
    expect(screen.getByLabelText("Bo's status")).not.toHaveTextContent('Computer')
  })

  it('shows each player their live standing', () => {
    const players = [
      makePlayer({ id: 'p1', name: 'Alice', money: 5_000 }),
      makePlayer({ id: 'p2', name: 'Bo', money: 40_000 }),
    ]
    renderModal(<StatusModal players={players} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByLabelText("Bo's status")).toHaveTextContent('1st')
    expect(screen.getByLabelText("Alice's status")).toHaveTextContent('2nd')
  })

  it('names the order a retired player finished in', () => {
    const player = makePlayer({ isRetired: true, retirementRank: 1 })
    renderModal(<StatusModal players={[player]} activePlayerId={undefined} onClose={vi.fn()} />)

    expect(screen.getByLabelText("Alice's status")).toHaveTextContent('Retired #1')
  })

  it('calls onClose when Close is pressed', () => {
    const onClose = vi.fn()
    renderModal(<StatusModal players={[makePlayer()]} activePlayerId="p1" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape', () => {
    const onClose = vi.fn()
    renderModal(<StatusModal players={[makePlayer()]} activePlayerId="p1" onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  /*
   * B6. The screen furthest from a Nintendo status screen: two columns of
   * 0.78rem text with the one number that matters at the bottom. What a
   * player owns is a set of objects the board already draws, and the total
   * is the headline, not the footer.
   */
  describe('reading as a shelf of things rather than a spreadsheet', () => {
    it('leads with net worth as the one big number', () => {
      const player = makePlayer({ money: 40_000 })
      const { container } = renderModal(
        <StatusModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />,
      )

      const headline = container.querySelector('[class*="totalValue"]')
      expect(headline).toHaveTextContent('$40,000')
      expect(screen.getByText('If the game ended now')).toBeInTheDocument()
    })

    it('shows the job, the home and the passengers as their own tiles', () => {
      const player = makePlayer({
        career: {
          id: 'career-chef',
          title: 'Line Cook',
          salary: 45_000,
          raiseStep: 5_000,
          requiresDegree: false,
          icon: 'career:food-truck-owner',
          description: 'Long shifts, good food.',
        },
        house: {
          id: 'house-tiny-cabin',
          name: 'Tiny Cabin',
          price: 60_000,
          resaleRange: [40_000, 95_000],
          icon: 'house:tiny-cabin',
          description: 'One room, one hammock.',
        },
        isMarried: true,
        children: 2,
      })
      renderModal(<StatusModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />)

      const card = screen.getByLabelText("Alice's status")
      expect(card).toHaveTextContent('Line Cook')
      expect(card).toHaveTextContent('Tiny Cabin')
      expect(card).toHaveTextContent('Married')
      expect(card).toHaveTextContent('2 children')
    })

    it('tags a loan in red rather than burying it in a row of a table', () => {
      const { container } = renderModal(
        <StatusModal players={[makePlayer({ loans: 2 })]} activePlayerId="p1" onClose={vi.fn()} />,
      )

      const tag = container.querySelector('[class*="debtTile"]')
      expect(tag).not.toBeNull()
      expect(tag).toHaveTextContent('2 loans')
      expect(tag).toHaveTextContent('−$50,000')
    })

    it('keeps every itemised line, folded behind one summary', () => {
      const { container } = renderModal(
        <StatusModal players={[makePlayer()]} activePlayerId="p1" onClose={vi.fn()} />,
      )

      const details = container.querySelector('details')
      expect(details).not.toBeNull()
      expect(screen.getByText('Full breakdown')).toBeInTheDocument()
      expect(details).toHaveTextContent('Cash')
    })
  })
})
