import type { CurrencySpec, EconomyConstants } from '../types'

/**
 * Dollars, grouped the way an American board game prints them.
 *
 * Hand-rolled rather than routed through `Intl` everywhere: the game's words
 * are English in every edition, and only the digits and the symbol are the
 * country's business.
 */
export const USA_CURRENCY: CurrencySpec = {
  symbol: '$',
  locale: 'en-US',
  tileRounding: 100,
  payoutRounding: 1_000,
}

/**
 * Every dollar figure the USA board is tuned around.
 *
 * These are the numbers that lived in `src/domain/model/constants.ts`, moved
 * verbatim — not one of them changed on the way here, which is the entire
 * point of the extraction. `constants.ts` still exports them under their old
 * names, because ~20 modules read better naming `WEDDING_GIFT` than reaching
 * through an edition for it; but the engine takes them from the edition, so
 * a second edition's wedding costs what that edition says it costs.
 */
export const USA_ECONOMY: EconomyConstants = {
  startingMoney: 10_000,
  /**
   * Tuition, and the reason it is a spin now rather than a flat $52,000.
   *
   * $52,000 is where the College Lane / Straight to Work fork came back to
   * even — measured, not guessed (see the git history for the full
   * derivation) — so that figure stays the *mean* of the four bands below,
   * not a number free to move. What changes is that a player no longer knows
   * their bill until they press Spin: a 4-7 pays the old flat rate exactly, a
   * 1-3 pays for it and then some, and an 8 or better turns into the
   * scholarship story every college-lane player secretly wants to tell.
   */
  tuition: {
    outcomes: [
      {
        upTo: 3,
        note: 'The financial aid letter arrives a semester late, and by then the gap is yours to cover.',
        cost: 90_000,
      },
      {
        upTo: 7,
        note: 'Tuition comes in right where the brochure said it would.',
        cost: 52_000,
      },
      {
        upTo: 9,
        note: 'A department scholarship covers more of the bill than you were counting on.',
        cost: 21_000,
      },
      {
        upTo: 10,
        note: "Full ride. The dean's office calls to congratulate you, which has never once happened to anyone you know.",
        cost: 0,
      },
    ],
  },
  loanPrincipal: 20_000,
  /**
   * Normal is the game exactly as it has always played; the harder rates are
   * where difficulty does most of its damage. On Very Hard the bank wants two
   * and a half times what it lends.
   */
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
  /**
   * The wheel decides the marriage, not just the wedding.
   *
   * Read down the bands and it is a life rather than a prize: a proposal that
   * had to be asked twice brings someone who is still paying off a car they
   * cannot afford; a low first ask is a reception the couple are still settling
   * a year later; the middle is the sensible wedding most people actually have;
   * and only the top of the wheel is the unambiguously good one, where a second
   * income walks in the door with savings behind it.
   *
   * The bad end really is a loss — at a two-player table a rescued proposal
   * finishes $2,000 down and the runaway reception barely clears the envelopes —
   * and the mean is still comfortably positive, which is the constraint that
   * matters. Marriage has to stay worth doing: a negative expectation would mean
   * nobody ever marries, and the whole family side of the board, children
   * included, hangs off this tile. `marriage.test.ts` is what holds that.
   *
   * The wedding is deliberately the *smaller* half of the downside. A flat bill
   * is regressive — it lands hardest on the player with least, who on this board
   * is the school-leaver — so the sums here stay modest and the real swing lives
   * on the `household` tiles below, where it scales with what you earn.
   *
   * Note the table size does its own work here. Every rival pays a gift, so a
   * full table makes marriage reliably good and a duel makes it a real gamble —
   * which is the right way round, because a duel is where a swing decides
   * everything.
   */
  marriage: {
    proposalSpin: 3,
    secondAskSpin: 2,
    rescued: {
      upTo: 10,
      note: 'They said yes the second time — and moved in with a car loan, a store card and a very relaxed attitude to both.',
      giftMultiplier: 1,
      cost: 12_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 4,
        note: 'The reception ran away with itself: the room, the flowers, the photographer, and both families ordering the good wine.',
        giftMultiplier: 1,
        cost: 8_000,
        windfall: 0,
      },
      {
        upTo: 7,
        note: 'A small, sensible wedding. Forty people, one good speech, and the gifts covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 9,
        note: 'Two incomes under one roof, and the rent suddenly looks like half of what it was.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 20_000,
      },
      {
        upTo: 10,
        note: 'The whole county turns up, everybody is generous, and your partner turns out to have been quietly saving for years.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 30_000,
      },
    ],
  },
  /**
   * Three fifths of a payday riding on every pip either side of a five.
   *
   * Quoted in paydays rather than dollars because that is how it lands: a bad
   * year costs about two and a half months' pay and a good one puts three
   * ahead. On a $60,000 wage that is $36,000 a pip — a swing from $144,000 down
   * to $180,000 up, which is the largest thing on the board outside retirement,
   * and deliberately so. This is the tile that makes marriage a bet rather than
   * a prize, and it only ever fires for players who took the bet.
   *
   * Barely profitable on average, at three tenths of a payday to the good. If
   * the joint account paid well it would be a reward for marrying rather than a
   * consequence of it, and marriage already has its reward in the envelopes.
   * What this adds is the thing that was missing: years where the spending
   * outran the household and being married is precisely why you are down.
   */
  household: {
    breakEvenSpin: 5,
    shareOfPayday: 0.6,
  },
  /**
   * Nine children in ten grow up and do something decent; the tenth is a star.
   *
   * The ordinary nine are paid `0.14` of a payday per pip, so a child who rolls
   * a five hands back about seven tenths of one of their parent's paydays, and
   * a whole ordinary life averages a little under two thirds of one. With the
   * flat star folded in, one child is worth `0.63 x payday + $25,000`.
   *
   * Read that as a slope rather than a level, because the slope is the design.
   * A master groomer's child averages **$46,400**, a median earner's **$69,100**
   * and an agency owner's **$118,600** — two and a half times the first. That
   * spread is what buys Family Lane a stake in the board's volatility. A flat
   * bonus big enough to make the lane worth choosing measurably erased the
   * difference between a groomer's life and an agency owner's, and that
   * difference *is* what makes Straight to Work the volatile road.
   *
   * It is more than the flat $52,000 it replaces, and it has to be: the lane
   * also has to be worth a computer seat choosing, which it never once was.
   * Measured at these figures the computer takes Family Lane 286 times in 600
   * and Fast Track the rest — a fork that turns on your wage and how much
   * ladder you have left, which is what a fork is for.
   *
   * The star stays a quarter of a million, flat, for anybody's child: enough to
   * turn a game over on the results screen, and a courier's kid making it big
   * is the better story. It is also safe to leave flat — measured, shrinking it
   * moved the volatility ratio by 0.013, so it is not where that lives.
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
   * A quarter of a million into the fund, and the last act of the board given
   * up. Measured rather than guessed: it is about what a player who has kept a
   * job and stayed out of debt is holding when they reach The Number, so
   * roughly nine seats in twenty are offered the choice at all and the rest
   * are told to come back when they have earned it.
   */
  fireNumber: 250_000,
  /**
   * $64,000 a pip against that stake: $64,000 back on a one, $640,000 on a
   * ten, $352,000 on an average wheel. Four wedges out of ten come back
   * smaller than the money that went in, which is exactly the point — and the
   * expected surplus is what the last act of the board would have paid a
   * player who kept working. Measured, not guessed: a seat that always stops
   * when offered and one that never does finish within a per cent of each
   * other.
   */
  firePayoutPerPip: 64_000,
  bigMoney: 50_000,
}
