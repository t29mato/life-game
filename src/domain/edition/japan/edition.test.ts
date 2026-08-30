import { describe, expect, it } from 'vitest'

import type { SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { EDITION_USA } from '../usa'
import { EDITION_JAPAN } from './index'

/**
 * The Japan edition's founding bargain, asserted so it cannot drift: the
 * *mechanical* board is the measured USA board at ×100 — same gates, same
 * stops, same hardships, same hazard tags, same paydays, every sum a hundred
 * times over — and everything a player reads is Japanese. The USA board is two
 * years of measured balance; the mirror is what lets this edition inherit all
 * of it, and this file is what stops a well-meaning copy edit from quietly
 * moving a gate or dropping a hazard and unpicking the inheritance. The one
 * sanctioned deviation is the house catalogue's resale tilt, argued and
 * asserted in `houses.test.ts`.
 */

const FACTOR = 100

describe('the japan economy is the tuned USA economy at ×100', () => {
  const usa = EDITION_USA.economy
  const japan = EDITION_JAPAN.economy

  it('scales every flat sum', () => {
    expect(japan.startingMoney).toBe(usa.startingMoney * FACTOR)
    expect(japan.loanPrincipal).toBe(usa.loanPrincipal * FACTOR)
    expect(japan.weddingGift).toBe(usa.weddingGift * FACTOR)
    expect(japan.divorceSettlement).toBe(usa.divorceSettlement * FACTOR)
    expect(japan.firstRetirementBonus).toBe(usa.firstRetirementBonus * FACTOR)
    expect(japan.casualWagePerPip).toBe(usa.casualWagePerPip * FACTOR)
    expect(japan.lifeInsurancePayout).toBe(usa.lifeInsurancePayout * FACTOR)
    expect(japan.fireNumber).toBe(usa.fireNumber * FACTOR)
    expect(japan.firePayoutPerPip).toBe(usa.firePayoutPerPip * FACTOR)
    expect(japan.bigMoney).toBe(usa.bigMoney * FACTOR)
  })

  it('scales the difficulty rates and premiums', () => {
    for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
      expect(japan.loanRepayment[difficulty]).toBe(usa.loanRepayment[difficulty] * FACTOR)
      expect(japan.earlyLoanRepayment[difficulty]).toBe(usa.earlyLoanRepayment[difficulty] * FACTOR)
    }
    for (const kind of ['home', 'auto', 'life'] as const) {
      expect(japan.insurancePremium[kind]).toBe(usa.insurancePremium[kind] * FACTOR)
    }
  })

  it('keeps the counts as counts and scales only the sums', () => {
    expect(japan.household).toEqual(usa.household)
    expect(japan.childOutcome.perPipOfPayday).toBe(usa.childOutcome.perPipOfPayday)
    expect(japan.childOutcome.starSpin).toBe(usa.childOutcome.starSpin)
    expect(japan.childOutcome.starPayout).toBe(usa.childOutcome.starPayout * FACTOR)
  })

  it('spins the tuition bill on the same bands, at ×100 the stakes, in its own words', () => {
    expect(japan.tuition.outcomes).toHaveLength(usa.tuition.outcomes.length)
    for (const [jp, us] of japan.tuition.outcomes.map((band, i) => [band, usa.tuition.outcomes[i]!] as const)) {
      expect(jp.upTo).toBe(us.upTo)
      expect(jp.cost).toBe(us.cost * FACTOR)
      expect(jp.note).not.toBe(us.note)
    }
  })

  it('marries on the same wheel, at ×100 the stakes, in its own words', () => {
    expect(japan.marriage.proposalSpin).toBe(usa.marriage.proposalSpin)
    expect(japan.marriage.secondAskSpin).toBe(usa.marriage.secondAskSpin)
    const pairs = [
      [japan.marriage.rescued, usa.marriage.rescued] as const,
      ...japan.marriage.outcomes.map((band, i) => [band, usa.marriage.outcomes[i]!] as const),
    ]
    expect(japan.marriage.outcomes).toHaveLength(usa.marriage.outcomes.length)
    for (const [jp, us] of pairs) {
      expect(jp.upTo).toBe(us.upTo)
      expect(jp.giftMultiplier).toBe(us.giftMultiplier)
      expect(jp.cost).toBe(us.cost * FACTOR)
      expect(jp.windfall).toBe(us.windfall * FACTOR)
      expect(jp.note).not.toBe(us.note)
    }
  })

  it('rounds a hundred times coarser, as a ×100 board must', () => {
    expect(EDITION_JAPAN.currency).toEqual({
      symbol: '¥',
      locale: 'ja-JP',
      tileRounding: EDITION_USA.currency.tileRounding * FACTOR,
      payoutRounding: EDITION_USA.currency.payoutRounding * FACTOR,
      // Display-only: a salary still credits and balances in the same ×100
      // unit as everything else here. This just tells a player-facing string
      // to caption it "a month" instead of "a payday" — see `formatSalary`.
      salaryDisplay: { unit: 'month', adjective: 'Monthly', periods: 12 },
    })
  })
})

describe('the japan route is the measured skeleton, tile for tile', () => {
  const usaSpaces = spacesOf(EDITION_USA.route)
  const japanSpaces = spacesOf(EDITION_JAPAN.route)

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
    expect(EDITION_JAPAN.route.segments.map((s) => s.kind)).toEqual(
      EDITION_USA.route.segments.map((s) => s.kind),
    )
    expect(japanSpaces).toHaveLength(usaSpaces.length)
  })

  it('mirrors every tile mechanically at ×100, in its own words', () => {
    japanSpaces.forEach((jp, i) => {
      const us = usaSpaces[i]!
      const at = `${jp.id} (mirrors ${us.id})`

      expect(jp.kind, at).toBe(us.kind)
      expect(jp.appearsFrom, at).toBe(us.appearsFrom)
      expect(jp.unscaled, at).toBe(us.unscaled)
      expect(jp.amountFrom, at).toBe(us.amountFrom)

      expect(jp.effect.type, at).toBe(us.effect.type)
      expect(sumsOf(jp.effect), at).toEqual(sumsOf(us.effect).map((sum) => sum * FACTOR))
      const jpHazard = 'hazard' in jp.effect ? jp.effect.hazard : undefined
      const usHazard = 'hazard' in us.effect ? us.effect.hazard : undefined
      expect(jpHazard, at).toBe(usHazard)
      const jpCompulsory = 'compulsory' in jp.effect ? jp.effect.compulsory : undefined
      const usCompulsory = 'compulsory' in us.effect ? us.effect.compulsory : undefined
      expect(jpCompulsory, at).toBe(usCompulsory)

      expect(jp.harsher === undefined, at).toBe(us.harsher === undefined)
      if (jp.harsher && us.harsher) {
        expect(jp.harsher.from, at).toBe(us.harsher.from)
        expect(jp.harsher.kind, at).toBe(us.harsher.kind)
        expect(jp.harsher.effect.type, at).toBe(us.harsher.effect.type)
        expect(sumsOf(jp.harsher.effect), at).toEqual(sumsOf(us.harsher.effect).map((sum) => sum * FACTOR))
      }
    })
  })

  it('says everything in its own words — no USA copy leaks through', () => {
    const usaDescriptions = new Set(usaSpaces.map((space) => space.description))
    const identical = japanSpaces.filter((space) => usaDescriptions.has(space.description))
    expect(identical.map((space) => space.id)).toEqual([])
  })

  it('carries full catalogues of its own', () => {
    expect(EDITION_JAPAN.houses).toHaveLength(9)
    expect(EDITION_JAPAN.lifeTiles).toHaveLength(36)
    expect(EDITION_JAPAN.stocks).toHaveLength(5)
    // Life tile values are the tuned curve at ×100, slot for slot.
    expect(EDITION_JAPAN.lifeTiles.map((tile) => tile.value)).toEqual(
      EDITION_USA.lifeTiles.map((tile) => tile.value * FACTOR),
    )
    // Career pools carry the same ladder shapes: rung counts and pay at ×100.
    expect(EDITION_JAPAN.careers.basic.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_JAPAN.careers.graduate.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.graduate.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_JAPAN.careers.basic.map((c) => c.payPerPip)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.payPerPip && c.payPerPip * FACTOR),
    )
    expect(EDITION_JAPAN.careers.basic.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.basic.map((c) => !!c.promotesTo),
    )
    expect(EDITION_JAPAN.careers.graduate.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.graduate.map((c) => !!c.promotesTo),
    )
  })
})
