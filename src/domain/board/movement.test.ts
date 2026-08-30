import { describe, expect, it } from 'vitest'
import type { Board, Space } from '../model/types'
import { planMovement, planMovementVia } from './movement'

function space(overrides: Partial<Space> & Pick<Space, 'id' | 'next'>): Space {
  return {
    kind: 'normal',
    title: overrides.id,
    description: 'A test space.',
    effect: { type: 'none' },
    layout: { x: 0, y: 0 },
    tone: 'blue',
    icon: 'space:payday',
    ...overrides,
  }
}

/** A -> B -> C -> D -> E (linear, E is retirement) */
function linearBoard(): Board {
  const spaces: Space[] = [
    space({ id: 'a', next: ['b'] }),
    space({ id: 'b', next: ['c'] }),
    space({ id: 'c', next: ['d'] }),
    space({ id: 'd', next: ['e'] }),
    space({ id: 'e', kind: 'retirement', next: [], effect: { type: 'retire' } }),
  ]
  return {
    spaces: Object.fromEntries(spaces.map((s) => [s.id, s])),
    startSpaceId: 'a',
    retirementSpaceId: 'e',
    width: 10,
    height: 10,
  }
}

/** A -> B -> FORK(C1|C2) -> both rejoin at D -> E(retirement) */
function forkBoard(): Board {
  const spaces: Space[] = [
    space({ id: 'a', next: ['b'] }),
    space({ id: 'b', next: ['fork'] }),
    space({ id: 'fork', next: ['c1', 'c2'] }),
    space({ id: 'c1', next: ['d'] }),
    space({ id: 'c2', next: ['d'] }),
    space({ id: 'd', next: ['e'] }),
    space({ id: 'e', kind: 'retirement', next: [], effect: { type: 'retire' } }),
  ]
  return {
    spaces: Object.fromEntries(spaces.map((s) => [s.id, s])),
    startSpaceId: 'a',
    retirementSpaceId: 'e',
    width: 10,
    height: 10,
  }
}

/** A -> PAYDAY(B) -> C -> STOP(D) -> PAYDAY(E) -> F(retirement) */
function paydayStopBoard(): Board {
  const spaces: Space[] = [
    space({ id: 'a', next: ['b'] }),
    space({ id: 'b', kind: 'payday', next: ['c'], effect: { type: 'payday' } }),
    space({ id: 'c', next: ['d'] }),
    space({ id: 'd', kind: 'stop', next: ['e'], effect: { type: 'chooseCareer', pool: 'basic' } }),
    space({ id: 'e', kind: 'payday', next: ['f'], effect: { type: 'payday' } }),
    space({ id: 'f', kind: 'retirement', next: [], effect: { type: 'retire' } }),
  ]
  return {
    spaces: Object.fromEntries(spaces.map((s) => [s.id, s])),
    startSpaceId: 'a',
    retirementSpaceId: 'f',
    width: 10,
    height: 10,
  }
}

describe('planMovement', () => {
  it('walks a straight line for the given number of steps', () => {
    const plan = planMovement(linearBoard(), 'a', 2)
    expect(plan).toEqual({
      path: ['b', 'c'],
      destinationId: 'c',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [],
    })
  })

  it('returns the origin as destination when steps is 0', () => {
    const plan = planMovement(linearBoard(), 'b', 0)
    expect(plan).toEqual({
      path: [],
      destinationId: 'b',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [],
    })
  })

  it('halts at a fork before stepping off it, keeping steps owed', () => {
    // Reaching the fork tile itself is an ordinary step; only stepping *off*
    // it needs a decision, so the fork id lands in `path` and consumes a step.
    const plan = planMovement(forkBoard(), 'a', 5)
    expect(plan).toEqual({
      path: ['b', 'fork'],
      destinationId: 'fork',
      stepsRemaining: 3,
      stoppedBy: 'fork',
      passed: [],
    })
  })

  it('halts immediately with an empty path when starting on a fork', () => {
    const plan = planMovement(forkBoard(), 'fork', 3)
    expect(plan).toEqual({
      path: [],
      destinationId: 'fork',
      stepsRemaining: 3,
      stoppedBy: 'fork',
      passed: [],
    })
  })

  it('passes over a fork-less landing exactly onto the space before it', () => {
    const plan = planMovement(forkBoard(), 'a', 1)
    expect(plan.destinationId).toBe('b')
    expect(plan.stoppedBy).toBe('stepsExhausted')
  })

  it('forfeits leftover steps when it enters a forced stop', () => {
    const plan = planMovement(paydayStopBoard(), 'c', 5)
    expect(plan).toEqual({
      path: ['d'],
      destinationId: 'd',
      stepsRemaining: 0,
      stoppedBy: 'forcedStop',
      passed: [],
    })
  })

  it('counts a payday passed through but not one landed on', () => {
    const passedThrough = planMovement(paydayStopBoard(), 'a', 2)
    expect(passedThrough).toEqual({
      path: ['b', 'c'],
      destinationId: 'c',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [{ kind: 'payday', spaceId: 'b' }],
    })

    const landedOn = planMovement(paydayStopBoard(), 'a', 1)
    expect(landedOn).toEqual({
      path: ['b'],
      destinationId: 'b',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [],
    })
  })

  it('halts on entering retirement even with steps to spare', () => {
    const plan = planMovement(paydayStopBoard(), 'e', 10)
    expect(plan).toEqual({
      path: ['f'],
      destinationId: 'f',
      stepsRemaining: 0,
      stoppedBy: 'terminal',
      passed: [],
    })
  })

  it('halts immediately when starting on the retirement space', () => {
    const plan = planMovement(linearBoard(), 'e', 4)
    expect(plan).toEqual({
      path: [],
      destinationId: 'e',
      stepsRemaining: 0,
      stoppedBy: 'terminal',
      passed: [],
    })
  })

  it('walks through multiple paydays before exhausting steps', () => {
    const plan = planMovement(paydayStopBoard(), 'a', 4)
    // a -> b(payday, passed) -> c -> d(stop) halts forced stop before payday e
    expect(plan.stoppedBy).toBe('forcedStop')
    expect(plan.destinationId).toBe('d')
    expect(plan.passed).toEqual([{ kind: 'payday', spaceId: 'b' }])
  })
})

describe('planMovementVia', () => {
  it('throws a descriptive error when the branch is not one of the forks next spaces', () => {
    expect(() => planMovementVia(forkBoard(), 'fork', 'd', 3)).toThrow(/not a (valid )?branch/i)
  })

  it('steps onto the chosen branch and continues with the remaining steps', () => {
    const plan = planMovementVia(forkBoard(), 'fork', 'c1', 2)
    expect(plan).toEqual({
      path: ['c1', 'd'],
      destinationId: 'd',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [],
    })
  })

  it('continues all the way into retirement when enough steps remain', () => {
    const plan = planMovementVia(forkBoard(), 'fork', 'c1', 3)
    expect(plan).toEqual({
      path: ['c1', 'd', 'e'],
      destinationId: 'e',
      stepsRemaining: 0,
      stoppedBy: 'terminal',
      passed: [],
    })
  })

  it('stops immediately after the chosen step when that step alone exhausts steps', () => {
    const plan = planMovementVia(forkBoard(), 'fork', 'c2', 1)
    expect(plan).toEqual({
      path: ['c2'],
      destinationId: 'c2',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [],
    })
  })

  it('applies forced-stop rules to the chosen branch', () => {
    const board = paydayStopBoard()
    // pretend "c" is a fork onto "d" (stop) for this test by reusing the linear next
    const plan = planMovementVia(board, 'c', 'd', 5)
    expect(plan).toEqual({
      path: ['d'],
      destinationId: 'd',
      stepsRemaining: 0,
      stoppedBy: 'forcedStop',
      passed: [],
    })
  })

  it('applies retirement rules to the chosen branch', () => {
    const plan = planMovementVia(paydayStopBoard(), 'e', 'f', 6)
    expect(plan).toEqual({
      path: ['f'],
      destinationId: 'f',
      stepsRemaining: 0,
      stoppedBy: 'terminal',
      passed: [],
    })
  })

  it('counts a payday on the chosen branch when passed through, not when landed on', () => {
    const board = paydayStopBoard()
    const passedThrough = planMovementVia(board, 'a', 'b', 2)
    expect(passedThrough).toEqual({
      path: ['b', 'c'],
      destinationId: 'c',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [{ kind: 'payday', spaceId: 'b' }],
    })

    const landedOn = planMovementVia(board, 'a', 'b', 1)
    expect(landedOn).toEqual({
      path: ['b'],
      destinationId: 'b',
      stepsRemaining: 0,
      stoppedBy: 'stepsExhausted',
      passed: [],
    })
  })

  it('can chain into a second fork after resuming from the first', () => {
    const spaces: Space[] = [
      space({ id: 'start', next: ['fork1'] }),
      space({ id: 'fork1', next: ['x', 'y'] }),
      space({ id: 'x', next: ['fork2'] }),
      space({ id: 'y', next: ['fork2'] }),
      space({ id: 'fork2', next: ['p', 'q'] }),
      space({ id: 'p', next: [] }),
      space({ id: 'q', next: [] }),
    ]
    const board: Board = {
      spaces: Object.fromEntries(spaces.map((s) => [s.id, s])),
      startSpaceId: 'start',
      retirementSpaceId: 'p',
      width: 10,
      height: 10,
    }
    const plan = planMovementVia(board, 'fork1', 'x', 3)
    expect(plan).toEqual({
      path: ['x', 'fork2'],
      destinationId: 'fork2',
      stepsRemaining: 1,
      stoppedBy: 'fork',
      passed: [],
    })
  })
})

describe('sanity integration with a real board shape', () => {
  it('planMovement never throws for any space id on a self-built board', () => {
    const board = forkBoard()
    for (const id of Object.keys(board.spaces)) {
      expect(() => planMovement(board, id, 3)).not.toThrow()
    }
  })
})
