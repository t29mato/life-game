import { describe, expect, it } from 'vitest'
import type { Decision, DecisionOption } from '@domain/model/types'
import {
  EARLY_LOAN_REPAYMENT,
  INSURANCE_PREMIUM,
  LOAN_PRINCIPAL,
  SHARES_PER_PURCHASE,
} from '@domain/model/constants'
import { BASIC_CAREERS } from '@domain/edition/usa'
import { HOUSES } from '@domain/edition/usa'
import { STOCKS } from '@domain/edition/usa'
import { insuranceOptionId } from './applyEffect'
import { branchDecision } from './branch'
import { fixtureMovementBoard, fixturePlayer, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import {
  BANK_DECLINE_OPTION_ID,
  BANK_LOAN_OPTION_ID,
  BANK_REPAY_OPTION_ID,
  choose,
  DECLINE_HOUSE_OPTION_ID,
  DECLINE_INSURANCE_OPTION_ID,
  DECLINE_STOCK_OPTION_ID,
} from './choose'

function decisionState(overrides: Parameters<typeof fixtureState>[0] = {}) {
  return fixtureState({ board: fixtureMovementBoard(), phase: 'awaitingDecision', ...overrides })
}

/** Options only need ids here — `choose` never reads the labels back. */
function options(...ids: string[]): DecisionOption[] {
  return ids.map((id) => ({ id, label: id, description: '', icon: 'space:payday' }))
}

function decision(kind: Decision['kind'], ...ids: string[]): Decision {
  return { kind, prompt: 'Pick one', options: options(...ids) }
}

describe('choose', () => {
  it('throws when the phase is not awaitingDecision', () => {
    const state = fixtureState({ board: fixtureMovementBoard(), phase: 'resolved' })
    expect(() => choose(state, 'anything', { random: createFakeRandom() })).toThrow(/awaitingDecision/)
  })

  it('throws when the option id is not one of the offered options', () => {
    const state = decisionState({
      players: [fixturePlayer({ spaceId: 'fork' })],
      stepsRemaining: 1,
      pendingDecision: {
        kind: 'branch',
        prompt: 'Which way?',
        options: [{ id: 'stopBranch', label: 'Stop', description: '', icon: 'space:payday' }],
      },
    })
    expect(() => choose(state, 'not-an-option', { random: createFakeRandom() })).toThrow(/not one of/)
  })

  describe('branch', () => {
    it('resumes movement toward the forced-stop branch and stops there', () => {
      const player = fixturePlayer({ spaceId: 'fork' })
      const state = decisionState({
        players: [player],
        stepsRemaining: 1,
        pendingDecision: {
          kind: 'branch',
          prompt: 'Which way?',
          options: [
            { id: 'stopBranch', label: 'Stop Branch', description: '', icon: 'space:payday' },
            { id: 'longBranch', label: 'Long Branch', description: '', icon: 'space:payday' },
          ],
        },
      })

      const next = choose(state, 'stopBranch', { random: createFakeRandom() })

      expect(next.phase).toBe('moving')
      expect(next.pendingDecision).toBeNull()
      expect(next.movementPath).toEqual(['stopBranch'])
      expect(next.stepsRemaining).toBe(0)
      expect(next.players[0]!.spaceId).toBe('stopBranch')
    })

    it('continues walking the chosen branch and pays paydays passed along it', () => {
      const player = fixturePlayer({ spaceId: 'fork', career: BASIC_CAREERS[0]!, money: 0 })
      const state = decisionState({
        players: [player],
        stepsRemaining: 3,
        pendingDecision: {
          kind: 'branch',
          prompt: 'Which way?',
          options: [
            { id: 'stopBranch', label: 'Stop Branch', description: '', icon: 'space:payday' },
            { id: 'longBranch', label: 'Long Branch', description: '', icon: 'space:payday' },
          ],
        },
      })

      const next = choose(state, 'longBranch', { random: createFakeRandom() })

      expect(next.phase).toBe('moving')
      expect(next.movementPath).toEqual(['longBranch', 'mid', 'merge'])
      expect(next.stepsRemaining).toBe(0)
      expect(next.players[0]!.spaceId).toBe('merge')
      expect(next.players[0]!.money).toBe(BASIC_CAREERS[0]!.salary) // mid payday passed through
    })
  })

  describe('career', () => {
    it('sets the chosen career and resolves the turn', () => {
      const career = BASIC_CAREERS[0]!
      const player = fixturePlayer({ spaceId: 'a', career: null })
      const state = decisionState({
        players: [player],
        pendingDecision: {
          kind: 'career',
          prompt: 'Choose your career path',
          options: [{ id: career.id, label: career.title, description: career.description, icon: 'space:payday'}],
        },
      })

      const next = choose(state, career.id, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.pendingDecision).toBeNull()
      expect(next.players[0]!.career).toEqual(career)
      expect(next.lastEvent).not.toBeNull()
    })
  })

  describe('house', () => {
    it('buys the chosen house and resolves the turn', () => {
      const house = HOUSES[0]!
      const player = fixturePlayer({ spaceId: 'a', house: null, money: house.price + 100_000 })
      const state = decisionState({
        players: [player],
        pendingDecision: {
          kind: 'house',
          prompt: 'Pick a home to buy',
          options: [
            { id: house.id, label: house.name, description: house.description, icon: 'space:payday'},
            { id: DECLINE_HOUSE_OPTION_ID, label: 'Keep renting for now', description: '', icon: 'space:payday' },
          ],
        },
      })

      const next = choose(state, house.id, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.house).toEqual(house)
      expect(next.lastEvent!.moneyDelta).toBe(-house.price)
    })

    it('declines to buy when the decline option is chosen', () => {
      const house = HOUSES[0]!
      const player = fixturePlayer({ spaceId: 'a', house: null })
      const state = decisionState({
        players: [player],
        pendingDecision: {
          kind: 'house',
          prompt: 'Pick a home to buy',
          options: [
            { id: house.id, label: house.name, description: house.description, icon: 'space:payday'},
            { id: DECLINE_HOUSE_OPTION_ID, label: 'Keep renting for now', description: '', icon: 'space:payday' },
          ],
        },
      })

      const next = choose(state, DECLINE_HOUSE_OPTION_ID, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.house).toBeNull()
      expect(next.lastEvent!.moneyDelta).toBe(0)
    })

    it('trades up, crediting the old home at its price', () => {
      const oldHouse = HOUSES[0]!
      const newHouse = HOUSES[3]!
      const player = fixturePlayer({ spaceId: 'a', house: oldHouse, money: 500_000 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('house', newHouse.id, DECLINE_HOUSE_OPTION_ID),
      })

      const next = choose(state, newHouse.id, { random: createFakeRandom() })

      expect(next.players[0]!.house).toEqual(newHouse)
      expect(next.players[0]!.money).toBe(500_000 + oldHouse.price - newHouse.price)
      expect(next.lastEvent!.moneyDelta).toBe(oldHouse.price - newHouse.price)
      expect(next.lastEvent!.notes.some((note) => note.includes(oldHouse.name))).toBe(true)
      expect(next.log.some((entry) => entry.message.includes('trades up'))).toBe(true)
    })

    it('lets a player with a home decline and stay put', () => {
      const oldHouse = HOUSES[0]!
      const player = fixturePlayer({ spaceId: 'a', house: oldHouse, money: 500_000 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('house', HOUSES[3]!.id, DECLINE_HOUSE_OPTION_ID),
      })

      const next = choose(state, DECLINE_HOUSE_OPTION_ID, { random: createFakeRandom() })

      expect(next.players[0]!.house).toEqual(oldHouse)
      expect(next.players[0]!.money).toBe(500_000)
      expect(next.phase).toBe('resolved')
    })
  })

  describe('stock', () => {
    it('buys the chosen stock and debits the price per share', () => {
      const stock = STOCKS[0]!
      const player = fixturePlayer({ spaceId: 'a', money: 100_000, stocks: [] })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('stock', stock.id, DECLINE_STOCK_OPTION_ID),
      })

      const next = choose(state, stock.id, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.stocks).toEqual([{ stockId: stock.id, shares: SHARES_PER_PURCHASE }])
      expect(next.players[0]!.money).toBe(100_000 - stock.price * SHARES_PER_PURCHASE)
      expect(next.lastEvent!.moneyDelta).toBe(-stock.price * SHARES_PER_PURCHASE)
    })

    it('always allows walking away with the cash', () => {
      const stock = STOCKS[0]!
      const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('stock', stock.id, DECLINE_STOCK_OPTION_ID),
      })

      const next = choose(state, DECLINE_STOCK_OPTION_ID, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.stocks).toEqual([])
      expect(next.players[0]!.money).toBe(100_000)
    })

    it('rejects an option id that is not a known stock', () => {
      const state = decisionState({
        players: [fixturePlayer({ spaceId: 'a' })],
        pendingDecision: decision('stock', 'stock-not-real', DECLINE_STOCK_OPTION_ID),
      })
      expect(() => choose(state, 'stock-not-real', { random: createFakeRandom() })).toThrow(/unknown stock/)
    })
  })

  describe('insurance', () => {
    it('takes out the chosen policy and debits the premium', () => {
      const player = fixturePlayer({ spaceId: 'a', money: 200_000, insurance: [] })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('insurance', insuranceOptionId('home'), DECLINE_INSURANCE_OPTION_ID),
      })

      const next = choose(state, insuranceOptionId('home'), { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.insurance).toEqual(['home'])
      expect(next.players[0]!.money).toBe(200_000 - INSURANCE_PREMIUM.home)
      expect(next.lastEvent!.moneyDelta).toBe(-INSURANCE_PREMIUM.home)
    })

    it('always allows taking the risk instead', () => {
      const player = fixturePlayer({ spaceId: 'a', money: 200_000 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('insurance', insuranceOptionId('life'), DECLINE_INSURANCE_OPTION_ID),
      })

      const next = choose(state, DECLINE_INSURANCE_OPTION_ID, { random: createFakeRandom() })

      expect(next.players[0]!.insurance).toEqual([])
      expect(next.players[0]!.money).toBe(200_000)
    })

    it('rejects an option id that names no policy', () => {
      const state = decisionState({
        players: [fixturePlayer({ spaceId: 'a' })],
        pendingDecision: decision('insurance', 'insurance-yacht', DECLINE_INSURANCE_OPTION_ID),
      })
      expect(() => choose(state, 'insurance-yacht', { random: createFakeRandom() })).toThrow(/unknown insurance/)
    })
  })

  describe('bank', () => {
    it('takes a loan, crediting the principal', () => {
      const player = fixturePlayer({ spaceId: 'a', money: 1_000, loans: 0 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('bank', BANK_LOAN_OPTION_ID, BANK_DECLINE_OPTION_ID),
      })

      const next = choose(state, BANK_LOAN_OPTION_ID, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.money).toBe(1_000 + LOAN_PRINCIPAL)
      expect(next.players[0]!.loans).toBe(1)
      expect(next.lastEvent!.moneyDelta).toBe(LOAN_PRINCIPAL)
    })

    it('repays a loan early at the discounted price', () => {
      const player = fixturePlayer({ spaceId: 'a', money: 100_000, loans: 2 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('bank', BANK_LOAN_OPTION_ID, BANK_REPAY_OPTION_ID, BANK_DECLINE_OPTION_ID),
      })

      const next = choose(state, BANK_REPAY_OPTION_ID, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(100_000 - EARLY_LOAN_REPAYMENT)
      expect(next.players[0]!.loans).toBe(1)
      expect(next.lastEvent!.moneyDelta).toBe(-EARLY_LOAN_REPAYMENT)
    })

    it('celebrates clearing the last loan', () => {
      const player = fixturePlayer({ spaceId: 'a', money: 100_000, loans: 1 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('bank', BANK_REPAY_OPTION_ID, BANK_DECLINE_OPTION_ID),
      })

      const next = choose(state, BANK_REPAY_OPTION_ID, { random: createFakeRandom() })

      expect(next.players[0]!.loans).toBe(0)
      expect(next.lastEvent!.narration).toContain('Debt free')
    })

    it('always allows walking on with nothing changed', () => {
      const player = fixturePlayer({ spaceId: 'a', money: 100_000, loans: 1 })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('bank', BANK_LOAN_OPTION_ID, BANK_DECLINE_OPTION_ID),
      })

      const next = choose(state, BANK_DECLINE_OPTION_ID, { random: createFakeRandom() })

      expect(next.phase).toBe('resolved')
      expect(next.players[0]!.money).toBe(100_000)
      expect(next.players[0]!.loans).toBe(1)
    })

    it('rejects an option id the bank never offers', () => {
      const state = decisionState({
        players: [fixturePlayer({ spaceId: 'a' })],
        pendingDecision: decision('bank', 'bank-rob-it', BANK_DECLINE_OPTION_ID),
      })
      expect(() => choose(state, 'bank-rob-it', { random: createFakeRandom() })).toThrow(/unknown bank option/)
    })
  })

  describe('event presentation', () => {
    it('narrates every resolved decision and marks a new career as a milestone', () => {
      const career = BASIC_CAREERS[0]!
      const cases: Array<{ decision: Decision; optionId: string }> = [
        { decision: decision('career', career.id), optionId: career.id },
        { decision: decision('house', HOUSES[0]!.id, DECLINE_HOUSE_OPTION_ID), optionId: HOUSES[0]!.id },
        { decision: decision('house', HOUSES[0]!.id, DECLINE_HOUSE_OPTION_ID), optionId: DECLINE_HOUSE_OPTION_ID },
        { decision: decision('stock', STOCKS[0]!.id, DECLINE_STOCK_OPTION_ID), optionId: STOCKS[0]!.id },
        { decision: decision('stock', STOCKS[0]!.id, DECLINE_STOCK_OPTION_ID), optionId: DECLINE_STOCK_OPTION_ID },
        {
          decision: decision('insurance', insuranceOptionId('auto'), DECLINE_INSURANCE_OPTION_ID),
          optionId: insuranceOptionId('auto'),
        },
        {
          decision: decision('insurance', insuranceOptionId('auto'), DECLINE_INSURANCE_OPTION_ID),
          optionId: DECLINE_INSURANCE_OPTION_ID,
        },
        { decision: decision('bank', BANK_LOAN_OPTION_ID, BANK_DECLINE_OPTION_ID), optionId: BANK_LOAN_OPTION_ID },
        { decision: decision('bank', BANK_LOAN_OPTION_ID, BANK_DECLINE_OPTION_ID), optionId: BANK_DECLINE_OPTION_ID },
      ]

      for (const testCase of cases) {
        const state = decisionState({
          players: [fixturePlayer({ spaceId: 'a', money: 500_000, loans: 1 })],
          pendingDecision: testCase.decision,
        })
        const next = choose(state, testCase.optionId, { random: createFakeRandom() })
        expect(next.lastEvent!.narration, testCase.optionId).toBeTruthy()
        expect(next.lastEvent!.narration!.length, testCase.optionId).toBeGreaterThan(10)
        expect(['normal', 'big', 'milestone']).toContain(next.lastEvent!.emphasis)
      }

      const careerState = decisionState({
        players: [fixturePlayer({ spaceId: 'a' })],
        pendingDecision: decision('career', career.id),
      })
      expect(choose(careerState, career.id, { random: createFakeRandom() }).lastEvent!.emphasis).toBe('milestone')
    })
  })
})

describe('a fork is chosen before the wheel is spun', () => {
  /*
   * Choosing after the spin let a player take whichever lane the number
   * happened to land them well on — a playtester called it out as "せこい"
   * (cheap), and they were right: no board game hands you that. Every fork on
   * this board sits on a `stop`, so a player always begins a turn standing on
   * one, which is what makes choosing first possible at all.
   */
  it('commits to the road and hands the turn to the spinner', () => {
    const board = fixtureMovementBoard()
    const state = fixtureState({
      board,
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 0,
      pendingDecision: branchDecision(board, 'fork', null),
    })

    const chosen = board.spaces['fork']!.next[0]!
    const next = choose(state, chosen, { random: createFakeRandom() })

    expect(next.phase).toBe('awaitingSpin')
    expect(next.chosenExit).toBe(chosen)
    expect(next.pendingDecision).toBeNull()
    // Nothing has moved yet: the wheel has not been spun.
    expect(next.players[0]!.spaceId).toBe('fork')
    expect(next.movementPath).toEqual([])
  })

  it('does not reveal the distance in the prompt, since it is not rolled yet', () => {
    const board = fixtureMovementBoard()
    const decision = branchDecision(board, 'fork', null)
    expect(decision.prompt).not.toMatch(/\d+\s+space/)
    expect(decision.prompt).toContain('then spin')
  })

  it('still resolves a fork reached mid-move, where the distance is known', () => {
    const board = fixtureMovementBoard()
    const state = fixtureState({
      board,
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: branchDecision(board, 'fork', 2),
    })

    const next = choose(state, board.spaces['fork']!.next[0]!, { random: createFakeRandom() })

    expect(next.phase).toBe('moving')
    expect(next.chosenExit).toBeNull()
  })
})
