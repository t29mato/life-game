import { describe, expect, it } from 'vitest'
import { fixtureMovementBoard, fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { settle } from './settle'

describe('settle', () => {
  it('throws when the phase is not moving', () => {
    const state = fixtureState({ board: fixtureMovementBoard(), phase: 'awaitingSpin' })
    expect(() => settle(state, { random: createFakeRandom() })).toThrow(/moving/)
  })

  it('resolves a fork reached mid-move with the roll still owed, instead of asking', () => {
    // 1 step owed: `resolveForkBranch` reads that as the roll, and 1 is a
    // "first road" number — same rule `spin.ts` uses when a player is
    // already standing on the fork at the top of their turn.
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'fork' })
    const state = fixtureState({ board, players: [player], phase: 'moving', stepsRemaining: 1 })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('moving')
    expect(next.pendingDecision).toBeNull()
    expect(next.movementPath).toEqual(['stopBranch'])
    expect(next.stepsRemaining).toBe(0)
    expect(next.log.some((entry) => entry.message.includes('Stop Branch'))).toBe(true)
  })

  it('applies the destination effect and resolves when there is no fork to choose', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'a', money: 1_000 })
    const state = fixtureState({
      board,
      players: [player],
      phase: 'moving',
      stepsRemaining: 0,
      movementPath: ['a'],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('resolved')
    expect(next.lastEvent).not.toBeNull()
    expect(next.movementPath).toEqual([])
    expect(next.stepsRemaining).toBe(0)
  })

  it('folds a payday passed along the way into the landing event\'s own notes, then clears it', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'a', money: 1_000 })
    const state = fixtureState({
      board,
      players: [player],
      phase: 'moving',
      stepsRemaining: 0,
      movementPath: ['a'],
      passedNotes: ['Player passes payday: $500.'],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.lastEvent!.notes).toContain('Player passes payday: $500.')
    expect(next.passedNotes).toEqual([])
  })

  it('goes to awaitingDecision instead of resolved when the landing effect itself needs a decision', () => {
    const board = fixtureMovementBoard()
    const careerSpace = fixtureSpace({ id: 'careerFair', effect: { type: 'chooseCareer', pool: 'basic' }, next: [] })
    const boardWithCareer = { ...board, spaces: { ...board.spaces, careerFair: careerSpace } }
    const player = fixturePlayer({ spaceId: 'careerFair' })
    const state = fixtureState({ board: boardWithCareer, players: [player], phase: 'moving', stepsRemaining: 0 })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('awaitingDecision')
    expect(next.pendingDecision!.kind).toBe('valueSpin')
    expect(next.lastEvent).toBeNull()
  })

  it('does not stop for a fork when there are no steps left over', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'fork' })
    const state = fixtureState({ board, players: [player], phase: 'moving', stepsRemaining: 0 })

    const next = settle(state, { random: createFakeRandom() })

    // fork's own effect is 'none', so it just resolves rather than asking to branch
    expect(next.phase).toBe('resolved')
  })
})

describe('a fork mid-move keeps the pawn moving, never stalls it on a question', () => {
  /*
   * A fork used to stop the pawn and ask which way, so a spin that reached
   * one mid-move read as having been ignored — the wheel landed, a card
   * appeared, and the car had not budged. A fork is the wheel's own call now
   * (see `spin.ts`), reached mid-move or not, so there is no longer a
   * question to stall on: the same roll that got the player this far keeps
   * them moving.
   */
  it('takes the first road on a low roll and keeps the full distance owed', () => {
    const state = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining: 4,
      movementPath: [],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('moving')
    expect(next.pendingDecision).toBeNull()
    // stopBranch is a forced stop, so all 4 owed steps land the player
    // exactly there regardless — see the second test for a roll that
    // actually has room to show its distance.
    expect(next.movementPath).toEqual(['stopBranch'])
  })

  it('takes the second road on a high roll', () => {
    const state = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining: 6,
      movementPath: [],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('moving')
    // longBranch → mid → merge → final → retirement: none of the four are a
    // forced stop, so all 6 owed steps carry the player the whole way to the
    // terminal space in one go.
    expect(next.movementPath).toEqual(['longBranch', 'mid', 'merge', 'final', 'retirement'])
  })
})
