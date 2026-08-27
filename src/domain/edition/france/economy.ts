import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Euros, printed the way a French board game printed in English prints them.
 *
 * Same grouping, same rounding units as the dollar board, because the euro and
 * the dollar have lived within a few per cent of each other for two decades:
 * a $52,000 tuition bill and a €52,000 one are the same size of life event.
 * ×1 is therefore the honest scale — where Japan needed ×100 to keep the tuned
 * ratios in believable yen, France keeps them in believable euros by changing
 * nothing but the symbol. The wink lives in the copy, not the arithmetic.
 */
export const FRANCE_CURRENCY: CurrencySpec = {
  symbol: '€',
  locale: 'fr-FR',
  tileRounding: 100,
  payoutRounding: 1_000,
}

/**
 * Every euro figure the France board is tuned around: the USA economy at ×1.
 *
 * Not an exchange rate — a balance-preservation rule. Every number in the game
 * is tuned against every other (salaries against tuition against loan interest
 * against the retirement bonus), and the cheapest correct move for a new
 * country is to keep those ratios bit for bit and change only the unit. The
 * euro sits close enough to the dollar that the unit does not even need to
 * move. `france/edition.test.ts` is the proof this file really is ×1 and has
 * not quietly drifted.
 */
export const FRANCE_ECONOMY: EconomyConstants = {
  startingMoney: 10_000,
  /**
   * The prépa years are free — the Republic pays for the cramming — and then
   * the grande école at the end of them sends an invoice the Republic does
   * not subsidise. A spin now, not a flat bill: €52,000 stays the *mean* of
   * the four bands below, the same measured number the opening fork was
   * balanced at.
   */
  tuition: {
    outcomes: [
      {
        upTo: 3,
        note: "The invoice arrives with a surprise frais de dossier nobody mentioned at the open day, and it isn't small.",
        cost: 90_000,
      },
      {
        upTo: 7,
        note: 'The invoice from the grande école is exactly what the brochure quoted.',
        cost: 52_000,
      },
      {
        upTo: 9,
        note: 'A means-tested bourse covers more of the invoice than you expected.',
        cost: 21_000,
      },
      {
        upTo: 10,
        note: "Exonération totale — the grande école waives the whole thing, and your parents don't quite believe it.",
        cost: 0,
      },
    ],
  },
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
   * The wedding envelope — the urn on the gift table at every French
   * reception. €10,000 a guest is stylised exactly the way the $10,000 it
   * mirrors always was.
   */
  weddingGift: 10_000,
  divorceSettlement: 15_000,
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
      note: 'They said yes the second time — and moved in with a leased car, an unpaid fine from a speed camera near Limoges, and a very relaxed attitude to both.',
      giftMultiplier: 1,
      cost: 12_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 4,
        note: 'The château wedding ran away with itself: the marquee, the caterer\'s fourth course, and both families ordering the good champagne.',
        giftMultiplier: 1,
        cost: 8_000,
        windfall: 0,
      },
      {
        upTo: 7,
        note: 'Ten minutes at the town hall under the portrait of the Republic, then one long dinner for forty. One speech lands, and the envelopes covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 9,
        note: 'Two incomes under one roof, and the city rent suddenly looks like half of what it was.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 20_000,
      },
      {
        upTo: 10,
        note: 'The whole village turns up, everybody is generous, and your partner turns out to hold a savings booklet untouched since their first communion.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 30_000,
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
   * spin are counts and travel unchanged; at ×1 the star travels unchanged
   * too — a courier's child making it big is still the better story.
   */
  childOutcome: {
    perPipOfPayday: 0.14,
    starSpin: 10,
    starPayout: 250_000,
  },
  firstRetirementBonus: 80_000,
  casualWagePerPip: 900,
  insurancePremium: {
    home: 25_000,
    auto: 20_000,
    life: 50_000,
  },
  lifeInsurancePayout: 100_000,
  /**
   * "The number", à la française. Retirement is the one subject the whole
   * country will stop traffic over, and stopping *early* — before anyone can
   * reform the age again — is the dream the tile sells. The board's envelope
   * arithmetic prices it exactly where the measured USA number sits.
   */
  fireNumber: 250_000,
  firePayoutPerPip: 64_000,
  bigMoney: 50_000,
}
