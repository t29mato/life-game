import { describe, expect, it } from 'vitest'
import { BASIC_CAREERS } from '@domain/edition/usa'
import { fixtureMovementBoard, fixturePlayer, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { spin } from './spin'

/** A career paid by contract: one payday is one predictable figure. */
const SALARIED_CAREER = BASIC_CAREERS.find((career) => career.payPerPip === undefined)!

describe('spin', () => {
  it('throws when the phase is not awaitingSpin', () => {
    const state = fixtureState({ board: fixtureMovementBoard(), phase: 'moving' })
    expect(() => spin(state, { random: createFakeRandom() })).toThrow(/awaitingSpin/)
  })

  it('moves the player, records the spin, and switches to moving', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'start' })
    const state = fixtureState({ board, players: [player], phase: 'awaitingSpin' })

    const next = spin(state, { random: createFakeRandom({ spins: [2] }) })

    expect(next.lastSpin).toBe(2)
    expect(next.phase).toBe('moving')
    // 2 steps from start: a, payday1 — lands exactly on the payday space, no pass-through pay
    expect(next.movementPath).toEqual(['a', 'payday1'])
    expect(next.stepsRemaining).toBe(0)
    expect(next.players[0]!.spaceId).toBe('payday1')
  })

  it('queues, but does not yet pay, every payday passed through (not landed on)', () => {
    const board = fixtureMovementBoard()
    // Salaried, so the sum under test is the pass-through rule rather than the
    // wheel — what an unsteady trade collects on the way past is payday.test.ts's.
    const career = SALARIED_CAREER
    const player = fixturePlayer({ spaceId: 'start', career, money: 0 })
    const state = fixtureState({ board, players: [player], phase: 'awaitingSpin' })

    // 4 steps from start: a, payday1, fork — halts at the fork with 1 step owed,
    // having passed through (not landed on) payday1.
    const next = spin(state, { random: createFakeRandom({ spins: [4] }) })

    expect(next.movementPath).toEqual(['a', 'payday1', 'fork'])
    expect(next.stepsRemaining).toBe(1)
    /*
     * Queued for `settle` to pay out as its own card — named for `payday1`
     * — once the pawn's own hop animation has actually finished, not paid
     * the instant the store learns about it. See `PassedQueueItem`.
     */
    expect(next.pendingPassedItems).toEqual([{ kind: 'payday', spaceId: 'payday1' }])
    expect(next.players[0]!.money).toBe(0)
    expect(next.players[0]!.spaceId).toBe('fork')
  })

  it('does not pay when the destination is itself a payday space', () => {
    const board = fixtureMovementBoard()
    const career = BASIC_CAREERS[0]!
    const player = fixturePlayer({ spaceId: 'start', career, money: 0 })
    const state = fixtureState({ board, players: [player], phase: 'awaitingSpin' })

    const next = spin(state, { random: createFakeRandom({ spins: [2] }) })

    expect(next.players[0]!.spaceId).toBe('payday1')
    expect(next.players[0]!.money).toBe(0)
  })

  it('logs the spin', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'start' })
    const state = fixtureState({ board, players: [player], phase: 'awaitingSpin' })
    const next = spin(state, { random: createFakeRandom({ spins: [1] }) })
    expect(next.log.length).toBeGreaterThan(state.log.length)
  })
})
