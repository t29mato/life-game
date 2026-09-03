import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Yen, printed the way the Japan board already prints them.
 *
 * Identical to `JAPAN_CURRENCY` and deliberately so: this is the same country
 * counting the same money, and a research salary is read monthly there like
 * everybody else's. It is written out again rather than imported because an
 * edition owns its own currency — the day one of these two boards wants a
 * different rounding is the day sharing it would have been the bug.
 */
export const RESEARCHER_JAPAN_CURRENCY: CurrencySpec = {
  symbol: '¥',
  locale: 'ja-JP',
  tileRounding: 10_000,
  payoutRounding: 100_000,
  salaryDisplay: { unit: 'month', adjective: 'Monthly', periods: 12 },
}

/**
 * The Japan economy, and the one figure on it this board is not allowed to
 * inherit.
 *
 * Everything here is the measured USA economy at ×100, exactly as the country
 * Japan board has it — starting cash, loans, the wedding, the household, the
 * insurance premiums, the number. Those are all facts about the *place*, and
 * the place has not changed.
 *
 * `tuition` has. On the country board it is four years of undergraduate fees,
 * a real bill, and its mean is load-bearing for that board's opening fork. On
 * this board the same tile is five years of graduate school, and pricing those
 * five years as a bill would be telling a lie about what they cost. A Japanese
 * doctorate is mostly not expensive: fee waivers are ordinary, the national
 * fellowship pays a stipend outright, and what the years actually take is the
 * five years — which this board already charges in full, on the lane itself,
 * as eight tiles with no payday anywhere on them while the other road banks
 * three. Charging the money as well would be charging twice for the same
 * decision.
 *
 * So the bands below run from a bad year that genuinely hurts to a funded one
 * that costs nothing, at a mean of ¥2.0M against the country board's ¥5.2M.
 * That is a deliberate, measured divergence and not a copy error:
 * `balance.test.ts` re-measures this board's opening fork from scratch rather
 * than inheriting the country board's, because the pools either side of that
 * fork have swapped shapes and nothing about it could be inherited anyway.
 */
export const RESEARCHER_JAPAN_ECONOMY: EconomyConstants = {
  startingMoney: 1_000_000,
  tuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'No fellowship, no waiver, and a supervisor who assumes you can simply be here. Five years of rent, fees and reagents, on a part-time teaching wage.',
        cost: 5_000_000,
      },
      {
        upTo: 4,
        note: 'A fee waiver for half the years and tutoring for the rest. It works out, in the sense that you are never quite in arrears.',
        cost: 2_000_000,
      },
      {
        upTo: 5,
        note: 'A partial fee exemption and a supervisor who finds you a research assistantship. You eat, cheaply, and buy your own laptop.',
        cost: 1_000_000,
      },
      {
        upTo: 6,
        note: 'The national fellowship, first time of asking: fees waived, a stipend paid monthly, and a research budget of your own at twenty-five.',
        cost: 0,
      },
    ],
  },
  /**
   * Not a second tuition bill on this board — the Fixed-Term Ladder's first
   * tile, where a newly appointed researcher discovers what arriving costs.
   *
   * The engine calls this field `doctorateTuition` because on every other
   * board the road it sits on is a grad school, and the field is named for
   * what a route usually does with it rather than for what this one does.
   * Here it buys a laboratory: the equipment the start-up package did not
   * cover, the renovation the department promised and half-funded, and the
   * first year's consumables bought before the first grant lands. Priced at
   * the country board's ×100 figures, because this one *is* a real bill and
   * the measured spread of that bill is worth keeping.
   */
  doctorateTuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'There is no start-up package. There is a room, a bench, and a very warm welcome. Everything that makes the room a laboratory is yours to buy.',
        cost: 5_400_000,
      },
      {
        upTo: 4,
        note: 'The start-up money arrives and covers rather less than the quotation did. The renovation runs three weeks and two million over.',
        cost: 4_800_000,
      },
      {
        upTo: 5,
        note: 'A departmental fund covers the big instrument. You still buy the consumables, the chairs and the second freezer.',
        cost: 4_000_000,
      },
      {
        upTo: 6,
        note: 'You inherit a retiring professor\'s entire laboratory, keys and freezers and all, and only have to pay to move it.',
        cost: 3_000_000,
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
  weddingGift: 1_000_000,
  divorceSettlement: 1_500_000,
  /**
   * The wheel decides the marriage, at the country board's stakes, with the
   * two-body problem written into the bands. Two academics is two job markets
   * that do not overlap, and the board has to be able to say so — but the mean
   * stays comfortably positive, because children hang off this tile.
   */
  marriage: {
    proposalSpin: 4,
    secondAskSpin: 4,
    rescued: {
      upTo: 6,
      note: 'They said yes the second time — and their own contract is at an institute four hours away, so the first two years of the marriage happen on a night bus and a video call.',
      giftMultiplier: 1,
      cost: 1_200_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 2,
        note: 'The reception is held between two conference seasons and attended by both supervisors, who give the same speech. The venue is charged by the hour.',
        giftMultiplier: 1,
        cost: 800_000,
        windfall: 0,
      },
      {
        upTo: 4,
        note: 'A registry office on a Tuesday and dinner with eleven people, because the grant report was due on the Monday. The envelopes covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 5,
        note: 'They took the post in the same city. Two salaries, one commute each, and a flat neither of you could have taken alone.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 2_000_000,
      },
      {
        upTo: 6,
        note: 'The whole department turns up, both families are generous, and your partner turns out to have been quietly saving since their own doctorate.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 3_000_000,
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
  fireNumber: 25_000_000,
  firePayoutPerPip: 10_000_000,
  bigMoney: 5_000_000,
}
