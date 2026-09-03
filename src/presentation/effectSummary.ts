import { SPIN_FACES } from '@domain/model/constants'
import type { SpaceEffect } from '@domain/model/types'
import type { Edition } from '@domain/edition/types'
import { certainArrivals } from '@domain/rules/children'

import { formatMoney, formatMoneyDelta } from './format'

/**
 * What a tile actually does, in one line, read straight off its own effect.
 *
 * A playtester tapped a star tile and was told "Lucky Find: You stumble into a
 * little story worth remembering." — charming, and no help at all in deciding
 * whether they wanted to land there. Flavour is the second line now; this is
 * the first.
 *
 * Every string below is derived from the effect's own numbers or from the
 * edition's economy — never hand-written per tile. That is the whole point:
 * a hand-written summary is a second copy of the rules, and second copies
 * drift. Change a tile's amount and this line changes with it; add a tile and
 * it gets a summary for free.
 *
 * The voice: plain words, the cost stated as a number, no sentence where a
 * figure will do. `-$1,800`, not "you will have to pay a deposit".
 */
export function describeEffect(effect: SpaceEffect, edition: Edition): string {
  const { currency, economy } = edition
  const money = (amount: number): string => formatMoney(amount, currency)
  const delta = (amount: number): string => formatMoneyDelta(amount, currency)
  /** A die-decided sum, written as the band it can land in. */
  const band = (perPip: number): string =>
    `${delta(perPip)} to ${delta(perPip * SPIN_FACES)}, on the die`

  switch (effect.type) {
    case 'none':
      return 'Nothing happens here.'

    // --- money, straight up or straight down -------------------------------
    case 'gainMoney':
      return delta(effect.amount)
    case 'payMoney':
      return effect.hazard === undefined
        ? delta(-effect.amount)
        : `${delta(-effect.amount)} — nothing, if you hold the policy`
    case 'payEach':
      return `${delta(-effect.amount)} to every other player`
    case 'collectFromEach':
      return `${delta(effect.amount)} from every other player`
    case 'payPerChild':
      return `${delta(-effect.amount)} for each child`
    case 'collectPerChild':
      return `${delta(effect.amount)} for each child`
    case 'stockDividend':
      return `${delta(effect.perShare)} for every share you hold`
    case 'spinForMoney':
      return band(effect.perPip)

    // --- work --------------------------------------------------------------
    case 'payday':
      return 'Your salary — collected landing here or driving past.'
    case 'payRaise':
      return 'Your salary goes up.'
    case 'promotion':
      return 'Roll for a promotion. Under the bar pays a raise instead.'
    case 'tradeYear':
      return 'A year in your trade, on the die. The best pays what the worst costs.'
    case 'chooseCareer':
      return 'A new job, and the die picks which.'
    case 'careerChange':
      return effect.compulsory === true
        ? 'A new trade. This one you cannot turn down.'
        : 'Two other trades, offered. Keeping your job is an answer.'
    case 'loseCareer':
      return 'You lose your job, and earn nothing until a fair re-hires you.'

    // --- school ------------------------------------------------------------
    case 'tuition': {
      const spec = effect.bill === 'doctorate' ? economy.doctorateTuition ?? economy.tuition : economy.tuition
      const costs = spec.outcomes.map((outcome) => outcome.cost)
      const cheapest = Math.min(...costs)
      const dearest = Math.max(...costs)
      // A full ride is a cost of nothing, and "-$0" reads as a bug.
      const low = cheapest === 0 ? 'nothing' : delta(-cheapest)
      return `${low} to ${delta(-dearest)}, on the die`
    }
    case 'graduate':
      return 'You graduate. Every fair after this deals from the graduate ladders.'
    case 'doctorate':
      return 'The doctorate, and the shelf of jobs it opens.'

    // --- family ------------------------------------------------------------
    case 'getMarried':
      return 'A proposal, settled on the die — and a gift from everyone if it lands.'
    case 'household':
      return 'The joint account, settled on the die. Married players only.'
    case 'haveChildren': {
      // A tile whose faces all agree names its outcome; one that actually
      // rolls names the whole spread, empty end included. Saying "+1 child"
      // about a die that lands on none two faces in six would be the summary
      // promising what the tile cannot deliver.
      const certain = certainArrivals(effect.arrivals)
      if (certain !== null) {
        const gift = money(certain * effect.celebrationPerChild)
        return `${certain === 1 ? '+1 child' : `+${certain} children`}, and ${gift} in gifts`
      }
      const counts = effect.arrivals.map((arrival) => arrival.children)
      const most = Math.max(...counts)
      const least = Math.min(...counts)
      const top = money(most * effect.celebrationPerChild)
      return `${least} to ${most} children on the die, and up to ${top} in gifts`
    }
    case 'divorce':
      return `A separation: ${delta(-economy.divorceSettlement)}, and the children go with them.`

    // --- what you own ------------------------------------------------------
    case 'buyHouse':
      return 'Buy a house. Your turn stops here for it.'
    case 'upgradeHouse':
      return 'Trade up to a better home, if you already own one.'
    case 'buyStock':
      return 'Shares to buy, at the price the market is asking.'
    case 'buyInsurance':
      return 'Policies to buy, against the board’s worst tiles.'
    case 'bank':
      return `The bank: borrow ${money(economy.loanPrincipal)}, or pay a loan off.`

    // --- LIFE tiles and the upsets ------------------------------------------
    case 'gainLifeTiles':
      return effect.count === 1 ? 'LIFE tile +1' : `LIFE tiles +${effect.count}`
    case 'stealLifeTile':
      return 'Take one LIFE tile from whoever holds the most.'
    case 'swapMoneyWithLeader':
      return 'Swap wallets with whoever is ahead.'

    // --- the end of the road -------------------------------------------------
    case 'retire':
      return 'The end of the road. First one in takes the biggest bonus.'
    case 'retireEarly':
      return 'Stop working decades early — if you are holding the number.'
  }
}
