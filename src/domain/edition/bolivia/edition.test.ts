import { describe, expect, it } from 'vitest'

import type { SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { validateRoute } from '../../board/validateRoute'
import { EDITION_USA } from '../usa'
// The USA route as this edition still mirrors it — see the file for why the
// grad-school fork is folded back out, and when this import goes away.
import { USA_SKELETON } from '../../../test/editionParity'
import { EDITION_JAPAN } from '../japan'
import { EDITION_BOLIVIA } from './index'

/**
 * The Bolivia edition's founding bargain, asserted so it cannot drift: the
 * *mechanical* board is the measured USA board at ×1 — same gates, same
 * stops, same hardships, same hazard tags, same paydays, every sum
 * unchanged, because the exchange rate and the income gap cancel and the
 * dollar numerals already read as bolivianos — and everything a player reads
 * is Bolivian. The USA board is two years of measured balance; the mirror is
 * what lets this edition inherit all of it, and this file is what stops a
 * well-meaning copy edit from quietly moving a gate or dropping a hazard and
 * unpicking the inheritance. Unlike Japan, there is no sanctioned deviation:
 * the house ladder appreciates exactly as the USA one does, which happens to
 * be how Bolivian brick genuinely behaves.
 */

const FACTOR = 1

describe('the bolivia economy is the tuned USA economy at ×1', () => {
  const usa = EDITION_USA.economy
  const bolivia = EDITION_BOLIVIA.economy

  it('carries every flat sum unchanged', () => {
    expect(bolivia.startingMoney).toBe(usa.startingMoney * FACTOR)
    expect(bolivia.loanPrincipal).toBe(usa.loanPrincipal * FACTOR)
    expect(bolivia.weddingGift).toBe(usa.weddingGift * FACTOR)
    expect(bolivia.divorceSettlement).toBe(usa.divorceSettlement * FACTOR)
    expect(bolivia.firstRetirementBonus).toBe(usa.firstRetirementBonus * FACTOR)
    expect(bolivia.casualWagePerPip).toBe(usa.casualWagePerPip * FACTOR)
    expect(bolivia.lifeInsurancePayout).toBe(usa.lifeInsurancePayout * FACTOR)
    expect(bolivia.fireNumber).toBe(usa.fireNumber * FACTOR)
    expect(bolivia.firePayoutPerPip).toBe(usa.firePayoutPerPip * FACTOR)
    expect(bolivia.bigMoney).toBe(usa.bigMoney * FACTOR)
  })

  it('carries the difficulty rates and premiums unchanged', () => {
    for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
      expect(bolivia.loanRepayment[difficulty]).toBe(usa.loanRepayment[difficulty] * FACTOR)
      expect(bolivia.earlyLoanRepayment[difficulty]).toBe(usa.earlyLoanRepayment[difficulty] * FACTOR)
    }
    for (const kind of ['home', 'auto', 'life'] as const) {
      expect(bolivia.insurancePremium[kind]).toBe(usa.insurancePremium[kind] * FACTOR)
    }
  })

  it('keeps the counts as counts', () => {
    expect(bolivia.household).toEqual(usa.household)
    expect(bolivia.childOutcome.perPipOfPayday).toBe(usa.childOutcome.perPipOfPayday)
    expect(bolivia.childOutcome.starSpin).toBe(usa.childOutcome.starSpin)
    expect(bolivia.childOutcome.starPayout).toBe(usa.childOutcome.starPayout * FACTOR)
  })

  it('spins the tuition bill on the same bands, at the same stakes, in its own words', () => {
    expect(bolivia.tuition.outcomes).toHaveLength(usa.tuition.outcomes.length)
    for (const [bo, us] of bolivia.tuition.outcomes.map((band, i) => [band, usa.tuition.outcomes[i]!] as const)) {
      expect(bo.upTo).toBe(us.upTo)
      expect(bo.cost).toBe(us.cost * FACTOR)
      expect(bo.note).not.toBe(us.note)
    }
  })

  it('marries on the same wheel, at the same stakes, in its own words', () => {
    expect(bolivia.marriage.proposalSpin).toBe(usa.marriage.proposalSpin)
    expect(bolivia.marriage.secondAskSpin).toBe(usa.marriage.secondAskSpin)
    const pairs = [
      [bolivia.marriage.rescued, usa.marriage.rescued] as const,
      ...bolivia.marriage.outcomes.map((band, i) => [band, usa.marriage.outcomes[i]!] as const),
    ]
    expect(bolivia.marriage.outcomes).toHaveLength(usa.marriage.outcomes.length)
    for (const [bo, us] of pairs) {
      expect(bo.upTo).toBe(us.upTo)
      expect(bo.giftMultiplier).toBe(us.giftMultiplier)
      expect(bo.cost).toBe(us.cost * FACTOR)
      expect(bo.windfall).toBe(us.windfall * FACTOR)
      expect(bo.note).not.toBe(us.note)
    }
  })

  it('rounds at the same units, as a ×1 board must', () => {
    expect(EDITION_BOLIVIA.currency).toEqual({
      symbol: 'Bs ',
      locale: 'es-BO',
      tileRounding: EDITION_USA.currency.tileRounding * FACTOR,
      payoutRounding: EDITION_USA.currency.payoutRounding * FACTOR,
    })
  })
})

describe('the bolivia route is the measured skeleton, tile for tile', () => {
  const usaSpaces = spacesOf(USA_SKELETON)
  const boliviaSpaces = spacesOf(EDITION_BOLIVIA.route)

  /** The two sums an effect can carry, for the ×1 comparison. */
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

  it('is a sound route in its own right', () => {
    expect(validateRoute(EDITION_BOLIVIA.route, EDITION_BOLIVIA)).toEqual([])
  })

  it('walks the same shape: segment for segment, lane for lane', () => {
    expect(EDITION_BOLIVIA.route.segments.map((s) => s.kind)).toEqual(
      USA_SKELETON.segments.map((s) => s.kind),
    )
    expect(boliviaSpaces).toHaveLength(usaSpaces.length)
  })

  it('mirrors every tile mechanically at ×1, in its own words', () => {
    boliviaSpaces.forEach((bo, i) => {
      const us = usaSpaces[i]!
      const at = `${bo.id} (mirrors ${us.id})`

      expect(bo.kind, at).toBe(us.kind)
      expect(bo.appearsFrom, at).toBe(us.appearsFrom)
      expect(bo.unscaled, at).toBe(us.unscaled)
      expect(bo.amountFrom, at).toBe(us.amountFrom)

      expect(bo.effect.type, at).toBe(us.effect.type)
      expect(sumsOf(bo.effect), at).toEqual(sumsOf(us.effect).map((sum) => sum * FACTOR))
      const boHazard = 'hazard' in bo.effect ? bo.effect.hazard : undefined
      const usHazard = 'hazard' in us.effect ? us.effect.hazard : undefined
      expect(boHazard, at).toBe(usHazard)
      const boCompulsory = 'compulsory' in bo.effect ? bo.effect.compulsory : undefined
      const usCompulsory = 'compulsory' in us.effect ? us.effect.compulsory : undefined
      expect(boCompulsory, at).toBe(usCompulsory)

      expect(bo.harsher === undefined, at).toBe(us.harsher === undefined)
      if (bo.harsher && us.harsher) {
        expect(bo.harsher.from, at).toBe(us.harsher.from)
        expect(bo.harsher.kind, at).toBe(us.harsher.kind)
        expect(bo.harsher.effect.type, at).toBe(us.harsher.effect.type)
        expect(sumsOf(bo.harsher.effect), at).toEqual(sumsOf(us.harsher.effect).map((sum) => sum * FACTOR))
      }
    })
  })

  it('says everything in its own words — no USA or Japan copy leaks through', () => {
    // At ×1 the temptation to copy a sentence along with its sum is at its
    // strongest, so the leak check reads both older editions.
    const borrowed = new Set([
      ...usaSpaces.map((space) => space.description),
      ...spacesOf(EDITION_JAPAN.route).map((space) => space.description),
    ])
    const identical = boliviaSpaces.filter((space) => borrowed.has(space.description))
    expect(identical.map((space) => space.id)).toEqual([])
  })

  it('carries full catalogues of its own', () => {
    expect(EDITION_BOLIVIA.houses).toHaveLength(9)
    expect(EDITION_BOLIVIA.lifeTiles).toHaveLength(36)
    expect(EDITION_BOLIVIA.stocks).toHaveLength(5)
    // Life tile values are the tuned curve, slot for slot.
    expect(EDITION_BOLIVIA.lifeTiles.map((tile) => tile.value)).toEqual(
      EDITION_USA.lifeTiles.map((tile) => tile.value * FACTOR),
    )
    // The house ladder is the USA ladder unchanged — no depreciation tilt here.
    expect(EDITION_BOLIVIA.houses.map((house) => house.price)).toEqual(
      EDITION_USA.houses.map((house) => house.price * FACTOR),
    )
    expect(EDITION_BOLIVIA.houses.map((house) => house.resaleRange)).toEqual(
      EDITION_USA.houses.map((house) => house.resaleRange),
    )
    // The stock ladder likewise, ticker for ticker.
    expect(EDITION_BOLIVIA.stocks.map((stock) => stock.price)).toEqual(
      EDITION_USA.stocks.map((stock) => stock.price * FACTOR),
    )
    expect(EDITION_BOLIVIA.stocks.map((stock) => stock.payoutRange)).toEqual(
      EDITION_USA.stocks.map((stock) => stock.payoutRange),
    )
    // Career pools carry the same ladder shapes: rung counts and pay at ×1.
    expect(EDITION_BOLIVIA.careers.basic.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_BOLIVIA.careers.graduate.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.graduate.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_BOLIVIA.careers.basic.map((c) => c.payPerPip)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.payPerPip && c.payPerPip * FACTOR),
    )
    expect(EDITION_BOLIVIA.careers.graduate.map((c) => c.payPerPip)).toEqual(
      EDITION_USA.careers.graduate.map((c) => c.payPerPip && c.payPerPip * FACTOR),
    )
    expect(EDITION_BOLIVIA.careers.basic.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.basic.map((c) => !!c.promotesTo),
    )
    expect(EDITION_BOLIVIA.careers.graduate.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.graduate.map((c) => !!c.promotesTo),
    )
    expect(EDITION_BOLIVIA.careers.basic.map((c) => !!c.isCalling)).toEqual(
      EDITION_USA.careers.basic.map((c) => !!c.isCalling),
    )
    expect(EDITION_BOLIVIA.careers.graduate.map((c) => !!c.isCalling)).toEqual(
      EDITION_USA.careers.graduate.map((c) => !!c.isCalling),
    )
  })
})
