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
