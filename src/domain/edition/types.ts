import type {
  Career,
  Difficulty,
  EditionId,
  House,
  InsuranceKind,
  LifeTile,
  Money,
  SpinValue,
  Stock,
} from '../model/types'
import type { RouteDefinition } from '../board/route'

/**
 * LIFE JOURNEY — the edition contract.
 *
 * An edition is a *place*: the money it counts in, the jobs it offers, the
 * homes it sells, the small glories it hands out. It is data, and only data.
 * The game — phases, movement, effect semantics, decisions, scoring, the
 * computer's decision procedure, difficulty machinery, saves, audio, the whole
 * UI — is the engine, and the engine is shared by every edition.
 *
 * The line between the two is the reason this file exists. Anything the engine
 * would otherwise have to hard-code in one country's dollars lives here, so
 * that a second edition is a data file rather than an archaeology project. The
 * USA edition is the current game, extracted verbatim: it is the proof that the
 * seam changed nothing.
 */

/** Re-exported so edition code has one import for the whole contract. */
export type { EditionId }

/**
 * How an edition writes money down.
 *
 * Formatting stays in the presentation and application layers; what lives here
 * is only what differs between countries, because a formatter that took a
 * whole `Edition` would drag the catalogues into every panel that prints a
 * price.
 */
export interface CurrencySpec {
  /** Prefixed to every amount: `'$'`, `'¥'`, `'€'`. */
  readonly symbol: string
  /** Locale used for digit grouping only — the game's words are always English. */
  readonly locale: string
  /**
   * Rounding unit for a difficulty-scaled bill on a board tile.
   *
   * The smallest bills on the USA board are written in hundreds — a $300
   * streaming subscription, a $400 bus pass — and rounding those to thousands
   * would triple them. An edition whose money runs 100× larger rounds 100×
   * coarser, and its tiles read just as cleanly.
   */
  readonly tileRounding: Money
  /**
   * Rounding unit for the prizes and prices the game quotes in round numbers:
   * a house's rolled resale, a share's payout. A home that sold for $241,333
   * reads as a glitch rather than as a market.
   */
  readonly payoutRounding: Money
}

/**
 * Every `Money` value the engine needs but cannot invent, in one place.
 *
 * These were module constants in `src/domain/model/constants.ts`, which is
 * exactly as far as they could travel while there was one country. They are
 * tuned against each other — salaries against tuition against loan interest
 * against the retirement bonus — so an edition that changes the unit keeps the
 * ratios and changes only the scale.
 */
export interface EconomyConstants {
  /** Cash every player starts with. */
  readonly startingMoney: Money
  /** Tuition charged for taking the college branch at the start. */
  readonly collegeTuition: Money
  /** Principal received per loan taken. */
  readonly loanPrincipal: Money
  /**
   * Repaid per outstanding loan at the final scoring, by difficulty.
   *
   * Difficulty's sharpest tool, and the reason the figures are edition data
   * rather than a multiplier: the board's extra bills push players into
   * borrowing, and the interest is what turns that borrowing into a losing
   * position. A player who keeps their nerve never pays it.
   */
  readonly loanRepayment: Readonly<Record<Difficulty, Money>>
  /** Cost of clearing one loan early at the bank. Always the cheaper way out. */
  readonly earlyLoanRepayment: Readonly<Record<Difficulty, Money>>
  /** Wedding gift each other player hands the newlywed, before the band's multiplier. */
  readonly weddingGift: Money
  /** Whether the proposal lands, and which marriage the wheel handed over. */
  readonly marriage: MarriageSpec
  /** What a `household` tile settles for a married player. */
  readonly household: HouseholdSpec
  /**
   * How a grown-up child actually pays back: one spin each, at retirement.
   *
   * Two halves, deliberately. The ordinary life is a share of what a *payday*
   * is worth to the parent, so what a family can put behind a child depends on
   * what the family has; the star is a flat sum anybody's child can win. See
   * `src/domain/rules/children.ts` for why the split is load-bearing rather
   * than decorative — in short, a child worth the same to a groomer and to an
   * agency owner flattens the one difference the board's volatility runs on.
   *
   * There is deliberately no edition-wide "a child is worth X" constant any
   * more. It would have to be a lie for every player who is not on the median
   * wage; `expectedChildValue(player, economy)` is the honest form of it.
   */
  readonly childOutcome: {
    /**
     * Ordinary return per pip, as a share of one of the parent's paydays.
     * A child rolling a 5 on a $70,000 wage hands back `5 x share x 70,000`.
     */
    readonly perPipOfPayday: number
    /** A spin of this or more, and that child made it. */
    readonly starSpin: SpinValue
    /**
     * What a star is worth instead — loud, rare, flat, and the point of the
     * change. Flat because a courier's child has to be able to be one.
     */
    readonly starPayout: Money
  }
  /** Bonus for the first player to retire; each later place gets half of the one before. */
  readonly firstRetirementBonus: Money
  /**
   * Casual pay per pip while between jobs. A player with no career used to
   * collect nothing at all on a payday, which made unemployment a dead stretch
   * of turns; now they pick up shifts, and the wheel decides how good the week
   * was. Deliberately well under any real salary — it keeps you fed, not rich.
   */
  readonly casualWagePerPip: Money
  /** Premium charged once when a policy is taken out. */
  readonly insurancePremium: Readonly<Record<InsuranceKind, Money>>
  /** Paid out at the final scoring to anyone holding a life policy. */
  readonly lifeInsurancePayout: Money
  /**
   * "The number": what a player must be holding to retire early, and what
   * stopping costs them, because the two are the same sum.
   *
   * This is the whole reason early retirement is not a free button. Stopping
   * does not merely hand you the first retirement place and let you keep your
   * cash — you put the number *into* the fund you are going to live on, and
   * what comes back out is decided by the wheel. Priced against what a career
   * that stayed employed and out of debt is holding when it reaches the tile,
   * so that roughly half the table is offered the choice at all.
   */
  readonly fireNumber: Money
  /**
   * Per pip of the spin that realises the fund a player retires on.
   *
   * Paid as `firePayoutPerPip × spin` against a stake of `fireNumber`, so a
   * five or below is a fund that came back smaller than the money that went
   * into it and a nine is a life-changing one. Priced so that the expected
   * payout, plus the retirement place jumped, is worth about what the last act
   * of the board pays a player who keeps working — which is what makes
   * stopping an argument rather than an answer.
   */
  readonly firePayoutPerPip: Money
  /**
   * Cash movement at or above this reshapes the standings, so the event card
   * gets a cut-in rather than sliding quietly past.
   *
   * Edition data because it is a *threshold on money*: left at a dollar figure,
   * an edition counting in a 100× unit would treat a bus fare as a turning
   * point and cut in on every single tile.
   */
  readonly bigMoney: Money
}

/**
 * The `EconomyConstants` fields that are a single sum of money.
 *
 * Board content names one of these when its amount belongs to the edition
 * rather than to the tile — the tuition bill is the edition's tuition, not
 * "$40,000" — so the route can stay data while the money stays the country's.
 */
export type EconomyAmountKey = {
  [K in keyof EconomyConstants]: EconomyConstants[K] extends Money ? K : never
}[keyof EconomyConstants]

/**
 * One of the marriages an edition can hand out.
 *
 * A wedding is a single moment, so what varies about it is a single sum — but
 * which sum is the whole point. Written as data because what marriage costs and
 * returns is one of the most local things a country has: the gift customs, who
 * pays for the reception, whether two incomes is the norm or the exception.
 */
export interface MarriageOutcome {
  /** Highest spin that lands in this band. Bands are written worst-first. */
  readonly upTo: SpinValue
  /** One line for the event card, in the edition's own voice. */
  readonly note: string
  /** Multiplier on the gift every other player hands over. */
  readonly giftMultiplier: number
  /** Paid once by the couple: a reception that ran away, a partner's overdraft. */
  readonly cost: Money
  /** Received once: a partner's savings, a second income arriving. */
  readonly windfall: Money
}

/**
 * Whether you marry, and what kind of marriage you got.
 *
 * Both are the wheel's business now. Marriage was the last thing on the board
 * that could only ever be good — you married and everybody paid you — which is
 * exactly the flaw the degree had before burnout, and children had while they
 * were worth $10,000. The band a spin lands in decides whether the gifts covered
 * the reception, whether the partner arrived with savings or with debts, and
 * whether the whole county turned up.
 *
 * The mean stays positive, deliberately and load-bearingly: a marriage that
 * loses money on average is one nobody sane takes, and children hang off it.
 */
export interface MarriageSpec {
  /** Spin this or better and the proposal lands first time. */
  readonly proposalSpin: SpinValue
  /** Under the bar, the wheel is asked once more; this or better is a yes. */
  readonly secondAskSpin: SpinValue
  /** What a proposal that had to be asked twice turns into. Its own band. */
  readonly rescued: MarriageOutcome
  /** Bands for a proposal that landed first time, worst spin first. */
  readonly outcomes: readonly MarriageOutcome[]
}

/**
 * The joint account, for the tiles that keep asking about it.
 *
 * The wedding is one moment; a household is the rest of the game. A `household`
 * tile spins and settles `(spin - breakEvenSpin) x perPip`, so the bad months
 * are as real as the good ones and neither is rare. The line sits below the
 * average spin on purpose — two incomes should be worth having overall — but
 * only just, because the spread is the point rather than the profit.
 */
export interface HouseholdSpec {
  /** The spin the account breaks even on. Below it, the spending outran it. */
  readonly breakEvenSpin: SpinValue
  /**
   * How much of one payday rides on each pip either side of that line.
   *
   * A share of the household's income rather than a flat sum, because that is
   * how living with somebody actually works: spending rises to meet what comes
   * in, and a couple on a restaurant owner's money do not overspend by the same
   * dollar figure as a couple on a groomer's.
   *
   * It also has to be a share for the board to keep its shape. A flat swing is
   * regressive — it lands hardest on whoever has least, which on this board is
   * the school-leaver — and it dilutes the one relationship the opening fork is
   * built on, because a sum common to both lanes drags their spreads together.
   * Proportional does the opposite: the basic ladders run from $24k to $148.5k
   * and the graduate band is a third as wide, so scaling by income widens
   * Straight to Work exactly where it is supposed to be the volatile road.
   */
  readonly shareOfPayday: number
}

/** The two pools a career fair can deal from. A degree unlocks the second. */
export interface CareerPools {
  readonly basic: readonly Career[]
  readonly graduate: readonly Career[]
}

/**
 * One country's worth of content.
 *
 * Everything the board needs from a country is here: the money it counts in,
 * the catalogues it deals from, and — since the route became data — the shape
 * of the road itself. `createBoard` reads this and nothing else; there is no
 * longer anywhere for a country to hide in the engine.
 */
export interface Edition {
  readonly id: EditionId
  /** Shown on the title screen once there is more than one to choose from. */
  readonly name: string
  readonly currency: CurrencySpec
  readonly economy: EconomyConstants
  /**
   * The board: where the road forks, what the two sides are called, and every
   * tile in between. `validateRoute` is what keeps one honest.
   */
  readonly route: RouteDefinition
  readonly careers: CareerPools
  readonly houses: readonly House[]
  readonly lifeTiles: readonly LifeTile[]
  readonly stocks: readonly Stock[]
}
