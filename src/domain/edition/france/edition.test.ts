import { describe, expect, it } from 'vitest'

import type { SpaceEffect } from '../../model/types'
import { spacesOf } from '../../board/route'
import { validateRoute } from '../../board/validateRoute'
import { EDITION_USA } from '../usa'
import { EDITION_FRANCE } from './index'

/**
 * The France edition's founding bargain, asserted so it cannot drift: the
 * *mechanical* board is the measured USA board at ×1 — same gates, same
 * stops, same hardships, same hazard tags, same paydays, every sum unchanged
 * because the euro sits close enough to the dollar that only the symbol moves
 * — and everything a player reads is French. The USA board is the measured
 * balance; the mirror is what lets this edition inherit all of it, and this
 * file is what stops a well-meaning copy edit from quietly moving a gate or
 * dropping a hazard and unpicking the inheritance.
 *
 * Unlike Japan, this edition takes no house-catalogue deviation: the French
 * market tells the same appreciate-gently story the dollar board does, so the
 * house and stock ladders are pinned to the USA figures exactly.
 */

const FACTOR = 1

describe('the france economy is the tuned USA economy at ×1', () => {
  const usa = EDITION_USA.economy
  const france = EDITION_FRANCE.economy

  it('keeps every flat sum', () => {
    expect(france.startingMoney).toBe(usa.startingMoney * FACTOR)
    expect(france.loanPrincipal).toBe(usa.loanPrincipal * FACTOR)
    expect(france.weddingGift).toBe(usa.weddingGift * FACTOR)
    expect(france.divorceSettlement).toBe(usa.divorceSettlement * FACTOR)
    expect(france.firstRetirementBonus).toBe(usa.firstRetirementBonus * FACTOR)
    expect(france.casualWagePerPip).toBe(usa.casualWagePerPip * FACTOR)
    expect(france.lifeInsurancePayout).toBe(usa.lifeInsurancePayout * FACTOR)
    expect(france.fireNumber).toBe(usa.fireNumber * FACTOR)
    expect(france.firePayoutPerPip).toBe(usa.firePayoutPerPip * FACTOR)
    expect(france.bigMoney).toBe(usa.bigMoney * FACTOR)
  })

  it('keeps the difficulty rates and premiums', () => {
    for (const difficulty of ['normal', 'hard', 'veryHard'] as const) {
      expect(france.loanRepayment[difficulty]).toBe(usa.loanRepayment[difficulty] * FACTOR)
      expect(france.earlyLoanRepayment[difficulty]).toBe(usa.earlyLoanRepayment[difficulty] * FACTOR)
    }
    for (const kind of ['home', 'auto', 'life'] as const) {
      expect(france.insurancePremium[kind]).toBe(usa.insurancePremium[kind] * FACTOR)
    }
  })

  it('keeps the counts as counts and the sums as sums', () => {
    expect(france.household).toEqual(usa.household)
    expect(france.childOutcome.perPipOfPayday).toBe(usa.childOutcome.perPipOfPayday)
    expect(france.childOutcome.starSpin).toBe(usa.childOutcome.starSpin)
    expect(france.childOutcome.starPayout).toBe(usa.childOutcome.starPayout * FACTOR)
  })

  it('spins the tuition bill on the same bands, at the same stakes, in its own words', () => {
    expect(france.tuition.outcomes).toHaveLength(usa.tuition.outcomes.length)
    for (const [fr, us] of france.tuition.outcomes.map((band, i) => [band, usa.tuition.outcomes[i]!] as const)) {
      expect(fr.upTo).toBe(us.upTo)
      expect(fr.cost).toBe(us.cost * FACTOR)
      expect(fr.note).not.toBe(us.note)
    }
  })

  it('marries on the same wheel, at the same stakes, in its own words', () => {
    expect(france.marriage.proposalSpin).toBe(usa.marriage.proposalSpin)
    expect(france.marriage.secondAskSpin).toBe(usa.marriage.secondAskSpin)
    const pairs = [
      [france.marriage.rescued, usa.marriage.rescued] as const,
      ...france.marriage.outcomes.map((band, i) => [band, usa.marriage.outcomes[i]!] as const),
    ]
    expect(france.marriage.outcomes).toHaveLength(usa.marriage.outcomes.length)
    for (const [fr, us] of pairs) {
      expect(fr.upTo).toBe(us.upTo)
      expect(fr.giftMultiplier).toBe(us.giftMultiplier)
      expect(fr.cost).toBe(us.cost * FACTOR)
      expect(fr.windfall).toBe(us.windfall * FACTOR)
      expect(fr.note).not.toBe(us.note)
    }
  })

  it('rounds exactly the way the dollar board rounds, as a ×1 board must', () => {
    expect(EDITION_FRANCE.currency).toEqual({
      symbol: '€',
      locale: 'fr-FR',
      tileRounding: EDITION_USA.currency.tileRounding * FACTOR,
      payoutRounding: EDITION_USA.currency.payoutRounding * FACTOR,
    })
  })
})

describe('the france route is the measured skeleton, tile for tile', () => {
  const usaSpaces = spacesOf(EDITION_USA.route)
  const franceSpaces = spacesOf(EDITION_FRANCE.route)

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

  it('walks the same shape: segment for segment, lane for lane', () => {
    expect(EDITION_FRANCE.route.segments.map((s) => s.kind)).toEqual(
      EDITION_USA.route.segments.map((s) => s.kind),
    )
    expect(franceSpaces).toHaveLength(usaSpaces.length)
  })

  it('mirrors every tile mechanically at ×1, in its own words', () => {
    franceSpaces.forEach((fr, i) => {
      const us = usaSpaces[i]!
      const at = `${fr.id} (mirrors ${us.id})`

      expect(fr.kind, at).toBe(us.kind)
      expect(fr.appearsFrom, at).toBe(us.appearsFrom)
      expect(fr.unscaled, at).toBe(us.unscaled)
      expect(fr.amountFrom, at).toBe(us.amountFrom)

      expect(fr.effect.type, at).toBe(us.effect.type)
      expect(sumsOf(fr.effect), at).toEqual(sumsOf(us.effect).map((sum) => sum * FACTOR))
      const frHazard = 'hazard' in fr.effect ? fr.effect.hazard : undefined
      const usHazard = 'hazard' in us.effect ? us.effect.hazard : undefined
      expect(frHazard, at).toBe(usHazard)
      const frCompulsory = 'compulsory' in fr.effect ? fr.effect.compulsory : undefined
      const usCompulsory = 'compulsory' in us.effect ? us.effect.compulsory : undefined
      expect(frCompulsory, at).toBe(usCompulsory)

      expect(fr.harsher === undefined, at).toBe(us.harsher === undefined)
      if (fr.harsher && us.harsher) {
        expect(fr.harsher.from, at).toBe(us.harsher.from)
        expect(fr.harsher.kind, at).toBe(us.harsher.kind)
        expect(fr.harsher.effect.type, at).toBe(us.harsher.effect.type)
        expect(sumsOf(fr.harsher.effect), at).toEqual(sumsOf(us.harsher.effect).map((sum) => sum * FACTOR))
      }
    })
  })

  it('says everything in its own words — no USA copy leaks through', () => {
    // At ×1 the amounts cannot betray a lazy copy, so the words are the only
    // witness: a France tile wearing a USA sentence is a tile nobody wrote.
    const usaDescriptions = new Set(usaSpaces.map((space) => space.description))
    const identical = franceSpaces.filter((space) => usaDescriptions.has(space.description))
    expect(identical.map((space) => space.id)).toEqual([])
  })

  it('rewrites the harsher days in its own words too', () => {
    const usaHarsher = new Set(
      usaSpaces.flatMap((space) => (space.harsher ? [space.harsher.description] : [])),
    )
    const identical = franceSpaces.filter(
      (space) => space.harsher && usaHarsher.has(space.harsher.description),
    )
    expect(identical.map((space) => space.id)).toEqual([])
  })

  it('is a valid route at every length and difficulty', () => {
    expect(validateRoute(EDITION_FRANCE.route, EDITION_FRANCE)).toEqual([])
  })

  it('carries full catalogues of its own', () => {
    expect(EDITION_FRANCE.houses).toHaveLength(9)
    expect(EDITION_FRANCE.lifeTiles).toHaveLength(36)
    expect(EDITION_FRANCE.stocks).toHaveLength(5)
    // Life tile values are the tuned curve at ×1, slot for slot.
    expect(EDITION_FRANCE.lifeTiles.map((tile) => tile.value)).toEqual(
      EDITION_USA.lifeTiles.map((tile) => tile.value * FACTOR),
    )
    // Career pools carry the same ladder shapes: rung counts and pay at ×1.
    expect(EDITION_FRANCE.careers.basic.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_FRANCE.careers.graduate.map((c) => c.salary)).toEqual(
      EDITION_USA.careers.graduate.map((c) => c.salary * FACTOR),
    )
    expect(EDITION_FRANCE.careers.basic.map((c) => c.payPerPip)).toEqual(
      EDITION_USA.careers.basic.map((c) => c.payPerPip && c.payPerPip * FACTOR),
    )
    expect(EDITION_FRANCE.careers.graduate.map((c) => c.payPerPip)).toEqual(
      EDITION_USA.careers.graduate.map((c) => c.payPerPip && c.payPerPip * FACTOR),
    )
    expect(EDITION_FRANCE.careers.basic.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.basic.map((c) => !!c.promotesTo),
    )
    expect(EDITION_FRANCE.careers.graduate.map((c) => !!c.promotesTo)).toEqual(
      EDITION_USA.careers.graduate.map((c) => !!c.promotesTo),
    )
  })

  it('pins the house and stock ladders to the USA figures exactly', () => {
    // The one deviation Japan took — the depreciation tilt — is one France
    // deliberately does not: the ladder's story already fits, so the measured
    // numbers travel untouched and the balance suite inherits them whole.
    expect(EDITION_FRANCE.houses.map((h) => [h.price, ...h.resaleRange])).toEqual(
      EDITION_USA.houses.map((h) => [h.price, ...h.resaleRange]),
    )
    expect(EDITION_FRANCE.stocks.map((s) => [s.price, ...s.payoutRange])).toEqual(
      EDITION_USA.stocks.map((s) => [s.price, ...s.payoutRange]),
    )
  })
})
