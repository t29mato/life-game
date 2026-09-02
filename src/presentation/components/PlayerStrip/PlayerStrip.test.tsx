import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Player, PlayerId } from '@domain/model/types'
import type { Standing } from '@domain/rules/standing'
import { PlayerStrip } from './PlayerStrip'

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

function standingsOf(entries: readonly (readonly [PlayerId, number])[]): ReadonlyMap<PlayerId, Standing> {
  return new Map(entries.map(([id, rank]) => [id, { rank, netWorth: 0 }]))
}

/** Standings where the deciding figure is not the wallet — the B2 case. */
function worthOf(
  entries: readonly (readonly [PlayerId, number, number])[],
): ReadonlyMap<PlayerId, Standing> {
  return new Map(entries.map(([id, rank, netWorth]) => [id, { rank, netWorth }]))
}

describe('PlayerStrip', () => {
  const players = [
    makePlayer(),
    makePlayer({ id: 'p2', name: 'Bob', color: 'red', money: 25000 }),
  ]

  it('is one button: pressing anywhere on the band asks for the full status', () => {
    const onOpenStatus = vi.fn()
    render(
      <PlayerStrip
        players={players}
        currentPlayerIndex={0}
        standings={standingsOf([['p1', 2], ['p2', 1]])}
        onOpenStatus={onOpenStatus}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /players — open full status/i }))
    expect(onOpenStatus).toHaveBeenCalledTimes(1)
  })

  it('gives every seat its glance: name, wallet, standing', () => {
    render(
      <PlayerStrip
        players={players}
        currentPlayerIndex={0}
        standings={standingsOf([['p1', 2], ['p2', 1]])}
        onOpenStatus={() => {}}
      />,
    )

    const strip = screen.getByRole('button', { name: /players — open full status/i })
    expect(within(strip).getByText('Alice')).toBeInTheDocument()
    expect(within(strip).getByText('$10,000')).toBeInTheDocument()
    expect(within(strip).getByText('2nd')).toBeInTheDocument()
    expect(within(strip).getByText('Bob')).toBeInTheDocument()
    expect(within(strip).getByText('$25,000')).toBeInTheDocument()
    expect(within(strip).getByText('1st')).toBeInTheDocument()
  })

  it('marks a retired seat as retired instead of quoting a standing it is no longer playing for', () => {
    render(
      <PlayerStrip
        players={[makePlayer({ isRetired: true, retirementRank: 1 })]}
        currentPlayerIndex={0}
        standings={standingsOf([['p1', 1]])}
        onOpenStatus={() => {}}
      />,
    )

    expect(screen.getByText('Retired')).toBeInTheDocument()
    expect(screen.queryByText('1st')).not.toBeInTheDocument()
  })

  /*
   * B2. The band reported from a real game: "Player 1 $12,000 1st / Player 2
   * $18,000 2nd". Both figures were true and the ordinal still looked wrong,
   * because the number that decided it — net worth, with $75,000 of loans
   * taken off it — was only ever visible inside a modal. A rank is not
   * allowed to come out of a calculation the player cannot see.
   */
  describe('showing what the rank was decided on', () => {
    const leaders = [
      makePlayer({ id: 'p1', name: 'Alice', money: 12_000 }),
      makePlayer({ id: 'p2', name: 'Bob', color: 'red', money: 18_000, loans: 3 }),
    ]

    it('prints the net worth the ordinal is sorted on, beside the cash', () => {
      render(
        <PlayerStrip
          players={leaders}
          currentPlayerIndex={0}
          standings={worthOf([['p1', 1, 72_000], ['p2', 2, -57_000]])}
          onOpenStatus={() => {}}
        />,
      )

      const strip = screen.getByRole('button', { name: /players — open full status/i })
      expect(within(strip).getByText('$12,000')).toBeInTheDocument()
      expect(within(strip).getByText('$18,000')).toBeInTheDocument()
      // The two figures that actually decided the order — a house behind
      // the smaller wallet, three loans behind the bigger one.
      expect(within(strip).getByText('$72,000')).toBeInTheDocument()
      expect(within(strip).getByText('-$57,000')).toBeInTheDocument()
      expect(within(strip).getAllByText('Worth')).toHaveLength(2)
    })

    it('tags the debt that made the two disagree, priced at what it takes to clear', () => {
      render(
        <PlayerStrip
          players={leaders}
          currentPlayerIndex={0}
          standings={worthOf([['p1', 1, 72_000], ['p2', 2, -57_000]])}
          onOpenStatus={() => {}}
        />,
      )

      // Three loans at the normal rate: $25,000 each to settle.
      expect(screen.getByText('−$75,000')).toBeInTheDocument()
    })

    it(`prices that debt at the table's own difficulty`, () => {
      render(
        <PlayerStrip
          players={[makePlayer({ loans: 1 })]}
          currentPlayerIndex={0}
          standings={worthOf([['p1', 1, -15_000]])}
          difficulty="veryHard"
          onOpenStatus={() => {}}
        />,
      )

      expect(screen.queryByText('−$25,000')).not.toBeInTheDocument()
    })

    it('leaves a debt-free seat untagged', () => {
      const { container } = render(
        <PlayerStrip
          players={[makePlayer()]}
          currentPlayerIndex={0}
          standings={worthOf([['p1', 1, 10_000]])}
          onOpenStatus={() => {}}
        />,
      )

      expect(container.textContent).not.toContain('−$')
    })

    it('spells the whole standing out for a hover or a long press', () => {
      render(
        <PlayerStrip
          players={leaders}
          currentPlayerIndex={0}
          standings={worthOf([['p1', 1, 72_000], ['p2', 2, -57_000]])}
          onOpenStatus={() => {}}
        />,
      )

      const badge = screen.getByText('2nd')
      expect(badge).toHaveAttribute('title', expect.stringContaining('net worth -$57,000'))
      expect(badge).toHaveAttribute('title', expect.stringContaining('cash $18,000'))
      expect(badge).toHaveAttribute('title', expect.stringContaining('3 loans'))
    })
  })
})
