import { describe, expect, it } from 'vitest'
import type { Decision, DecisionOption } from '@domain/model/types'
import {
  CASUAL_WAGE_PER_PIP,
  EARLY_LOAN_REPAYMENT,
  INSURANCE_PREMIUM,
  LOAN_PRINCIPAL,
  SHARES_PER_PURCHASE,
  WEDDING_GIFT,
} from '@domain/model/constants'
import { createBoard } from '@domain/board/createBoard'
import { allEditions } from '@domain/edition/registry'
import { BASIC_CAREERS, USA_ECONOMY } from '@domain/edition/usa'
import {
  CONTRACT_CAREERS,
  EDITION_RESEARCHER_FRANCE,
  FONCTIONNAIRE_CAREERS,
  RESEARCHER_FRANCE_ECONOMY,
} from '@domain/edition/france-researcher'
import { HOUSES } from '@domain/edition/usa'
import { STOCKS } from '@domain/edition/usa'
import { applyEffect, insuranceOptionId, VALUE_SPIN_OPTION_ID } from './applyEffect'
import { formatMoney } from './format'
import { branchDecision } from './branch'
import { TRADE_YEAR_STORIES } from '@domain/rules/tradeYear'
import { fixtureMovementBoard, fixturePlayer, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import {
  BANK_DECLINE_OPTION_ID,
  BANK_LOAN_OPTION_ID,
  BANK_REPAY_OPTION_ID,
  CAREER_STAY_OPTION_ID,
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

    it('continues walking the chosen branch and queues paydays passed along it', () => {
      // Salaried, so the figure asserted is the pass-through rule and not a spin.
      const salaried = BASIC_CAREERS.find((career) => career.payPerPip === undefined)!
      const player = fixturePlayer({ spaceId: 'fork', career: salaried, money: 0 })
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
      // Cut at `mid`, the payday it sweeps past — see `nextMovementLeg`.
      expect(next.movementPath).toEqual(['longBranch', 'mid'])
      expect(next.pendingPath).toEqual(['merge'])
      expect(next.stepsRemaining).toBe(0)
      expect(next.players[0]!.spaceId).toBe('merge')
      // Queued for `settle` to pay out as its own card, not paid the instant
      // the store learns about it — same rule `spin.ts` follows.
      expect(next.pendingPassedItems).toEqual([{ kind: 'payday', spaceId: 'mid' }])
      expect(next.players[0]!.money).toBe(0)
    })
  })

  describe('career', () => {
    it('spins for one of the two offered careers and resolves the turn', () => {
      const first = BASIC_CAREERS[0]!
      const second = BASIC_CAREERS[1]!
      const player = fixturePlayer({ spaceId: 'a', career: null })
      const state = decisionState({
        players: [player],
        pendingDecision: {
          kind: 'valueSpin',
          prompt: 'Choose your career path',
          options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: '', icon: 'space:payday' }],
          offeredCareerIds: [first.id, second.id],
        },
      })

      const low = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [3] }) })
      expect(low.players[0]!.career).toEqual(first)
      expect(low.phase).toBe('resolved')
      expect(low.pendingDecision).toBeNull()
      expect(low.lastEvent).not.toBeNull()

      const high = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [5] }) })
      expect(high.players[0]!.career).toEqual(second)
    })

    it('lets a player with a career decline the spin and stay put', () => {
      const staying = BASIC_CAREERS[2]!
      const first = BASIC_CAREERS[0]!
      const second = BASIC_CAREERS[1]!
      const player = fixturePlayer({ spaceId: 'a', career: staying })
      const state = decisionState({
        players: [player],
        pendingDecision: {
          kind: 'valueSpin',
          prompt: 'Two other trades would take you at the level you are on.',
          options: [
            { id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: '', icon: 'space:payday' },
            { id: CAREER_STAY_OPTION_ID, label: 'Stay', description: '', icon: 'space:payday' },
          ],
          offeredCareerIds: [first.id, second.id],
        },
      })

      const random = createFakeRandom()
      const next = choose(state, CAREER_STAY_OPTION_ID, { random })

      expect(next.players[0]!.career).toEqual(staying)
      expect(next.phase).toBe('resolved')
      // Staying never touches the wheel — no roll, no new number to animate to.
      expect(random.calls.spins).toBe(0)
      expect(next.lastSpin).toBe(state.lastSpin)
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
      // Which house replaced which is the narration's sentence; the note is
      // only for the credit, which nothing else on the card shows.
      expect(next.lastEvent!.narration).toContain(oldHouse.name)
      expect(next.lastEvent!.notes.some((note) => note.includes(oldHouse.name))).toBe(false)
      expect(next.lastEvent!.notes.some((note) => note.includes('credited back'))).toBe(true)
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

  describe('valueSpin', () => {
    it('spins for a spinForMoney tile only once the player presses the button', () => {
      const board = fixtureMovementBoard()
      const spinSpace = { ...board.spaces.a!, effect: { type: 'spinForMoney' as const, perPip: 100, reason: 'Lucky roll' } }
      const state = decisionState({
        board: { ...board, spaces: { ...board.spaces, a: spinSpace } },
        players: [fixturePlayer({ spaceId: 'a', money: 0 })],
        pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
      })

      const random = createFakeRandom({ spins: [5] })
      const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

      expect(random.calls.spins).toBe(1)
      expect(next.phase).toBe('resolved')
      expect(next.pendingDecision).toBeNull()
      expect(next.players[0]!.money).toBe(500)
      expect(next.lastEvent!.moneyDelta).toBe(500)
      // The die is carried structurally and printed by the card itself, so
      // no handler spells the roll out in prose any more.
      expect(next.lastEvent!.rolled).toBe(5)
      expect(next.lastEvent!.notes.join(' ')).not.toContain('Rolled')
      expect(next.lastEvent!.narration).not.toMatch(/rolls? a 5/i)
      expect(next.lastEvent!.notes).toEqual(['Lucky roll'])
    })

    it('spins for a casual payday, paying by the roll rather than nothing', () => {
      const player = fixturePlayer({ spaceId: 'payday1', money: 1_000, career: null })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
      })

      const random = createFakeRandom({ spins: [4] })
      const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

      expect(random.calls.spins).toBe(1)
      expect(next.players[0]!.money).toBe(1_000 + CASUAL_WAGE_PER_PIP * 4)
      // The roll travels on the event, the total is on the delta plate, and
      // the note carries the third number — the rate, which is the only one
      // of the three the card cannot otherwise show, and the one that makes
      // the other two check out.
      expect(next.lastEvent!.rolled).toBe(4)
      expect(next.lastEvent!.notes.join(' ')).not.toContain('Rolled')
      expect(next.lastEvent!.notes).toEqual([
        `Between jobs — shifts pay ${formatMoney(CASUAL_WAGE_PER_PIP)} for every pip you roll.`,
      ])
      // And the narration no longer prints the total a second time.
      expect(next.lastEvent!.narration).not.toContain(formatMoney(CASUAL_WAGE_PER_PIP * 4))
      // Nobody to draw a portrait of — a casual player between jobs has no
      // trade for the card to name.
      expect(next.lastEvent!.careerIcon).toBeUndefined()
    })

    it('spins for an unsteady career payday at its own rate, not the casual one', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip !== undefined)!
      const player = fixturePlayer({ spaceId: 'payday1', money: 0, career })
      const state = decisionState({
        players: [player],
        pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
      })

      const random = createFakeRandom({ spins: [5] })
      const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

      expect(next.players[0]!.money).toBe(career.payPerPip! * 5)
      expect(next.lastEvent!.careerIcon).toBe(career.icon)
    })

    it('rejects an option id the wheel never offered', () => {
      const state = decisionState({
        players: [fixturePlayer({ spaceId: 'payday1' })],
        pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
      })
      expect(() => choose(state, 'spin-twice', { random: createFakeRandom() })).toThrow()
    })

    describe('promotion', () => {
      const board = fixtureMovementBoard()
      const promoSpace = (reason = 'Review time') => ({
        ...board.spaces.a!,
        effect: { type: 'promotion' as const, reason },
      })

      it('passes the player over but still gives a raise on a spin under the bar', () => {
        const career = BASIC_CAREERS[0]!
        const player = fixturePlayer({ spaceId: 'a', career })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: promoSpace() } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const needed = career.promotionSpin ?? 4
        const random = createFakeRandom({ spins: [(needed - 1) as typeof needed] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(random.calls.spins).toBe(1)
        expect(next.players[0]!.career?.id).toBe(career.id)
        expect(next.players[0]!.career?.salary).toBeGreaterThan(career.salary)
        // One footnote, and it is the outcome. The card used to carry two —
        // "the job goes to somebody else" beside "a raise anyway" — and a
        // playtester read the pair as a contradiction. The missed rung is
        // still said, in the narration, where a sentence belongs.
        expect(next.lastEvent!.notes).toHaveLength(1)
        expect(next.lastEvent!.notes[0]).toMatch(/raise|up/i)
        expect(next.lastEvent!.narration).toContain('Not this time')
      })

      it('promotes on a spin at or above the bar', () => {
        const career = BASIC_CAREERS[0]!
        const player = fixturePlayer({ spaceId: 'a', career })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: promoSpace() } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [career.promotionSpin ?? 4] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(next.players[0]!.career?.id).toBe(career.promotesTo)
        expect(next.lastEvent!.emphasis).toBe('milestone')
      })

      it('skips a whole rung on a perfect six', () => {
        const career = BASIC_CAREERS[0]!
        const player = fixturePlayer({ spaceId: 'a', career })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: promoSpace() } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [6] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        const skipped = BASIC_CAREERS.find((c) => c.id === career.promotesTo)!
        expect(next.players[0]!.career?.id).toBe(skipped.promotesTo)
        // The narration names the rung landed on; the note that used to say
        // "Two rungs in one morning" was the same news in a second voice.
        expect(next.lastEvent!.narration).toContain('skip a whole rung')
        expect(next.lastEvent!.notes.join(' ')).not.toContain('Two rungs')
      })
    })

    describe('getMarried', () => {
      const board = fixtureMovementBoard()
      const weddingSpace = { ...board.spaces.a!, effect: { type: 'getMarried' as const } }

      it('marries on a mid spin, gifted by every rival still in the game', () => {
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: weddingSpace } },
          players: [
            fixturePlayer({ id: 'p1', spaceId: 'a', money: 50_000 }),
            fixturePlayer({ id: 'p2', name: 'Bo', money: 50_000 }),
          ],
          currentPlayerIndex: 0,
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [4] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(random.calls.spins).toBe(1)
        expect(next.players[0]!.isMarried).toBe(true)
        expect(next.players[0]!.money).toBe(50_000 + WEDDING_GIFT)
        expect(next.players[1]!.money).toBe(50_000 - WEDDING_GIFT)
        expect(next.lastEvent!.emphasis).toBe('milestone')
      })

      it('asks a second, kinder time on a low first spin, and can still land a rescued yes', () => {
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: weddingSpace } },
          players: [
            fixturePlayer({ id: 'p1', spaceId: 'a', money: 50_000 }),
            fixturePlayer({ id: 'p2', name: 'Bo', money: 50_000 }),
          ],
          currentPlayerIndex: 0,
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        // First spin (1) is under the bar, so a second (4) is drawn automatically.
        const random = createFakeRandom({ spins: [1, 4] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(random.calls.spins).toBe(2)
        expect(next.players[0]!.isMarried).toBe(true)
        expect(next.players[0]!.money).toBe(50_000 + WEDDING_GIFT - USA_ECONOMY.marriage.rescued.cost)
      })

      it('stays single on two low spins, and pays a LIFE tile instead', () => {
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: weddingSpace } },
          players: [
            fixturePlayer({ id: 'p1', spaceId: 'a', money: 50_000 }),
            fixturePlayer({ id: 'p2', name: 'Bo', money: 50_000 }),
          ],
          currentPlayerIndex: 0,
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [1, 1] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(next.players[0]!.isMarried).toBe(false)
        expect(next.players[0]!.money).toBe(50_000)
        expect(next.players[0]!.lifeTiles).toHaveLength(1)
        expect(next.lastEvent!.lifeTilesGained).toHaveLength(1)
      })
    })

    describe('household', () => {
      const board = fixtureMovementBoard()
      const jointSpace = { ...board.spaces.a!, effect: { type: 'household' as const, reason: 'Settled up' } }

      it('costs a married player money on a low spin', () => {
        const player = fixturePlayer({ spaceId: 'a', isMarried: true, money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: jointSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [1] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(next.players[0]!.money).toBeLessThan(100_000)
        expect(next.lastEvent!.moneyDelta).toBeLessThan(0)
      })

      it('pays a married player on a high spin', () => {
        const player = fixturePlayer({ spaceId: 'a', isMarried: true, money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: jointSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [6] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(next.players[0]!.money).toBeGreaterThan(100_000)
        expect(next.lastEvent!.moneyDelta).toBeGreaterThan(0)
      })
    })

    describe('tradeYear', () => {
      const board = fixtureMovementBoard()
      const COOK = BASIC_CAREERS.find((career) => career.id === 'career-line-cook')!
      const yearSpace = {
        ...board.spaces.a!,
        effect: { type: 'tradeYear' as const, reason: 'A year of long hours.', share: 0.5 },
      }
      const stateOn = (spin: 1 | 2 | 3 | 4 | 5 | 6, career = COOK) => {
        const player = fixturePlayer({ spaceId: 'a', career, money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: yearSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })
        return choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [spin] }) })
      }

      it('costs a bad year, and the worst face costs half a year of pay', () => {
        const next = stateOn(1)
        // Half of a Line Cook's $54,950, rounded to the board's hundreds.
        expect(next.players[0]!.money).toBe(100_000 - 27_500)
        expect(next.lastEvent!.moneyDelta).toBe(-27_500)
        expect(next.log.at(-1)!.tone).toBe('money-out')
      })

      it('pays a good year exactly what the bad one cost', () => {
        expect(stateOn(6).players[0]!.money).toBe(100_000 + 27_500)
        expect(stateOn(6).lastEvent!.moneyDelta).toBe(27_500)
        expect(stateOn(6).log.at(-1)!.tone).toBe('money-in')
      })

      it('never leaves the year even — the middle faces still swing', () => {
        expect(stateOn(3).lastEvent!.moneyDelta).toBeLessThan(0)
        expect(stateOn(4).lastEvent!.moneyDelta).toBeGreaterThan(0)
      })

      /*
       * The whole point of the tile, and the thing that makes it an
       * alternative to a career change rather than another one: whatever the
       * die said, the same person walks into the same job in the morning.
       */
      it('leaves the career, the ladder and the salary exactly where they were', () => {
        for (const spin of [1, 3, 6] as const) {
          const next = stateOn(spin)
          expect(next.players[0]!.career).toEqual(COOK)
          expect(next.players[0]!.carriedSeniority).toBeUndefined()
          expect(next.lastEvent!.notes.join(' ')).toContain('Still a Line Cook, on the same rung.')
        }
      })

      it('tells the family story for the face, and wears the trade\'s portrait', () => {
        const kitchen = stateOn(1)
        expect(kitchen.lastEvent!.narration).toBe(TRADE_YEAR_STORIES.kitchen[0])
        expect(kitchen.lastEvent!.icon).toBe(COOK.icon)

        // The same face, a different family, a different year entirely.
        const surgeon = BASIC_CAREERS[0]!
        const care = stateOn(1, { ...surgeon, icon: 'career:surgeon', salary: 54_950 })
        expect(care.lastEvent!.narration).toBe(TRADE_YEAR_STORIES.care[0])
      })

      it('scales with what the player earns rather than with a figure on the tile', () => {
        const apprentice = BASIC_CAREERS.find((career) => career.id === 'career-salon-apprentice')!
        const owner = BASIC_CAREERS.find((career) => career.id === 'career-salon-owner')!
        const small = stateOn(6, apprentice).lastEvent!.moneyDelta
        const large = stateOn(6, owner).lastEvent!.moneyDelta
        expect(large).toBeGreaterThan(small * 3)
      })

      it('prints the die that decided it', () => {
        expect(stateOn(5).lastEvent!.rolled).toBe(5)
      })
    })

    describe('haveChildren', () => {
      const board = fixtureMovementBoard()
      const babySpace = { ...board.spaces.a!, effect: { type: 'haveChildren' as const, count: 1, celebrationPerPip: 500 } }

      it('spins for the gift envelopes only once the player presses the button', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 0 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: babySpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [6] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(random.calls.spins).toBe(1)
        expect(next.phase).toBe('resolved')
        expect(next.pendingDecision).toBeNull()
        expect(next.players[0]!.money).toBe(3_000)
        expect(next.lastEvent!.moneyDelta).toBe(3_000)
        // The roll is on the event and the total is on the delta plate, so
        // neither the note nor the narration says either of them again.
        expect(next.lastEvent!.rolled).toBe(6)
        expect(next.lastEvent!.notes).toEqual([])
        expect(next.lastEvent!.narration).not.toContain(formatMoney(3_000))
      })
    })

    describe('tuition', () => {
      const board = fixtureMovementBoard()
      const billSpace = { ...board.spaces.a!, effect: { type: 'tuition' as const, reason: 'College tuition' } }

      it('spins for the bill only once the player presses the button, landing in the worst band', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const random = createFakeRandom({ spins: [1] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(random.calls.spins).toBe(1)
        expect(next.phase).toBe('resolved')
        expect(next.pendingDecision).toBeNull()
        const worstBand = USA_ECONOMY.tuition.outcomes[0]!
        expect(next.players[0]!.money).toBe(100_000 - worstBand.cost)
        expect(next.lastEvent!.moneyDelta).toBe(-worstBand.cost)
        // The number the wheel actually landed on, so the visible spinner has
        // something to animate to instead of the result just appearing.
        expect(next.lastSpin).toBe(1)
      })

      it('charges nothing on a spin that lands in the free band', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const bestBand = USA_ECONOMY.tuition.outcomes[USA_ECONOMY.tuition.outcomes.length - 1]!
        expect(bestBand.cost).toBe(0)
        const random = createFakeRandom({ spins: [bestBand.upTo] })
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random })

        expect(next.players[0]!.money).toBe(100_000)
        expect(next.lastEvent!.moneyDelta).toBe(0)
        expect(next.lastEvent!.notes.join(' ')).toContain('full ride')
      })

      /*
       * The card a real player read back, verbatim: "A 2 for Player 1. The
       * financial aid letter arrives a semester late... Tuition comes to
       * $90,000." and then, underneath, "Rolled a 2 — The financial aid
       * letter arrives a semester late..." and "Tuition: $90,000" again.
       * Three facts, each said twice. Each one now has exactly one home.
       */
      it('says the roll, the reason and the bill exactly once each', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [1] }) })
        const event = next.lastEvent!
        const band = USA_ECONOMY.tuition.outcomes[0]!
        const bill = formatMoney(band.cost)

        // The roll: carried structurally for the card to print, and written
        // out nowhere.
        expect(event.rolled).toBe(1)
        expect(event.notes.join(' ')).not.toMatch(/rolled/i)
        expect(event.narration).not.toMatch(/rolled|a 1\b/i)

        // The reason: the narration, and only the narration.
        expect(event.narration).toBe(band.note)
        expect(event.notes.join(' ')).not.toContain(band.note)

        // The bill: the plate, and only the plate. A player who can cover it
        // sees it as the delta, so a note repeating it is the same sentence
        // twice; a player who cannot is told it as `borrowing.charge`, below.
        expect(event.moneyDelta).toBe(-band.cost)
        expect(event.notes.join(' ')).not.toContain(bill)
        expect(event.narration).not.toContain(bill)
      })

      it('reports the loans a bill too big to cover forced, as figures rather than a sentence', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 0 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [1] }) })
        const loans = next.players[0]!.loans
        expect(loans).toBeGreaterThan(0)

        // The whole point of B1: the wallet went *up* on the biggest charge
        // on the board, and the card has to be able to say why without
        // adding a payment and a debt together into one green number.
        const borrowing = next.lastEvent!.borrowing!
        expect(next.lastEvent!.moneyDelta).toBeGreaterThan(0)
        expect(borrowing.loans).toBe(loans)
        expect(borrowing.borrowed).toBe(loans * USA_ECONOMY.loanPrincipal)
        expect(borrowing.charge).toBe(USA_ECONOMY.tuition.outcomes[0]!.cost)
        expect(borrowing.dueAtRetirement).toBeGreaterThan(borrowing.borrowed)
      })

      /*
       * The case that confused a real player, and the reason `balanceAfter` is
       * read off the wallet rather than composed by the handler. A bill bigger
       * than the player has takes automatic loans to cover it, so the plate
       * reports the *net* of bill and principal — here a bill of tens of
       * thousands lands as a rise — and the one number that makes sense of
       * that is what is actually in the wallet afterwards.
       */
      it('reports the balance an auto-loaned bill really left', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 0 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [1] }) })
        const settled = next.players[0]!
        expect(settled.loans).toBeGreaterThan(0)
        // Never negative: the loans covered the bill, and the card can say so.
        expect(next.lastEvent!.balanceAfter).toBe(settled.money)
        expect(next.lastEvent!.balanceAfter).toBeGreaterThanOrEqual(0)
      })

      it('reports the balance an ordinary debit left, with no loan involved', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [1] }) })
        expect(next.players[0]!.loans).toBe(0)
        expect(next.lastEvent!.balanceAfter).toBe(100_000 + next.lastEvent!.moneyDelta)
      })

      it('leaves the balance off a card that moved no money', () => {
        const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
        const state = decisionState({
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const bestBand = USA_ECONOMY.tuition.outcomes[USA_ECONOMY.tuition.outcomes.length - 1]!
        const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [bestBand.upTo] }) })
        expect(next.lastEvent!.moneyDelta).toBe(0)
        expect(next.lastEvent!.balanceAfter).toBeUndefined()
      })

      it('pays the player on a band that costs less than nothing', () => {
        /*
         * The Researcher: France board's thesis die, and the only face of a
         * tuition tile anywhere in this game that credits rather than debits:
         * a doctorate done inside a company, on an employment contract. See
         * `TuitionOutcome.cost`.
         */
        const paying =
          RESEARCHER_FRANCE_ECONOMY.tuition.outcomes[RESEARCHER_FRANCE_ECONOMY.tuition.outcomes.length - 1]!
        expect(paying.cost).toBeLessThan(0)
        const player = fixturePlayer({ spaceId: 'a', money: 100_000 })
        const state = decisionState({
          editionId: EDITION_RESEARCHER_FRANCE.id,
          board: { ...board, spaces: { ...board.spaces, a: billSpace } },
          players: [player],
          pendingDecision: decision('valueSpin', VALUE_SPIN_OPTION_ID),
        })

        const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [paying.upTo] }) })
        expect(next.players[0]!.money).toBe(100_000 - paying.cost)
        expect(next.lastEvent!.moneyDelta).toBe(-paying.cost)
        // No "full ride" note: the plate carries the money coming in, and the
        // band's own line is the colour.
        expect(next.lastEvent!.notes).toEqual([])
        expect(next.log[0]!.message).toContain('paid to them')
      })
    })

    /**
     * The concours: a `careerChange` with a bar on it. Two faces appoint, four
     * do nothing at all, and doing nothing is the point — see `SpaceEffect`'s
     * `passSpin` and `src/domain/rules/careerGate.ts`.
     */
    describe('a gated career roll', () => {
      const board = fixtureMovementBoard()
      const gateSpace = {
        ...board.spaces.a!,
        effect: {
          type: 'careerChange' as const,
          reason: 'The competition',
          compulsory: true,
          pool: 'doctorate' as const,
          passSpin: 5 as const,
        },
      }
      const postdoc = CONTRACT_CAREERS.find((c) => c.id === 'career-frr-postdoc')!
      const offers = [
        FONCTIONNAIRE_CAREERS[0]!.id,
        FONCTIONNAIRE_CAREERS[2]!.id,
      ] as [string, string]

      const sitting = () =>
        decisionState({
          editionId: EDITION_RESEARCHER_FRANCE.id,
          board: { ...board, spaces: { ...board.spaces, a: gateSpace } },
          players: [
            fixturePlayer({ spaceId: 'a', hasDegree: true, hasDoctorate: true, career: postdoc, money: 100_000 }),
          ],
          pendingDecision: {
            ...decision('valueSpin', VALUE_SPIN_OPTION_ID),
            offeredCareerIds: offers,
          },
        })

      it('changes absolutely nothing on a face under the bar', () => {
        const next = choose(sitting(), VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [4] }) })
        expect(next.players[0]!.career).toEqual(postdoc)
        expect(next.players[0]!.money).toBe(100_000)
        expect(next.lastEvent!.moneyDelta).toBe(0)
        expect(next.lastEvent!.rolled).toBe(4)
        expect(next.lastEvent!.narration).toContain('Not this time')
        expect(next.phase).toBe('resolved')
      })

      it('appoints on the bar itself, and splits the passing faces between the two posts', () => {
        const cleared = choose(sitting(), VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [5] }) })
        expect(cleared.players[0]!.career!.id).toBe(offers[0])
        expect(cleared.players[0]!.career!.cannotBeLaidOff).toBe(true)

        const theOther = choose(sitting(), VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [6] }) })
        expect(theOther.players[0]!.career!.id).toBe(offers[1])
      })
    })
  })

  describe('event presentation', () => {
    it('narrates every resolved decision and marks a new career as a milestone', () => {
      const career = BASIC_CAREERS[0]!
      const cases: Array<{ decision: Decision; optionId: string }> = [
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
        pendingDecision: {
          kind: 'valueSpin',
          prompt: 'Choose your career path',
          options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: '', icon: 'space:payday' }],
          offeredCareerIds: [career.id, BASIC_CAREERS[1]!.id],
        },
      })
      expect(
        choose(careerState, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [3] }) }).lastEvent!.emphasis,
      ).toBe('milestone')
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
      pendingDecision: branchDecision(board, 'fork', null, fixturePlayer()),
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
    const decision = branchDecision(board, 'fork', null, fixturePlayer())
    expect(decision.prompt).not.toMatch(/\d+\s+space/)
    // And it does not tell the player to roll: the two roads are on screen as
    // pickable cards and the die follows on its own once one is taken.
    expect(decision.prompt).toBe('Which way do you go?')
  })

  it('still resolves a fork reached mid-move, where the distance is known', () => {
    const board = fixtureMovementBoard()
    const state = fixtureState({
      board,
      players: [fixturePlayer({ id: 'p1', spaceId: 'fork' })],
      currentPlayerIndex: 0,
      phase: 'awaitingDecision',
      stepsRemaining: 2,
      pendingDecision: branchDecision(board, 'fork', 2, fixturePlayer()),
    })

    const next = choose(state, board.spaces['fork']!.next[0]!, { random: createFakeRandom() })

    expect(next.phase).toBe('moving')
    expect(next.chosenExit).toBeNull()
  })
})

/*
 * A number that simply appeared in prose was the complaint. A tile a move
 * only swept past resolved its die out of sight and handed over a card
 * reading "Rolled a 3." — true, and about something the player never saw
 * happen. The card carries the die that decided it now, so the shell can put
 * that roll back on screen; every wheel-decided outcome flows through
 * `resolveSpinOutcome`, so the mark is stamped there rather than tile by
 * tile, and it never changes what was decided.
 */
describe('the die that decided a card', () => {
  it('is stamped on whatever a value spin resolves into', () => {
    const player = fixturePlayer({ spaceId: 'a', career: null })
    const state = decisionState({
      players: [player],
      pendingDecision: {
        kind: 'valueSpin',
        prompt: 'Choose your career path',
        options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description: '', icon: 'space:payday' }],
        offeredCareerIds: [BASIC_CAREERS[0]!.id, BASIC_CAREERS[1]!.id],
      },
    })

    const next = choose(state, VALUE_SPIN_OPTION_ID, { random: createFakeRandom({ spins: [5] }) })

    expect(next.lastEvent!.rolled).toBe(5)
    expect(next.lastSpin).toBe(5)
  })

  it('is absent from an answer that never touched the die', () => {
    const state = decisionState({
      players: [fixturePlayer({ spaceId: 'a' })],
      pendingDecision: decision('bank', BANK_DECLINE_OPTION_ID),
    })

    const next = choose(state, BANK_DECLINE_OPTION_ID, { random: createFakeRandom() })

    expect(next.lastEvent!.rolled).toBeUndefined()
  })
})

/*
 * The invariant behind `DecisionOption.turnsTheDie`, checked against what the
 * resolvers actually do rather than against anyone's memory of them.
 *
 * The shell cannot hold a card back for a die it does not know is coming. A
 * single-option value spin is obvious — the decision *is* a die — but the same
 * roll hides inside an ordinary decision card the moment a second option
 * exists to weigh, and `choose` resolves it in the very tick it is dispatched.
 * That is exactly how a career fair and The Number both came to hand a player
 * a finished card stamped "Rolled 6" with no die ever on screen: each guard
 * along the way was correct, and none of them knew a roll was owed.
 *
 * So every option in the game is walked here, on every edition's real board,
 * and the flag is held to the only thing that makes it true: whether answering
 * with it actually calls `random.spin()`.
 */
describe('every option that reaches for the die says so', () => {
  /** Equipped for as many tiles as one player can plausibly be, so the walk below reaches them. */
  function walker(edition: ReturnType<typeof allEditions>[number], withCareer: boolean) {
    const career = edition.careers.basic[0]
    return fixturePlayer({
      money: 5_000_000,
      career: withCareer && career ? career : null,
      hasDegree: true,
      isMarried: true,
      loans: 2,
    })
  }

  it('marks exactly the options whose answer turns the die, on every board in the game', () => {
    const rolling: string[] = []
    const still: string[] = []

    for (const edition of allEditions()) {
      const board = createBoard('normal', edition)
      for (const space of Object.values(board.spaces)) {
        for (const withCareer of [true, false]) {
          const player = walker(edition, withCareer)
          const base = fixtureState({
            board,
            editionId: edition.id,
            players: [{ ...player, spaceId: space.id }],
          })

          let raised
          try {
            raised = applyEffect(base, space, { random: createFakeRandom() })
          } catch {
            continue
          }
          const decisionRaised = raised.state.pendingDecision
          // A fork's options are roads, and answering one needs movement
          // context this walk has no business inventing.
          if (!decisionRaised || decisionRaised.kind === 'branch') continue

          for (const option of decisionRaised.options) {
            const random = createFakeRandom()
            let answered
            try {
              answered = choose({ ...raised.state, phase: 'awaitingDecision' }, option.id, { random })
            } catch {
              continue
            }
            const label = `${edition.id}/${space.id}/${option.id}`

            // `rolled` is what the finished card prints; `lastSpin` is what
            // the die on screen animates to. Publishing one without the other
            // leaves a die with no number to settle on — it never turns, and
            // the turn hangs behind it, waiting on an animation that cannot
            // start. `resolveRetireEarly` did exactly that.
            if (answered.lastEvent?.rolled !== undefined) {
              expect(
                { option: label, lastSpin: answered.lastSpin },
                `"${label}" printed a rolled face but no lastSpin for the die to land on`,
              ).toEqual({ option: label, lastSpin: answered.lastEvent.rolled })
            }
            if (random.calls.spins > 0) rolling.push(label)
            else still.push(label)

            expect(
              { option: label, turnsTheDie: option.turnsTheDie === true },
              `answering "${label}" ${random.calls.spins > 0 ? 'turns the die but is not marked turnsTheDie — the shell will show its result with no die on screen' : 'never turns the die but is marked turnsTheDie — the shell will ask for a press nothing is waiting on'}`,
            ).toEqual({ option: label, turnsTheDie: random.calls.spins > 0 })
          }
        }
      }
    }

    // A walk that reached nothing would pass every assertion above by never
    // making one, so it has to prove it found both kinds.
    expect(rolling.length).toBeGreaterThan(0)
    expect(still.length).toBeGreaterThan(0)
    // The two the player actually reported, by name, so a route that stopped
    // offering either would fail here rather than quietly narrowing the test.
    expect(rolling.some((entry) => entry.includes('main-career-fair'))).toBe(true)
    expect(rolling.some((entry) => entry.includes('sunset-number'))).toBe(true)
  })
})
