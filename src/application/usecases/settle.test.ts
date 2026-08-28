import { describe, expect, it } from 'vitest'
import { fixtureMovementBoard, fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { settle } from './settle'

describe('settle', () => {
  it('throws when the phase is not moving', () => {
    const state = fixtureState({ board: fixtureMovementBoard(), phase: 'awaitingSpin' })
    expect(() => settle(state, { random: createFakeRandom() })).toThrow(/moving/)
  })

  it('raises a branch decision when stopped at a fork with steps remaining', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'fork' })
    const state = fixtureState({ board, players: [player], phase: 'moving', stepsRemaining: 1 })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('awaitingDecision')
    expect(next.pendingDecision).not.toBeNull()
    expect(next.pendingDecision!.kind).toBe('branch')
    const ids = next.pendingDecision!.options.map((o) => o.id)
    expect(ids).toEqual(['stopBranch', 'longBranch'])
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
      passedPaydayNote: 'Player passes payday: $500.',
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.lastEvent!.notes).toContain('Player passes payday: $500.')
    expect(next.passedPaydayNote).toBeNull()
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

describe('a fork explains what the spin bought', () => {
  /*
   * A fork stops the pawn before it moves at all, so without this the spin
   * reads as having been ignored: the wheel lands, a card appears, and the car
   * has not budged. A playtester reported exactly that, believing a second
   * spin was needed to move.
   */
  it('tells the player how far they are about to travel', () => {
    const state = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining: 4,
      movementPath: [],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('awaitingDecision')
    expect(next.pendingDecision?.prompt).toContain('4 spaces')
  })

  it('says it in the singular for a single space', () => {
    const state = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining: 1,
      movementPath: [],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.pendingDecision?.prompt).toContain('1 space down')
  })
})
