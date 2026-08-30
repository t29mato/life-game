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

  it('resolves one item off the passed-item queue as its own named card, not folded into the landing', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'fork', money: 1_000 })
    const state = fixtureState({
      board,
      players: [player],
      phase: 'moving',
      stepsRemaining: 1,
      movementPath: ['a', 'payday1', 'fork'],
      pendingPassedItems: [{ kind: 'payday', spaceId: 'payday1' }],
    })

    const next = settle(state, { random: createFakeRandom({ spins: [4] }) })

    // The queue drains before the fork it was standing on even gets a look —
    // "Fork" itself is never mentioned in this card.
    expect(next.phase).toBe('passingEvent')
    expect(next.activePassedEvent?.title).toBe('Payday')
    // Nobody pressed anything for this tile, so the card carries the die that
    // paid it — that is what lets the shell throw the roll on screen before
    // the card is readable, rather than leaving it as a line of prose about
    // a number the player never watched arrive.
    expect(next.activePassedEvent?.rolled).toBe(4)
    expect(next.pendingPassedItems).toEqual([])
    expect(next.movementPath).toEqual([])
    // Not resolved yet: the fork this move was still owed is still owed.
    expect(next.stepsRemaining).toBe(1)
  })

  it('drains every item in the queue, in order, before finally reaching the fork it was standing on', () => {
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'fork', money: 1_000 })
    const state = fixtureState({
      board,
      players: [player],
      phase: 'moving',
      stepsRemaining: 1,
      pendingPassedItems: [
        { kind: 'payday', spaceId: 'payday1' },
        { kind: 'event', spaceId: 'stopBranch' },
      ],
    })

    const afterFirst = settle(state, { random: createFakeRandom() })
    expect(afterFirst.phase).toBe('passingEvent')
    expect(afterFirst.activePassedEvent?.title).toBe('Payday')
    expect(afterFirst.pendingPassedItems).toHaveLength(1)

    // Dismissing the card is just calling `settle` again — no separate command.
    const afterSecond = settle(afterFirst, { random: createFakeRandom() })
    expect(afterSecond.phase).toBe('passingEvent')
    expect(afterSecond.pendingPassedItems).toEqual([])
    // `stopBranch` pays a flat bonus: no die was consulted, so there is none
    // to show, and the card arrives complete exactly as it always has.
    expect(afterSecond.activePassedEvent?.rolled).toBeUndefined()

    const afterQueue = settle(afterSecond, { random: createFakeRandom() })
    expect(afterQueue.phase).toBe('moving')
    expect(afterQueue.movementPath).toEqual(['stopBranch'])
    expect(afterQueue.stepsRemaining).toBe(0)
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
      stepsRemaining: 3,
      movementPath: [],
    })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('moving')
    expect(next.pendingDecision).toBeNull()
    // stopBranch is a forced stop, so all 3 owed steps land the player
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
    // longBranch → mid → merge → final → retirement: none of the four is a
    // forced stop, so all 6 owed steps carry the player the whole way to the
    // terminal space — but `mid` is a payday, so the hop is cut there and
    // the rest of it waits in `pendingPath` for that card to be read.
    expect(next.movementPath).toEqual(['longBranch', 'mid'])
    expect(next.pendingPath).toEqual(['merge', 'final', 'retirement'])
    expect(next.pendingPassedItems).toEqual([{ kind: 'payday', spaceId: 'mid' }])
  })

  /*
   * The pause, and then the carrying on. This is the whole of what a sweep
   * past a payday looks like now: hop to it, stop on it, read the card, and
   * only then hop onward — where before the pawn crossed the entire distance
   * in one uninterrupted sweep and was handed the cards afterwards, standing
   * on a tile that had nothing to do with any of them.
   */
  it('hands back the rest of the road once a swept-past card is dismissed', () => {
    const state = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining: 6,
      movementPath: [],
    })

    // The first leg, and the card it ends on.
    const moving = settle(state, { random: createFakeRandom() })
    const carded = settle(moving, { random: createFakeRandom() })
    expect(carded.phase).toBe('passingEvent')
    expect(carded.activePassedEvent).not.toBeNull()
    // Nothing hops while a card is up.
    expect(carded.movementPath).toEqual([])
    expect(carded.pendingPath).toEqual(['merge', 'final', 'retirement'])

    // Dismissed: the pawn carries on, and with nothing else queued the rest
    // of the road is one last leg.
    const onward = settle(carded, { random: createFakeRandom() })
    expect(onward.phase).toBe('moving')
    expect(onward.activePassedEvent).toBeNull()
    expect(onward.movementPath).toEqual(['merge', 'final', 'retirement'])
    expect(onward.pendingPath).toEqual([])
  })

  it('animates a move that sweeps past nothing in one uninterrupted hop', () => {
    const state = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining: 3,
      movementPath: [],
    })

    const next = settle(state, { random: createFakeRandom() })

    // stopBranch halts the move outright, so there is nothing to sweep past
    // and nothing to cut: exactly the hop this has always been.
    expect(next.movementPath).toEqual(['stopBranch'])
    expect(next.pendingPath).toEqual([])
    expect(next.pendingPassedItems).toEqual([])
  })
})
