import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'
import type { Player } from '@domain/model/types'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { AssetsModal } from './AssetsModal'

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

describe('AssetsModal', () => {
  it("renders every listed player's cash and net worth", () => {
    const players = [makePlayer({ id: 'p1', name: 'Alice', money: 10_000 }), makePlayer({ id: 'p2', name: 'Bo', money: 5_000 })]
    renderModal(<AssetsModal players={players} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('Bo')).toBeInTheDocument()
    expect(screen.getAllByText('Net worth')).toHaveLength(2)
  })

  it('marks the active player as now playing', () => {
    const players = [makePlayer({ id: 'p1', name: 'Alice' }), makePlayer({ id: 'p2', name: 'Bo' })]
    renderModal(<AssetsModal players={players} activePlayerId="p2" onClose={vi.fn()} />)

    const bo = screen.getByLabelText("Bo's assets")
    expect(bo).toHaveTextContent('Now playing')
    const alice = screen.getByLabelText("Alice's assets")
    expect(alice).not.toHaveTextContent('Now playing')
  })

  it('lists a house, its loans, its shares, and its children each as their own ledger line', () => {
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
      stocks: [{ stockId: 'stock-noodle-chain', shares: 3 }],
      children: 2,
    })
    renderModal(<AssetsModal players={[player]} activePlayerId="p1" onClose={vi.fn()} />)

    expect(screen.getByText(/House — Tiny Cabin/)).toBeInTheDocument()
    expect(screen.getByText(/Shares — 3 held/)).toBeInTheDocument()
    expect(screen.getByText(/Loans — 1 outstanding/)).toBeInTheDocument()
    expect(screen.getByText(/Children — 2,/)).toBeInTheDocument()
  })

  it('calls onClose when Close is pressed', () => {
    const onClose = vi.fn()
    renderModal(<AssetsModal players={[makePlayer()]} activePlayerId="p1" onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape', () => {
    const onClose = vi.fn()
    renderModal(<AssetsModal players={[makePlayer()]} activePlayerId="p1" onClose={onClose} />)
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
