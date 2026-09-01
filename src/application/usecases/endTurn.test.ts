import { describe, expect, it } from 'vitest'
import { HOUSES } from '@domain/edition/usa'
import { STOCKS } from '@domain/edition/usa'
import { fixturePlayer, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { endTurn } from './endTurn'

describe('endTurn', () => {
  it('throws when the phase is not resolved', () => {
    const state = fixtureState({ phase: 'awaitingSpin' })
    expect(() => endTurn(state, { random: createFakeRandom() })).toThrow(/resolved/)
  })

  it('clears lastEvent, lastSpin and movementPath', () => {
    const players = [fixturePlayer({ id: 'p1' }), fixturePlayer({ id: 'p2' })]
    const state = fixtureState({
      players,
      phase: 'resolved',
      lastSpin: 5,
      movementPath: ['x'],
      lastEvent: {
        spaceId: 'x',
        title: 'X',
        description: '',
        icon: 'space:payday',
        tone: 'blue',
        moneyDelta: 0,
        lifeTilesGained: [],
        notes: [],
      },
    })
    const next = endTurn(state, { random: createFakeRandom() })
    expect(next.lastEvent).toBeNull()
    expect(next.lastSpin).toBeNull()
    expect(next.movementPath).toEqual([])
  })

  it('advances to the next player without incrementing turn mid-round', () => {
    const players = [fixturePlayer({ id: 'p1' }), fixturePlayer({ id: 'p2' }), fixturePlayer({ id: 'p3' })]
    const state = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved', turn: 1 })
    const next = endTurn(state, { random: createFakeRandom() })
    expect(next.currentPlayerIndex).toBe(1)
    expect(next.turn).toBe(1)
    expect(next.phase).toBe('awaitingSpin')
  })

  it('wraps around to the first player and increments turn', () => {
    const players = [fixturePlayer({ id: 'p1' }), fixturePlayer({ id: 'p2' })]
    const state = fixtureState({ players, currentPlayerIndex: 1, phase: 'resolved', turn: 1 })
    const next = endTurn(state, { random: createFakeRandom() })
    expect(next.currentPlayerIndex).toBe(0)
    expect(next.turn).toBe(2)
  })

  it('skips retired players when picking the next player', () => {
    const players = [
      fixturePlayer({ id: 'p1' }),
      fixturePlayer({ id: 'p2', isRetired: true, retirementRank: 1 }),
      fixturePlayer({ id: 'p3' }),
    ]
    const state = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved' })
    const next = endTurn(state, { random: createFakeRandom() })
    expect(next.currentPlayerIndex).toBe(2)
  })

  it('ends the game once every player has retired', () => {
    const players = [
      fixturePlayer({ id: 'p1', money: 100_000, isRetired: true, retirementRank: 1 }),
      fixturePlayer({ id: 'p2', money: 0, isRetired: true, retirementRank: 2 }),
    ]
    const state = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved' })
    const next = endTurn(state, { random: createFakeRandom() })

    expect(next.phase).toBe('gameOver')
    expect(next.results).not.toBeNull()
    expect(next.results!.standings).toHaveLength(2)
    for (let i = 1; i < next.results!.standings.length; i += 1) {
      expect(next.results!.standings[i - 1]!.total).toBeGreaterThanOrEqual(next.results!.standings[i]!.total)
    }
    expect(next.results!.standings.some((s) => s.playerId === next.results!.winnerId)).toBe(true)
    // richer player with the earlier retirement rank should come out ahead
    expect(next.results!.winnerId).toBe('p1')
  })

  /*
   * The last retirement used to *be* the scoring: `computeResults` ran in the
   * same tick, every house and every holding drew a uniform integer out of the
   * random port, and the player met the finished figures on the results screen
   * having pressed nothing. These tests used to assert that draw. What they
   * assert now is that `endTurn` decides nothing at all about what anything
   * was worth — it only opens the settlement and hands over the dice still
   * owed. See `scoreRoll.test.ts` for what the dice then do.
   */
  it('opens the settlement instead of valuing anything once everybody has retired', () => {
    const house = HOUSES[0]!
    const stock = STOCKS[0]!
    const players = [
      fixturePlayer({
        id: 'p1',
        house,
        stocks: [{ stockId: stock.id, shares: 2 }],
        isRetired: true,
        retirementRank: 1,
      }),
      fixturePlayer({ id: 'p2', isRetired: true, retirementRank: 2 }),
    ]
    const state = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved' })
    const random = createFakeRandom()
    const next = endTurn(state, { random })

    expect(next.phase).toBe('scoring')
    expect(next.results).toBeNull()
    expect(next.scoreRolls).toEqual([
      { playerId: 'p1', kind: 'house', face: null },
      { playerId: 'p1', kind: 'market', face: null },
    ])
    // The whole point: nothing was rolled here. Not a die, not an integer.
    expect(random.calls.spins).toBe(0)
    expect(random.calls.ints).toEqual([])
  })

  it('owes one die per asset class, house before shares, in seat order', () => {
    const house = HOUSES[0]!
    const stock = STOCKS[0]!
    const players = [
      fixturePlayer({ id: 'p1', house, isRetired: true, retirementRank: 1 }),
      fixturePlayer({ id: 'p2', stocks: [{ stockId: stock.id, shares: 3 }], isRetired: true, retirementRank: 2 }),
      fixturePlayer({
        id: 'p3',
        house,
        stocks: [{ stockId: stock.id, shares: 1 }],
        isRetired: true,
        retirementRank: 3,
      }),
    ]
    const state = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved' })
    const next = endTurn(state, { random: createFakeRandom() })

    expect(next.scoreRolls.map((roll) => `${roll.playerId}:${roll.kind}`)).toEqual([
      'p1:house',
      'p2:market',
      'p3:house',
      'p3:market',
    ])
  })

  /*
   * Nothing to settle, so no ceremony: a table where nobody bought a home or
   * a share owes no dice and goes straight to the results, rather than being
   * made to press through an empty step with nothing riding on it.
   */
  it('goes straight to gameOver when nobody owns anything to value', () => {
    const players = [
      fixturePlayer({ id: 'p1', money: 100_000, stocks: [], isRetired: true, retirementRank: 1 }),
      fixturePlayer({ id: 'p2', money: 0, stocks: [], isRetired: true, retirementRank: 2 }),
    ]
    const state = fixtureState({ players, currentPlayerIndex: 0, phase: 'resolved' })
    const next = endTurn(state, { random: createFakeRandom() })

    expect(next.scoreRolls).toEqual([])
    expect(next.phase).toBe('gameOver')
    expect(next.results!.standings.every((standing) => standing.stockValue === 0)).toBe(true)
    expect(next.results!.standings.every((standing) => standing.houseValue === 0)).toBe(true)
  })
})
