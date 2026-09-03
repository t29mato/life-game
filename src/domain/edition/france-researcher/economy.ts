import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Euros, printed the way the France board already prints them.
 *
 * Identical to `FRANCE_CURRENCY`, and written out again rather than imported
 * for the reason an edition owns its own currency: the day one of these two
 * boards wants a different rounding is the day sharing it would have been the
 * bug. A salary here reads as a salary and not as a monthly figure — France
 * quotes a research post in euros a year, the way the dollar board quotes a
 * job, so there is no `salaryDisplay` to write.
 */
export const RESEARCHER_FRANCE_CURRENCY: CurrencySpec = {
  symbol: '€',
  locale: 'fr-FR',
  tileRounding: 100,
  payoutRounding: 1_000,
}

/**
 * The France economy, and the one figure on it this board refuses to inherit.
 *
 * Everything here is the measured USA economy at ×1, exactly as the country
 * France board has it — the euro has sat within a few per cent of the dollar
 * for twenty years, so the tuned ratios survive a change of symbol and
 * nothing else. Starting cash, the bank, the wedding, the household, the
 * premiums, the number: all facts about the place, and the place has not
 * changed.
 *
 * `tuition` has, and further than any board has moved it before — because on
 * this board it is not a bill at all. It is the thesis years, and in France
 * those years are usually *funded*: a three-year doctoral contract is the
 * ordinary case, a fee waiver is routine, and one face of this die is the
 * thing no other board in this game can print — **a doctorate done inside a
 * company, on an employment contract, that pays you to do it.** The bands run
 * from a thesis written in the evenings on nobody's money to a salary for
 * three years, and the mean is a small cost rather than the largest bill on
 * the board.
 *
 * That is a deliberate, measured divergence and not a copy error. It is also
 * not generosity: the road it sits on still charges the years in full — nine
 * tiles with a single small teaching fee on them while the road opposite is
 * salaried from its first tile and banks three paydays — and
 * `balance.test.ts` re-measures the whole opening fork from scratch rather
 * than inheriting a number from anywhere.
 */
export const RESEARCHER_FRANCE_ECONOMY: EconomyConstants = {
  startingMoney: 10_000,
  tuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'No contract, no grant, and a supervisor who is sure something will turn up. Five years of evenings, weekends and hourly teaching, and the thesis is written on your own money.',
        cost: 28_000,
      },
      {
        upTo: 4,
        note: 'A doctoral contract for three years, and a thesis that takes four. The last year is yours to fund, and you fund it by teaching.',
        cost: 6_000,
      },
      {
        upTo: 5,
        note: 'A full doctoral contract, start to finish: a modest salary, social cover, and enrolment fees somebody else remembers to waive.',
        cost: 0,
      },
      {
        upTo: 6,
        /*
         * The one face of a tuition die anywhere in this game that pays. See
         * `TuitionOutcome.cost` for the plumbing, and §10.3 of the concept
         * document for why it belongs on this board and on no other.
         */
        note: 'An industrial doctorate: the thesis done inside a company, on a salary, with the firm paying the laboratory for the privilege. Three years of research, and you finish with savings.',
        cost: -24_000,
      },
    ],
  },
  /**
   * The mobility years, at the country board's own measured figures.
   *
   * The engine calls this `doctorateTuition` because on every other board the
   * road it sits on is a grad school. Here it buys the two things a French
   * academic career is unofficially priced at before anyone will appoint you:
   * a postdoc abroad, and the years of coming back. Two moves, two deposits,
   * a household split across a border, flights home that nobody reimburses,
   * and the months between one contract ending and the next beginning.
   *
   * Kept at ×1 exactly, unlike the thesis die above, because this one really
   * is a bill and its measured spread is worth keeping: the gated road has to
   * cost something real, or the concours at the end of it is a free ticket.
   */
  doctorateTuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'Three years in two countries, a household in both for part of it, and four months between contracts with rent still due in a city you no longer live in.',
        cost: 54_000,
      },
      {
        upTo: 4,
        note: 'A good fellowship abroad that covers the salary and none of the moving. You learn what a shipping container costs.',
        cost: 48_000,
      },
      {
        upTo: 5,
        note: 'One move, one return, and a laboratory that pays your flights to the conferences you would have paid for yourself.',
        cost: 40_000,
      },
      {
        upTo: 6,
        note: 'A European grant that follows you rather than the other way round, and a colleague who lends you a flat for the summer you come home.',
        cost: 30_000,
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
  weddingGift: 10_000,
  divorceSettlement: 15_000,
  /**
   * The wheel decides the marriage, at the country board's stakes, with the
   * two-body problem written into the bands — two academics is two job
   * markets that do not overlap, and in a country whose research posts are
   * allocated nationally, that means two cities. The mean stays comfortably
   * positive, because children hang off this tile.
   */
  marriage: {
    proposalSpin: 4,
    secondAskSpin: 4,
    rescued: {
      upTo: 6,
      note: 'They said yes the second time — and their own post is four hundred kilometres away, so the first two years of the marriage happen on the Friday evening train and the Sunday night one back.',
      giftMultiplier: 1,
      cost: 12_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 2,
        note: 'The reception ran away with itself: a hall in the village, both families ordering the good champagne, and the caterer adding a fourth course nobody asked for.',
        giftMultiplier: 1,
        cost: 8_000,
        windfall: 0,
      },
      {
        upTo: 4,
        note: 'Ten minutes at the town hall under the portrait of the Republic, then one long dinner for forty, because the grant report was due on the Monday. The envelopes covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 5,
        note: 'They were appointed in the same city, which is rarer than either of you says out loud. Two salaries, one flat, and no train ticket bought on a Sunday night ever again.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 20_000,
      },
      {
        upTo: 6,
        note: 'The whole laboratory comes, both families are generous, and your partner turns out to have a savings booklet opened for them at birth and never once touched.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 30_000,
      },
    ],
  },
  household: {
    breakEvenSpin: 3,
    shareOfPayday: 1,
  },
  childOutcome: {
    perPipOfPayday: 0.25,
    starSpin: 6,
    starPayout: 150_000,
  },
  firstRetirementBonus: 80_000,
  casualWagePerPip: 1_400,
  insurancePremium: {
    home: 4_000,
    auto: 3_000,
    life: 20_000,
  },
  lifeInsuranceMaturity: [6_000, 46_000],
  fireNumber: 250_000,
  firePayoutPerPip: 100_000,
  bigMoney: 50_000,
}
