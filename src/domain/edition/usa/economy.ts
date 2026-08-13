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
  collegeTuition: 40_000,
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
   * The bad end is genuinely bad — at a two-player table a rescued proposal is
   * $24,000 down — and the mean is still comfortably positive, which is the
   * constraint that matters. Marriage has to stay worth doing: a negative
   * expectation would mean nobody ever marries, and the whole family side of
   * the board, children included, hangs off this tile.
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
      cost: 34_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 4,
        note: 'The reception ran away with itself: the room, the flowers, the photographer, and both families ordering the good wine.',
        giftMultiplier: 1,
        cost: 22_000,
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
        windfall: 30_000,
      },
      {
        upTo: 10,
        note: 'The whole county turns up, everybody is generous, and your partner turns out to have been quietly saving for years.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 45_000,
      },
    ],
  },
  /**
   * $9,000 a pip either side of a five: a bad month costs $36,000 and a good one
   * brings $45,000, and the average month is worth $4,500.
   *
   * Barely profitable on purpose. If the joint account paid well it would be a
   * reward for marrying rather than a consequence of it, and marriage already
   * has its reward in the gift envelopes. What this adds is the thing the player
   * asked for: months where the spending outran the household and being married
   * is why you are down.
   */
  household: {
    breakEvenSpin: 5,
    perPip: 9_000,
  },
  /**
   * $52,000 a child on average — five times what it was, and now a real share
   * of a final total rather than a rounding error. It is the expected value of
   * `childOutcome` below, and `lifeTiles.test.ts`'s sibling check in
   * `economy.test.ts` is what stops the two drifting apart.
   */
  childBonus: 52_000,
  /**
   * Nine children in ten grow up and do something decent — $6,000 a pip, so
   * $6,000 to $54,000 depending on how life went. The tenth is a star, and a
   * star is worth a quarter of a million: enough to turn a game over on the
   * results screen, which is exactly the story a board game about a life
   * should be able to tell.
   *
   * 4.5 x 6,000 + 0.1 x 250,000 = 52,000, which is `childBonus` above.
   */
  childOutcome: {
    perPip: 6_000,
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
