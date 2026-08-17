import { describe, expect, it } from 'vitest'

import type { SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { EDITION_USA } from '../usa'
import { EDITION_INDIA } from './index'

/**
 * The India edition's founding bargain, asserted so it cannot drift: the
 * *mechanical* board is the measured USA board at ×100 — same tiers, same
 * stops, same hardships, same hazard tags, same paydays, every sum a hundred
 * times over — and everything a player reads is Indian. The USA board is two
 * years of measured balance; the mirror is what lets this edition inherit all
 * of it, and this file is what stops a well-meaning copy edit from quietly
 * moving a tier or dropping a hazard and unpicking the inheritance. Unlike the
 * yen board, even the house catalogue mirrors exactly: Indian property
 * appreciates, so the USA ladder's gentle appreciation is the honest story
 * here and there is no sanctioned deviation at all.
 */

const FACTOR = 100

describe('the india economy is the tuned USA economy at ×100', () => {
  const usa = EDITION_USA.economy
  const india = EDITION_INDIA.economy

  it('scales every flat sum', () => {
    expect(india.startingMoney).toBe(usa.startingMoney * FACTOR)
    expect(india.loanPrincipal).toBe(usa.loanPrincipal * FACTOR)
    expect(india.weddingGift).toBe(usa.weddingGift * FACTOR)
    expect(india.firstRetirementBonus).toBe(usa.firstRetirementBonus * FACTOR)
    expect(india.casualWagePerPip).toBe(usa.casualWagePerPip * FACTOR)
    expect(india.lifeInsurancePayout).toBe(usa.lifeInsurancePayout * FACTOR)
    expect(india.fireNumber).toBe(usa.fireNumber * FACTOR)
    expect(india.firePayoutPerPip).toBe(usa.firePayoutPerPip * FACTOR)
    expect(india.bigMoney).toBe(usa.bigMoney * FACTOR)
  })

  it('scales the difficulty rates and premiums', () => {
    for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
      expect(india.loanRepayment[difficulty]).toBe(usa.loanRepayment[difficulty] * FACTOR)
      expect(india.earlyLoanRepayment[difficulty]).toBe(usa.earlyLoanRepayment[difficulty] * FACTOR)
    }
    for (const kind of ['home', 'auto', 'life'] as const) {
      expect(india.insurancePremium[kind]).toBe(usa.insurancePremium[kind] * FACTOR)
    }
  })

  it('keeps the counts as counts and scales only the sums', () => {
    expect(india.household).toEqual(usa.household)
    expect(india.childOutcome.perPipOfPayday).toBe(usa.childOutcome.perPipOfPayday)
    expect(india.childOutcome.starSpin).toBe(usa.childOutcome.starSpin)
    expect(india.childOutcome.starPayout).toBe(usa.childOutcome.starPayout * FACTOR)
  })

  it('spins the tuition bill on the same bands, at ×100 the stakes, in its own words', () => {
    expect(india.tuition.outcomes).toHaveLength(usa.tuition.outcomes.length)
    for (const [ind, us] of india.tuition.outcomes.map((band, i) => [band, usa.tuition.outcomes[i]!] as const)) {
      expect(ind.upTo).toBe(us.upTo)
      expect(ind.cost).toBe(us.cost * FACTOR)
      expect(ind.note).not.toBe(us.note)
    }
  })

  it('marries on the same wheel, at ×100 the stakes, in its own words', () => {
    expect(india.marriage.proposalSpin).toBe(usa.marriage.proposalSpin)
    expect(india.marriage.secondAskSpin).toBe(usa.marriage.secondAskSpin)
    const pairs = [
      [india.marriage.rescued, usa.marriage.rescued] as const,
      ...india.marriage.outcomes.map((band, i) => [band, usa.marriage.outcomes[i]!] as const),
    ]
    expect(india.marriage.outcomes).toHaveLength(usa.marriage.outcomes.length)
    for (const [ind, us] of pairs) {
      expect(ind.upTo).toBe(us.upTo)
      expect(ind.giftMultiplier).toBe(us.giftMultiplier)
      expect(ind.cost).toBe(us.cost * FACTOR)
      expect(ind.windfall).toBe(us.windfall * FACTOR)
      expect(ind.note).not.toBe(us.note)
    }
  })

  it('rounds a hundred times coarser, as a ×100 board must', () => {
    expect(EDITION_INDIA.currency).toEqual({
      symbol: '₹',
      locale: 'en-IN',
      tileRounding: EDITION_USA.currency.tileRounding * FACTOR,
      payoutRounding: EDITION_USA.currency.payoutRounding * FACTOR,
    })
  })
})

describe('the india route is the measured skeleton, tile for tile', () => {
  const usaSpaces = spacesOf(EDITION_USA.route)
  const indiaSpaces = spacesOf(EDITION_INDIA.route)

  /** The two sums an effect can carry, for the ×100 comparison. */
  const sumsOf = (effect: SpaceEffect): readonly number[] => {
    switch (effect.type) {
      case 'gainMoney':
      case 'payMoney':
      case 'payEach':
      case 'collectFromEach':
      case 'payPerChild':
      case 'collectPerChild':
        return [effect.amount]
      case 'spinForMoney':
        return [effect.perPip]
      case 'stockDividend':
        return [effect.perShare]
      default:
        return []
    }
  }

  it('walks the same shape: segment for segment, lane for lane', () => {
    expect(EDITION_INDIA.route.segments.map((s) => s.kind)).toEqual(
      EDITION_USA.route.segments.map((s) => s.kind),
    )
    expect(indiaSpaces).toHaveLength(usaSpaces.length)
  })

  it('mirrors every tile mechanically at ×100, in its own words', () => {
    indiaSpaces.forEach((ind, i) => {
      const us = usaSpaces[i]!
      const at = `${ind.id} (mirrors ${us.id})`

      expect(ind.kind, at).toBe(us.kind)
      expect(ind.tier, at).toBe(us.tier)
      expect(ind.appearsFrom, at).toBe(us.appearsFrom)
      expect(ind.unscaled, at).toBe(us.unscaled)
      expect(ind.amountFrom, at).toBe(us.amountFrom)

      expect(ind.effect.type, at).toBe(us.effect.type)
      expect(sumsOf(ind.effect), at).toEqual(sumsOf(us.effect).map((sum) => sum * FACTOR))
      const indHazard = 'hazard' in ind.effect ? ind.effect.hazard : undefined
      const usHazard = 'hazard' in us.effect ? us.effect.hazard : undefined
      expect(indHazard, at).toBe(usHazard)
      const indCompulsory = 'compulsory' in ind.effect ? ind.effect.compulsory : undefined
      const usCompulsory = 'compulsory' in us.effect ? us.effect.compulsory : undefined
      expect(indCompulsory, at).toBe(usCompulsory)

      expect(ind.harsher === undefined, at).toBe(us.harsher === undefined)
      if (ind.harsher && us.harsher) {
        expect(ind.harsher.from, at).toBe(us.harsher.from)
        expect(ind.harsher.kind, at).toBe(us.harsher.kind)
        expect(ind.harsher.effect.type, at).toBe(us.harsher.effect.type)
        expect(sumsOf(ind.harsher.effect), at).toEqual(sumsOf(us.harsher.effect).map((sum) => sum * FACTOR))
      }
    })
  })

  it('says everything in its own words — no USA copy leaks through', () => {
    const usaDescriptions = new Set(usaSpaces.map((space) => space.description))
    const identical = indiaSpaces.filter((space) => usaDescriptions.has(space.description))
    expect(identical.map((space) => space.id)).toEqual([])
  })

  it('carries full catalogues of its own', () => {
    expect(EDITION_INDIA.houses).toHaveLength(9)
    expect(EDITION_INDIA.lifeTiles).toHaveLength(36)
    expect(EDITION_INDIA.stocks).toHaveLength(5)
    // Life tile values are the tuned curve at ×100, slot for slot.
    expect(EDITION_INDIA.lifeTiles.map((tile) => tile.value)).toEqual(
      EDITION_USA.lifeTiles.map((tile) => tile.value * FACTOR),
    )
    // Career pools carry the same ladder shapes: rung counts and pay at ×100.
    expect(EDITION_INDIA.careers.basic.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_INDIA.careers.graduate.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.graduate.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_INDIA.careers.basic.map((c) => c.payPerPip)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.payPerPip && c.payPerPip * FACTOR),
    )
    expect(EDITION_INDIA.careers.basic.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.basic.map((c) => !!c.promotesTo),
    )
    expect(EDITION_INDIA.careers.graduate.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.graduate.map((c) => !!c.promotesTo),
    )
  })

  it('mirrors the house ladder exactly — no depreciation tilt in India', () => {
    // Property here appreciates; the yen board's tilt was Japan's story, not a
    // template. Every price and every resale bound is the USA ladder at ×100.
    expect(EDITION_INDIA.houses.map((h) => h.price)).toEqual(
      EDITION_USA.houses.map((h) => h.price * FACTOR),
    )
    expect(EDITION_INDIA.houses.map((h) => h.resaleRange)).toEqual(
      EDITION_USA.houses.map((h) => [h.resaleRange[0] * FACTOR, h.resaleRange[1] * FACTOR]),
    )
    // And the stock ladder, price and payout band alike.
    expect(EDITION_INDIA.stocks.map((s) => s.price)).toEqual(
      EDITION_USA.stocks.map((s) => s.price * FACTOR),
    )
    expect(EDITION_INDIA.stocks.map((s) => s.payoutRange)).toEqual(
      EDITION_USA.stocks.map((s) => [s.payoutRange[0] * FACTOR, s.payoutRange[1] * FACTOR]),
    )
  })
})
