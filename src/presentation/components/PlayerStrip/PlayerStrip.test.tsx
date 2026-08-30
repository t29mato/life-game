import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Player, PlayerId } from '@domain/model/types'
import type { Standing } from '../PlayerPanel/rankPlayers'
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
})
