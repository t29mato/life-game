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
   * Tuition, and the reason it is a roll now rather than a flat $52,000.
   *
   * $52,000 is where the College Lane / Straight to Work fork came back to
   * even — measured, not guessed (see the git history for the full
   * derivation) — so that figure stays the *mean* of the four bands below,
   * not a number free to move. What changes is that a player no longer knows
   * their bill until they press Roll: a 3-4 pays the old flat rate exactly, a
   * 1-2 pays for it and then some, and a 5 or better turns into the
   * scholarship story every college-lane player secretly wants to tell.
   *
   * The bands were re-cut when the ten-wedge wheel became a six-face die, and
   * the scholarship band went from $21,000 to $28,000 in the process. That is
   * not the scholarship getting meaner, it is arithmetic: six faces cannot be
   * split 3/4/2/1, so the bands run 2/2/1/1 instead, and the middle band is
   * where the mean had to be bought back to keep it at exactly $52,000.
   */
  tuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'The financial aid letter arrives a semester late, and by then the gap is yours to cover.',
        cost: 90_000,
      },
      {
        upTo: 4,
        note: 'Tuition comes in right where the brochure said it would.',
        cost: 52_000,
      },
      {
        upTo: 5,
        note: 'A department scholarship covers more of the bill than you were counting on.',
        cost: 28_000,
      },
      {
        upTo: 6,
        note: "Full ride. The dean's office calls to congratulate you, which has never once happened to anyone you know.",
        cost: 0,
      },
    ],
  },
  /**
   * Going back, and why the bill is the smaller half of what it costs.
   *
   * Mean **$45,667**, against the first degree's $52,000 — and yes, that is
   * *less*, which is the opposite of what this was written as. The money is
   * not where the price of this road lives. A doctorate is six tiles walked
   * with no wage coming in, taken in the middle of a working life by somebody
   * who already has a graduate job to give up; the payday foregone is worth
   * $55,000-$80,000 on its own, so the road costs about $105,000 all in and
   * the bill is barely two fifths of it. Charging more on the *tile* would not
   * make the road heavier so much as delete it, which is exactly the argument
   * `SpaceContent.unscaled` makes about college tuition one degree down.
   *
   * The Very Hard board is what set the ceiling, and it set it hard. This bill
   * lands mid-career on a player who is rarely holding it in cash, so it is
   * paid in loans — and Very Hard's bank wants $50,000 back for every $20,000
   * it lends. At a $51,000 mean the college seats' win rate there measured
   * exactly 0.350 against a floor of 0.350; at $89,000 it measured 0.317, and
   * College Lane had stopped being a choice and become a trap. Every $10,000
   * on this line is roughly a point of that win rate.
   *
   * The bands are flatter than the undergraduate table's for the same reason.
   * It is the *bad end* that forces the borrowing, so the spread here is worth
   * less than the mean is: there is no full ride at the top, because a funded
   * studentship is a waiver and a stipend you still live thinly on, and no
   * six-figure disaster at the bottom either. Same 2/2/1/1 split over the six
   * faces the undergraduate table uses, so the two read as one system.
   */
  doctorateTuition: {
    outcomes: [
      {
        upTo: 2,
        note: 'The funding runs out in year two and the department is very sorry. The rest of it is yours to find.',
        cost: 54_000,
      },
      {
        upTo: 4,
        note: 'Fees, bench costs and four years of rent, with a teaching stipend that covers rather less than half.',
        cost: 48_000,
      },
      {
        upTo: 5,
        note: 'A partial studentship covers most of the fees. You still have to eat, and you do so cheaply.',
        cost: 40_000,
      },
      {
        upTo: 6,
        note: 'A fully funded studentship: fees waived, a stipend paid, and four years of instant noodles.',
        cost: 30_000,
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
  divorceSettlement: 15_000,
  /**
   * The wheel decides the marriage, not just the wedding — and, now, whether
   * there is one at all.
   *
   * Read down the bands and it is a life rather than a prize: a proposal that
   * had to be asked twice brings someone who is still paying off a car they
   * cannot afford; a low first ask is a reception the couple are still settling
   * a year later; the middle is the sensible wedding most people actually have;
   * and only the top of the wheel is the unambiguously good one, where a second
   * income walks in the door with savings behind it.
   *
   * `proposalSpin: 4` and `secondAskSpin: 4` mean a 1-in-4 life stays single at
   * this tile: half the table falls under the first ask's bar, and half of
   * those again fail the second — 0.5 × 0.5 = 25%. This used to be 2 and 2, a
   * 1-in-36 chance nobody at the table ever actually saw, which is what "not
   * everybody marries" needs to mean *in practice*, not just in the code path
   * `resolveMarriageSpin` already had sitting unused. A refusal is not a worse
   * roll than a rescued proposal — it pays a LIFE tile and skips every band on
   * this table, married or not, which is deliberate: staying single is a
   * different life, not a failed one.
   *
   * The bad end really is a loss — at a two-player table a rescued proposal
   * finishes $2,000 down and the runaway reception barely clears the envelopes —
   * and the mean is still comfortably positive, which is the constraint that
   * matters. Marriage has to stay worth doing: a negative expectation would mean
   * nobody ever marries, and the whole family side of the board, children
   * included, hangs off this tile. `marriage.test.ts` is what holds that — and
   * it still holds at 25% single, because staying single moves zero dollars
   * rather than a negative one; it dilutes the mean toward zero, it does not
   * drag it there.
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
    proposalSpin: 4,
    secondAskSpin: 4,
    rescued: {
      upTo: 6,
      note: 'They said yes the second time — and moved in with a car loan, a store card and a very relaxed attitude to both.',
      giftMultiplier: 1,
      cost: 12_000,
      windfall: 0,
    },
    outcomes: [
      {
        upTo: 2,
        note: 'The reception ran away with itself: the room, the flowers, the photographer, and both families ordering the good wine.',
        giftMultiplier: 1,
        cost: 8_000,
        windfall: 0,
      },
      {
        upTo: 4,
        note: 'A small, sensible wedding. Forty people, one good speech, and the gifts covered it.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 0,
      },
      {
        upTo: 5,
        note: 'Two incomes under one roof, and the rent suddenly looks like half of what it was.',
        giftMultiplier: 1,
        cost: 0,
        windfall: 20_000,
      },
      {
        upTo: 6,
        note: 'The whole county turns up, everybody is generous, and your partner turns out to have been quietly saving for years.',
        giftMultiplier: 1.5,
        cost: 0,
        windfall: 30_000,
      },
    ],
  },
  /**
   * A whole payday riding on every pip either side of a three.
   *
   * Quoted in paydays rather than dollars because that is how it lands: a bad
   * year costs two months' pay and a good one puts three ahead. On a $60,000
   * wage that is $60,000 a pip — a swing from $120,000 down to $180,000 up,
   * which is the largest thing on the board outside retirement, and
   * deliberately so. This is the tile that makes marriage a bet rather than a
   * prize, and it only ever fires for players who took the bet.
   *
   * The share went from three fifths of a payday to a whole one when the wheel
   * became a die, and that is the swing being *held*, not widened: a die is a
   * narrower instrument than a ten-wedge wheel (its results sit two thirds as
   * far from the middle), so the pip has to be worth proportionally more for
   * a bad year to cost what a bad year has always cost here.
   *
   * Barely profitable on average, at half a payday to the good. If the joint
   * account paid well it would be a reward for marrying rather than a
   * consequence of it, and marriage already has its reward in the envelopes.
   * What this adds is the thing that was missing: years where the spending
   * outran the household and being married is precisely why you are down.
   */
  household: {
    breakEvenSpin: 3,
    shareOfPayday: 1,
  },
  /**
   * Five children in six grow up and do something decent; the sixth is a star.
   *
   * The ordinary five are paid `0.25` of a payday per pip, so a child who rolls
   * a three hands back three quarters of one of their parent's paydays, and a
   * whole ordinary life averages a little under two thirds of one. With the
   * flat star folded in, one child is worth `0.625 x payday + $25,000` — the
   * same figure it was worth on the ten-wedge wheel, which is the point: the
   * rate per pip and the star's own size both moved so the child would not.
   *
   * Read that as a slope rather than a level, because the slope is the design.
   * A master groomer's child averages **$46,300**, a median earner's **$68,800**
   * and an agency owner's **$117,800** — two and a half times the first. That
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
   * The star is $150,000, flat, for anybody's child: enough to turn a game over
   * on the results screen, and a courier's kid making it big is the better
   * story. It was a quarter of a million while a star was the top wedge of a
   * ten-wedge wheel; the top face of a die comes up once in six rather than
   * once in ten, so the prize came down to keep what a star is *worth over a
   * game* — $25,000 a child — exactly where it was. It is also safe to leave
   * flat — measured, shrinking it moved the volatility ratio by 0.013, so it
   * is not where that lives.
   */
  childOutcome: {
    perPipOfPayday: 0.25,
    starSpin: 6,
    starPayout: 150_000,
  },
  firstRetirementBonus: 80_000,
  casualWagePerPip: 1_400,
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
   * $100,000 a pip against that stake: $100,000 back on a one, $600,000 on a
   * six, $350,000 on an average roll. Two faces out of six come back smaller
   * than the money that went in, which is exactly the point — and the expected
   * surplus is what the last act of the board would have paid a player who
   * kept working. Measured, not guessed: a seat that always stops when offered
   * and one that never does finish within a per cent of each other.
   */
  firePayoutPerPip: 100_000,
  bigMoney: 50_000,
}
