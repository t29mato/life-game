import { SPIN_FACES } from '@domain/model/constants'
import type { SpaceEffect } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { certainArrivals } from '@domain/rules/children'

import { formatMoney, formatMoneyDelta } from './format'
import { EN, type UiText } from './i18n/en'

/**
 * What a tile actually does, in one line, read straight off its own effect.
 *
 * A playtester tapped a star tile and was told "Lucky Find: You stumble into a
 * little story worth remembering." — charming, and no help at all in deciding
 * whether they wanted to land there. Flavour is the second line now; this is
 * the first.
 *
 * Every figure below is derived from the effect's own numbers or from the
 * edition's economy — never hand-written per tile. That is the whole point:
 * a hand-written summary is a second copy of the rules, and second copies
 * drift. Change a tile's amount and this line changes with it; add a tile and
 * it gets a summary for free.
 *
 * The *words* around those figures come from the chrome catalogue rather than
 * from the tile, for exactly the same reason they are not written per tile:
 * "money out" is the same sentence on ninety tiles in five countries, and it
 * should be translated once. `t` defaults to English so a caller with no
 * locale in hand — a test, a component rendered bare — still gets a sentence.
 *
 * The voice: plain words, the cost stated as a number, no sentence where a
 * figure will do. `-$1,800`, not "you will have to pay a deposit".
 */
export function describeEffect(effect: SpaceEffect, edition: Edition, t: UiText = EN): string {
  const { currency, economy } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const delta = (amount: number): string => formatMoneyDelta(amount, currency)
  /** A die-decided sum, written as the band it can land in. */
  const band = (perPip: number): string =>
    t.format.onTheDie(t.format.range(delta(perPip), delta(perPip * SPIN_FACES)))

  switch (effect.type) {
    case 'none':
      return t.effect.none

    // --- money, straight up or straight down -------------------------------
    case 'gainMoney':
      return delta(effect.amount)
    case 'payMoney':
      return effect.hazard === undefined
        ? delta(-effect.amount)
        : t.effect.insurable(delta(-effect.amount))
    case 'payEach':
      return t.effect.payEach(delta(-effect.amount))
    case 'collectFromEach':
      return t.effect.collectFromEach(delta(effect.amount))
    case 'payPerChild':
      return t.effect.payPerChild(delta(-effect.amount))
    case 'collectPerChild':
      return t.effect.collectPerChild(delta(effect.amount))
    case 'stockDividend':
      return t.effect.stockDividend(delta(effect.perShare))
    case 'spinForMoney':
      return band(effect.perPip)

    // --- work --------------------------------------------------------------
    case 'payday':
      return t.effect.payday
    case 'payRaise':
      return t.effect.payRaise
    case 'promotion':
      return t.effect.promotion
    case 'tradeYear':
      return t.effect.tradeYear
    case 'chooseCareer':
      return t.effect.chooseCareer
    case 'careerChange':
      return effect.compulsory === true ? t.effect.careerChangeForced : t.effect.careerChangeOffered
    case 'loseCareer':
      return t.effect.loseCareer

    // --- school ------------------------------------------------------------
    case 'tuition': {
      const spec = effect.bill === 'doctorate' ? economy.doctorateTuition ?? economy.tuition : economy.tuition
      const costs = spec.outcomes.map((outcome) => outcome.cost)
      const cheapest = Math.min(...costs)
      const dearest = Math.max(...costs)
      // A full ride is a cost of nothing, and "-$0" reads as a bug.
      const low = cheapest === 0 ? t.effect.tuitionFree : delta(-cheapest)
      return t.format.onTheDie(t.format.range(low, delta(-dearest)))
    }
    case 'graduate':
      return t.effect.graduate
    case 'doctorate':
      return t.effect.doctorate

    // --- family ------------------------------------------------------------
    case 'getMarried':
      return t.effect.getMarried
    case 'household':
      return t.effect.household
    case 'haveChildren': {
      // A tile whose faces all agree names its outcome; one that actually
      // rolls names the whole spread, empty end included. Saying "+1 child"
      // about a die that lands on none two faces in six would be the summary
      // promising what the tile cannot deliver.
      const certain = certainArrivals(effect.arrivals)
      if (certain !== null) {
        const gift = money(certain * effect.celebrationPerChild)
        return t.effect.haveChildren(t.effect.childCount(certain), gift)
      }
      const counts = effect.arrivals.map((arrival) => arrival.children)
      const most = Math.max(...counts)
      const least = Math.min(...counts)
      const top = money(most * effect.celebrationPerChild)
      return t.effect.childrenOnTheDie(least, most, top)
    }
    case 'divorce':
      return t.effect.divorce(delta(-economy.divorceSettlement))

    // --- what you own ------------------------------------------------------
    case 'buyHouse':
      return t.effect.buyHouse
    case 'upgradeHouse':
      return t.effect.upgradeHouse
    case 'buyStock':
      return t.effect.buyStock
    case 'buyInsurance':
      return t.effect.buyInsurance
    case 'bank':
      return t.effect.bank(money(economy.loanPrincipal))

    // --- LIFE tiles and the upsets ------------------------------------------
    case 'gainLifeTiles':
      return t.effect.lifeTiles(effect.count)
    case 'stealLifeTile':
      return t.effect.stealLifeTile
    case 'swapMoneyWithLeader':
      return t.effect.swapMoneyWithLeader

    // --- the end of the road -------------------------------------------------
    case 'retire':
      return t.effect.retire
    case 'retireEarly':
      return t.effect.retireEarly
  }
}
