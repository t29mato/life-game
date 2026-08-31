import { describe, expect, it, vi } from 'vitest'
import type { Player } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { estimateNetWorth } from '@domain/rules/scoring'
import { rankPlayers } from './standing'

// This helper only needs to trust whatever `estimateNetWorth` reports — its
// own job is ranking around that number. Stubbing it to plain cash keeps the
// suite decoupled from the real formula (house/stocks/loans), which the
// domain owns and tests itself.
vi.mock('@domain/rules/scoring', () => ({
  estimateNetWorth: vi.fn((player: Player) => player.money),
}))

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

describe('rankPlayers', () => {
  it('ranks players by net worth, richest first', () => {
    const players = [
      makePlayer({ id: 'p1', money: 10_000 }),
      makePlayer({ id: 'p2', money: 40_000 }),
    ]
    const ranks = rankPlayers(players, 'normal')
    expect(ranks.get('p1')).toEqual({ netWorth: 10_000, rank: 2 })
    expect(ranks.get('p2')).toEqual({ netWorth: 40_000, rank: 1 })
  })

  it('shares a rank between two players tied on net worth', () => {
    const players = [
      makePlayer({ id: 'p1', money: 10_000 }),
      makePlayer({ id: 'p2', money: 10_000 }),
      makePlayer({ id: 'p3', money: 5_000 }),
    ]
    const ranks = rankPlayers(players, 'normal')
    // Alice and Bob are tied for 1st; Cy is 3rd, not 2nd or 4th.
    expect(ranks.get('p1')?.rank).toBe(1)
    expect(ranks.get('p2')?.rank).toBe(1)
    expect(ranks.get('p3')?.rank).toBe(3)
  })

  it('keys the map by player id so callers can render in seat order', () => {
    const players = [
      makePlayer({ id: 'p1', money: 10_000 }),
      makePlayer({ id: 'p2', money: 40_000 }),
    ]
    const ranks = rankPlayers(players, 'normal')
    expect([...ranks.keys()].sort()).toEqual(['p1', 'p2'])
  })

  it("prices net worth in the game's own edition", () => {
    rankPlayers([makePlayer({ id: 'p1' })], 'normal', 'japan')
    expect(vi.mocked(estimateNetWorth)).toHaveBeenLastCalledWith(
      expect.objectContaining({ id: 'p1' }),
      'normal',
      editionFor('japan'),
    )
  })
})
