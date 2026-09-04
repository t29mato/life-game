import { describe, expect, it } from 'vitest'
import { fixtureMovementBoard, fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { settle } from './settle'
import { spin } from './spin'

describe('settle', () => {
  it('throws when the phase is not moving', () => {
    const state = fixtureState({ board: fixtureMovementBoard(), phase: 'awaitingSpin' })
    expect(() => settle(state, { random: createFakeRandom() })).toThrow(/moving/)
  })

  it('parks the pawn at a fork reached mid-move and hands the road back to the wheel', () => {
    // The steps still owed are kept for the travel they were rolled for. They
    // used to pick the road as well — see the block below for why that was the
    // bug behind "the second fork always goes up".
    const board = fixtureMovementBoard()
    const player = fixturePlayer({ spaceId: 'fork' })
    const state = fixtureState({ board, players: [player], phase: 'moving', stepsRemaining: 1 })

    const next = settle(state, { random: createFakeRandom() })

    expect(next.phase).toBe('awaitingSpin')
    expect(next.pendingDecision).toBeNull()
    expect(next.chosenExit).toBeNull()
    expect(next.players[0]!.spaceId).toBe('fork')
    expect(next.movementPath).toEqual([])
    // The distance the board already promised is kept, not re-rolled: `spin`
    // spends it the moment the road is settled, so the pawn covers exactly
    // the ground it always did.
    expect(next.stepsRemaining).toBe(1)
    expect(next.log.some((entry) => entry.message.includes('the road splits'))).toBe(true)
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

    // Only once the queue is empty does the junction itself get a look, and
    // what it does is hand the road back to the wheel.
    const afterQueue = settle(afterSecond, { random: createFakeRandom() })
    expect(afterQueue.phase).toBe('awaitingSpin')
    expect(afterQueue.players[0]!.spaceId).toBe('fork')
    expect(afterQueue.movementPath).toEqual([])
    expect(afterQueue.stepsRemaining).toBe(1)
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

/**
 * The fix for "the second fork always goes up".
 *
 * A fork reached mid-move used to be settled by `stepsRemaining` — what was
 * left of a roll that had already spent at least a pip getting to the
 * junction. That number is never a 6, is a 5 only on a 6 thrown from the tile
 * next door, and piles up on 1, 2 and 3, which is the low half of the die and
 * therefore the *first* road every time — the one `layoutFork` draws above the
 * trunk. Measured across 40 seeded four-player games on all seven boards and
 * all three difficulties, the mid-career junction sent 73-86% of everyone who
 * reached it that way up the first road, while the two junctions a pawn always
 * comes to rest on (the start tile, and the `stop` at the estate agent's)
 * split 50/50 — because those two were already being settled by a press.
 *
 * So a junction now pauses the move: the pawn stops on it, `spin.ts` settles
 * the road on a throw of its own exactly as it always has for the start tile,
 * and the distance the move already owed is spent in the same breath rather
 * than re-rolled — so the pawn covers the same ground it always did and only
 * the road changes hands.
 */
describe('a fork mid-move is settled by a press of its own, not by the distance left over', () => {
  const atTheFork = (stepsRemaining: number) =>
    fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'moving',
      stepsRemaining,
      movementPath: [],
    })

  it.each([1, 2, 3, 4, 5, 6])('parks rather than branching, whatever the %i steps left owed', (owed) => {
    const next = settle(atTheFork(owed), { random: createFakeRandom() })

    expect(next.phase).toBe('awaitingSpin')
    expect(next.players[0]!.spaceId).toBe('fork')
    expect(next.chosenExit).toBeNull()
    // The owed distance survives the pause — see `spin.ts`, which spends it
    // the moment the road is settled rather than throwing for it again.
    expect(next.stepsRemaining).toBe(owed)
    expect(next.pendingPath).toEqual([])
  })

  /*
   * The heart of it: the road a player ends up on must not be a function of
   * how far they happened to be standing from the junction. Under the old rule
   * these twelve calls produced the first road for every owed distance of 1-3
   * and the second for every 4-6, whatever the wheel said — and since a
   * junction is reached with 1, 2 or 3 owed far more often than with 4 or 5,
   * and never with 6, "the fork always goes up" was the shape of it.
   */
  it.each([1, 2, 3, 4, 5, 6])('takes the road the wheel names, not the %i steps owed', (owed) => {
    const parked = settle(atTheFork(owed), { random: createFakeRandom() })

    // 2 is a low face and 5 a high one; the owed distance is the same in both.
    const low = spin(parked, { random: createFakeRandom({ spins: [2] }) })
    const high = spin(parked, { random: createFakeRandom({ spins: [5] }) })

    expect(low.log.some((entry) => entry.message.includes('Stop Branch'))).toBe(true)
    expect(high.log.some((entry) => entry.message.includes('Long Branch'))).toBe(true)
  })

  it('spends the distance the move already owed rather than throwing for it again', () => {
    const parked = settle(atTheFork(3), { random: createFakeRandom() })
    const moved = spin(parked, { random: createFakeRandom({ spins: [5] }) })

    // One press, not two: the road is settled and the three owed steps carry
    // the pawn down it in the same breath.
    expect(moved.phase).toBe('moving')
    expect(moved.chosenExit).toBeNull()
    expect(moved.log.some((entry) => entry.message.includes('3 spaces down it'))).toBe(true)
  })

  /*
   * Leg-cutting is unchanged and still lives here: a card just dismissed with
   * road still owed hands back the next hop rather than the next card.
   */
  it('hands back the rest of the road once a swept-past card is dismissed', () => {
    const carded = fixtureState({
      board: fixtureMovementBoard(),
      players: [fixturePlayer({ id: 'p1', spaceId: 'mid' })],
      currentPlayerIndex: 0,
      phase: 'passingEvent',
      stepsRemaining: 0,
      movementPath: [],
      pendingPath: ['merge', 'final'],
    })

    const onward = settle(carded, { random: createFakeRandom() })

    expect(onward.phase).toBe('moving')
    expect(onward.activePassedEvent).toBeNull()
    expect(onward.movementPath).toEqual(['merge', 'final'])
    expect(onward.pendingPath).toEqual([])
  })
})

