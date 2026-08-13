import { describe, expect, it } from 'vitest'

import {
  CASUAL_WAGE_PER_PIP,
  CHILD_BONUS,
  COLLEGE_TUITION,
  EARLY_LOAN_REPAYMENT,
  FIRST_RETIREMENT_BONUS,
  INSURANCE_PREMIUM,
  LIFE_INSURANCE_PAYOUT,
  LOAN_PRINCIPAL,
  LOAN_REPAYMENT,
  STARTING_MONEY,
  WEDDING_GIFT,
} from '../model/constants'
import { DEFAULT_EDITION_ID, allEditions, editionFor, editionOf, registerEdition } from './registry'
import { EDITION_USA } from './usa'
import { scaleEdition } from './scale'

describe('the edition registry', () => {
  it('ships the USA edition as the default', () => {
    expect(DEFAULT_EDITION_ID).toBe('usa')
    expect(editionFor('usa')).toBe(EDITION_USA)
    expect(allEditions()).toContain(EDITION_USA)
  })

  it('reads a save that predates editions as the game it was played on', () => {
    // The same bargain `difficultyProfile(undefined)` strikes: the honest
    // reading of a state with no edition is the only edition there was.
    expect(editionOf({})).toBe(EDITION_USA)
    expect(editionFor(undefined)).toBe(EDITION_USA)
  })

  it('falls back rather than failing on an edition this build does not have', () => {
    // A save naming an edition since withdrawn has to stay loadable.
    expect(editionFor('atlantis')).toBe(EDITION_USA)
  })

  it('resolves a registered edition by the id a game stores', () => {
    const registered = scaleEdition(EDITION_USA, 2, { id: 'registry-test-double' })
    registerEdition(registered)
    expect(editionOf({ editionId: 'registry-test-double' })).toBe(registered)
  })
})

describe('the USA edition is the game that was already here', () => {
  /*
   * `constants.ts` is now a reading aid rather than a source of truth, and this
   * is what keeps the two honest. If the extraction had moved a single figure,
   * every balance number in the game would have shifted underneath a suite that
   * still reads the old names — so the equality is asserted rather than assumed.
   */
  it('exports exactly the constants the codebase already named', () => {
    const { economy } = EDITION_USA
    expect(STARTING_MONEY).toBe(economy.startingMoney)
    expect(COLLEGE_TUITION).toBe(economy.collegeTuition)
    expect(LOAN_PRINCIPAL).toBe(economy.loanPrincipal)
    expect(LOAN_REPAYMENT).toBe(economy.loanRepayment.normal)
    expect(EARLY_LOAN_REPAYMENT).toBe(economy.earlyLoanRepayment.normal)
    expect(WEDDING_GIFT).toBe(economy.weddingGift)
    expect(CHILD_BONUS).toBe(economy.childBonus)
    expect(FIRST_RETIREMENT_BONUS).toBe(economy.firstRetirementBonus)
    expect(CASUAL_WAGE_PER_PIP).toBe(economy.casualWagePerPip)
    expect(INSURANCE_PREMIUM).toEqual(economy.insurancePremium)
    expect(LIFE_INSURANCE_PAYOUT).toBe(economy.lifeInsurancePayout)
  })

  it('still holds the figures the board was tuned against', () => {
    // Spelled out rather than derived: these are the numbers every win rate in
    // `gameBalance.test.ts` was measured against, and a silent edit to any of
    // them is exactly what this whole extraction had to avoid.
    expect(EDITION_USA.economy).toMatchObject({
      startingMoney: 10_000,
      collegeTuition: 40_000,
      loanPrincipal: 20_000,
      loanRepayment: { normal: 25_000, hard: 38_000, veryHard: 50_000 },
      earlyLoanRepayment: { normal: 22_000, hard: 28_000, veryHard: 34_000 },
      weddingGift: 10_000,
      childBonus: 10_000,
      firstRetirementBonus: 80_000,
      casualWagePerPip: 900,
      insurancePremium: { home: 25_000, auto: 20_000, life: 50_000 },
      lifeInsurancePayout: 100_000,
      bigMoney: 50_000,
    })
  })

  it('counts in dollars, rounded the way the board prints', () => {
    expect(EDITION_USA.currency).toEqual({
      symbol: '$',
      locale: 'en-US',
      tileRounding: 100,
      payoutRounding: 1_000,
    })
  })

  it('carries the catalogues the game already had', () => {
    expect(EDITION_USA.careers.basic).toHaveLength(14)
    expect(EDITION_USA.careers.graduate).toHaveLength(12)
    expect(EDITION_USA.houses).toHaveLength(9)
    expect(EDITION_USA.lifeTiles).toHaveLength(36)
    expect(EDITION_USA.stocks).toHaveLength(5)
  })
})
