import { describe, expect, it } from 'vitest'
import type { LifeTile } from '@domain/model/types'
import {
  CASUAL_WAGE_PER_PIP,
  EARLY_LOAN_REPAYMENT,
  INSURANCE_PREMIUM,
  WEDDING_GIFT,
} from '@domain/model/constants'
import { BASIC_CAREERS, GRADUATE_CAREERS } from '@domain/edition/usa'
import { HOUSES } from '@domain/edition/usa'
import { STOCKS } from '@domain/edition/usa'
import { fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import {
  applyEffect,
  BANK_DECLINE_OPTION_ID,
  BANK_LOAN_OPTION_ID,
  BANK_REPAY_OPTION_ID,
  CAREER_STAY_OPTION_ID,
  DECLINE_HOUSE_OPTION_ID,
  DECLINE_INSURANCE_OPTION_ID,
  DECLINE_STOCK_OPTION_ID,
  insuranceOptionId,
} from './applyEffect'

const TILE_A: LifeTile = { id: 'tile-a', title: 'Ran a Marathon', value: 15_000, icon: 'tile:marathon' }
const TILE_B: LifeTile = { id: 'tile-b', title: 'Wrote a Novel', value: 90_000, icon: 'tile:novel' }

describe('applyEffect', () => {
  describe('none', () => {
    it('leaves the player untouched and logs an event entry', () => {
      const player = fixturePlayer()
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'none' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]).toEqual(player)
      expect(event.moneyDelta).toBe(0)
      expect(next.log).toHaveLength(1)
      expect(next.log[0]!.tone).toBe('event')
      expect(next.pendingDecision).toBeNull()
    })
  })

  describe('gainMoney', () => {
    it('credits the amount to the player', () => {
      const player = fixturePlayer({ money: 1_000 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'gainMoney', amount: 500, reason: 'Found cash' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBe(1_500)
      expect(event.moneyDelta).toBe(500)
      expect(next.log[0]!.tone).toBe('money-in')
    })
  })

  describe('payMoney', () => {
    it('debits the amount when the player can afford it', () => {
      const player = fixturePlayer({ money: 1_000 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payMoney', amount: 300, reason: 'Car repair' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBe(700)
      expect(event.moneyDelta).toBe(-300)
      expect(next.log[0]!.tone).toBe('money-out')
    })

    it('auto-takes a loan when the payment would go below zero', () => {
      const player = fixturePlayer({ money: 100, loans: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payMoney', amount: 5_000, reason: 'Emergency' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBeGreaterThanOrEqual(0)
      expect(next.players[0]!.loans).toBeGreaterThan(0)
    })
  })

  describe('payday', () => {
    it('pays a contract flat, and does not touch the wheel to do it', () => {
      // Salaried work is the one kind of payday the wheel has no say in. Burning
      // a spin on it anyway would be invisible here but would shift every later
      // draw in the game, so the unused wheel is part of the promise.
      const career = BASIC_CAREERS.find((c) => c.payPerPip === undefined)!
      const player = fixturePlayer({ money: 1_000, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const random = createFakeRandom({ spins: [9] })
      const { state: next, event } = applyEffect(state, space, { random })
      expect(next.players[0]!.money).toBe(1_000 + career.salary)
      expect(event.moneyDelta).toBe(career.salary)
      expect(random.calls.spins).toBe(0)
      expect(next.log[0]!.tone).toBe('money-in')
    })

    it('pays casual shifts by the spin when unemployed, never nothing', () => {
      const player = fixturePlayer({ money: 1_000, career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom({ spins: [7] }) })
      expect(next.players[0]!.money).toBe(1_000 + CASUAL_WAGE_PER_PIP * 7)
      expect(event.moneyDelta).toBe(CASUAL_WAGE_PER_PIP * 7)
      expect(next.log[0]!.tone).toBe('money-in')
    })

    it('says the shifts were picked up, and shows the spin that paid for them', () => {
      const player = fixturePlayer({ money: 0, career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom({ spins: [4] }) })
      expect(event.notes.join(' ')).toContain('pick up shifts')
      expect(event.notes.join(' ')).toContain('Spun a 4')
      expect(next.log[0]!.message).toContain('casual shifts')
    })

    it('pays an unsteady career by the spin rather than its headline salary', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip !== undefined)!
      const player = fixturePlayer({ money: 0, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })

      const lean = applyEffect(state, space, { random: createFakeRandom({ spins: [2] }) })
      const fat = applyEffect(state, space, { random: createFakeRandom({ spins: [9] }) })

      expect(lean.event.moneyDelta).toBe(career.payPerPip! * 2)
      expect(fat.event.moneyDelta).toBe(career.payPerPip! * 9)
      expect(fat.event.notes.join(' ')).toContain('Spun a 9')
      expect(fat.state.log[0]!.message).toContain('spinning a 9')
    })

    it('leaves a salaried packet flat, and never spends a spin on it', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip === undefined)!
      const player = fixturePlayer({ money: 0, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const random = createFakeRandom({ spins: [10] })

      const { event } = applyEffect(state, space, { random })

      expect(event.moneyDelta).toBe(career.salary)
      expect(event.notes.join(' ')).not.toContain('Spun')
      expect(random.calls.spins).toBe(0)
    })
  })

  describe('payRaise', () => {
    it('raises the salary when employed', () => {
      const career = BASIC_CAREERS[0]!
      const player = fixturePlayer({ career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payRaise' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.career!.salary).toBe(career.salary + career.raiseStep)
      expect(event.moneyDelta).toBe(0)
      expect(next.log[0]!.tone).toBe('milestone')
    })

    it('does nothing when unemployed', () => {
      const player = fixturePlayer({ career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payRaise' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.career).toBeNull()
    })
  })

  describe('gainLifeTiles', () => {
    it('draws the requested number of tiles from the shuffled deck', () => {
      const player = fixturePlayer()
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'gainLifeTiles', count: 2 } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.lifeTiles).toHaveLength(2)
      expect(event.lifeTilesGained).toHaveLength(2)
      expect(event.moneyDelta).toBe(0)
    })
  })

  describe('chooseCareer', () => {
    it('offers two options from the basic pool', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision).not.toBeNull()
      expect(next.pendingDecision!.kind).toBe('career')
      expect(next.pendingDecision!.options).toHaveLength(2)
      const basicIds = new Set(BASIC_CAREERS.map((c) => c.id))
      for (const option of next.pendingDecision!.options) {
        expect(basicIds.has(option.id)).toBe(true)
      }
    })

    it('offers from the graduate pool when the player has a degree', () => {
      const player = fixturePlayer({ hasDegree: true })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'graduate' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const graduateIds = new Set(GRADUATE_CAREERS.map((c) => c.id))
      for (const option of next.pendingDecision!.options) {
        expect(graduateIds.has(option.id)).toBe(true)
      }
    })

    it('falls back to the basic pool when a graduate offer meets a player without a degree', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'graduate' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const basicIds = new Set(BASIC_CAREERS.map((c) => c.id))
      for (const option of next.pendingDecision!.options) {
        expect(basicIds.has(option.id)).toBe(true)
      }
    })

    it('does not change the player until a choice is made', () => {
      const player = fixturePlayer({ career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.career).toBeNull()
    })
  })

  describe('graduate', () => {
    it('grants a degree', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'graduate' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.hasDegree).toBe(true)
      expect(event.notes).toContain('Earned a degree!')
    })
  })

  describe('getMarried', () => {
    /** Three guests, one of them retired and therefore not paying for anything. */
    const weddingParty = () =>
      fixtureState({
        players: [
          fixturePlayer({ id: 'p1', name: 'Alex', money: 50_000 }),
          fixturePlayer({ id: 'p2', name: 'Bo', money: 50_000 }),
          fixturePlayer({ id: 'p3', name: 'Cy', money: 50_000, isRetired: true }),
        ],
        currentPlayerIndex: 0,
      })

    const MARRIAGE_SPACE = { effect: { type: 'getMarried' } } as const

    it('marries on a spin of 3 or better and collects a gift from every active guest', () => {
      const state = weddingParty()
      const space = fixtureSpace(MARRIAGE_SPACE)
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom({ spins: [3] }) })

      expect(next.players[0]!.isMarried).toBe(true)
      // only the non-retired guest pays; both have plenty of cash, so no auto-loan kicks in
      expect(next.players[0]!.money).toBe(50_000 + WEDDING_GIFT)
      expect(next.players[1]!.money).toBe(50_000 - WEDDING_GIFT)
      expect(next.players[2]!.money).toBe(50_000) // retired guest is skipped
      expect(event.moneyDelta).toBe(WEDDING_GIFT)
    })

    it('turns a spin of 8 or better into a wedding half again as expensive for the guests', () => {
      const state = weddingParty()
      const space = fixtureSpace(MARRIAGE_SPACE)
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom({ spins: [8] }) })

      const grand = Math.round(WEDDING_GIFT * 1.5)
      expect(next.players[0]!.isMarried).toBe(true)
      expect(event.moneyDelta).toBe(grand)
      expect(next.players[1]!.money).toBe(50_000 - grand)
      expect(next.log[0]!.message).toContain('spectacularly')
    })

    it('asks again after a 1 or a 2, and a 2 on the second ask still gets a wedding', () => {
      const state = weddingParty()
      const space = fixtureSpace(MARRIAGE_SPACE)
      // 1 is under the bar, so the wheel is given a second, kinder chance.
      const random = createFakeRandom({ spins: [1, 2] })
      const { state: next, event } = applyEffect(state, space, { random })

      expect(random.calls.spins).toBe(2)
      expect(next.players[0]!.isMarried).toBe(true)
      expect(event.moneyDelta).toBe(WEDDING_GIFT)
      expect(event.notes.join(' ')).toContain('this time, yes')
    })

    it('leaves the player single on a 1 and then a 1, and pays them a LIFE tile for the year', () => {
      const state = weddingParty()
      const space = fixtureSpace(MARRIAGE_SPACE)
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom({ spins: [1] }) })

      expect(next.players[0]!.isMarried).toBe(false)
      // Nobody pays for a wedding that did not happen.
      expect(next.players[0]!.money).toBe(50_000)
      expect(next.players[1]!.money).toBe(50_000)
      expect(event.moneyDelta).toBe(0)
      expect(event.lifeTilesGained).toHaveLength(1)
      expect(next.players[0]!.lifeTiles).toHaveLength(1)
      // Staying single must not close Family Lane off — that would make one bad
      // spin cost the player the whole family side of the board.
      expect(next.players[0]!.children).toBe(0)
      expect(event.notes.join(' ')).toContain('still open')
    })

    it('is a no-op for a player who is already married', () => {
      const state = fixtureState({ players: [fixturePlayer({ isMarried: true, money: 50_000 })] })
      const space = fixtureSpace(MARRIAGE_SPACE)
      const random = createFakeRandom({ spins: [10] })
      const { state: next, event } = applyEffect(state, space, { random })

      expect(next.players[0]!.money).toBe(50_000)
      expect(event.moneyDelta).toBe(0)
      expect(random.calls.spins).toBe(0)
    })
  })

  describe('haveChildren', () => {
    it('adds children to the player', () => {
      const player = fixturePlayer({ children: 1 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'haveChildren', count: 2 } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.children).toBe(3)
      expect(event.moneyDelta).toBe(0)
    })
  })

  describe('buyHouse', () => {
    it('offers three houses plus a decline option', () => {
      const player = fixturePlayer()
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'buyHouse' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision).not.toBeNull()
      expect(next.pendingDecision!.kind).toBe('house')
      expect(next.pendingDecision!.options).toHaveLength(4)
      const houseIds = new Set(HOUSES.map((h) => h.id))
      const [a, b, c, decline] = next.pendingDecision!.options
      expect(houseIds.has(a!.id)).toBe(true)
      expect(houseIds.has(b!.id)).toBe(true)
      expect(houseIds.has(c!.id)).toBe(true)
      expect(houseIds.has(decline!.id)).toBe(false)
    })

    it('does not change the player until a choice is made', () => {
      const player = fixturePlayer({ house: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'buyHouse' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.house).toBeNull()
    })
  })

  describe('collectFromEach', () => {
    it('collects the amount from every other active player', () => {
      const mover = fixturePlayer({ id: 'p1', money: 0 })
      const p2 = fixturePlayer({ id: 'p2', money: 1_000 })
      const p3 = fixturePlayer({ id: 'p3', money: 1_000, isRetired: true })
      const state = fixtureState({ players: [mover, p2, p3], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'collectFromEach', amount: 200, reason: 'Prize money' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBe(200)
      expect(next.players[1]!.money).toBe(800)
      expect(next.players[2]!.money).toBe(1_000)
      expect(event.moneyDelta).toBe(200)
    })
  })

  describe('payEach', () => {
    it('pays the amount to every other active player', () => {
      const mover = fixturePlayer({ id: 'p1', money: 1_000 })
      const p2 = fixturePlayer({ id: 'p2', money: 0 })
      const p3 = fixturePlayer({ id: 'p3', money: 0, isRetired: true })
      const state = fixtureState({ players: [mover, p2, p3], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'payEach', amount: 200, reason: 'Round of drinks' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBe(800)
      expect(next.players[1]!.money).toBe(200)
      expect(next.players[2]!.money).toBe(0)
      expect(event.moneyDelta).toBe(-200)
    })
  })

  describe('spinForMoney', () => {
    it('gains perPip times the spin result', () => {
      const player = fixturePlayer({ money: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'spinForMoney', perPip: 100, reason: 'Lucky roll' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom({ spins: [7] }) })
      expect(next.players[0]!.money).toBe(700)
      expect(event.moneyDelta).toBe(700)
    })
  })

  describe('retire', () => {
    it('retires the player with rank 1 when nobody has retired yet', () => {
      const player = fixturePlayer()
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'retire' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.isRetired).toBe(true)
      expect(next.players[0]!.retirementRank).toBe(1)
    })

    it('assigns the next rank after other retirees', () => {
      const mover = fixturePlayer({ id: 'p1' })
      const already = fixturePlayer({ id: 'p2', isRetired: true, retirementRank: 1 })
      const state = fixtureState({ players: [mover, already], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'retire' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.retirementRank).toBe(2)
    })
  })

  // -------------------------------------------------------------------------
  // Hosting: every branch narrates, and the card knows how hard to land
  // -------------------------------------------------------------------------

  describe('event presentation', () => {
    it('gives every effect a non-empty narration and an emphasis', () => {
      const player = fixturePlayer({ id: 'p1', career: BASIC_CAREERS[0]!, children: 2, house: HOUSES[0]!, lifeTiles: [TILE_A] })
      const rival = fixturePlayer({ id: 'p2', name: 'Bo', money: 500_000, lifeTiles: [TILE_B] })
      const state = fixtureState({ players: [player, rival], currentPlayerIndex: 0 })

      const effects = [
        { type: 'none' },
        { type: 'gainMoney', amount: 500, reason: 'Found cash' },
        { type: 'payMoney', amount: 500, reason: 'Toll' },
        { type: 'payMoney', amount: 60_000, reason: 'House fire', hazard: 'fire' },
        { type: 'payday' },
        { type: 'payRaise' },
        { type: 'gainLifeTiles', count: 1 },
        { type: 'chooseCareer', pool: 'basic' },
        { type: 'graduate' },
        { type: 'getMarried' },
        { type: 'haveChildren', count: 1 },
        { type: 'buyHouse' },
        { type: 'collectFromEach', amount: 100, reason: 'Prize' },
        { type: 'payEach', amount: 100, reason: 'Drinks' },
        { type: 'spinForMoney', perPip: 100, reason: 'Lucky roll' },
        { type: 'retire' },
        { type: 'careerChange', reason: 'Headhunted!' },
        { type: 'loseCareer', reason: 'Laid off.' },
        { type: 'buyStock' },
        { type: 'stockDividend', perShare: 5_000, reason: 'Dividend day' },
        { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] },
        { type: 'bank' },
        { type: 'payPerChild', amount: 5_000, reason: 'School fees' },
        { type: 'collectPerChild', amount: 5_000, reason: 'Child benefit' },
        { type: 'swapMoneyWithLeader', reason: 'Rival swap' },
        { type: 'stealLifeTile', reason: 'Sticky fingers' },
        { type: 'upgradeHouse' },
      ] as const

      for (const effect of effects) {
        const space = fixtureSpace({ effect })
        const { event } = applyEffect(state, space, { random: createFakeRandom() })
        expect(event.narration, `narration for ${effect.type}`).toBeTruthy()
        expect(event.narration!.length, `narration for ${effect.type}`).toBeGreaterThan(10)
        expect(['normal', 'big', 'milestone']).toContain(event.emphasis)
      }
    })

    it('marks life milestones as milestones', () => {
      const state = fixtureState({ players: [fixturePlayer({ career: BASIC_CAREERS[0]! })] })
      for (const effect of [{ type: 'graduate' }, { type: 'getMarried' }, { type: 'retire' }] as const) {
        const { event } = applyEffect(state, fixtureSpace({ effect }), { random: createFakeRandom() })
        expect(event.emphasis, effect.type).toBe('milestone')
      }
    })

    it("reserves the 'upset' log tone for the two effects that reorder the standings", () => {
      // The log tone is what GameLog styles an upset from, so a false positive
      // on an ordinary space would cry wolf at the table.
      const player = fixturePlayer({ id: 'p1', career: BASIC_CAREERS[0]!, children: 2, house: HOUSES[0]!, lifeTiles: [TILE_A] })
      const rival = fixturePlayer({ id: 'p2', name: 'Bo', money: 500_000, lifeTiles: [TILE_B] })
      const state = fixtureState({ players: [player, rival], currentPlayerIndex: 0 })

      const upsetting = ['swapMoneyWithLeader', 'stealLifeTile']
      const effects = [
        { type: 'none' },
        { type: 'gainMoney', amount: 500, reason: 'Found cash' },
        { type: 'payMoney', amount: 90_000, reason: 'Toll' },
        { type: 'payday' },
        { type: 'payRaise' },
        { type: 'gainLifeTiles', count: 1 },
        { type: 'graduate' },
        { type: 'getMarried' },
        { type: 'haveChildren', count: 1 },
        { type: 'collectFromEach', amount: 100_000, reason: 'Prize' },
        { type: 'payEach', amount: 100_000, reason: 'Drinks' },
        { type: 'spinForMoney', perPip: 100, reason: 'Lucky roll' },
        { type: 'retire' },
        { type: 'loseCareer', reason: 'Laid off.' },
        { type: 'stockDividend', perShare: 5_000, reason: 'Dividend day' },
        { type: 'payPerChild', amount: 5_000, reason: 'School fees' },
        { type: 'collectPerChild', amount: 5_000, reason: 'Child benefit' },
        { type: 'swapMoneyWithLeader', reason: 'Rival swap' },
        { type: 'stealLifeTile', reason: 'Sticky fingers' },
      ] as const

      for (const effect of effects) {
        const { state: next } = applyEffect(state, fixtureSpace({ effect }), { random: createFakeRandom() })
        const tones = next.log.map((entry) => entry.tone)
        if (upsetting.includes(effect.type)) expect(tones, effect.type).toContain('upset')
        else expect(tones, effect.type).not.toContain('upset')
      }
    })

    it('sizes an ordinary payment as normal and a large one as big', () => {
      const state = fixtureState({ players: [fixturePlayer({ money: 500_000 })] })
      const small = applyEffect(
        state,
        fixtureSpace({ effect: { type: 'payMoney', amount: 1_000, reason: 'Groceries' } }),
        { random: createFakeRandom() },
      )
      const large = applyEffect(
        state,
        fixtureSpace({ effect: { type: 'gainMoney', amount: 120_000, reason: 'Lottery win' } }),
        { random: createFakeRandom() },
      )
      expect(small.event.emphasis).toBe('normal')
      expect(large.event.emphasis).toBe('big')
    })
  })

  // -------------------------------------------------------------------------
  // Insurance
  // -------------------------------------------------------------------------

  describe('payMoney with a hazard', () => {
    it('charges nothing and says so when the matching policy is held', () => {
      const player = fixturePlayer({ money: 100_000, insurance: ['home'] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payMoney', amount: 60_000, reason: 'House fire', hazard: 'fire' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(100_000)
      expect(event.moneyDelta).toBe(0)
      expect(event.emphasis).toBe('big')
      expect(event.notes.some((note) => note.includes('covers it'))).toBe(true)
      expect(event.narration).toContain('Insured!')
      expect(next.log[0]!.message).toContain('covered')
      expect(next.log[0]!.tone).toBe('milestone')
    })

    it('still charges when the policy held covers a different hazard', () => {
      const player = fixturePlayer({ money: 100_000, insurance: ['auto'] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payMoney', amount: 60_000, reason: 'House fire', hazard: 'fire' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(40_000)
      expect(event.moneyDelta).toBe(-60_000)
    })

    it('charges an uninsured player in full', () => {
      const player = fixturePlayer({ money: 100_000, insurance: [] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payMoney', amount: 30_000, reason: 'Fender bender', hazard: 'accident' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBe(70_000)
    })
  })

  describe('buyInsurance', () => {
    it('offers every kind the player does not hold, plus a decline option', () => {
      const player = fixturePlayer({ insurance: [] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['home', 'auto', 'life'] } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.kind).toBe('insurance')
      expect(next.pendingDecision!.options.map((option) => option.id)).toEqual([
        insuranceOptionId('home'),
        insuranceOptionId('auto'),
        insuranceOptionId('life'),
        DECLINE_INSURANCE_OPTION_ID,
      ])
    })

    it('never re-offers a policy already held', () => {
      const player = fixturePlayer({ insurance: ['home'] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['home', 'auto'] } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision!.options.map((option) => option.id)).toEqual([
        insuranceOptionId('auto'),
        DECLINE_INSURANCE_OPTION_ID,
      ])
    })

    it('raises no decision at all when every offered policy is already held', () => {
      const player = fixturePlayer({ insurance: ['home', 'auto'] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['home', 'auto'] } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision).toBeNull()
      expect(event.notes[0]).toContain('Already covered')
    })

    it('prices each option at its premium', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['life'] } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision!.options[0]!.detail).toContain(
        INSURANCE_PREMIUM.life.toLocaleString('en-US'),
      )
    })
  })

  // -------------------------------------------------------------------------
  // Career churn
  // -------------------------------------------------------------------------

  describe('careerChange', () => {
    it('offers two other trades and, third, the job the player already has', () => {
      // A career is a ladder. Marching somebody off one they have climbed is a
      // deletion of the arc they were playing for, so staying is an answer.
      const current = BASIC_CAREERS[0]!
      const player = fixturePlayer({ career: current })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.kind).toBe('career')
      expect(next.pendingDecision!.options).toHaveLength(3)

      const careerIds = new Set(BASIC_CAREERS.map((career) => career.id))
      const [first, second, stay] = next.pendingDecision!.options
      expect(careerIds.has(first!.id)).toBe(true)
      expect(careerIds.has(second!.id)).toBe(true)
      expect(stay!.id).toBe(CAREER_STAY_OPTION_ID)
      expect(stay!.label).toContain(current.title)
    })

    it('takes the decline away when the tile says nobody asked', () => {
      const player = fixturePlayer({ career: BASIC_CAREERS[0]! })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({
        effect: { type: 'careerChange', reason: 'The whole department is reorganised.', compulsory: true },
      })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.options).toHaveLength(2)
      expect(next.pendingDecision!.options.map((option) => option.id)).not.toContain(CAREER_STAY_OPTION_ID)
    })

    it('takes the decline away from a player with no job, so a layoff always has a way back', () => {
      const state = fixtureState({ players: [fixturePlayer({ career: null })] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Career fair!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.options).toHaveLength(2)
      expect(next.pendingDecision!.options.map((option) => option.id)).not.toContain(CAREER_STAY_OPTION_ID)
    })

    it('never offers the job the player already has back to them', () => {
      for (const current of BASIC_CAREERS) {
        const state = fixtureState({ players: [fixturePlayer({ career: current })] })
        const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
        const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
        expect(next.pendingDecision!.options.map((option) => option.id)).not.toContain(current.id)
      }
    })

    it('draws from the graduate pool for a player with a degree', () => {
      const state = fixtureState({ players: [fixturePlayer({ hasDegree: true })] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const graduateIds = new Set(GRADUATE_CAREERS.map((career) => career.id))
      for (const option of next.pendingDecision!.options) {
        expect(graduateIds.has(option.id)).toBe(true)
      }
    })

    it('leaves the current career in place until the choice is answered', () => {
      const career = BASIC_CAREERS[0]!
      const state = fixtureState({ players: [fixturePlayer({ career })] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.career).toEqual(career)
    })
  })

  describe('loseCareer', () => {
    it('takes the job away so paydays drop to casual shifts', () => {
      const player = fixturePlayer({ career: BASIC_CAREERS[0]! })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'loseCareer', reason: 'Laid off.' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.career).toBeNull()
      expect(event.emphasis).toBe('milestone')
      expect(next.log[0]!.message).toContain('loses their job')

      const payday = applyEffect(next, fixtureSpace({ effect: { type: 'payday' } }), {
        random: createFakeRandom({ spins: [3] }),
      })
      expect(payday.event.moneyDelta).toBe(CASUAL_WAGE_PER_PIP * 3)
    })

    it('is a harmless no-op for a player who has no job to lose', () => {
      const player = fixturePlayer({ career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'loseCareer', reason: 'Laid off.' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]).toEqual(player)
      expect(event.emphasis).toBe('normal')
    })
  })

  // -------------------------------------------------------------------------
  // Investing
  // -------------------------------------------------------------------------

  describe('buyStock', () => {
    it('offers three stocks plus a decline option', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({ effect: { type: 'buyStock' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.kind).toBe('stock')
      expect(next.pendingDecision!.options).toHaveLength(4)
      const stockIds = new Set(STOCKS.map((stock) => stock.id))
      const options = next.pendingDecision!.options
      for (const option of options.slice(0, 3)) expect(stockIds.has(option.id)).toBe(true)
      expect(options[3]!.id).toBe(DECLINE_STOCK_OPTION_ID)
    })

    it('offers three different stocks', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({ effect: { type: 'buyStock' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const ids = next.pendingDecision!.options.slice(0, 3).map((option) => option.id)
      expect(new Set(ids).size).toBe(3)
    })

    it('buys nothing until the choice is answered', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({ effect: { type: 'buyStock' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.stocks).toEqual([])
      expect(next.players[0]!.money).toBe(10_000)
    })
  })

  describe('stockDividend', () => {
    it('pays perShare for every share held', () => {
      const player = fixturePlayer({
        money: 0,
        stocks: [
          { stockId: STOCKS[0]!.id, shares: 2 },
          { stockId: STOCKS[1]!.id, shares: 1 },
        ],
      })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'stockDividend', perShare: 4_000, reason: 'Dividend day' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(12_000)
      expect(event.moneyDelta).toBe(12_000)
      expect(next.log[0]!.tone).toBe('money-in')
    })

    it('pays nothing to a player holding no shares', () => {
      const player = fixturePlayer({ money: 1_000, stocks: [] })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'stockDividend', perShare: 4_000, reason: 'Dividend day' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(1_000)
      expect(event.moneyDelta).toBe(0)
      expect(next.log[0]!.tone).toBe('info')
    })
  })

  // -------------------------------------------------------------------------
  // The bank
  // -------------------------------------------------------------------------

  describe('bank', () => {
    it('offers borrowing and walking on, but not repaying, when debt-free', () => {
      const state = fixtureState({ players: [fixturePlayer({ loans: 0, money: 100_000 })] })
      const space = fixtureSpace({ effect: { type: 'bank' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.kind).toBe('bank')
      expect(next.pendingDecision!.options.map((option) => option.id)).toEqual([
        BANK_LOAN_OPTION_ID,
        BANK_DECLINE_OPTION_ID,
      ])
    })

    it('offers repaying when a loan is outstanding and affordable', () => {
      const state = fixtureState({ players: [fixturePlayer({ loans: 2, money: EARLY_LOAN_REPAYMENT })] })
      const space = fixtureSpace({ effect: { type: 'bank' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision!.options.map((option) => option.id)).toEqual([
        BANK_LOAN_OPTION_ID,
        BANK_REPAY_OPTION_ID,
        BANK_DECLINE_OPTION_ID,
      ])
    })

    it('hides repaying when the player cannot cover it without borrowing again', () => {
      const state = fixtureState({ players: [fixturePlayer({ loans: 2, money: EARLY_LOAN_REPAYMENT - 1 })] })
      const space = fixtureSpace({ effect: { type: 'bank' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision!.options.map((option) => option.id)).not.toContain(BANK_REPAY_OPTION_ID)
    })

    it('always leaves a way to walk on', () => {
      for (const loans of [0, 1]) {
        const state = fixtureState({ players: [fixturePlayer({ loans, money: 100_000 })] })
        const { state: next } = applyEffect(state, fixtureSpace({ effect: { type: 'bank' } }), {
          random: createFakeRandom(),
        })
        expect(next.pendingDecision!.options.map((option) => option.id)).toContain(BANK_DECLINE_OPTION_ID)
      }
    })
  })

  // -------------------------------------------------------------------------
  // Children cost something
  // -------------------------------------------------------------------------

  describe('payPerChild', () => {
    it('multiplies the bill by the number of children', () => {
      const player = fixturePlayer({ money: 100_000, children: 3 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payPerChild', amount: 5_000, reason: 'School fees' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(85_000)
      expect(event.moneyDelta).toBe(-15_000)
    })

    it('charges a childless player nothing', () => {
      const player = fixturePlayer({ money: 100_000, children: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payPerChild', amount: 5_000, reason: 'School fees' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(100_000)
      expect(event.moneyDelta).toBe(0)
    })

    it('auto-borrows when a big family outruns the balance', () => {
      const player = fixturePlayer({ money: 1_000, children: 4, loans: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payPerChild', amount: 10_000, reason: 'School fees' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.loans).toBeGreaterThan(0)
      expect(next.players[0]!.money).toBeGreaterThanOrEqual(0)
      expect(event.notes.some((note) => note.includes('loan'))).toBe(true)
    })
  })

  describe('collectPerChild', () => {
    it('multiplies the payment by the number of children', () => {
      const player = fixturePlayer({ money: 0, children: 2 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'collectPerChild', amount: 6_000, reason: 'Child benefit' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(12_000)
      expect(event.moneyDelta).toBe(12_000)
    })

    it('pays a childless player nothing', () => {
      const player = fixturePlayer({ money: 0, children: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'collectPerChild', amount: 6_000, reason: 'Child benefit' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(0)
      expect(event.moneyDelta).toBe(0)
    })
  })

  // -------------------------------------------------------------------------
  // Upsets
  // -------------------------------------------------------------------------

  describe('swapMoneyWithLeader', () => {
    it('swaps cash with the richest player still in the game', () => {
      const mover = fixturePlayer({ id: 'p1', name: 'Alex', money: 5_000 })
      const leader = fixturePlayer({ id: 'p2', name: 'Bo', money: 300_000 })
      const other = fixturePlayer({ id: 'p3', name: 'Cy', money: 50_000 })
      const state = fixtureState({ players: [mover, leader, other], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'swapMoneyWithLeader', reason: 'Rival swap' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(300_000)
      expect(next.players[1]!.money).toBe(5_000)
      expect(next.players[2]!.money).toBe(50_000)
      expect(event.moneyDelta).toBe(295_000)
      expect(event.emphasis).toBe('big')
      expect(next.log[0]!.tone).toBe('upset')
    })

    it('ignores retired players when looking for the leader', () => {
      const mover = fixturePlayer({ id: 'p1', money: 5_000 })
      const retiredRich = fixturePlayer({ id: 'p2', money: 900_000, isRetired: true, retirementRank: 1 })
      const active = fixturePlayer({ id: 'p3', money: 20_000 })
      const state = fixtureState({ players: [mover, retiredRich, active], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'swapMoneyWithLeader', reason: 'Rival swap' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(20_000)
      expect(next.players[1]!.money).toBe(900_000)
      expect(next.players[2]!.money).toBe(5_000)
    })

    it('does nothing when the mover already leads', () => {
      const mover = fixturePlayer({ id: 'p1', money: 100_000 })
      const rival = fixturePlayer({ id: 'p2', money: 10_000 })
      const state = fixtureState({ players: [mover, rival], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'swapMoneyWithLeader', reason: 'Rival swap' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.money).toBe(100_000)
      expect(next.players[1]!.money).toBe(10_000)
      expect(event.moneyDelta).toBe(0)
    })

    it('does nothing when the mover is the only one left', () => {
      const mover = fixturePlayer({ id: 'p1', money: 100_000 })
      const state = fixtureState({ players: [mover], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'swapMoneyWithLeader', reason: 'Rival swap' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.money).toBe(100_000)
      expect(event.moneyDelta).toBe(0)
    })

    it('does not cry upset over a swap that never happened', () => {
      const leading = fixtureState({
        players: [fixturePlayer({ id: 'p1', money: 100_000 }), fixturePlayer({ id: 'p2', money: 10_000 })],
        currentPlayerIndex: 0,
      })
      const alone = fixtureState({ players: [fixturePlayer({ id: 'p1', money: 100_000 })], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'swapMoneyWithLeader', reason: 'Rival swap' } })

      for (const state of [leading, alone]) {
        const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
        expect(next.log[0]!.tone).toBe('info')
      }
    })
  })

  describe('stealLifeTile', () => {
    it('takes a tile from the player holding the most tile value', () => {
      const mover = fixturePlayer({ id: 'p1', lifeTiles: [] })
      const poor = fixturePlayer({ id: 'p2', lifeTiles: [TILE_A] })
      const rich = fixturePlayer({ id: 'p3', lifeTiles: [TILE_B] })
      const state = fixtureState({ players: [mover, poor, rich], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'stealLifeTile', reason: 'Sticky fingers' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.lifeTiles).toEqual([TILE_B])
      expect(next.players[1]!.lifeTiles).toEqual([TILE_A])
      expect(next.players[2]!.lifeTiles).toEqual([])
      expect(event.lifeTilesGained).toEqual([TILE_B])
      expect(event.emphasis).toBe('big')
      expect(next.log[0]!.tone).toBe('upset')
    })

    it('skips retired players', () => {
      const mover = fixturePlayer({ id: 'p1', lifeTiles: [] })
      const retired = fixturePlayer({ id: 'p2', lifeTiles: [TILE_B], isRetired: true, retirementRank: 1 })
      const active = fixturePlayer({ id: 'p3', lifeTiles: [TILE_A] })
      const state = fixtureState({ players: [mover, retired, active], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'stealLifeTile', reason: 'Sticky fingers' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.lifeTiles).toEqual([TILE_A])
      expect(next.players[1]!.lifeTiles).toEqual([TILE_B])
    })

    it('does nothing when nobody else holds a tile', () => {
      const mover = fixturePlayer({ id: 'p1', lifeTiles: [TILE_A] })
      const rival = fixturePlayer({ id: 'p2', lifeTiles: [] })
      const state = fixtureState({ players: [mover, rival], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'stealLifeTile', reason: 'Sticky fingers' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.lifeTiles).toEqual([TILE_A])
      expect(event.lifeTilesGained).toEqual([])
      expect(next.log[0]!.tone).toBe('info')
    })
  })

  // -------------------------------------------------------------------------
  // House upgrade
  // -------------------------------------------------------------------------

  describe('upgradeHouse', () => {
    it('only offers homes more expensive than the one held', () => {
      const current = HOUSES[2]!
      const state = fixtureState({ players: [fixturePlayer({ house: current })] })
      const space = fixtureSpace({ effect: { type: 'upgradeHouse' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.kind).toBe('house')
      for (const option of next.pendingDecision!.options) {
        if (option.id === DECLINE_HOUSE_OPTION_ID) continue
        expect(HOUSES.find((house) => house.id === option.id)!.price).toBeGreaterThan(current.price)
      }
    })

    it('always leaves the option of staying put', () => {
      const state = fixtureState({ players: [fixturePlayer({ house: HOUSES[0]! })] })
      const { state: next } = applyEffect(state, fixtureSpace({ effect: { type: 'upgradeHouse' } }), {
        random: createFakeRandom(),
      })
      expect(next.pendingDecision!.options.map((option) => option.id)).toContain(DECLINE_HOUSE_OPTION_ID)
    })

    it('falls back to an ordinary house hunt for a player with no home', () => {
      const state = fixtureState({ players: [fixturePlayer({ house: null })] })
      const { state: next } = applyEffect(state, fixtureSpace({ effect: { type: 'upgradeHouse' } }), {
        random: createFakeRandom(),
      })
      expect(next.pendingDecision!.kind).toBe('house')
      expect(next.pendingDecision!.options).toHaveLength(4)
      const houseIds = new Set(HOUSES.map((house) => house.id))
      for (const option of next.pendingDecision!.options.slice(0, 3)) {
        expect(houseIds.has(option.id)).toBe(true)
      }
    })

    it('raises no decision when the player already owns the best home', () => {
      const best = HOUSES.reduce((a, b) => (b.price > a.price ? b : a))
      const state = fixtureState({ players: [fixturePlayer({ house: best })] })
      const { state: next, event } = applyEffect(state, fixtureSpace({ effect: { type: 'upgradeHouse' } }), {
        random: createFakeRandom(),
      })
      expect(next.pendingDecision).toBeNull()
      expect(event.notes[0]).toContain(best.name)
    })
  })
})


describe('a career decision shows what the player earns today', () => {
  /*
   * A forced change asks the player to give up an income without telling them
   * what it is: the offers carry their own salaries, but with nothing to
   * measure them against the choice is uninformed. A playtester asked for this.
   */
  it('names the current salary and job when a change is forced', () => {
    const career = BASIC_CAREERS[0]!
    const player = fixturePlayer({ career })
    const state = fixtureState({ players: [player] })
    const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })

    const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

    expect(next.pendingDecision!.prompt).toContain(career.title)
    expect(next.pendingDecision!.prompt).toContain('/payday')
  })

  it('quotes the casual shifts a player between jobs would be giving up', () => {
    const player = fixturePlayer({ career: null })
    const state = fixtureState({ players: [player] })
    const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'A fresh start' } })

    const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

    expect(next.pendingDecision!.prompt).toContain('between jobs')
    expect(next.pendingDecision!.prompt).toContain('a pip')
  })

  it('leaves the first-job prompt alone, since there is nothing to give up', () => {
    const player = fixturePlayer({ career: null })
    const state = fixtureState({ players: [player] })
    const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })

    const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

    expect(next.pendingDecision!.prompt).toBe('Choose your career path')
  })
})
