import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Rupees, grouped the way India actually reads them.
 *
 * `en-IN` is doing real work here: `toLocaleString` groups the last three
 * digits and then every two — ₹52,00,000, ₹2,50,00,000 — which *is* the
 * lakh/crore convention, in the one channel `CurrencySpec` has for it. An
 * Indian reader parses ₹1,20,00,000 as 1.2 crore at a glance, and a table of
 * English-speaking friends learns the grouping by the second payday. Rounding
 * runs a hundred times coarser than the dollar board, exactly like the yen
 * board: tiles round to ₹10,000 and the big quoted prices — a house's rolled
 * resale, a share's payout — round to the lakh, which is precisely how Indian
 * property and portfolios are quoted in life.
 */
export const INDIA_CURRENCY: CurrencySpec = {
  symbol: '₹',
  locale: 'en-IN',
  tileRounding: 10_000,
  payoutRounding: 100_000,
}

/**
 * Every rupee figure the India board is tuned around: the USA economy at ×100.
 *
 * The same balance-preservation rule the yen board used, and for India the
 * flat ×100 is barely even stylised — it sits within a few percent of the real
 * dollar-rupee rate, so the sums read like the country by accident of
 * arithmetic: ₹10,00,000 to start a life, a ₹52,00,000 seat at a private
 * college, and a retirement number of ₹2.5 crore, which is the exact figure
 * every FIRE spreadsheet forwarded on WhatsApp arrives at. The ratios between
 * the numbers are two years of measured balance and are not this edition's to
 * touch; `india/edition.test.ts` is the proof this file is ×100 and has not
 * quietly drifted.
 */
export const INDIA_ECONOMY: EconomyConstants = {
  startingMoney: 1_000_000,
  /**
   * Two years of coaching classes, the entrance-exam attempts, and four years
   * of a private engineering or medical seat — a spin now, not a flat bill.
   * ₹5,200,000 stays the *mean* of the four bands below, the same measured
   * number the opening fork was balanced at.
   */
  tuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'The management-quota seat costs what the prospectus never printed, and a refresher year of coaching gets added on top.',
        cost: 9_000_000,
      },
      {
        upTo: 4,
        note: 'Coaching, entrance attempts and the seat itself come to exactly what was budgeted.',
        cost: 5_200_000,
      },
      {
        upTo: 5,
        note: 'A merit-cum-means scholarship covers more of the four years than you expected.',
        cost: 2_800_000,
      },
      {
        upTo: 6,
        note: 'An AIR good enough for a full fee waiver — the kind of result relatives never stop mentioning.',
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
   * The shagun envelope: every guest hands the couple cash in a decorated
   * envelope, and by iron custom the sum ends in a single extra rupee — the
   * one is the blessing. The engine's gift-from-each-player rule *is* the
   * custom, verbatim. ₹10,00,000 is stylised the same way the $10,000 it
   * mirrors always was.
   */
  weddingGift: 1_000_000,
  divorceSettlement: 1_500_000,
  /**
   * The wheel decides the marriage, not just the wedding — same bands, same
   * spins, same sums ×100 as the tuned USA wheel, with the lives behind them
   * recast. What swings in India is the wedding itself: the functions
   * multiply, the guest list compounds, and a family measures the whole thing
   * in years of saving. That spending is the material here — the gold, the
   * band, the five functions — and the mean stays comfortably positive, which
   * is the constraint that matters: children hang off this tile.
   */
  marriage: {
    proposalSpin: 4,
    secondAskSpin: 4,
    rescued: {
      upTo: 6,
      note: 'They said yes the second time — and moved in with three maxed credit cards, an EMI on a phone from two phones ago, and a very relaxed attitude to both.',
      giftMultiplier: 1,
      cost: 1_200_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 2,
        note: 'The wedding grew a function a week: the engagement, the music night, the cocktail evening, the horse, the brass band, and both families insisting on the bigger hall.',
        giftMultiplier: 1,
        cost: 800_000,
        windfall: 0,
      },
      {
        upTo: 4,
        note: 'A temple ceremony at dawn and one good lunch. Sixty guests, one uncle\'s speech that lands, and the envelopes covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 5,
        note: 'Two salaries under one roof, and the rent on the two-bedroom flat suddenly looks like half of what it was.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 2_000_000,
      },
      {
        upTo: 6,
        note: 'Three villages\' worth of guests turn up, everybody is generous, and your partner turns out to have been quietly running a recurring deposit since their first salary.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 3_000_000,
      },
    ],
  },
  /** Counts, not money: the joint account swings the same either side of a five. */
  household: {
    breakEvenSpin: 3,
    shareOfPayday: 1,
  },
  /**
   * What a grown-up child hands back at retirement: a share of the parent's
   * payday per pip, and a flat star anybody's kid can be. The ratio and the
   * spin are counts and travel unchanged; the star is money and travels ×100 —
   * the delivery rider's child cracking the big exam is still the better story.
   */
  childOutcome: {
    perPipOfPayday: 0.25,
    starSpin: 6,
    starPayout: 15_000_000,
  },
  firstRetirementBonus: 8_000_000,
  casualWagePerPip: 140_000,
  insurancePremium: {
    home: 400_000,
    auto: 300_000,
    life: 2_000_000,
  },
  lifeInsuranceMaturity: [600_000, 4_600_000],
  /**
   * "The number", desi edition. Every family WhatsApp group has forwarded a
   * calculation of what a comfortable retirement needs, and every forward
   * lands somewhere around two crore. The board's own envelope arithmetic says
   * two and a half — and the tile that offers it quotes the forwards.
   */
  fireNumber: 25_000_000,
  firePayoutPerPip: 10_000_000,
  bigMoney: 5_000_000,
}
