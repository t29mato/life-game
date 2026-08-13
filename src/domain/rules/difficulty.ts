import type { Difficulty, Money, SpaceEffect } from '../model/types'
import type { Edition } from '../edition/types'
import { EDITION_USA } from '../edition/usa'

/**
 * The dials each difficulty turns, and the only place their numbers live.
 *
 * Two rules shaped every value below.
 *
 * The first is that difficulty must be *visible*. A hidden multiplier applied
 * somewhere in the use cases would make a harder game feel arbitrary — the tile
 * says $9,000 and the wallet loses $20,000. So the scaling is applied once, in
 * `createBoard`, and baked into the spaces themselves: the Market Crash tile on
 * Very Hard genuinely reads $23,400, the event card quotes that figure, and the
 * computer seats value it correctly without knowing difficulty exists at all.
 *
 * The second is that the harder settings bite through *frequency* first, because
 * that is what a player at the table actually feels. An edition's route seeds a
 * couple of dozen extra setback tiles from `hard` upwards, turns pieces of pure
 * scenery into real bills, and cancels two paydays on `hard` and two more on
 * `veryHard`. The multipliers below are the trim on top of that.
 *
 * A note on how far these have to reach. Board bills start out as small change
 * beside the payroll — an $800 grocery run against a $60,000 payday — and only
 * about one tile in three is ever landed on, so a setback contributes roughly a
 * fifth of its face value across a game. Frequency and size alone therefore
 * cannot close the gap to break-even; what closes it is the two levers that
 * touch every player in every game, namely the paydays that no longer arrive
 * and the interest on the borrowing that follows.
 */
export interface DifficultyProfile {
  /** Multiplier on every dollar the board hands out. Below 1 thins windfalls. */
  readonly gainScale: number
  /** Multiplier on every dollar the board demands. Above 1 fattens bills. */
  readonly lossScale: number
  /**
   * Repaid per outstanding loan at the final scoring.
   *
   * This is the sharpest tool in the box, and deliberately so: the board's
   * extra bills push players into borrowing, and the interest is what turns
   * that borrowing into a losing position. It is also the fairest, because a
   * player who keeps their nerve and stays out of debt never pays it.
   */
  readonly loanRepayment: Money
  /** Cost of clearing one loan early at the bank. Always the cheaper way out. */
  readonly earlyLoanRepayment: Money
  /** Fraction of a house's rolled resale that actually reaches the seller. */
  readonly resaleScale: number
  /** Fraction of a share's rolled payout that survives to the final total. */
  readonly stockScale: number
}

/** Every difficulty, kindest first. The order the title screen offers them in. */
export const DIFFICULTIES: readonly Difficulty[] = ['normal', 'hard', 'veryHard']

/**
 * The multipliers, which are pure ratios and therefore the same in any
 * currency. The two loan figures are not: they are sums of money, so they come
 * from the edition and are folded in by `difficultyProfile` below.
 */
type ProfileScales = Omit<DifficultyProfile, 'loanRepayment' | 'earlyLoanRepayment'>

const SCALES: Readonly<Record<Difficulty, ProfileScales>> = {
  /** The game exactly as it has always played. Every number here is an identity. */
  normal: {
    gainScale: 1,
    lossScale: 1,
    resaleScale: 1,
    stockScale: 1,
  },
  /**
   * A clear step down, but still a game you expect to finish in the black.
   * Windfalls lose a third, bills gain most of one, the bank wants a third more
   * back, and a house no longer sells for a tidy profit on what it cost.
   */
  hard: {
    gainScale: 0.65,
    lossScale: 2,
    resaleScale: 0.75,
    stockScale: 0.78,
  },
  /**
   * Break-even is the good outcome. The bank wants two and a half times what it
   * lends, the windfalls are less than half what they were, and a house sells
   * for barely more than half its worth — so a mortgage taken out to buy one is
   * a bet, not a savings account.
   */
  veryHard: {
    gainScale: 0.45,
    lossScale: 2.6,
    resaleScale: 0.55,
    stockScale: 0.6,
  },
}

/**
 * The dials for a difficulty, defaulting to `normal`.
 *
 * The fallback is not defensive padding: a save written before difficulty
 * existed reloads with the field missing, and the honest reading of that save
 * is the game it was actually played at. `edition` defaults the same way and
 * for the same reason.
 */
export function difficultyProfile(
  difficulty: Difficulty | undefined,
  edition: Edition = EDITION_USA,
): DifficultyProfile {
  const settled: Difficulty = (difficulty && SCALES[difficulty] && difficulty) || 'normal'
  return {
    ...SCALES[settled],
    loanRepayment: edition.economy.loanRepayment[settled],
    earlyLoanRepayment: edition.economy.earlyLoanRepayment[settled],
  }
}

export function loanRepaymentFor(difficulty: Difficulty | undefined, edition: Edition = EDITION_USA): Money {
  return difficultyProfile(difficulty, edition).loanRepayment
}

export function earlyLoanRepaymentFor(difficulty: Difficulty | undefined, edition: Edition = EDITION_USA): Money {
  return difficultyProfile(difficulty, edition).earlyLoanRepayment
}

/**
 * Rounds to the edition's payout unit — whole thousands on the USA board, the
 * unit every price and prize there is quoted in — so a scaled payout never
 * reads as a glitch.
 */
function toPayoutUnit(amount: Money, edition: Edition): Money {
  const unit = edition.currency.payoutRounding
  return Math.max(0, Math.round(amount / unit) * unit)
}

/** What a house rolled at `rolled` actually fetches on this difficulty. */
export function scaleResale(
  rolled: Money,
  difficulty: Difficulty | undefined,
  edition: Edition = EDITION_USA,
): Money {
  return toPayoutUnit(rolled * difficultyProfile(difficulty, edition).resaleScale, edition)
}

/** What a share rolled at `rolled` actually cashes out at on this difficulty. */
export function scaleStockPayout(
  rolled: Money,
  difficulty: Difficulty | undefined,
  edition: Edition = EDITION_USA,
): Money {
  return toPayoutUnit(rolled * difficultyProfile(difficulty, edition).stockScale, edition)
}

/**
 * Rounds a scaled tile amount to something a board tile can print.
 *
 * The edition's `tileRounding` is finer than its payout unit — hundreds rather
 * than thousands on the USA board — because the smallest bills there are a
 * $300 streaming subscription and a $400 bus pass, and rounding those to
 * thousands would triple them. Never rounds a real amount all the way to zero:
 * a tile that charges nothing is a tile that lies.
 */
function toTileUnit(amount: Money, edition: Edition): Money {
  const unit = edition.currency.tileRounding
  const rounded = Math.round(amount / unit) * unit
  return rounded === 0 && amount !== 0 ? unit : rounded
}

/**
 * Rewrites the money on a single board effect for `difficulty`.
 *
 * Only the amounts the *board* chooses are touched. Salary is the player's own
 * — earned by the career they picked and grown by every raise they took — so
 * `payday` and `payRaise` are left alone: a harder board can cancel a payroll
 * (see `missedPayday` on an edition's route), but it never quietly cuts the rate
 * a player negotiated. Life tiles, children and the milestones are likewise
 * untouched, because they are the same story at every difficulty; only the
 * price of living changes.
 */
export function harshenEffect(
  effect: SpaceEffect,
  difficulty: Difficulty | undefined,
  edition: Edition = EDITION_USA,
): SpaceEffect {
  const { gainScale, lossScale } = difficultyProfile(difficulty, edition)
  if (gainScale === 1 && lossScale === 1) return effect

  const gain = (amount: Money): Money => toTileUnit(amount * gainScale, edition)
  const loss = (amount: Money): Money => toTileUnit(amount * lossScale, edition)

  switch (effect.type) {
    case 'gainMoney':
      return { ...effect, amount: gain(effect.amount) }
    case 'payMoney':
      return { ...effect, amount: loss(effect.amount) }
    case 'collectFromEach':
      return { ...effect, amount: gain(effect.amount) }
    case 'payEach':
      return { ...effect, amount: loss(effect.amount) }
    case 'spinForMoney':
      return { ...effect, perPip: gain(effect.perPip) }
    case 'stockDividend':
      return { ...effect, perShare: gain(effect.perShare) }
    case 'payPerChild':
      return { ...effect, amount: loss(effect.amount) }
    case 'collectPerChild':
      return { ...effect, amount: gain(effect.amount) }
    default:
      return effect
  }
}
