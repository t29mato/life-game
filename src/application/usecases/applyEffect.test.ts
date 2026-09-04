import { describe, expect, it } from 'vitest'
import type { Board, LifeTile, RollAmountRow, RollOfferRow, RollTableRow, SpinValue } from '@domain/model/types'
import { CASUAL_WAGE_PER_PIP, EARLY_LOAN_REPAYMENT, INSURANCE_PREMIUM, SPIN_FACES } from '@domain/model/constants'
import { BASIC_CAREERS, DOCTORATE_CAREERS, GRADUATE_CAREERS, USA_CURRENCY, USA_ECONOMY } from '@domain/edition/usa'
import {
  ACADEMIA_CAREERS,
  EDITION_RESEARCHER_JAPAN,
  INDUSTRY_CAREERS,
  PERMANENT_CAREERS,
} from '@domain/edition/japan-researcher'
import {
  CONTRACT_CAREERS,
  EDITION_RESEARCHER_FRANCE,
  FONCTIONNAIRE_CAREERS,
  RESEARCHER_FRANCE_ECONOMY,
} from '@domain/edition/france-researcher'
import { createBoard } from '@domain/board/createBoard'
import { allEditions } from '@domain/edition/registry'
import { DIFFICULTIES } from '@domain/rules/difficulty'
import { ladderPositionOf } from '@domain/edition/lookup'
import { NEW_BABY_ARRIVALS, TWINS_ARRIVALS } from '@domain/rules/children'
import { householdSwing, perPipPayout } from '@domain/rules/diePayout'
import { expectedMarriageValue } from '@domain/rules/marriage'
import { paydayPayFor } from '@domain/rules/player'
import { TRADE_YEAR_STORIES, tradeYearSwing } from '@domain/rules/tradeYear'
import { HOUSES } from '@domain/edition/usa'
import { STOCKS } from '@domain/edition/usa'
import { fixtureBoard, fixturePlayer, fixtureSpace, fixtureState } from '../testing/fixtures'
import { createFakeRandom } from '../testing/fakes'
import { formatMoney } from './format'
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

/** The rows of a die that deals jobs, and of one that deals sums — see `RollTableRow`. */
const offerRows = (rows: readonly RollTableRow[] = []): readonly RollOfferRow[] =>
  rows.filter((row): row is RollOfferRow => 'career' in row)
const amountRows = (rows: readonly RollTableRow[] = []): readonly RollAmountRow[] =>
  rows.filter((row): row is RollAmountRow => 'amount' in row)

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

  describe('promotion', () => {
    it('holds for the player to spin themselves when there is a real rung to win, quoting the bar', () => {
      const career = BASIC_CAREERS[0]!
      const state = fixtureState({ players: [fixturePlayer({ career })] })
      const random = createFakeRandom({ spins: [6] })
      const { state: next } = applyEffect(state, fixtureSpace({ effect: { type: 'promotion', reason: 'Review time' } }), {
        random,
      })

      expect(random.calls.spins).toBe(0)
      expect(next.players[0]!.career).toEqual(career)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      const description = next.pendingDecision?.options[0]?.description ?? ''
      expect(description).toContain(`${career.promotionSpin}`)
    })

    it('resolves instantly with no career, never touching the wheel', () => {
      const state = fixtureState({ players: [fixturePlayer({ career: null })] })
      const random = createFakeRandom()
      const { state: next } = applyEffect(state, fixtureSpace({ effect: { type: 'promotion', reason: 'Review time' } }), {
        random,
      })
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision).toBeNull()
    })

    it('resolves instantly at the top of the ladder — a guaranteed double raise, no wheel involved', () => {
      const topRung = GRADUATE_CAREERS.find((c) => c.promotesTo === undefined && !c.isCalling)!
      const state = fixtureState({ players: [fixturePlayer({ career: topRung })] })
      const random = createFakeRandom()
      const { state: next, event } = applyEffect(state, fixtureSpace({ effect: { type: 'promotion', reason: 'Review time' } }), {
        random,
      })
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision).toBeNull()
      expect(event.emphasis).toBe('big')
      expect(next.players[0]!.career?.salary).toBeGreaterThan(topRung.salary)
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
      const random = createFakeRandom({ spins: [5] })
      const { state: next, event } = applyEffect(state, space, { random })
      expect(next.players[0]!.money).toBe(1_000 + career.salary)
      expect(event.moneyDelta).toBe(career.salary)
      expect(random.calls.spins).toBe(0)
      expect(next.log[0]!.tone).toBe('money-in')
    })

    it('prints the trade this packet was earned at', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip === undefined)!
      const player = fixturePlayer({ money: 1_000, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const { event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(event.careerIcon).toBe(career.icon)
    })

    it('holds a casual payday for the player to spin themselves, touching neither money nor the wheel', () => {
      const player = fixturePlayer({ money: 1_000, career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const random = createFakeRandom({ spins: [4] })
      const { state: next } = applyEffect(state, space, { random })
      expect(next.players[0]!.money).toBe(1_000)
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      expect(next.pendingDecision?.options).toHaveLength(1)
    })

    /*
     * The card used to quote the rate — "$1,400 a pip you roll, 1 to 6" —
     * and leave the six multiplications to whoever was holding the phone.
     * It now prints them. The sentence keeps the one thing a table cannot
     * say: whose week this is.
     */
    it('says the shifts are up for grabs, and prints what every number on the wheel pays', () => {
      const player = fixturePlayer({ money: 0, career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const option = next.pendingDecision?.options[0]
      expect(option?.description).toContain('pick up shifts')
      // The rate is no longer a sentence to run in your head.
      expect(option?.description).not.toContain(`$${CASUAL_WAGE_PER_PIP.toLocaleString('en-US')}`)
      expect(amountRows(option?.table)).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => ({
          range: String(face),
          amount: formatMoney(CASUAL_WAGE_PER_PIP * face),
        })),
      )
      expect(next.log[0]!.message).toContain('payday spin')
    })

    /*
     * Not a hardcoded list of six sums but the game's own `paydayPayFor`,
     * which is what `choose.ts` actually credits the packet by. The rate a
     * payday runs on is a decision — this trade's `payPerPip`, or the
     * edition's casual wage — and a card that picked it a second time would
     * be a second place for the two to disagree about who is being paid.
     */
    it('reads its bands off the same payout the packet is credited by', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip !== undefined)!
      const player = fixturePlayer({ money: 0, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(amountRows(next.pendingDecision?.options[0]?.table)).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => ({
          range: String(face),
          amount: formatMoney(paydayPayFor(player, face as SpinValue)),
        })),
      )
      // …and it is this trade's own rate, not the casual one.
      expect(paydayPayFor(player, 6)).not.toBe(CASUAL_WAGE_PER_PIP * 6)
    })

    it('holds an unsteady career payday for a spin too, naming the trade whose week it is', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip !== undefined)!
      const player = fixturePlayer({ money: 0, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const description = next.pendingDecision?.options[0]?.description ?? ''
      expect(description).toContain(career.title)
      expect(description).toContain('no two weeks pay the same')
    })

    it('leaves a salaried packet flat, and never spends a spin on it', () => {
      const career = BASIC_CAREERS.find((c) => c.payPerPip === undefined)!
      const player = fixturePlayer({ money: 0, career })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'payday' } })
      const random = createFakeRandom({ spins: [6] })

      const { event } = applyEffect(state, space, { random })

      expect(event.moneyDelta).toBe(career.salary)
      expect(event.notes.join(' ')).not.toContain('Rolled')
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
    it('spins between two options from the basic pool', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision).not.toBeNull()
      expect(next.pendingDecision!.kind).toBe('valueSpin')
      expect(next.pendingDecision!.options).toHaveLength(1)
      const offeredIds = next.pendingDecision!.offeredCareerIds!
      expect(offeredIds).toHaveLength(2)
      const basicIds = new Set(BASIC_CAREERS.map((c) => c.id))
      for (const id of offeredIds) {
        expect(basicIds.has(id)).toBe(true)
      }
    })

    it('breaks the two offers into a table, keyed to the die\'s own halves, instead of a sentence', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const option = next.pendingDecision!.options[0]!
      // The tile's own title and narration already say what this is —
      // the description must not repeat a career name or a roll range.
      expect(option.description).not.toMatch(/\d-\d/)
      expect(option.table).toHaveLength(2)
      expect(option.table![0]!.range).toBe('1-3')
      expect(option.table![1]!.range).toBe('4-6')
      const [firstId, secondId] = next.pendingDecision!.offeredCareerIds!
      const firstCareer = BASIC_CAREERS.find((c) => c.id === firstId)!
      const secondCareer = BASIC_CAREERS.find((c) => c.id === secondId)!
      expect(offerRows(option.table).map((row) => row.career)).toEqual([firstCareer.title, secondCareer.title])
    })

    /*
     * The pay and the rung as their own values, not clauses inside a sentence
     * a component has to pattern-match apart again. The product owner asked
     * for them as columns; a column can only be built out of a field.
     */
    it("hands the pay, its period and the rung over as an offer's own fields", () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const offers = offerRows(next.pendingDecision!.options[0]!.table)
      const [firstId, secondId] = next.pendingDecision!.offeredCareerIds!
      for (const [offer, id] of [
        [offers[0]!, firstId],
        [offers[1]!, secondId],
      ] as const) {
        const career = BASIC_CAREERS.find((c) => c.id === id)!
        expect(offer.pay).toBe(formatMoney(career.salary))
        expect(offer.period).toBe('payday')
        // No fact is smuggled back into another: the name is the name alone.
        expect(offer.career).not.toMatch(/[($]/)
        // A fair deals bottom rungs, so every offer that stands on a real
        // ladder says so, and nothing else does.
        if (offer.rung !== undefined) expect(offer.rung).toMatch(/^1 of [2-9]$/)
      }
    })

    it('leaves a calling and a one-rung trade with no rung to quote', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const [firstId, secondId] = next.pendingDecision!.offeredCareerIds!
      const offers = offerRows(next.pendingDecision!.options[0]!.table)
      for (const [offer, id] of [
        [offers[0]!, firstId],
        [offers[1]!, secondId],
      ] as const) {
        const career = BASIC_CAREERS.find((c) => c.id === id)!
        const standsOnALadder = !career.isCalling && career.promotesTo !== undefined
        expect(offer.rung !== undefined).toBe(standsOnALadder)
      }
    })

    it("puts each offer's own portrait on its row, so a fair shows the jobs and not just their names", () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'basic' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const option = next.pendingDecision!.options[0]!
      const [firstId, secondId] = next.pendingDecision!.offeredCareerIds!
      const firstCareer = BASIC_CAREERS.find((c) => c.id === firstId)!
      const secondCareer = BASIC_CAREERS.find((c) => c.id === secondId)!
      expect(offerRows(option.table).map((row) => row.icon)).toEqual([firstCareer.icon, secondCareer.icon])
    })

    it('offers from the graduate pool when the player has a degree', () => {
      const player = fixturePlayer({ hasDegree: true })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'graduate' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const graduateIds = new Set(GRADUATE_CAREERS.map((c) => c.id))
      for (const id of next.pendingDecision!.offeredCareerIds!) {
        expect(graduateIds.has(id)).toBe(true)
      }
    })

    it('falls back to the basic pool when a graduate offer meets a player without a degree', () => {
      const player = fixturePlayer({ hasDegree: false })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool: 'graduate' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const basicIds = new Set(BASIC_CAREERS.map((c) => c.id))
      for (const id of next.pendingDecision!.offeredCareerIds!) {
        expect(basicIds.has(id)).toBe(true)
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

  describe('doctorate', () => {
    it('grants a doctorate', () => {
      const player = fixturePlayer({ hasDegree: true })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'doctorate' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.hasDoctorate).toBe(true)
      expect(event.notes).toContain('Earned a doctorate!')
    })

    /*
     * The only road to this tile is gated behind the degree, so the flag is
     * already true when anyone reaches it. Setting it anyway costs nothing and
     * means a doctorate can never exist that quietly closes the graduate shelf
     * to whoever holds it — see `doctoratePlayer`.
     */
    it('carries the degree with it, so the two flags can never disagree', () => {
      const state = fixtureState({ players: [fixturePlayer({ hasDegree: false })] })
      const space = fixtureSpace({ effect: { type: 'doctorate' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.hasDegree).toBe(true)
      expect(next.players[0]!.hasDoctorate).toBe(true)
    })
  })

  describe('the shelf a career fair deals from', () => {
    const offered = (state: ReturnType<typeof fixtureState>, pool: 'basic' | 'graduate' | 'doctorate') => {
      const space = fixtureSpace({ effect: { type: 'chooseCareer', pool } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      return next.pendingDecision!.offeredCareerIds!
    }

    const idsIn = (careers: readonly { readonly id: string }[]) => new Set(careers.map((c) => c.id))

    it('hands a school-leaver the basic pool at a graduate fair, exactly as it always did', () => {
      const state = fixtureState({ players: [fixturePlayer({ hasDegree: false })] })
      const basics = idsIn(BASIC_CAREERS)
      for (const id of offered(state, 'graduate')) expect(basics.has(id)).toBe(true)
    })

    /*
     * A doctor at a graduate fair is still only offered what that fair has on
     * the table. The rule is "the lower of the two shelves", and this is the
     * half of it that is easy to get backwards.
     */
    it('hands a doctor the graduate pool at a graduate fair', () => {
      const state = fixtureState({
        players: [fixturePlayer({ hasDegree: true, hasDoctorate: true })],
      })
      const graduates = idsIn(GRADUATE_CAREERS)
      for (const id of offered(state, 'graduate')) expect(graduates.has(id)).toBe(true)
    })

    it('hands a graduate the graduate pool at a doctoral fair', () => {
      const state = fixtureState({ players: [fixturePlayer({ hasDegree: true })] })
      const graduates = idsIn(GRADUATE_CAREERS)
      for (const id of offered(state, 'doctorate')) expect(graduates.has(id)).toBe(true)
    })

    it('hands a doctor the doctoral pool at a doctoral fair', () => {
      const state = fixtureState({
        players: [fixturePlayer({ hasDegree: true, hasDoctorate: true })],
      })
      const doctors = idsIn(DOCTORATE_CAREERS)
      for (const id of offered(state, 'doctorate')) expect(doctors.has(id)).toBe(true)
    })
  })

  describe('the tuition bill a tile sends', () => {
    const bandsOf = (bill?: 'doctorate') => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({
        effect: { type: 'tuition', reason: 'Fees', ...(bill ? { bill } : {}) },
      })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      return amountRows(next.pendingDecision!.options[0]!.table).map((row) => row.amount)
    }

    it('prints the undergraduate bands when the tile does not say otherwise', () => {
      expect(bandsOf()).toEqual(['$90,000', '$52,000', '$28,000', 'Full ride'])
    })

    /*
     * The doctoral table, and the two facts about it worth pinning: it is a
     * different table, and its worst face is cheaper than the undergraduate
     * one's. See `doctorateTuition` — the bad end is what forces borrowing, and
     * on Very Hard borrowing is what turns a road into a trap.
     */
    it('prints the doctoral bands when the tile says so', () => {
      expect(bandsOf('doctorate')).toEqual(['$54,000', '$48,000', '$40,000', '$30,000'])
    })
  })

  describe('getMarried', () => {
    const MARRIAGE_SPACE = { effect: { type: 'getMarried' } } as const

    it('holds for the player to spin themselves, touching neither the wheel nor anyone\'s money', () => {
      const state = fixtureState({
        players: [
          fixturePlayer({ id: 'p1', name: 'Alex', money: 50_000 }),
          fixturePlayer({ id: 'p2', name: 'Bo', money: 50_000 }),
        ],
        currentPlayerIndex: 0,
      })
      const random = createFakeRandom({ spins: [6] })
      const { state: next } = applyEffect(state, fixtureSpace(MARRIAGE_SPACE), { random })

      expect(random.calls.spins).toBe(0)
      expect(next.players[0]!.isMarried).toBe(false)
      expect(next.players[0]!.money).toBe(50_000)
      expect(next.players[1]!.money).toBe(50_000)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      expect(next.pendingDecision?.options).toHaveLength(1)
    })

    it('is a no-op for a player who is already married', () => {
      const state = fixtureState({ players: [fixturePlayer({ isMarried: true, money: 50_000 })] })
      const space = fixtureSpace(MARRIAGE_SPACE)
      const random = createFakeRandom({ spins: [6] })
      const { state: next, event } = applyEffect(state, space, { random })

      expect(next.players[0]!.money).toBe(50_000)
      expect(event.moneyDelta).toBe(0)
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision).toBeNull()
    })

    it('keeps marrying worth doing on average, at every table size', () => {
      /*
       * The constraint the whole spread is built inside, still true whether
       * the roll happens here or waits for a press in `choose.ts`. A marriage
       * that loses money on average is one nobody sane takes, and children,
       * Family Lane and the entire family scoring lane hang off reaching
       * this tile.
       */
      for (const rivals of [1, 2, 3]) {
        expect(expectedMarriageValue(USA_ECONOMY, rivals)).toBeGreaterThan(0)
      }
      expect(expectedMarriageValue(USA_ECONOMY, 3)).toBeGreaterThan(expectedMarriageValue(USA_ECONOMY, 1))
    })
  })

  describe('household', () => {
    const JOINT = { effect: { type: 'household', reason: 'The joint account, settled up' } } as const

    /*
     * The only die on the board that can take money off a player for landing
     * low, so its table is the one that has to carry signs — and the face
     * that lands exactly nowhere says so in words, because `$0` reads as a
     * bug rather than as the month that came out level.
     */
    it('holds for a married player to spin themselves, printing every month the die can deal', () => {
      const player = fixturePlayer({ isMarried: true, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const random = createFakeRandom({ spins: [1] })
      const { state: next } = applyEffect(state, fixtureSpace(JOINT), { random })

      expect(random.calls.spins).toBe(0)
      expect(next.players[0]!.money).toBe(100_000)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      const rows = amountRows(next.pendingDecision?.options[0]?.table)
      expect(rows).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => {
          const swing = householdSwing(player, USA_ECONOMY, face as SpinValue)
          const amount =
            swing === 0 ? 'Breaks even' : swing > 0 ? `+${formatMoney(swing)}` : formatMoney(swing)
          return { range: String(face), amount }
        }),
      )
      // Below the break-even face the account is down, above it up, and the
      // rows say which is which without the player doing the arithmetic.
      expect(rows[0]!.amount.startsWith('-')).toBe(true)
      expect(rows[USA_ECONOMY.household.breakEvenSpin - 1]!.amount).toBe('Breaks even')
      expect(rows[5]!.amount.startsWith('+')).toBe(true)
    })

    it('passes a single player by entirely, without touching the wheel', () => {
      // Nobody to split the bill with, so there is no bill to split — and no
      // spin burned on one either, which would shift every later draw.
      const player = fixturePlayer({ isMarried: false, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const random = createFakeRandom({ spins: [1] })
      const { state: next, event } = applyEffect(state, fixtureSpace(JOINT), { random })

      expect(event.moneyDelta).toBe(0)
      expect(next.players[0]!.money).toBe(100_000)
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision).toBeNull()
    })
  })

  describe('tradeYear', () => {
    const YEAR = {
      effect: { type: 'tradeYear', reason: 'A year of long hours.', share: 0.5 },
    } as const
    const COOK = BASIC_CAREERS.find((career) => career.id === 'career-line-cook')!

    /*
     * The prose used to name the best year and add that the worst one cost
     * the same — two faces of six, with the middle four left to guess at.
     * All six are printed now. The *stories* still are not: which of the
     * family's six years happened is the reveal the die is turned for, and a
     * table of vignettes would leave it nothing to turn up.
     */
    it('holds for the player to roll, printing all six years without spoiling any of them', () => {
      const player = fixturePlayer({ career: COOK, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const random = createFakeRandom({ spins: [6] })
      const { state: next } = applyEffect(state, fixtureSpace(YEAR), { random })

      expect(random.calls.spins).toBe(0)
      expect(next.players[0]!.money).toBe(100_000)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      expect(next.pendingDecision?.options).toHaveLength(1)

      const option = next.pendingDecision?.options[0]
      const rows = amountRows(option?.table)
      expect(rows).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => {
          const swing = tradeYearSwing(COOK.salary, 0.5, face as SpinValue, USA_CURRENCY.tileRounding)
          return {
            range: String(face),
            amount: swing > 0 ? `+${formatMoney(swing)}` : formatMoney(swing),
          }
        }),
      )
      // Half a Line Cook's $54,950, rounded to the USA board's hundreds —
      // the best year, and the worst one costing exactly as much.
      expect(rows[5]!.amount).toBe(`+${formatMoney(27_500)}`)
      expect(rows[0]!.amount).toBe(formatMoney(-27_500))

      const description = option?.description ?? ''
      expect(description).toContain('Line Cook')
      // The one promise that separates this from every other career tile.
      expect(description).toContain('Nobody is offering you a different job')
      // Not one of the family's six vignettes is on the card before the roll.
      for (const story of TRADE_YEAR_STORIES.kitchen) {
        expect(description).not.toContain(story)
      }
    })

    it('wears the trade\'s own portrait on the button, not the tile\'s glyph', () => {
      const player = fixturePlayer({ career: COOK })
      const state = fixtureState({ players: [player] })
      const { state: next } = applyEffect(state, fixtureSpace(YEAR), { random: createFakeRandom() })
      expect(next.pendingDecision?.options[0]?.icon).toBe(COOK.icon)
    })

    it('passes a player with no career by entirely, without touching the wheel', () => {
      // No trade, no year in it — and no spin burned on one either, which
      // would shift every later draw. Same rule the joint account applies to
      // a single player.
      const player = fixturePlayer({ career: null, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const random = createFakeRandom({ spins: [1] })
      const { state: next, event } = applyEffect(state, fixtureSpace(YEAR), { random })

      expect(event.moneyDelta).toBe(0)
      expect(next.players[0]!.money).toBe(100_000)
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision).toBeNull()
      expect(next.log[0]!.tone).toBe('info')
    })
  })

  describe('divorce', () => {
    const SPLIT = { effect: { type: 'divorce', reason: 'Divorce settlement' } } as const

    it('debits the settlement, ends the marriage, and sends every child with the departing partner', () => {
      const player = fixturePlayer({ isMarried: true, children: 2, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const { state: next, event } = applyEffect(state, fixtureSpace(SPLIT), { random: createFakeRandom() })

      expect(next.players[0]!.isMarried).toBe(false)
      expect(next.players[0]!.children).toBe(0)
      expect(next.players[0]!.money).toBe(100_000 - USA_ECONOMY.divorceSettlement)
      expect(event.moneyDelta).toBe(-USA_ECONOMY.divorceSettlement)
      expect(next.pendingDecision).toBeNull()
    })

    it('still charges the settlement and ends the marriage for a childless couple', () => {
      const player = fixturePlayer({ isMarried: true, children: 0, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const { state: next } = applyEffect(state, fixtureSpace(SPLIT), { random: createFakeRandom() })

      expect(next.players[0]!.isMarried).toBe(false)
      expect(next.players[0]!.children).toBe(0)
      expect(next.players[0]!.money).toBe(100_000 - USA_ECONOMY.divorceSettlement)
    })

    it('passes a single player by entirely', () => {
      const player = fixturePlayer({ isMarried: false, children: 0, money: 100_000 })
      const state = fixtureState({ players: [player] })
      const { state: next, event } = applyEffect(state, fixtureSpace(SPLIT), { random: createFakeRandom() })

      expect(event.moneyDelta).toBe(0)
      expect(next.players[0]!.money).toBe(100_000)
      expect(next.players[0]!.isMarried).toBe(false)
      expect(next.pendingDecision).toBeNull()
    })
  })

  describe('tuition', () => {
    const BILL = { effect: { type: 'tuition', reason: 'College tuition' } } as const

    it('holds for the player to spin themselves, naming every band before they do — as a table, not a sentence', () => {
      const player = fixturePlayer({ money: 100_000 })
      const state = fixtureState({ players: [player] })
      const random = createFakeRandom({ spins: [1] })
      const { state: next } = applyEffect(state, fixtureSpace(BILL), { random })

      expect(random.calls.spins).toBe(0)
      expect(next.players[0]!.money).toBe(100_000)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      // The description is the plain-language framing only — the tile's own
      // title and narration already say what it is, so it must not repeat
      // "College tuition" or "1 to 6" on top of them.
      const description = next.pendingDecision?.options[0]?.description ?? ''
      expect(description).not.toMatch(/tuition/i)
      expect(description).not.toMatch(/1 to \d/)
      const table = next.pendingDecision?.options[0]?.table ?? []
      expect(table).toHaveLength(USA_ECONOMY.tuition.outcomes.length)
      for (const band of USA_ECONOMY.tuition.outcomes) {
        const amount = band.cost === 0 ? 'Full ride' : formatMoney(band.cost)
        expect(amountRows(table).some((row) => row.amount === amount)).toBe(true)
      }
    })

    it('prints a band that pays as money coming in, signed', () => {
      /*
       * The Researcher: France board's thesis die, whose best face is a
       * doctorate done inside a company on a salary. A bare figure in a
       * column of bills reads as one more bill, so the paying face is signed
       * the way the joint account and the year in the trade are signed. See
       * `TuitionOutcome.cost`.
       */
      const state = fixtureState({
        editionId: EDITION_RESEARCHER_FRANCE.id,
        players: [fixturePlayer({ money: 100_000 })],
      })
      const { state: next } = applyEffect(state, fixtureSpace(BILL), { random: createFakeRandom() })
      const table = amountRows(next.pendingDecision?.options[0]?.table)
      const paying = RESEARCHER_FRANCE_ECONOMY.tuition.outcomes.find((band) => band.cost < 0)!
      expect(table[table.length - 1]).toEqual({
        range: '6',
        amount: `+${formatMoney(-paying.cost, EDITION_RESEARCHER_FRANCE.currency)}`,
      })
    })
  })

  describe('haveChildren', () => {
    it('hands nobody over on landing: who arrives is what the die is for', () => {
      const player = fixturePlayer({ children: 1, money: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({
        effect: { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 2_500 },
      })
      const random = createFakeRandom({ spins: [4] })
      const { state: next, event } = applyEffect(state, space, { random })
      expect(next.players[0]!.children).toBe(1)
      expect(next.players[0]!.money).toBe(0)
      expect(event.moneyDelta).toBe(0)
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      expect(next.pendingDecision?.options).toHaveLength(1)
      // Says what is at stake, not what the control is: the die is on screen
      // and the table under it lists every face.
      expect(next.pendingDecision?.options[0]?.description).toBe('Whether the house grows this year.')
    })

    /*
     * The published table is the whole contract with the player, and the empty
     * face is the half of it that is new — a card that quietly listed only the
     * two faces that hand a child over would be promising what the die does
     * not.
     */
    it('publishes the distribution honestly, empty face included', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({
        effect: { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 2_500 },
      })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(amountRows(next.pendingDecision?.options[0]?.table)).toEqual([
        { range: '1-2', amount: 'No child this year' },
        { range: '3-5', amount: 'One child, +$2,500 in gifts' },
        { range: '6', amount: 'Twins, +$5,000 in gifts' },
      ])
    })

    it('settles a certain tile on the spot rather than asking for a die nobody can lose', () => {
      const player = fixturePlayer({ children: 1, money: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({
        effect: { type: 'haveChildren', arrivals: TWINS_ARRIVALS, celebrationPerChild: 2_500 },
      })
      const random = createFakeRandom({ spins: [4] })
      const { state: next, event } = applyEffect(state, space, { random })
      expect(next.pendingDecision).toBeNull()
      expect(random.calls.spins).toBe(0)
      expect(next.players[0]!.children).toBe(3)
      expect(next.players[0]!.money).toBe(5_000)
      expect(event.moneyDelta).toBe(5_000)
      expect(event.emphasis).toBe('milestone')
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

    it('carries a transfer for every player who paid, signed from their own side', () => {
      const mover = fixturePlayer({ id: 'p1', money: 0 })
      const p2 = fixturePlayer({ id: 'p2', name: 'Rival', color: 'blue', money: 1_000 })
      const state = fixtureState({ players: [mover, p2], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'collectFromEach', amount: 200, reason: 'Prize money' } })
      const { event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(event.transfers).toEqual([
        { playerId: 'p2', playerName: 'Rival', playerColor: 'blue', amount: -200 },
      ])
      // The lane flies the amount; the note says only where it left them,
      // so a player is not told the same $200 twice on one card.
      expect(event.notes).toEqual(['Prize money', 'Rival is down to $800.'])
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

    it('carries a transfer for every player who was paid, signed from their own side', () => {
      const mover = fixturePlayer({ id: 'p1', money: 1_000 })
      const p2 = fixturePlayer({ id: 'p2', name: 'Rival', color: 'green', money: 0 })
      const state = fixtureState({ players: [mover, p2], currentPlayerIndex: 0 })
      const space = fixtureSpace({ effect: { type: 'payEach', amount: 200, reason: 'Round of drinks' } })
      const { event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(event.transfers).toEqual([
        { playerId: 'p2', playerName: 'Rival', playerColor: 'green', amount: 200 },
      ])
      expect(event.notes).toEqual(['Round of drinks', 'Rival is up to $200.'])
    })
  })

  describe('spinForMoney', () => {
    it('holds for the player to spin themselves, printing the whole die rather than rolling for them', () => {
      const player = fixturePlayer({ money: 0 })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'spinForMoney', perPip: 100, reason: 'Lucky roll' } })
      const random = createFakeRandom({ spins: [4] })
      const { state: next } = applyEffect(state, space, { random })
      expect(next.players[0]!.money).toBe(0)
      expect(random.calls.spins).toBe(0)
      expect(next.pendingDecision?.kind).toBe('valueSpin')
      const option = next.pendingDecision?.options[0]
      // The tile's own phrase stays; the arithmetic moves into the rows.
      expect(option?.description).toContain('Lucky roll')
      expect(amountRows(option?.table)).toEqual([
        { range: '1', amount: '$100' },
        { range: '2', amount: '$200' },
        { range: '3', amount: '$300' },
        { range: '4', amount: '$400' },
        { range: '5', amount: '$500' },
        { range: '6', amount: '$600' },
      ])
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

  describe('retireEarly', () => {
    /*
     * The one die on this board a player *chooses* to throw, which makes it
     * the one where knowing what is on it is the decision rather than a
     * courtesy. The card used to quote the floor and the ceiling — two faces
     * of six, and the two a player could already work out. All six are on
     * the option now, priced by the same `perPipPayout` that pays the fund
     * out in `choose.ts`.
     */
    it('publishes the whole fund ladder beside the stake', () => {
      const { fireNumber, firePayoutPerPip } = USA_ECONOMY
      const player = fixturePlayer({ money: fireNumber })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'retireEarly' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      const take = next.pendingDecision?.options[0]
      expect(next.pendingDecision?.kind).toBe('retire')
      expect(take?.turnsTheDie).toBe(true)
      expect(amountRows(take?.table)).toEqual(
        [1, 2, 3, 4, 5, 6].map((face) => ({
          range: String(face),
          amount: formatMoney(perPipPayout(firePayoutPerPip, face as SpinValue)),
        })),
      )
      // The stake is still the loudest number on the option, and it is still
      // the one the table's low faces have to be read against.
      expect(take?.detail).toBe(`-${formatMoney(fireNumber)}`)
    })

    /* Walking on decides nothing and rolls nothing, so it has nothing to
       tabulate — and a decline that grew a die's table would be claiming it
       does. */
    it('leaves the decline with no table at all', () => {
      const player = fixturePlayer({ money: USA_ECONOMY.fireNumber })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'retireEarly' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision?.options[1]?.table).toBeUndefined()
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
        { type: 'tuition', reason: 'College tuition' },
        { type: 'gainLifeTiles', count: 1 },
        { type: 'chooseCareer', pool: 'basic' },
        { type: 'graduate' },
        { type: 'getMarried' },
        { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 500 },
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

    /*
     * The invariant the whole design rests on, swept across every effect
     * rather than spot-checked on the two or three that happened to be
     * written by hand: a card that moved money reports the wallet it left
     * behind, and a card that moved none says nothing about money at all.
     * Anybody adding an effect below gets this for free — and finds out here
     * if they somehow return a state the balance cannot be read from.
     */
    it('reports the resulting balance on every effect that moves money, and only those', () => {
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
        { type: 'graduate' },
        { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 500 },
        { type: 'collectFromEach', amount: 100, reason: 'Prize' },
        { type: 'payEach', amount: 100, reason: 'Drinks' },
        { type: 'spinForMoney', perPip: 100, reason: 'Lucky roll' },
        { type: 'stockDividend', perShare: 5_000, reason: 'Dividend day' },
        { type: 'payPerChild', amount: 5_000, reason: 'School fees' },
        { type: 'collectPerChild', amount: 5_000, reason: 'Child benefit' },
        { type: 'swapMoneyWithLeader', reason: 'Rival swap' },
      ] as const

      for (const effect of effects) {
        const space = fixtureSpace({ effect })
        const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
        const settled = next.players.find((candidate) => candidate.id === 'p1')!
        if (event.moneyDelta === 0) {
          expect(event.balanceAfter, `balanceAfter for ${effect.type}`).toBeUndefined()
        } else {
          expect(event.balanceAfter, `balanceAfter for ${effect.type}`).toBe(settled.money)
        }
      }
    })

    it('marks life milestones as milestones', () => {
      // getMarried is not here: it defers to a value-spin decision now, and
      // the neutral card that raises it is deliberately not milestone-weight
      // — that belongs to the wedding itself, once `choose.ts` resolves it.
      const state = fixtureState({ players: [fixturePlayer({ career: BASIC_CAREERS[0]! })] })
      for (const effect of [{ type: 'graduate' }, { type: 'retire' }] as const) {
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
        { type: 'tuition', reason: 'College tuition' },
        { type: 'gainLifeTiles', count: 1 },
        { type: 'graduate' },
        { type: 'getMarried' },
        { type: 'haveChildren', arrivals: NEW_BABY_ARRIVALS, celebrationPerChild: 500 },
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
      // Nothing happened, so there is nothing to note: the narration alone
      // says they walked out already covered.
      expect(event.notes).toEqual([])
      expect(event.narration).toContain('already covered')
    })

    it('prices each option at its premium', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['life'] } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.pendingDecision!.options[0]!.detail).toContain(
        INSURANCE_PREMIUM.life.toLocaleString('en-US'),
      )
    })

    /*
     * The premium was always on the card and the odds never were, which is
     * what made cover read as a shop where everything is free. A cover policy
     * has to name the bill it is against, read off *this* board — the bills
     * are difficulty-scaled, the editions differ, and the office comes round
     * twice, so nothing about it can be written down in advance.
     */
    describe('what the card says you are buying', () => {
      /** An office at `a`, with one fire bill of `amount` still ahead of it. */
      const officeWithFireAhead = (amount: number) =>
        fixtureBoard([
          fixtureSpace({ id: 'a', effect: { type: 'buyInsurance', kinds: ['home'] }, next: ['fire'] }),
          fixtureSpace({
            id: 'fire',
            effect: { type: 'payMoney', amount, reason: 'Fire damage', hazard: 'fire' },
            next: ['end'],
          }),
          fixtureSpace({ id: 'end', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
        ])

      const cardFor = (board: Board, spaceId: string): string => {
        const player = fixturePlayer({ insurance: [], spaceId })
        const state = fixtureState({ board, players: [player] })
        const { state: next } = applyEffect(state, board.spaces[spaceId]!, { random: createFakeRandom() })
        return next.pendingDecision!.options[0]!.description
      }

      it('names the bill still ahead, at the figure this board actually charges', () => {
        expect(cardFor(officeWithFireAhead(24_000), 'a')).toContain('$24,000')
      })

      it('admits when the road ahead has nothing left to claim on', () => {
        // The second office is exactly this case for auto cover, which is why
        // it no longer stocks any — but a card that cannot say so is a card
        // that will lie the next time a tile moves.
        const board = fixtureBoard([
          fixtureSpace({ id: 'a', effect: { type: 'buyInsurance', kinds: ['home'] }, next: ['end'] }),
          fixtureSpace({ id: 'end', kind: 'retirement', effect: { type: 'retire' }, next: [] }),
        ])
        expect(cardFor(board, 'a')).toContain('already driven')
      })

      it('publishes the life policy’s six rungs, and no ladder for a cover policy', () => {
        const player = fixturePlayer({ insurance: [] })
        const state = fixtureState({ players: [player] })
        const space = fixtureSpace({ effect: { type: 'buyInsurance', kinds: ['home', 'life'] } })
        const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

        const [home, life] = next.pendingDecision!.options
        expect(home!.table).toBeUndefined()
        expect(life!.table).toHaveLength(SPIN_FACES)
        // Bottom rung first, top rung last — the ladder a die is read off.
        expect(life!.table![0]).toMatchObject({ range: '1' })
        expect(life!.table![SPIN_FACES - 1]).toMatchObject({ range: String(SPIN_FACES) })
      })
    })
  })

  // -------------------------------------------------------------------------
  // Career churn
  // -------------------------------------------------------------------------

  describe('careerChange', () => {
    it('offers a spin between two other trades, and a way to stay in the job already held', () => {
      // A career is a ladder. Marching somebody off one they have climbed is a
      // deletion of the arc they were playing for, so staying is an answer.
      const current = BASIC_CAREERS[0]!
      const player = fixturePlayer({ career: current })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.kind).toBe('valueSpin')
      expect(next.pendingDecision!.options).toHaveLength(2)

      const careerIds = new Set(BASIC_CAREERS.map((career) => career.id))
      const [first, second] = next.pendingDecision!.offeredCareerIds!
      expect(careerIds.has(first!)).toBe(true)
      expect(careerIds.has(second!)).toBe(true)
      const stay = next.pendingDecision!.options.find((option) => option.id === CAREER_STAY_OPTION_ID)
      expect(stay).toBeDefined()
      expect(stay!.label).toContain(current.title)
    })

    it('takes the decline away when the tile says nobody asked', () => {
      const player = fixturePlayer({ career: BASIC_CAREERS[0]! })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({
        effect: { type: 'careerChange', reason: 'The whole department is reorganised.', compulsory: true },
      })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.options).toHaveLength(1)
      expect(next.pendingDecision!.options.map((option) => option.id)).not.toContain(CAREER_STAY_OPTION_ID)
    })

    it('takes the decline away from a player with no job, so a layoff always has a way back', () => {
      const state = fixtureState({ players: [fixturePlayer({ career: null })] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Career fair!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.pendingDecision!.options).toHaveLength(1)
      expect(next.pendingDecision!.options.map((option) => option.id)).not.toContain(CAREER_STAY_OPTION_ID)
    })

    it('never offers the job the player already has back to them', () => {
      for (const current of BASIC_CAREERS) {
        const state = fixtureState({ players: [fixturePlayer({ career: current })] })
        const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
        const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
        expect(next.pendingDecision!.offeredCareerIds).not.toContain(current.id)
      }
    })

    it('draws from the graduate pool for a player with a degree', () => {
      const state = fixtureState({ players: [fixturePlayer({ hasDegree: true })] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      const graduateIds = new Set(GRADUATE_CAREERS.map((career) => career.id))
      for (const id of next.pendingDecision!.offeredCareerIds!) {
        expect(graduateIds.has(id)).toBe(true)
      }
    })

    it('leaves the current career in place until the choice is answered', () => {
      const career = BASIC_CAREERS[0]!
      const state = fixtureState({ players: [fixturePlayer({ career })] })
      const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.career).toEqual(career)
    })

    /**
     * The two words a board may add to a redraw, and the labour market they
     * describe. Both are absent on every board but the Researcher: Japan one,
     * where two tiles carry them — and those two tiles are the whole of what
     * makes that board's career fair Japanese rather than American. See
     * `SpaceEffect`'s `careerChange`.
     */
    describe('when the tile names a shelf and a rung', () => {
      /** A doctorate holder, mid-career, at the top of a three-rung academic ladder. */
      const academic = () =>
        fixturePlayer({
          hasDegree: true,
          hasDoctorate: true,
          career: ACADEMIA_CAREERS.find((c) => c.id === 'career-jpr-project-associate-professor')!,
        })
      const onResearcherBoard = (player = academic()) =>
        fixtureState({ editionId: EDITION_RESEARCHER_JAPAN.id, players: [player] })
      const rungOf = (id: string) => ladderPositionOf(id, EDITION_RESEARCHER_JAPAN)!.rung

      it('deals from the named shelf rather than from the one the player is entitled to', () => {
        // Without the cap this player would be offered a second permanent post
        // at the very tile that represents giving up on ever getting one.
        const space = fixtureSpace({
          effect: { type: 'careerChange', reason: 'You left the university', compulsory: true, pool: 'basic' },
        })
        const { state: next } = applyEffect(onResearcherBoard(), space, { random: createFakeRandom() })
        const industry = new Set(INDUSTRY_CAREERS.map((career) => career.id))
        for (const id of next.pendingDecision!.offeredCareerIds!) expect(industry.has(id)).toBe(true)
      })

      it('carries the climb across by default, even between shelves', () => {
        // The board's standing promise: a change of trade is not a demotion.
        const space = fixtureSpace({
          effect: { type: 'careerChange', reason: 'The fair', compulsory: true, pool: 'basic' },
        })
        const { state: next } = applyEffect(onResearcherBoard(), space, { random: createFakeRandom() })
        for (const id of next.pendingDecision!.offeredCareerIds!) expect(rungOf(id)).toBe(2)
      })

      it('deals the door-in rung to somebody crossing shelves when the tile says so', () => {
        const space = fixtureSpace({
          effect: {
            type: 'careerChange',
            reason: 'You left the university',
            compulsory: true,
            pool: 'basic',
            startsOver: true,
          },
        })
        const { state: next } = applyEffect(onResearcherBoard(), space, { random: createFakeRandom() })
        for (const id of next.pendingDecision!.offeredCareerIds!) expect(rungOf(id)).toBe(1)
        // And it says so out loud, because "at the level you are on" would be
        // a lie on this one tile.
        expect(next.pendingDecision!.prompt).not.toContain('the level you are on')
      })

      it('leaves the climb alone for somebody already working on that shelf', () => {
        // Moving between two research divisions is an ordinary move, and this
        // tile is not charging for that.
        const inIndustry = fixturePlayer({
          career: INDUSTRY_CAREERS.find((c) => c.id === 'career-jpr-research-group-leader')!,
        })
        const space = fixtureSpace({
          effect: { type: 'careerChange', reason: 'The fair', compulsory: true, pool: 'basic', startsOver: true },
        })
        const { state: next } = applyEffect(onResearcherBoard(inIndustry), space, {
          random: createFakeRandom(),
        })
        for (const id of next.pendingDecision!.offeredCareerIds!) expect(rungOf(id)).toBe(2)
      })
    })

    /**
     * A gate rather than a hall of booths — the Researcher: France board's
     * concours, and the only die in the game whose table can say "nothing".
     * See `SpaceEffect`'s `passSpin`.
     */
    describe('when the tile carries a bar', () => {
      const GATE = {
        effect: {
          type: 'careerChange',
          reason: 'The competition, first sitting',
          compulsory: true,
          pool: 'doctorate',
          passSpin: 5,
        },
      } as const

      const onFranceBoard = () =>
        fixtureState({
          editionId: EDITION_RESEARCHER_FRANCE.id,
          players: [
            fixturePlayer({
              hasDegree: true,
              hasDoctorate: true,
              career: CONTRACT_CAREERS.find((c) => c.id === 'career-frr-postdoc')!,
            }),
          ],
        })

      it('publishes the losing faces first, and they are most of the die', () => {
        // A competition that appoints on a five or a six is four faces of
        // nothing, and a card printing only the two posts would be
        // advertising a job fair.
        const { state: next } = applyEffect(onFranceBoard(), fixtureSpace(GATE), {
          random: createFakeRandom(),
        })
        const table = next.pendingDecision!.options[0]!.table ?? []
        expect(amountRows(table)).toEqual([{ range: '1-4', amount: 'Not this time' }])
        expect(offerRows(table).map((row) => row.range)).toEqual(['5', '6'])
      })

      it('deals the shelf the gate exists to protect, and nothing else', () => {
        const { state: next } = applyEffect(onFranceBoard(), fixtureSpace(GATE), {
          random: createFakeRandom(),
        })
        const permanent = new Set(FONCTIONNAIRE_CAREERS.map((career) => career.id))
        for (const id of next.pendingDecision!.offeredCareerIds!) expect(permanent.has(id)).toBe(true)
      })

      it('says the bar out loud, and says that missing it costs nothing', () => {
        const { state: next, event } = applyEffect(onFranceBoard(), fixtureSpace(GATE), {
          random: createFakeRandom(),
        })
        expect(next.pendingDecision!.prompt).toContain('5 or better')
        expect(event.notes.join(' ')).toContain('nothing changes')
        // Compulsory, so there is no "Stay" — but there is nothing to stay
        // *from* either, which is the whole difference from a fair.
        expect(next.pendingDecision!.options).toHaveLength(1)
      })
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
      const description = payday.state.pendingDecision?.options[0]?.description ?? ''
      expect(description).toContain('pick up shifts')
    })

    it('is a harmless no-op for a player who has no job to lose', () => {
      const player = fixturePlayer({ career: null })
      const state = fixtureState({ players: [player] })
      const space = fixtureSpace({ effect: { type: 'loseCareer', reason: 'Laid off.' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]).toEqual(player)
      expect(event.emphasis).toBe('normal')
    })

    it('cannot reach a post that is not the employer\'s to end', () => {
      /*
       * The mechanical payoff of the Researcher: Japan board's gated road: ten
       * years of one-year contracts, and then work this tile cannot touch. It
       * is a different exemption from a calling's — this is an ordinary job
       * with a ladder above it and a payroll behind it — so it is checked
       * separately. See `Career.cannotBeLaidOff`.
       */
      const permanent = PERMANENT_CAREERS[0]!
      expect(permanent.cannotBeLaidOff).toBe(true)
      expect(permanent.isCalling).toBeUndefined()
      const player = fixturePlayer({ hasDegree: true, hasDoctorate: true, career: permanent })
      const state = fixtureState({ editionId: EDITION_RESEARCHER_JAPAN.id, players: [player] })
      const space = fixtureSpace({ effect: { type: 'loseCareer', reason: 'The programme ended early.' } })
      const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })

      expect(next.players[0]!.career).toEqual(permanent)
      expect(event.emphasis).toBe('big')
      expect(next.log[0]!.message).toContain('keeps their permanent post')
    })

    it('still takes an ordinary job on that same board', () => {
      // The exemption is a property of the shelf, not of the edition: a
      // fixed-term academic post on the same board is lost like any other.
      const fixedTerm = ACADEMIA_CAREERS[0]!
      const player = fixturePlayer({ hasDegree: true, hasDoctorate: true, career: fixedTerm })
      const state = fixtureState({ editionId: EDITION_RESEARCHER_JAPAN.id, players: [player] })
      const space = fixtureSpace({ effect: { type: 'loseCareer', reason: 'Not renewed.' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      expect(next.players[0]!.career).toBeNull()
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

    /* "$120 a share" is a price and a unit; only the price is the figure. */
    it('prices a share as a figure and a unit rather than one string', () => {
      const state = fixtureState({ players: [fixturePlayer()] })
      const space = fixtureSpace({ effect: { type: 'buyStock' } })
      const { state: next } = applyEffect(state, space, { random: createFakeRandom() })
      for (const option of next.pendingDecision!.options.slice(0, 3)) {
        const stock = STOCKS.find((entry) => entry.id === option.id)!
        expect(option.detail).toBe(formatMoney(stock.price))
        expect(option.detailUnit).toBe('share')
      }
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
      // Reported as figures rather than as a sentence, so the card can print
      // the bill and the borrow as two separately signed rows instead of one
      // net number with a footnote arguing against it. See `withBorrowing`.
      expect(event.borrowing?.loans).toBe(next.players[0]!.loans)
      expect(event.borrowing?.charge).toBe(40_000)
    })

    /*
     * The promise the child-mischief tiles are built on, held across every
     * board rather than on one fixture: nobody is ever billed for a life they
     * did not live. It is what makes it safe to put a per-child bill on the
     * shared trunk and let it fire on a pass — a childless pawn walks through
     * it and is charged nothing at all, at every difficulty, on every edition.
     */
    it('charges a childless player nothing on any per-child bill any board carries', () => {
      for (const edition of allEditions()) {
        for (const difficulty of DIFFICULTIES) {
          const board = createBoard(difficulty, edition)
          for (const space of Object.values(board.spaces)) {
            if (space.effect.type !== 'payPerChild') continue
            const state = fixtureState({
              editionId: edition.id,
              board,
              players: [fixturePlayer({ children: 0, money: 100_000, spaceId: space.id })],
            })
            const { state: next, event } = applyEffect(state, space, { random: createFakeRandom() })
            expect(next.players[0]!.money, `${edition.id}/${difficulty}/${space.id}`).toBe(100_000)
            expect(event.moneyDelta, `${edition.id}/${difficulty}/${space.id}`).toBe(0)
          }
        }
      }
    })

    /*
     * And the other half: a bill a parent cannot simply fail to land on. Every
     * board carries exactly this — one per-child cost on an `event` tile, so a
     * family meets it by walking past rather than one game in five. Anything
     * rarer is not a consequence, it is a rumour.
     */
    it('gives every edition one per-child bill that fires on a pass', () => {
      for (const edition of allEditions()) {
        const board = createBoard('normal', edition)
        const passed = Object.values(board.spaces).filter(
          (space) => space.kind === 'event' && space.effect.type === 'payPerChild',
        )
        expect(passed.length, `${edition.id}`).toBeGreaterThan(0)
      }
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
      // The leader's own side of the swap: they went from $300,000 to $5,000.
      expect(event.transfers).toEqual([
        { playerId: 'p2', playerName: 'Bo', playerColor: leader.color, amount: -295_000 },
      ])
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
      // The narration already says they own the best address in town; a note
      // naming the same house again was saying it twice.
      expect(event.notes).toEqual([])
      expect(event.narration).toContain('best address')
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

  /*
   * The figure and what it is quoted per, as two fields. The card sets the
   * number large and tabular and the unit quiet beneath it, and it can only
   * do that if it is told which is which rather than hunting for a slash.
   */
  it("quotes the staying option's wage as a figure and a period, not one string", () => {
    const career = BASIC_CAREERS[0]!
    const player = fixturePlayer({ career })
    const state = fixtureState({ players: [player] })
    const space = fixtureSpace({ effect: { type: 'careerChange', reason: 'Headhunted!' } })

    const { state: next } = applyEffect(state, space, { random: createFakeRandom() })

    const stay = next.pendingDecision!.options.find((option) => option.id === CAREER_STAY_OPTION_ID)!
    expect(stay.detail).toBe(formatMoney(career.salary))
    expect(stay.detailUnit).toBe('payday')
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
