import type { Board, Career, Difficulty, House, LifeTile, Money, Space, SpaceEffect, Stock } from '../model/types'
import type { CurrencySpec, EconomyConstants, Edition, EditionId, MarriageOutcome, TuitionOutcome } from './types'

/**
 * Builds an edition whose every sum of money is `factor` times another's.
 *
 * This is not how a country edition gets written — Japan's salaries and house
 * prices are authored by hand, one wince at a time. It exists because the
 * ×100 conversion the Japan proposal specifies is a *balance-preservation*
 * rule, and a rule like that is only worth anything if something checks it:
 * an edition produced this way must play the identical game, decision for
 * decision, against one that is not. Anything left hard-coded in dollars —
 * a CPU threshold, a rounding unit — breaks that property and nothing else,
 * which is precisely why it needs its own test.
 */
export interface ScaleOptions {
  readonly id: EditionId
  readonly name?: string
  readonly currency?: CurrencySpec
}

const scaleRange = (range: readonly [Money, Money], factor: number): readonly [Money, Money] => [
  range[0] * factor,
  range[1] * factor,
]

const scaleCareer = (career: Career, factor: number): Career => ({
  ...career,
  salary: career.salary * factor,
  raiseStep: career.raiseStep * factor,
  ...(career.payPerPip === undefined ? {} : { payPerPip: career.payPerPip * factor }),
})

const scaleHouse = (house: House, factor: number): House => ({
  ...house,
  price: house.price * factor,
  resaleRange: scaleRange(house.resaleRange, factor),
})

const scaleTile = (tile: LifeTile, factor: number): LifeTile => ({ ...tile, value: tile.value * factor })

const scaleStock = (stock: Stock, factor: number): Stock => ({
  ...stock,
  price: stock.price * factor,
  payoutRange: scaleRange(stock.payoutRange, factor),
})

const scaleMarriageOutcome = (outcome: MarriageOutcome, factor: number): MarriageOutcome => ({
  ...outcome,
  cost: outcome.cost * factor,
  windfall: outcome.windfall * factor,
})

const scaleTuitionOutcome = (outcome: TuitionOutcome, factor: number): TuitionOutcome => ({
  ...outcome,
  cost: outcome.cost * factor,
})

const scaleByDifficulty = (
  byDifficulty: Readonly<Record<Difficulty, Money>>,
  factor: number,
): Readonly<Record<Difficulty, Money>> => ({
  normal: byDifficulty.normal * factor,
  hard: byDifficulty.hard * factor,
  veryHard: byDifficulty.veryHard * factor,
})

const scaleEconomy = (economy: EconomyConstants, factor: number): EconomyConstants => ({
  startingMoney: economy.startingMoney * factor,
  tuition: { outcomes: economy.tuition.outcomes.map((band) => scaleTuitionOutcome(band, factor)) },
  loanPrincipal: economy.loanPrincipal * factor,
  loanRepayment: scaleByDifficulty(economy.loanRepayment, factor),
  earlyLoanRepayment: scaleByDifficulty(economy.earlyLoanRepayment, factor),
  weddingGift: economy.weddingGift * factor,
  divorceSettlement: economy.divorceSettlement * factor,
  // Spins and multipliers are counts, not money: only the sums are rescaled.
  marriage: {
    proposalSpin: economy.marriage.proposalSpin,
    secondAskSpin: economy.marriage.secondAskSpin,
    rescued: scaleMarriageOutcome(economy.marriage.rescued, factor),
    outcomes: economy.marriage.outcomes.map((band) => scaleMarriageOutcome(band, factor)),
  },
  // Both fields are counts: a spin, and a share of a payday. Neither is money.
  household: economy.household,
  childOutcome: {
    // A share of a payday is a ratio; only the flat star is money.
    perPipOfPayday: economy.childOutcome.perPipOfPayday,
    starSpin: economy.childOutcome.starSpin,
    starPayout: economy.childOutcome.starPayout * factor,
  },
  firstRetirementBonus: economy.firstRetirementBonus * factor,
  casualWagePerPip: economy.casualWagePerPip * factor,
  insurancePremium: {
    home: economy.insurancePremium.home * factor,
    auto: economy.insurancePremium.auto * factor,
    life: economy.insurancePremium.life * factor,
  },
  lifeInsurancePayout: economy.lifeInsurancePayout * factor,
  fireNumber: economy.fireNumber * factor,
  firePayoutPerPip: economy.firePayoutPerPip * factor,
  bigMoney: economy.bigMoney * factor,
})

/**
 * `base`, priced in a unit `factor` times smaller.
 *
 * The rounding units scale with everything else by default: a board whose
 * bills run a hundred times larger has to round a hundred times coarser, or a
 * difficulty-scaled tile lands on a figure the original would have rounded
 * away, and the two boards stop being the same game.
 */
export function scaleEdition(base: Edition, factor: number, options: ScaleOptions): Edition {
  const currency: CurrencySpec = options.currency ?? {
    ...base.currency,
    tileRounding: base.currency.tileRounding * factor,
    payoutRounding: base.currency.payoutRounding * factor,
  }

  return {
    id: options.id,
    name: options.name ?? `${base.name} ×${factor}`,
    currency,
    economy: scaleEconomy(base.economy, factor),
    /*
     * The route travels unscaled, and deliberately.
     *
     * A country's tiles are written in that country's money, one wince at a
     * time — there is no honest way to *derive* them. What this helper builds
     * is a test double whose economy and catalogues are ×`factor`, used to
     * prove the engine and the computer never learned what a dollar is; its
     * board is scaled with `scaleBoard` at the point it is needed, which is
     * exact rather than approximate (see below).
     */
    route: base.route,
    careers: {
      basic: base.careers.basic.map((career) => scaleCareer(career, factor)),
      graduate: base.careers.graduate.map((career) => scaleCareer(career, factor)),
    },
    houses: base.houses.map((house) => scaleHouse(house, factor)),
    lifeTiles: base.lifeTiles.map((tile) => scaleTile(tile, factor)),
    stocks: base.stocks.map((stock) => scaleStock(stock, factor)),
  }
}

/** The same tile, charging or paying `factor` times as much. */
export function scaleEffect(effect: SpaceEffect, factor: number): SpaceEffect {
  switch (effect.type) {
    case 'gainMoney':
    case 'payMoney':
    case 'collectFromEach':
    case 'payEach':
    case 'payPerChild':
    case 'collectPerChild':
      return { ...effect, amount: effect.amount * factor }
    case 'spinForMoney':
      return { ...effect, perPip: effect.perPip * factor }
    case 'haveChildren':
      return { ...effect, celebrationPerPip: effect.celebrationPerPip * factor }
    case 'stockDividend':
      return { ...effect, perShare: effect.perShare * factor }
    default:
      // Paydays, raises, milestones, decisions and counts name no sum of their
      // own — what they are worth comes from the player and the catalogues.
      return effect
  }
}

/**
 * The same route, with every bill and windfall on it multiplied.
 *
 * An edition owns its route, but a route is written by hand in the money of
 * the country it describes — there is no honest way to *derive* one. So the
 * ×`factor` test double built above carries the base edition's route unchanged,
 * and this is how its board gets priced.
 *
 * Rescaling an *already built* board is exact rather than approximate: the
 * difficulty scaler rounds to the edition's tile unit, and rounding to a unit
 * `factor` times coarser after multiplying by `factor` is the same figure
 * either way round. So this produces precisely the board a ×`factor` edition
 * would build for itself.
 */
export function scaleBoard(board: Board, factor: number): Board {
  const spaces: Record<string, Space> = {}
  for (const [id, space] of Object.entries(board.spaces)) {
    spaces[id] = { ...space, effect: scaleEffect(space.effect, factor) }
  }
  return { ...board, spaces }
}
