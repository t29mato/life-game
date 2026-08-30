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

    /*
     * Cut at `payday1`, not handed over whole: the pawn hops as far as the
     * tile that owes it a card and stops *on* it, and the rest of the road
     * waits in `pendingPath` for `settle` to hand back once that card has
     * been read. See `nextMovementLeg`.
     */
    expect(next.movementPath).toEqual(['a', 'payday1'])
    expect(next.pendingPath).toEqual(['fork'])
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

  /*
   * The two presses a fork asks for. One roll used to answer both questions,
   * which put the far road's opening tiles out of reach entirely: nothing
   * under a 4 goes down it, and a 4 is already four tiles past the first of
   * them. `longBranch` is that first tile here — the fixture's stand-in for
   * Straight to Work's own career fair.
   */
  describe('standing on a fork', () => {
    const onTheFork = () =>
      fixtureState({
        board: fixtureMovementBoard(),
        players: [fixturePlayer({ spaceId: 'fork' })],
        phase: 'awaitingSpin',
      })

    it('spends the first roll on the road alone, and moves nobody', () => {
      const state = onTheFork()

      const next = spin(state, { random: createFakeRandom({ spins: [5] }) })

      expect(next.phase).toBe('awaitingDistanceSpin')
      expect(next.chosenExit).toBe('longBranch')
      expect(next.lastSpin).toBe(5)
      // Still on the fork, with nothing to animate: the car has been pointed
      // down a road, not sent along it.
      expect(next.players[0]!.spaceId).toBe('fork')
      expect(next.movementPath).toEqual([])
      expect(next.log[next.log.length - 1]!.message).toContain('Long Branch')
    })

    it("travels the second roll's own number, not the one that picked the road", () => {
      const picked = spin(onTheFork(), { random: createFakeRandom({ spins: [5] }) })

      const next = spin(picked, { random: createFakeRandom({ spins: [1] }) })

      // A 1 down a road only a 4, 5 or 6 could reach: the first tile of the
      // lane, which no single-roll fork could ever have landed on.
      expect(next.phase).toBe('moving')
      expect(next.lastSpin).toBe(1)
      expect(next.movementPath).toEqual(['longBranch'])
      expect(next.players[0]!.spaceId).toBe('longBranch')
      expect(next.chosenExit).toBeNull()
    })

    it('sends a low first roll down the other road, and travels that roll too', () => {
      const picked = spin(onTheFork(), { random: createFakeRandom({ spins: [2] }) })
      expect(picked.chosenExit).toBe('stopBranch')

      const next = spin(picked, { random: createFakeRandom({ spins: [6] }) })

      // `stopBranch` is a `stop`, so six steps still halt on it — the fork
      // being settled separately changes nothing about the road itself.
      expect(next.players[0]!.spaceId).toBe('stopBranch')
    })
  })

  it('logs the spin', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'start' })
    const state = fixtureState({ board, players: [player], phase: 'awaitingSpin' })
    const next = spin(state, { random: createFakeRandom({ spins: [1] }) })
    expect(next.log.length).toBeGreaterThan(state.log.length)
  })
})
