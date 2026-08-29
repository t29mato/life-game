import { describe, expect, it } from 'vitest'
import type { Board, Decision, DecisionOption, GameState, Player, Space } from '@domain/model/types'
import { CASUAL_WAGE_PER_PIP, EARLY_LOAN_REPAYMENT, INSURANCE_PREMIUM } from '@domain/model/constants'
import { AVERAGE_SPIN } from '@domain/rules/player'
import { BASIC_CAREERS, EDITION_USA, GRADUATE_CAREERS } from '@domain/edition/usa'
import { hiringPoolFor } from '@domain/edition/lookup'
import { HOUSES } from '@domain/edition/usa'
import { STOCKS } from '@domain/edition/usa'
import {
  BANK_DECLINE_OPTION_ID,
  BANK_LOAN_OPTION_ID,
  BANK_REPAY_OPTION_ID,
  CAREER_STAY_OPTION_ID,
  DECLINE_HOUSE_OPTION_ID,
  DECLINE_INSURANCE_OPTION_ID,
  DECLINE_STOCK_OPTION_ID,
  VALUE_SPIN_OPTION_ID,
  insuranceOptionId,
} from '../usecases/applyEffect'
import { fixtureBoard, fixtureMovementBoard, fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { CPU_THINK_MS, decideCpuCommand, meanFairSalary, valueOfSpace } from './decideCpuCommand'

function cpu(overrides: Partial<Player> = {}): Player {
  return fixturePlayer({ id: 'cpu', name: 'Botly', isCpu: true, spaceId: 'a', ...overrides })
}

function options(...ids: string[]): DecisionOption[] {
  return ids.map((id) => ({ id, label: id, description: '', icon: 'space:payday' }))
}

function decision(kind: Decision['kind'], ...ids: string[]): Decision {
  return { kind, prompt: 'Pick one', options: options(...ids) }
}

/** A career fair or career-change tile, wheel-decided: Spin, and Stay if `mayStay`. */
function careerSpinDecision(offeredCareerIds: readonly [string, string], mayStay = false): Decision {
  const spinOptions = options(VALUE_SPIN_OPTION_ID, ...(mayStay ? [CAREER_STAY_OPTION_ID] : []))
  return { kind: 'valueSpin', prompt: 'Pick one', options: spinOptions, offeredCareerIds }
}

/** A state parked in `awaitingDecision` with a computer seat to move. */
function deciding(pendingDecision: Decision, player: Player = cpu(), board: Board = fixtureMovementBoard()): GameState {
  return fixtureState({
    board,
    players: [player, fixturePlayer({ id: 'human', name: 'Alex' })],
    currentPlayerIndex: 0,
    phase: 'awaitingDecision',
    pendingDecision,
  })
}

/** The id the CPU settles on, asserted to be one it was actually offered. */
function chosen(state: GameState): string {
  const command = decideCpuCommand(state)
  if (command?.type !== 'choose') throw new Error(`expected a choose command, got ${command?.type ?? 'null'}`)
  expect(state.pendingDecision!.options.map((option) => option.id)).toContain(command.optionId)
  return command.optionId
}

describe('CPU_THINK_MS', () => {
  it('paces every phase the CPU acts in, slowly enough to follow', () => {
    expect(Object.keys(CPU_THINK_MS).sort()).toEqual([
      'awaitingDecision',
      'awaitingSpin',
      'passingEvent',
      'resolved',
    ])
    for (const delay of Object.values(CPU_THINK_MS)) {
      expect(delay).toBeGreaterThan(0)
      expect(delay).toBeLessThanOrEqual(2_000)
    }
  })
})

describe('decideCpuCommand — who acts', () => {
  it('returns null when the current player is a person', () => {
    const state = fixtureState({ players: [fixturePlayer({ isCpu: false })], phase: 'awaitingSpin' })
    expect(decideCpuCommand(state)).toBeNull()
  })

  it('returns null when there is no current player at all', () => {
    const state = fixtureState({ players: [], currentPlayerIndex: 0, phase: 'awaitingSpin' })
    expect(decideCpuCommand(state)).toBeNull()
  })

  it('still ends the turn for a seat that has just retired', () => {
    // Retiring leaves that player current for one last `endTurn`; going quiet
    // here would strand the game on the retirement card forever.
    const state = fixtureState({
      players: [cpu({ isRetired: true, retirementRank: 1 })],
      phase: 'resolved',
    })
    expect(decideCpuCommand(state)).toEqual({ type: 'endTurn' })
  })

  it('only speaks for the seat whose turn it is', () => {
    const state = fixtureState({
      players: [fixturePlayer({ id: 'human', isCpu: false }), cpu()],
      currentPlayerIndex: 0,
      phase: 'awaitingSpin',
    })
    expect(decideCpuCommand(state)).toBeNull()
    expect(decideCpuCommand({ ...state, currentPlayerIndex: 1 })).toEqual({ type: 'spin' })
  })
})

describe('decideCpuCommand — phases', () => {
  it('spins when a spin is owed', () => {
    const state = fixtureState({ players: [cpu()], phase: 'awaitingSpin' })
    expect(decideCpuCommand(state)).toEqual({ type: 'spin' })
  })

  it('ends the turn once the landing is resolved', () => {
    const state = fixtureState({ players: [cpu()], phase: 'resolved' })
    expect(decideCpuCommand(state)).toEqual({ type: 'endTurn' })
  })

  it('stays quiet while the pawn is moving — that belongs to the animation', () => {
    const state = fixtureState({ players: [cpu()], phase: 'moving', movementPath: ['a'] })
    expect(decideCpuCommand(state)).toBeNull()
  })

  it('stays quiet in setup and after the game is over', () => {
    for (const phase of ['setup', 'gameOver'] as const) {
      expect(decideCpuCommand(fixtureState({ players: [cpu()], phase }))).toBeNull()
    }
  })

  it('stays quiet when awaitingDecision has no decision attached', () => {
    const state = fixtureState({ players: [cpu()], phase: 'awaitingDecision', pendingDecision: null })
    expect(decideCpuCommand(state)).toBeNull()
  })

  it('stays quiet rather than inventing an answer when a decision has no options', () => {
    const state = deciding({ kind: 'valueSpin', prompt: 'Pick one', options: [] })
    expect(decideCpuCommand(state)).toBeNull()
  })
})

describe('decideCpuCommand — careers', () => {
  it('spins for a career fair — the only button on the card', () => {
    const poor = BASIC_CAREERS.reduce((a, b) => (b.salary < a.salary ? b : a))
    const rich = GRADUATE_CAREERS.reduce((a, b) => (b.salary > a.salary ? b : a))
    expect(chosen(deciding(careerSpinDecision([poor.id, rich.id])))).toBe(VALUE_SPIN_OPTION_ID)
  })

  it('spins away from a job worth less than the offered pair averages', () => {
    const poor = BASIC_CAREERS.find((career) => career.id === 'career-grooming-assistant')!
    const rich = GRADUATE_CAREERS.reduce((a, b) => (b.salary > a.salary ? b : a))
    const state = deciding(
      careerSpinDecision([poor.id, rich.id], true),
      cpu({ career: poor, hasDegree: true }),
    )
    expect(chosen(state)).toBe(VALUE_SPIN_OPTION_ID)
  })

  it('stays in a job worth more than the offered pair averages', () => {
    const held = GRADUATE_CAREERS.reduce((a, b) => (b.salary > a.salary ? b : a))
    const poorA = BASIC_CAREERS[0]!
    const poorB = BASIC_CAREERS[1]!
    const state = deciding(
      careerSpinDecision([poorA.id, poorB.id], true),
      cpu({ career: held, hasDegree: true }),
    )
    expect(chosen(state)).toBe(CAREER_STAY_OPTION_ID)
  })

  it('has nothing to stay in and nothing to do but spin when it has no career at all', () => {
    const [a, b] = BASIC_CAREERS
    // mayStay is false whenever the player has no career to hold onto, same
    // as applyEffect's chooseCareer and any careerChange dealt to a player
    // between jobs — there is no decline to model, so no CAREER_STAY_OPTION_ID
    // is ever offered here.
    const state = deciding(careerSpinDecision([a!.id, b!.id]), cpu({ career: null }))
    expect(chosen(state)).toBe(VALUE_SPIN_OPTION_ID)
  })

  it('spins rather than freezing when an offered id is unknown to the catalogue', () => {
    const career = BASIC_CAREERS[0]!
    const state = deciding(careerSpinDecision(['career-not-real', career.id], true), cpu({ career }))
    expect(chosen(state)).toBe(VALUE_SPIN_OPTION_ID)
  })
})

describe('decideCpuCommand — houses', () => {
  const cheapest = HOUSES.reduce((a, b) => (b.price < a.price ? b : a))
  const dearest = HOUSES.reduce((a, b) => (b.price > a.price ? b : a))

  it('buys the home it can comfortably afford', () => {
    const state = deciding(
      decision('house', cheapest.id, dearest.id, DECLINE_HOUSE_OPTION_ID),
      cpu({ money: 1_000_000 }),
    )
    expect(chosen(state)).toBe(dearest.id)
  })

  it('keeps renting rather than piling on loans it cannot service', () => {
    const state = deciding(decision('house', dearest.id, DECLINE_HOUSE_OPTION_ID), cpu({ money: 5_000 }))
    expect(chosen(state)).toBe(DECLINE_HOUSE_OPTION_ID)
  })

  it('prefers a modest home to a mansion when cash is tight', () => {
    const state = deciding(
      decision('house', cheapest.id, dearest.id, DECLINE_HOUSE_OPTION_ID),
      cpu({ money: cheapest.price + 40_000 }),
    )
    expect(chosen(state)).toBe(cheapest.id)
  })

  it('values a trade-up at the difference, not the full sticker price', () => {
    const state = deciding(
      decision('house', dearest.id, DECLINE_HOUSE_OPTION_ID),
      cpu({ money: dearest.price - cheapest.price + 100_000, house: cheapest }),
    )
    expect(chosen(state)).toBe(dearest.id)
  })

  it('declines rather than choose a house id the catalogue does not know', () => {
    const state = deciding(decision('house', 'house-not-real', DECLINE_HOUSE_OPTION_ID), cpu({ money: 500_000 }))
    expect(chosen(state)).toBe(DECLINE_HOUSE_OPTION_ID)
  })
})

describe('decideCpuCommand — stocks', () => {
  it('buys the share with the best expected value when cash allows', () => {
    const state = deciding(
      decision('stock', ...STOCKS.map((stock) => stock.id), DECLINE_STOCK_OPTION_ID),
      cpu({ money: 1_000_000 }),
    )
    const picked = STOCKS.find((stock) => stock.id === chosen(state))!
    const edge = (stock: (typeof STOCKS)[number]) => (stock.payoutRange[0] + stock.payoutRange[1]) / 2 - stock.price
    for (const stock of STOCKS) expect(edge(picked)).toBeGreaterThanOrEqual(edge(stock))
  })

  it('keeps its cash when a share would mean borrowing', () => {
    const dearest = STOCKS.reduce((a, b) => (b.price > a.price ? b : a))
    const state = deciding(decision('stock', dearest.id, DECLINE_STOCK_OPTION_ID), cpu({ money: 0 }))
    expect(chosen(state)).toBe(DECLINE_STOCK_OPTION_ID)
  })

  it('turns down a bigger average payout when the floor drops far below cost', () => {
    const steady = STOCKS.find((stock) => stock.ticker === 'NDL')!
    const wild = STOCKS.find((stock) => stock.ticker === 'FARM')!
    const edge = (stock: (typeof STOCKS)[number]) => (stock.payoutRange[0] + stock.payoutRange[1]) / 2 - stock.price
    // The wild one really is the better bet on paper — the CPU still declines it.
    expect(edge(wild)).toBeGreaterThan(edge(steady))
    expect(wild.price - wild.payoutRange[0]).toBeGreaterThan(steady.price - steady.payoutRange[0])

    const state = deciding(decision('stock', wild.id, steady.id, DECLINE_STOCK_OPTION_ID), cpu({ money: 1_000_000 }))
    expect(chosen(state)).toBe(steady.id)
  })

  it('declines rather than choose a stock id the catalogue does not know', () => {
    const state = deciding(decision('stock', 'stock-not-real', DECLINE_STOCK_OPTION_ID), cpu({ money: 1_000_000 }))
    expect(chosen(state)).toBe(DECLINE_STOCK_OPTION_ID)
  })
})

describe('decideCpuCommand — insurance', () => {
  /** A board whose only bill ahead of `a` is a house fire. */
  function fireAheadBoard(): Board {
    return fixtureBoard(
      [
        fixtureSpace({ id: 'a', next: ['fire'] }),
        fixtureSpace({
          id: 'fire',
          effect: { type: 'payMoney', amount: 200_000, reason: 'House fire', hazard: 'fire' },
          next: ['retirement'],
        }),
        fixtureSpace({ id: 'retirement', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
      ],
      { startSpaceId: 'a', retirementSpaceId: 'retirement' },
    )
  }

  it('always takes the life policy, which is a straight win at scoring', () => {
    const state = deciding(
      decision('insurance', insuranceOptionId('life'), DECLINE_INSURANCE_OPTION_ID),
      cpu({ money: 500_000 }),
    )
    expect(chosen(state)).toBe(insuranceOptionId('life'))
  })

  it('covers itself against a hazard that is still ahead on the board', () => {
    const state = deciding(
      decision('insurance', insuranceOptionId('home'), DECLINE_INSURANCE_OPTION_ID),
      cpu({ money: 500_000, spaceId: 'a' }),
      fireAheadBoard(),
    )
    expect(chosen(state)).toBe(insuranceOptionId('home'))
  })

  it('does not pay a premium against a hazard the board never threatens', () => {
    const state = deciding(
      decision('insurance', insuranceOptionId('auto'), DECLINE_INSURANCE_OPTION_ID),
      cpu({ money: 500_000, spaceId: 'a' }),
      fireAheadBoard(),
    )
    expect(chosen(state)).toBe(DECLINE_INSURANCE_OPTION_ID)
  })

  it('takes the risk when the premium would have to be borrowed', () => {
    const state = deciding(
      decision('insurance', insuranceOptionId('home'), DECLINE_INSURANCE_OPTION_ID),
      cpu({ money: 0, spaceId: 'a' }),
      fireAheadBoard(),
    )
    expect(chosen(state)).toBe(DECLINE_INSURANCE_OPTION_ID)
  })

  it('declines rather than choose an option id that names no policy', () => {
    const state = deciding(
      decision('insurance', 'insurance-yacht', DECLINE_INSURANCE_OPTION_ID),
      cpu({ money: 500_000 }),
    )
    expect(chosen(state)).toBe(DECLINE_INSURANCE_OPTION_ID)
  })

  it('never spends more than it has to: a free premium is still weighed against the payout', () => {
    expect(INSURANCE_PREMIUM.life).toBeLessThan(100_000)
  })
})

describe('decideCpuCommand — the bank', () => {
  it('repays a loan when it has the cash to spare', () => {
    const state = deciding(
      decision('bank', BANK_LOAN_OPTION_ID, BANK_REPAY_OPTION_ID, BANK_DECLINE_OPTION_ID),
      cpu({ money: 400_000, loans: 2 }),
    )
    expect(chosen(state)).toBe(BANK_REPAY_OPTION_ID)
  })

  it('walks on when repaying would strip its cash reserve bare', () => {
    const state = deciding(
      decision('bank', BANK_LOAN_OPTION_ID, BANK_REPAY_OPTION_ID, BANK_DECLINE_OPTION_ID),
      cpu({ money: EARLY_LOAN_REPAYMENT, loans: 1 }),
    )
    expect(chosen(state)).toBe(BANK_DECLINE_OPTION_ID)
  })

  it('never borrows for the sake of it — a loan only ever costs interest', () => {
    for (const money of [0, 50_000, 500_000]) {
      const state = deciding(decision('bank', BANK_LOAN_OPTION_ID, BANK_DECLINE_OPTION_ID), cpu({ money, loans: 0 }))
      expect(chosen(state)).toBe(BANK_DECLINE_OPTION_ID)
    }
  })
})

describe('decideCpuCommand — branches', () => {
  /**
   * Two lanes of equal length between the same fork and merge, so only what is
   * *on* each lane can decide the choice.
   *
   * ```
   * fork -+-> payingLane  -> merge -> retirement
   *       +-> costlyLane  -^
   * ```
   */
  function laneBoard(paying: Space['effect'], costly: Space['effect']): Board {
    return fixtureBoard(
      [
        fixtureSpace({ id: 'fork', next: ['payingLane', 'costlyLane'] }),
        fixtureSpace({ id: 'payingLane', effect: paying, next: ['merge'] }),
        fixtureSpace({ id: 'costlyLane', effect: costly, next: ['merge'] }),
        fixtureSpace({ id: 'merge', next: ['retirement'] }),
        fixtureSpace({ id: 'retirement', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
      ],
      { startSpaceId: 'fork', retirementSpaceId: 'retirement' },
    )
  }

  function forkState(board: Board, player: Player): GameState {
    return fixtureState({
      board,
      players: [{ ...player, spaceId: 'fork' }, fixturePlayer({ id: 'human', name: 'Alex' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: decision('branch', 'payingLane', 'costlyLane'),
    })
  }

  it('walks the lane that pays rather than the one that charges', () => {
    const board = laneBoard(
      { type: 'gainMoney', amount: 80_000, reason: 'Client win' },
      { type: 'payMoney', amount: 80_000, reason: 'Rent due' },
    )
    expect(chosen(forkState(board, cpu({ money: 200_000 })))).toBe('payingLane')
  })

  it('takes a lane with real upside when it is flush', () => {
    // +50,000 against a -40,000 bill: worth it with money in the bank.
    const board = fixtureBoard(
      [
        fixtureSpace({ id: 'fork', next: ['richLane', 'quietLane'] }),
        fixtureSpace({ id: 'richLane', effect: { type: 'gainMoney', amount: 50_000, reason: 'Bonus' }, next: ['richTail'] }),
        fixtureSpace({ id: 'richTail', effect: { type: 'payMoney', amount: 40_000, reason: 'Tax' }, next: ['merge'] }),
        fixtureSpace({ id: 'quietLane', effect: { type: 'none' }, next: ['quietTail'] }),
        fixtureSpace({ id: 'quietTail', effect: { type: 'none' }, next: ['merge'] }),
        fixtureSpace({ id: 'merge', next: ['retirement'] }),
        fixtureSpace({ id: 'retirement', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
      ],
      { startSpaceId: 'fork', retirementSpaceId: 'retirement' },
    )
    const state = fixtureState({
      board,
      players: [cpu({ money: 300_000, spaceId: 'fork' }), fixturePlayer({ id: 'human' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: decision('branch', 'richLane', 'quietLane'),
    })
    expect(chosen(state)).toBe('richLane')
  })

  it('refuses the same risky lane when it is broke', () => {
    const board = fixtureBoard(
      [
        fixtureSpace({ id: 'fork', next: ['richLane', 'quietLane'] }),
        fixtureSpace({ id: 'richLane', effect: { type: 'gainMoney', amount: 50_000, reason: 'Bonus' }, next: ['richTail'] }),
        fixtureSpace({ id: 'richTail', effect: { type: 'payMoney', amount: 40_000, reason: 'Tax' }, next: ['merge'] }),
        fixtureSpace({ id: 'quietLane', effect: { type: 'none' }, next: ['quietTail'] }),
        fixtureSpace({ id: 'quietTail', effect: { type: 'none' }, next: ['merge'] }),
        fixtureSpace({ id: 'merge', next: ['retirement'] }),
        fixtureSpace({ id: 'retirement', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
      ],
      { startSpaceId: 'fork', retirementSpaceId: 'retirement' },
    )
    const state = fixtureState({
      board,
      players: [cpu({ money: 2_000, spaceId: 'fork' }), fixturePlayer({ id: 'human' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: decision('branch', 'richLane', 'quietLane'),
    })
    expect(chosen(state)).toBe('quietLane')
  })

  it('takes the shorter road home when the two lanes are otherwise identical', () => {
    const board = fixtureBoard(
      [
        fixtureSpace({ id: 'fork', next: ['fastLane', 'slowLane'] }),
        fixtureSpace({ id: 'fastLane', effect: { type: 'none' }, next: ['merge'] }),
        fixtureSpace({ id: 'slowLane', effect: { type: 'none' }, next: ['slowTail'] }),
        fixtureSpace({ id: 'slowTail', effect: { type: 'none' }, next: ['merge'] }),
        fixtureSpace({ id: 'merge', next: ['retirement'] }),
        fixtureSpace({ id: 'retirement', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
      ],
      { startSpaceId: 'fork', retirementSpaceId: 'retirement' },
    )
    const state = fixtureState({
      board,
      players: [cpu({ money: 100_000, spaceId: 'fork' }), fixturePlayer({ id: 'human' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: decision('branch', 'slowLane', 'fastLane'),
    })
    expect(chosen(state)).toBe('fastLane')
  })

  it('values a payday lane by the salary it actually earns', () => {
    const board = laneBoard({ type: 'payday' }, { type: 'none' })
    const employed = forkState(board, cpu({ career: GRADUATE_CAREERS[0]!, money: 100_000 }))
    expect(chosen(employed)).toBe('payingLane')

    // Out of work, a payday lane is worth nothing, so the tie falls to the first offer.
    const jobless = forkState(board, cpu({ career: null, money: 100_000 }))
    expect(chosen(jobless)).toBe('payingLane')
  })

  /*
   * The wheel deals a coin flip between two offers now, not a pick of the
   * better one — so the pool's own mean is the right price for a fair, priced
   * off the rungs a fair can actually deal (the bottom of each ladder), not
   * the whole catalogue including every promotion sitting above it.
   */
  it('prices a career fair at the mean of the rungs it can actually deal', () => {
    const board = laneBoard(
      { type: 'chooseCareer', pool: 'basic' },
      { type: 'chooseCareer', pool: 'graduate' },
    )
    // A jobless CPU still walks towards the hall that hires it.
    const jobless = forkState(board, cpu({ career: null, money: 100_000 }))
    expect(chosen(jobless)).toBe('payingLane')

    const meanBasic = BASIC_CAREERS.reduce((sum, c) => sum + c.salary, 0) / BASIC_CAREERS.length
    expect(meanFairSalary(hiringPoolFor(EDITION_USA, false))).toBeLessThan(meanBasic)
  })

  it('falls back safely when a branch names a space the board does not hold', () => {
    const board = laneBoard({ type: 'none' }, { type: 'none' })
    const state = fixtureState({
      board,
      players: [cpu({ spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: decision('branch', 'nowhere', 'payingLane'),
    })
    expect(chosen(state)).toBe('payingLane')
  })
})

describe('decideCpuCommand — never freezes the game', () => {
  const everyDecision: Decision[] = [
    decision('branch', 'stopBranch', 'longBranch'),
    careerSpinDecision([BASIC_CAREERS[0]!.id, BASIC_CAREERS[1]!.id], true),
    careerSpinDecision([GRADUATE_CAREERS[0]!.id, GRADUATE_CAREERS[1]!.id], true),
    decision('house', ...HOUSES.map((house) => house.id), DECLINE_HOUSE_OPTION_ID),
    decision('stock', ...STOCKS.map((stock) => stock.id), DECLINE_STOCK_OPTION_ID),
    decision(
      'insurance',
      insuranceOptionId('home'),
      insuranceOptionId('auto'),
      insuranceOptionId('life'),
      DECLINE_INSURANCE_OPTION_ID,
    ),
    decision('bank', BANK_LOAN_OPTION_ID, BANK_REPAY_OPTION_ID, BANK_DECLINE_OPTION_ID),
    // Single-option decisions: a forced career change offers no way out.
    careerSpinDecision([BASIC_CAREERS[0]!.id, BASIC_CAREERS[1]!.id], false),
    decision('bank', BANK_DECLINE_OPTION_ID),
  ]

  const everyPlayer: Player[] = [
    cpu({ money: 0, loans: 4, spaceId: 'fork' }),
    cpu({ money: 10_000, spaceId: 'fork' }),
    cpu({ money: 1_000_000, spaceId: 'fork', house: HOUSES[5]!, insurance: ['home', 'auto', 'life'] }),
    cpu({ money: 250_000, spaceId: 'fork', career: GRADUATE_CAREERS[3]!, children: 3, isMarried: true, hasDegree: true }),
    cpu({ money: 75_000, spaceId: 'fork', house: HOUSES[1]!, stocks: [{ stockId: STOCKS[0]!.id, shares: 2 }] }),
  ]

  it('always answers with an option it was actually offered', () => {
    for (const player of everyPlayer) {
      for (const pendingDecision of everyDecision) {
        const state = deciding(pendingDecision, player)
        const command = decideCpuCommand(state)
        const label = `${player.money} / ${pendingDecision.kind}`
        if (command?.type !== 'choose') throw new Error(`no choice made for ${label}`)
        expect(pendingDecision.options.map((option) => option.id), label).toContain(command.optionId)
      }
    }
  })

  it('is deterministic: the same state always yields the same command', () => {
    for (const pendingDecision of everyDecision) {
      const state = deciding(pendingDecision, everyPlayer[3]!)
      expect(decideCpuCommand(state)).toEqual(decideCpuCommand(state))
    }
  })

  it('does not touch the state it is handed', () => {
    const state = deciding(decision('house', ...HOUSES.map((house) => house.id), DECLINE_HOUSE_OPTION_ID))
    const snapshot = JSON.stringify(state)
    decideCpuCommand(state)
    expect(JSON.stringify(state)).toBe(snapshot)
  })
})


describe('valuing a fork', () => {
  /**
   * A fork whose two lanes rejoin a long shared trunk. `rich` is one space
   * longer than `lean` and carries a large prize; everything after the merge
   * is common road neither lane earns credit for.
   */
  function forkBoard(): Board {
    const spaces: Record<string, Space> = {}
    const put = (space: Space): void => {
      spaces[space.id] = space
    }

    // The rewarding lane is deliberately the LONG one, so that under the old
    // fixed horizon the short lane could see further down the shared trunk.
    const RICH = 8
    put(fixtureSpace({ id: 'fork', next: ['rich-1', 'lean-1'] }))
    put(fixtureSpace({ id: 'rich-1', next: ['rich-2'], effect: { type: 'gainMoney', amount: 60_000, reason: 'Windfall' } }))
    for (let i = 2; i <= RICH; i += 1) {
      put(fixtureSpace({ id: `rich-${i}`, next: i === RICH ? ['merge-1'] : [`rich-${i + 1}`] }))
    }
    put(fixtureSpace({ id: 'lean-1', next: ['merge-1'] }))

    // Shared trunk, longer than the old 16-space horizon and full of money, so
    // a lane credited with any of it drowns out its own contents.
    const TRUNK = 22
    for (let i = 1; i <= TRUNK; i += 1) {
      put(
        fixtureSpace({
          id: `merge-${i}`,
          next: i === TRUNK ? ['end'] : [`merge-${i + 1}`],
          effect: { type: 'gainMoney', amount: 20_000, reason: 'Trunk money' },
        }),
      )
    }
    put(fixtureSpace({ id: 'end', kind: 'retirement', next: [], effect: { type: 'retire' } }))

    return { spaces, startSpaceId: 'fork', retirementSpaceId: 'end', width: 40, height: 4 }
  }

  it('ignores the trunk both lanes share and picks the lane with the better contents', () => {
    const board = forkBoard()
    const state = deciding(decision('branch', 'rich-1', 'lean-1'), cpu({ spaceId: 'fork' }), board)

    const command = decideCpuCommand(state)

    expect(command).toEqual({ type: 'choose', optionId: 'rich-1' })
  })
})

/**
 * Pay the wheel decides. A player between jobs picks up casual shifts and an
 * unsteady trade is paid per pip, so three things the computer used to price
 * at a flat salary — or at nothing — have to move with it, or it mistakes
 * unemployment for a dead stretch and an unsteady job for a cheap one.
 */
describe('decideCpuCommand — pay the wheel decides', () => {
  const paydaySpace = fixtureSpace({ id: 'pay', kind: 'payday', effect: { type: 'payday' } })
  const priceOf = (space: Space, player: Player, paydaysAhead = 1): number =>
    valueOfSpace(space, player, fixtureState({ players: [player] }), paydaysAhead)

  it('prices a payday for a player between jobs at the casual wage, not at nothing', () => {
    const price = priceOf(paydaySpace, cpu({ career: null }))
    expect(price).toBe(CASUAL_WAGE_PER_PIP * AVERAGE_SPIN)
    expect(price).toBeGreaterThan(0)
  })

  it('prices an unsteady job at the packet it averages, not at its pip rate', () => {
    const unsteady = BASIC_CAREERS.find((career) => career.payPerPip !== undefined)!
    expect(priceOf(paydaySpace, cpu({ career: unsteady }))).toBe(unsteady.salary)
  })

  it('still prices a salaried payday at the contract', () => {
    const steady = BASIC_CAREERS.find((career) => career.payPerPip === undefined)!
    expect(priceOf(paydaySpace, cpu({ career: steady }))).toBe(steady.salary)
  })

  it('prices a layoff at the drop to casual shifts rather than the whole wage', () => {
    const career = BASIC_CAREERS.find((c) => c.payPerPip === undefined)!
    const layoff = fixtureSpace({ effect: { type: 'loseCareer', reason: 'Downsized.' } })
    const cost = -priceOf(layoff, cpu({ career }))

    expect(cost).toBeGreaterThan(0)
    expect(cost).toBeLessThan(career.salary * 3)
    expect(cost).toBe((career.salary - CASUAL_WAGE_PER_PIP * AVERAGE_SPIN) * 3)
  })

  it('costs a player with no job nothing to be laid off from it', () => {
    const layoff = fixtureSpace({ effect: { type: 'loseCareer', reason: 'Downsized.' } })
    expect(priceOf(layoff, cpu({ career: null }))).toBe(0)
  })

  it('values a career fair at what the job adds over picking up shifts', () => {
    const fair = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
    const paydaysAhead = 6
    const price = priceOf(fair, cpu({ career: null }), paydaysAhead)

    /*
     * Priced off the rungs a fair can actually deal — the bottom of each ladder —
     * rather than off the whole pool. Valued against every rung, a first job
     * would be worth what a salon owner earns, and a computer seat would walk
     * past the road that leads to one to get to the fair.
     */
    const hiring = hiringPoolFor(EDITION_USA, false)
    expect(price).toBeGreaterThan(0)
    expect(price).toBe((meanFairSalary(hiring) - CASUAL_WAGE_PER_PIP * AVERAGE_SPIN) * paydaysAhead)
    expect(meanFairSalary(hiring)).toBeLessThan(
      BASIC_CAREERS.reduce((sum, c) => sum + c.salary, 0) / BASIC_CAREERS.length,
    )
  })

  it('still weighs an unsteady offer against a steady one on its expected pay, not its pip rate', () => {
    // The unsteady job pays more on an average week, and that is the whole
    // comparison — its pip rate is about a fifth of the figure and would not
    // be enough to make spinning worth it over staying, if the computer read
    // that instead.
    const steady = BASIC_CAREERS.find((c) => c.id === 'career-pastry-chef')!
    const unsteady = BASIC_CAREERS.find((c) => c.id === 'career-salon-owner')!
    expect(unsteady.payPerPip!).toBeLessThan(steady.salary)
    expect(unsteady.salary).toBeGreaterThan(steady.salary)

    const state = deciding(careerSpinDecision([steady.id, unsteady.id], true), cpu({ career: steady }))
    expect(chosen(state)).toBe(VALUE_SPIN_OPTION_ID)
  })
})
