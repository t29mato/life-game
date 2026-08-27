import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Yen, printed the way a Japanese board game prints them.
 *
 * No decimals, grouped in threes, and rounded a hundred times coarser than the
 * dollar board: the smallest bills here are written in tens of thousands — a
 * ¥30,000 stack of New Year cards, a ¥40,000 commuter pass — so the difficulty
 * scaler rounds to ¥10,000 and every tile still prints a clean figure.
 */
export const JAPAN_CURRENCY: CurrencySpec = {
  symbol: '¥',
  locale: 'ja-JP',
  tileRounding: 10_000,
  payoutRounding: 100_000,
  /**
   * A Japanese salary is read monthly, not annually — 月収, not 年収 — so the
   * board should say so. The lump a payday tile hands over is unchanged (still
   * tuned ×100 against the USA board, still what every balance test measures);
   * this only tells a player-facing string to divide that lump by 12 and
   * caption it "a month" before it prints, so a career reads as the real
   * monthly figure a player in Japan would actually recognise.
   */
  salaryDisplay: { unit: 'month', adjective: 'Monthly', periods: 12 },
}

/**
 * Every yen figure the Japan board is tuned around: the USA economy at ×100.
 *
 * This is not an exchange rate, it is a balance-preservation rule. Every number
 * in the game is tuned against every other — salaries against tuition against
 * loan interest against the retirement bonus — and the cheapest correct move
 * for a new country is to keep those ratios bit for bit and change only the
 * unit. Realism was already stylised on the dollar board (a $10,000 wedding
 * gift was never realistic either); the wink lives in the copy, not in the
 * arithmetic. `scaleInvariance.test.ts` is the proof the engine and the
 * computer play a ×100 board identically, and `japan/edition.test.ts` is the
 * proof this file really is ×100 and has not quietly drifted.
 */
export const JAPAN_ECONOMY: EconomyConstants = {
  startingMoney: 1_000_000,
  /**
   * Four years of national-university tuition plus the entrance fees — a
   * spin now, not a flat bill, same as the USA board. ¥5,200,000 is still the
   * *mean* of the four bands below, because it's the same measured number the
   * opening fork was balanced at.
   */
  tuition: {
    outcomes: [
      {
        upTo: 3,
        note: 'The scholarship application gets lost in a stack of paperwork, and a second year of cram school gets added on top of the bill.',
        cost: 9_000_000,
      },
      {
        upTo: 7,
        note: "Tuition and entrance fees come to exactly what the university's brochure promised.",
        cost: 5_200_000,
      },
      {
        upTo: 9,
        note: 'A prefectural scholarship covers more of the four years than you budgeted for.',
        cost: 2_100_000,
      },
      {
        upTo: 10,
        note: 'A full tuition waiver — the kind of transcript a family frames.',
        cost: 0,
      },
    ],
  },
  loanPrincipal: 2_000_000,
  loanRepayment: {
    normal: 2_500_000,
    hard: 3_800_000,
    veryHard: 5_000_000,
  },
  earlyLoanRepayment: {
    normal: 2_200_000,
    hard: 2_800_000,
    veryHard: 3_400_000,
  },
  /**
   * The go-shūgi envelope. The engine's gift-from-each-player rule *is* the
   * Japanese wedding custom, verbatim: attendance is priced, and beautifully
   * calligraphed. ¥1,000,000 is stylised the same way the $10,000 it mirrors
   * always was.
   */
  weddingGift: 1_000_000,
  divorceSettlement: 1_500_000,
  /**
   * The wheel decides the marriage, not just the wedding — same bands, same
   * spins, same sums ×100 as the tuned USA wheel, with the lives behind them
   * recast. The bad end is real (a rescued proposal at a two-player table
   * finishes down) and the mean stays comfortably positive, which is the
   * constraint that matters: children hang off this tile.
   */
  marriage: {
    proposalSpin: 3,
    secondAskSpin: 2,
    rescued: {
      upTo: 10,
      note: 'They said yes the second time — and moved in with a revolving card balance, a parking space for a car they no longer own, and a very relaxed attitude to both.',
      giftMultiplier: 1,
      cost: 1_200_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 4,
        note: 'The hotel banquet ran away with itself: two gown changes, a dry-ice entrance, and both families ordering the good sake.',
        giftMultiplier: 1,
        cost: 800_000,
        windfall: 0,
      },
      {
        upTo: 7,
        note: 'A small shrine ceremony and one good restaurant. Forty guests, one speech that lands, and the envelopes covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 9,
        note: 'Two incomes under one roof, and the rent on the 2LDK suddenly looks like half of what it was.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 2_000_000,
      },
      {
        upTo: 10,
        note: 'The whole hometown turns up, everybody is generous, and your partner turns out to have been quietly filling a postal savings book since high school.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 3_000_000,
      },
    ],
  },
  /** Counts, not money: the joint account swings the same either side of a five. */
  household: {
    breakEvenSpin: 5,
    shareOfPayday: 0.6,
  },
  /**
   * What a grown-up child hands back at retirement: a share of the parent's
   * payday per pip, and a flat star anybody's kid can be. The ratio and the
   * spin are counts and travel unchanged; the star is money and travels ×100 —
   * a courier's child making it big is still the better story.
   */
  childOutcome: {
    perPipOfPayday: 0.14,
    starSpin: 10,
    starPayout: 25_000_000,
  },
  firstRetirementBonus: 8_000_000,
  casualWagePerPip: 90_000,
  insurancePremium: {
    home: 2_500_000,
    auto: 2_000_000,
    life: 5_000_000,
  },
  lifeInsurancePayout: 10_000_000,
  /**
   * "The number", à la japonaise. A government report once calculated that a
   * comfortable retirement needs twenty million yen, then apologised for
   * saying so. The board's own envelope arithmetic says twenty-five — and the
   * tile that offers it quotes the report.
   */
  fireNumber: 25_000_000,
  firePayoutPerPip: 6_400_000,
  bigMoney: 5_000_000,
}
