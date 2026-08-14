import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Bolivianos, printed the way a Bolivian shop window prints them.
 *
 * Same rounding units as the dollar board, because the scale factor here is
 * ×1 — see below — so the smallest bills on the route are still written in
 * hundreds, and a difficulty-scaled tile still lands on a figure a market
 * chalkboard would actually show.
 */
export const BOLIVIA_CURRENCY: CurrencySpec = {
  symbol: 'Bs ',
  locale: 'es-BO',
  tileRounding: 100,
  payoutRounding: 1_000,
}

/**
 * Every boliviano figure the Bolivia board is tuned around: the USA economy
 * at ×1.
 *
 * One is a real scale factor, and it is the honest one. The boliviano trades
 * near seven to the dollar, and Bolivian incomes in bolivianos run close to
 * one seventh of American incomes in dollars — the two almost exactly cancel,
 * so the dollar board's numerals already *are* boliviano sums. The board's
 * bottom rung of Bs 24,000 a year is Bs 2,000 a month, which is the real
 * minimum wage; the Bs 148,500 top trade is a prosperous merchant with a
 * building to show for it; a Bs 660,000 home at the top of the ladder is a
 * finished multi-storey house with shops below. Multiplying by anything else
 * would have made the sums read *less* like Bolivia, not more.
 *
 * Keeping the numbers bit for bit is also the balance-preservation rule the
 * Japan edition proved at ×100: every figure in the game is tuned against
 * every other, and an edition may change the unit and the country but never
 * the ratios. `bolivia/edition.test.ts` pins this file to the USA economy so
 * it cannot quietly drift.
 */
export const BOLIVIA_ECONOMY: EconomyConstants = {
  startingMoney: 10_000,
  /**
   * Public university credits are famously cheap; the *years* are not. Five
   * years of a Bolivian degree — the entrance-exam academy, the photocopies,
   * the materials, the living, the thesis and its defence — is what this
   * figure buys, and it is the same measured number the opening fork was
   * balanced at on every board.
   */
  collegeTuition: 52_000,
  loanPrincipal: 20_000,
  loanRepayment: {
    normal: 25_000,
    hard: 38_000,
    veryHard: 50_000,
  },
  earlyLoanRepayment: {
    normal: 22_000,
    hard: 28_000,
    veryHard: 34_000,
  },
  /**
   * The padrino system, verbatim. A Bolivian wedding is not paid for by the
   * couple; it is sponsored, piece by piece, by everyone who matters to them —
   * a godparent for the cake, one for the band, one for the hall. The
   * engine's gift-from-each-player rule *is* that custom: everybody at the
   * table sponsors something, and Bs 10,000 apiece is stylised exactly the
   * way the $10,000 it mirrors always was.
   */
  weddingGift: 10_000,
  /**
   * The wheel decides the marriage, not just the wedding — same bands, same
   * spins, same sums as the tuned USA wheel, with the lives behind them
   * recast. The bad end is real (a rescued proposal at a two-player table
   * finishes down) and the mean stays comfortably positive, which is the
   * constraint that matters: children hang off this tile.
   */
  marriage: {
    proposalSpin: 3,
    secondAskSpin: 2,
    rescued: {
      upTo: 10,
      note: 'They said yes the second time — and moved in with the instalments still owing on an imported pickup, and a very relaxed attitude to both.',
      giftMultiplier: 1,
      cost: 12_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 4,
        note: 'The fiesta ran to a second day and a second brass band, and the sponsors\' generosity ran out somewhere around the fireworks.',
        giftMultiplier: 1,
        cost: 8_000,
        windfall: 0,
      },
      {
        upTo: 7,
        note: 'A civil ceremony, a church blessing, and one long lunch. The godparents covered the cake, the band and the hall, and the envelopes covered the rest.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 9,
        note: 'Two incomes under one roof — and your partner\'s market stall, it turns out, quietly clears more than your salary.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 20_000,
      },
      {
        upTo: 10,
        note: 'The whole town comes down from the countryside, every sponsor outdoes the last, and your partner has been running a savings pool with an iron hand since school.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 30_000,
      },
    ],
  },
  /** Counts, not money: the shared purse swings the same either side of a five. */
  household: {
    breakEvenSpin: 5,
    shareOfPayday: 0.6,
  },
  /**
   * What a grown-up child hands back at retirement: a share of the parent's
   * payday per pip, and a flat star anybody's kid can be. The ratio and the
   * spin are counts and travel unchanged; the star is the same quarter of a
   * million, because a fare-caller's child making it big is still the better
   * story.
   */
  childOutcome: {
    perPipOfPayday: 0.14,
    starSpin: 10,
    starPayout: 250_000,
  },
  firstRetirementBonus: 80_000,
  /**
   * Odd jobs at the market between real ones: hauling crates, minding a
   * stall, a day on somebody's building site. The wheel decides how good the
   * week was, and it keeps you fed rather than rich.
   */
  casualWagePerPip: 900,
  insurancePremium: {
    home: 25_000,
    auto: 20_000,
    life: 50_000,
  },
  lifeInsurancePayout: 100_000,
  /**
   * "The number": the pension statement, what the stall or the practice would
   * sell for, and the back of one envelope. Priced against what a career that
   * stayed employed and out of debt is holding when it reaches the tile, so
   * roughly half the table is offered the choice at all.
   */
  fireNumber: 250_000,
  firePayoutPerPip: 64_000,
  bigMoney: 50_000,
}
