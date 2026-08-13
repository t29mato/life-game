import type { Board, GameState, Player, Space, Stock } from '@domain/model/types'

/**
 * Hand-built fixtures for application-layer tests. Deliberately independent
 * of `createBoard()`/`createPlayer()` so most of the test suite does not need
 * the domain's board/rules modules to exist yet — only the frozen types.
 */

export function fixturePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Alex',
    color: 'red',
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

/** A stock whose numbers are round, so expected-value assertions stay readable. */
export function fixtureStock(overrides: Partial<Stock> = {}): Stock {
  return {
    id: 'stock-test',
    name: 'Test Holdings',
    ticker: 'TEST',
    price: 50_000,
    payoutRange: [40_000, 80_000],
    icon: 'stock:orbital-freight',
    description: 'A test holding.',
    ...overrides,
  }
}

export function fixtureSpace(overrides: Partial<Space> = {}): Space {
  return {
    id: 'space-1',
    kind: 'normal',
    title: 'Test Space',
    description: 'A test space.',
    effect: { type: 'none' },
    next: ['space-2'],
    layout: { x: 0, y: 0 },
    tone: 'blue',
    icon: 'space:payday',
    ...overrides,
  }
}

/** Builds a `Board` whose `spaces` record is indexed by each space's own id. */
export function fixtureBoard(spaces: readonly Space[], overrides: Partial<Board> = {}): Board {
  const record: Record<string, Space> = {}
  for (const space of spaces) record[space.id] = space
  return {
    spaces: record,
    startSpaceId: spaces[0]?.id ?? 'start',
    retirementSpaceId: spaces[spaces.length - 1]?.id ?? 'retirement',
    width: 100,
    height: 100,
    ...overrides,
  }
}

/**
 * A small hand-built board exercising every movement shape the use cases
 * care about: a payday to pass through, a fork, a `stop` branch, a `payday`
 * landed on mid-branch, and a `retirement` terminal.
 *
 * ```
 * start -> a -> payday1 -> fork -+-> stopBranch (stop) -----> merge -> final -> retirement
 *                                 +-> longBranch -> mid (payday) -^
 * ```
 */
export function fixtureMovementBoard(): Board {
  const spaces: Space[] = [
    fixtureSpace({ id: 'start', kind: 'start', title: 'Start', effect: { type: 'none' }, next: ['a'] }),
    fixtureSpace({ id: 'a', kind: 'normal', title: 'A', effect: { type: 'none' }, next: ['payday1'] }),
    fixtureSpace({ id: 'payday1', kind: 'payday', title: 'Payday', effect: { type: 'payday' }, next: ['fork'] }),
    fixtureSpace({
      id: 'fork',
      kind: 'normal',
      title: 'Fork',
      effect: { type: 'none' },
      next: ['stopBranch', 'longBranch'],
    }),
    fixtureSpace({
      id: 'stopBranch',
      kind: 'stop',
      title: 'Stop Branch',
      effect: { type: 'gainMoney', amount: 500, reason: 'Bonus' },
      next: ['merge'],
    }),
    fixtureSpace({ id: 'longBranch', kind: 'normal', title: 'Long Branch', effect: { type: 'none' }, next: ['mid'] }),
    fixtureSpace({ id: 'mid', kind: 'payday', title: 'Mid Payday', effect: { type: 'payday' }, next: ['merge'] }),
    fixtureSpace({ id: 'merge', kind: 'normal', title: 'Merge', effect: { type: 'none' }, next: ['final'] }),
    fixtureSpace({
      id: 'final',
      kind: 'normal',
      title: 'Final',
      effect: { type: 'payMoney', amount: 200, reason: 'Toll' },
      next: ['retirement'],
    }),
    fixtureSpace({ id: 'retirement', kind: 'retirement', title: 'Retirement', effect: { type: 'retire' }, next: [] }),
  ]
  return fixtureBoard(spaces, { startSpaceId: 'start', retirementSpaceId: 'retirement' })
}

export function fixtureState(overrides: Partial<GameState> = {}): GameState {
  const board = fixtureBoard([fixtureSpace({ id: 'start', kind: 'start', next: [] })])
  const player = fixturePlayer()
  return {
    board,
    boardLength: 'standard',
    editionId: 'usa',
    difficulty: 'normal',
    players: [player],
    currentPlayerIndex: 0,
    phase: 'awaitingSpin',
    pendingDecision: null,
    lastSpin: null,
    movementPath: [],
    stepsRemaining: 0,
    chosenExit: null,
    lastEvent: null,
    log: [],
    turn: 1,
    results: null,
    ...overrides,
  }
}
