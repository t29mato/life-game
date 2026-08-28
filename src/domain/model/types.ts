import type { IconName } from './icons'

/**
 * LIFE JOURNEY — domain model contract.
 *
 * This file is the frozen contract every layer codes against. It contains types
 * only: no logic, no imports from outside the domain. Behaviour lives in
 * `src/domain/rules` and `src/domain/board`.
 */

// ---------------------------------------------------------------------------
// Identifiers & primitives
// ---------------------------------------------------------------------------

export type PlayerId = string
export type SpaceId = string
export type CareerId = string
export type HouseId = string
export type LifeTileId = string
export type StockId = string
/**
 * Names a country edition: `'usa'`, `'japan'`, … A plain string rather than a
 * closed union, so shipping an edition never edits this frozen file — and so
 * an id read back from a save the build no longer knows about still types.
 */
export type EditionId = string

/** How long a session runs. Picked on the title screen; decides the board built. */
export type BoardLength = 'short' | 'standard' | 'long'

/**
 * How unkind the board is. Picked on the title screen alongside the length.
 *
 * Difficulty is not a hidden multiplier: it seeds extra setbacks into the route
 * and rewrites the money on the tiles, so a harder game is visibly a harder
 * board. See `src/domain/rules/difficulty.ts` for the dials it turns.
 */
export type Difficulty = 'normal' | 'hard' | 'veryHard'

/** Policies a player can hold. Each one waives the matching `Hazard` payment. */
export type InsuranceKind = 'home' | 'auto' | 'life'

/**
 * Tag on a `payMoney` effect. A player holding the matching policy pays
 * nothing — this is what makes buying insurance a real decision.
 */
export type Hazard = 'fire' | 'accident'

/** Whole dollars. May go negative — that is debt, and debt is allowed. */
export type Money = number

/** The spinner always yields 1–10. */
export type SpinValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange'

/** Palette token a space renders with. Presentation maps these to real colours. */
export type SpaceTone = 'blue' | 'orange' | 'green' | 'pink' | 'purple' | 'gold' | 'slate'

// ---------------------------------------------------------------------------
// Catalogue items
// ---------------------------------------------------------------------------

export interface Career {
  readonly id: CareerId
  readonly title: string
  /**
   * Paid every time the player passes or lands on a payday space.
   *
   * For a career with `payPerPip`, this is the *expected* packet rather than a
   * guaranteed one — it is what the job is worth on an average spin, and it is
   * what the panel quotes and the computer values the job by.
   */
  readonly salary: Money
  /**
   * Set on work that does not pay the same twice. A payday then pays
   * `payPerPip × spin` instead of `salary`, so an unsteady trade is a real
   * gamble: a good month beats a salaried job, a bad one barely covers rent.
   * Keep it close to `salary / 5.5`, the average spin, so the headline figure
   * stays honest.
   */
  readonly payPerPip?: Money
  /** Added to `salary` each time the player hits a pay-raise space. */
  readonly raiseStep: Money
  /** Only drawable from the graduate pool. */
  readonly requiresDegree: boolean
  readonly icon: IconName
  readonly description: string
  /**
   * The rung above this one on the same ladder.
   *
   * A career is a rung, not a job for life. An edition writes a trade as a
   * chain — apprentice, stylist, salon owner — by pointing each rung at the
   * next; the bottom rung is whichever one nothing points at, and that is the
   * only one a career fair ever hires you onto. Absent means the top of the
   * ladder: there is nowhere further to climb, and the review pays you instead.
   *
   * Nothing but the chain records the shape of a ladder, deliberately. A rung
   * number written on each entry would be a second copy of the same fact, and
   * the second copy is the one that goes stale.
   */
  readonly promotesTo?: CareerId
  /**
   * The spin a promotion review needs before it lifts you to `promotesTo`.
   *
   * This is what makes climbing something you play for rather than something
   * the board hands you. Write the higher rungs harder: a first promotion that
   * lands seven times in ten and a corner office that lands four says, in two
   * numbers, that the top of a ladder is meant to be rare.
   */
  readonly promotionSpin?: SpinValue
  /**
   * Work somebody was made for: a calling, with no ladder above it at all.
   *
   * A calling is not a ladder that failed. It never climbs, it can never be
   * taken away — a layoff finds nothing to take — and every review that would
   * have promoted somebody else hands it a LIFE tile instead, because what
   * this work pays out in is not a title. It is the alternative to climbing,
   * and it has to be worth choosing on its own terms.
   */
  readonly isCalling?: boolean
}

export interface House {
  readonly id: HouseId
  readonly name: string
  readonly price: Money
  /** Inclusive [min, max] resale value rolled at retirement. */
  readonly resaleRange: readonly [Money, Money]
  readonly icon: IconName
  readonly description: string
}

export interface LifeTile {
  readonly id: LifeTileId
  readonly title: string
  readonly value: Money
  readonly icon: IconName
}

export interface Stock {
  readonly id: StockId
  readonly name: string
  /** Two-to-four letter board ticker, e.g. `ORBT`. */
  readonly ticker: string
  /** Cost of a single share. */
  readonly price: Money
  /**
   * Inclusive [min, max] each share is worth when cashed out at retirement.
   * A wide range spanning below `price` is a genuinely risky holding.
   */
  readonly payoutRange: readonly [Money, Money]
  readonly icon: IconName
  readonly description: string
}

export interface StockHolding {
  readonly stockId: StockId
  readonly shares: number
}

// ---------------------------------------------------------------------------
// Board
// ---------------------------------------------------------------------------

export type SpaceKind =
  /** The very first space; nobody resolves an effect on it. */
  | 'start'
  /** Ordinary space, resolved only when landed on. */
  | 'normal'
  /** Salary is collected when passing *or* landing. */
  | 'payday'
  /** Movement always halts here even with steps left over. */
  | 'stop'
  /** Terminal space; reaching it retires the player. */
  | 'retirement'

export type SpaceEffect =
  | { readonly type: 'none' }
  | { readonly type: 'gainMoney'; readonly amount: Money; readonly reason: string }
  | {
      readonly type: 'payMoney'
      readonly amount: Money
      readonly reason: string
      /** When set, a player holding the matching policy pays nothing. */
      readonly hazard?: Hazard
    }
  | { readonly type: 'payday' }
  | { readonly type: 'payRaise' }
  /**
   * The tuition bill — a spin now, not a flat charge. Every other one-time
   * charge on the board that used to be a fixed sum has already gone this
   * way (marriage, the household account); tuition was the one still priced
   * like a certainty despite being the single largest bill in the game, and
   * a fixed cost is a strange thing for the college fork's whole gamble to
   * hinge on. The bands themselves live in `EconomyConstants.tuition`, same
   * as `getMarried` and `household` read their own sums from the edition
   * rather than carrying one on the tile.
   */
  | { readonly type: 'tuition'; readonly reason: string }
  /**
   * A review: spin, and climb a rung if the wheel says so.
   *
   * Distinct from `payRaise` because they are different promises. A raise is
   * more of the same money; a promotion is a different job, and the board is
   * not allowed to hand one over without asking the wheel first. A spin under
   * the bar is never a wasted tile — it pays the ordinary raise instead — and
   * a player already at the top of their ladder, or living their calling, is
   * paid in the currency their work actually deals in.
   */
  | { readonly type: 'promotion'; readonly reason: string }
  | { readonly type: 'gainLifeTiles'; readonly count: number }
  | { readonly type: 'chooseCareer'; readonly pool: 'graduate' | 'basic' }
  | { readonly type: 'graduate' }
  | { readonly type: 'getMarried' }
  /**
   * The joint account, settled by the wheel. Married players only.
   *
   * Marriage used to be the last uniformly good thing on the board: you married,
   * everybody paid you, and nothing about it could ever go wrong. This is the
   * half of it that keeps happening after the wedding — a partner whose spending
   * outruns the household in a bad month, two incomes carrying it in a good one.
   * A single player has nobody to split the bill with and nobody to argue with
   * about it, so nothing happens to them at all.
   */
  | { readonly type: 'household'; readonly reason: string }
  /**
   * `celebrationPerPip` prices the gift envelopes and congratulations checks
   * that show up whenever a baby actually arrives — real money, on the same
   * `rate × the spin` formula every other value-spin tile uses, priced per
   * tile rather than assumed, exactly like `spinForMoney`'s `perPip`.
   */
  | { readonly type: 'haveChildren'; readonly count: number; readonly celebrationPerPip: Money }
  | { readonly type: 'buyHouse' }
  | { readonly type: 'collectFromEach'; readonly amount: Money; readonly reason: string }
  | { readonly type: 'payEach'; readonly amount: Money; readonly reason: string }
  | { readonly type: 'spinForMoney'; readonly perPip: Money; readonly reason: string }
  | { readonly type: 'retire' }
  /**
   * Financial independence, offered rather than imposed → decision.
   *
   * A player holding the edition's `fireNumber` may stop here and never work
   * again: they take the retirement place going, and they forfeit every payday,
   * every windfall and every disaster still on the road. Drawing on the fund
   * decades early is spun for, so nobody knows what leaving costs until they
   * have said they are leaving. Walking on is always an option, and so is
   * being told, politely, that the number is not there yet.
   */
  | { readonly type: 'retireEarly' }
  // --- career churn -------------------------------------------------------
  /**
   * Two other trades, offered at the rung you have already reached.
   *
   * Declinable by default, and that default matters: a career is a ladder now,
   * so force-marching somebody who has climbed apprentice → stylist → owner
   * onto a fresh ladder is not a setback, it is a deletion of the arc they were
   * playing for. Keeping your job is always an answer.
   *
   * `compulsory` is for the tiles where it genuinely is not — a road the player
   * chose at a fork *in order to* re-draw, or a reorganisation nobody is asked
   * about. A player with no job at all is never offered the decline either:
   * there is nothing to stay in, and the board's one guarantee is that a layoff
   * always has a way back.
   */
  | { readonly type: 'careerChange'; readonly reason: string; readonly compulsory?: boolean }
  /** The player loses their job entirely and earns nothing until re-hired. */
  | { readonly type: 'loseCareer'; readonly reason: string }
  // --- investing ----------------------------------------------------------
  /** Offer shares to buy → decision. Declining is always an option. */
  | { readonly type: 'buyStock' }
  /** Pay `perShare` for every share the player holds. */
  | { readonly type: 'stockDividend'; readonly perShare: Money; readonly reason: string }
  /** Offer any policies the player does not yet hold → decision. */
  | { readonly type: 'buyInsurance'; readonly kinds: readonly InsuranceKind[] }
  /** Borrow or repay at the bank → decision. */
  | { readonly type: 'bank' }
  // --- family -------------------------------------------------------------
  | { readonly type: 'payPerChild'; readonly amount: Money; readonly reason: string }
  | { readonly type: 'collectPerChild'; readonly amount: Money; readonly reason: string }
  /**
   * A marriage ends. Married players only — a single player has nobody to
   * separate from, so the tile passes them by, the same way `household`
   * does. The settlement comes from `EconomyConstants.divorceSettlement`,
   * priced per edition the same way a wedding gift is; every child leaves
   * with the departing partner, which is the mechanical half of "they took
   * the kids" — Family Lane's own scoring stops counting them from here.
   */
  | { readonly type: 'divorce'; readonly reason: string }
  // --- upsets: these are what keep last place in the game ------------------
  /** Swap cash with whoever currently holds the most. */
  | { readonly type: 'swapMoneyWithLeader'; readonly reason: string }
  /** Take one random life tile from the player with the most tile value. */
  | { readonly type: 'stealLifeTile'; readonly reason: string }
  /** Trade up to a better home → decision. Nothing happens without a house. */
  | { readonly type: 'upgradeHouse' }

export interface SpaceLayout {
  /** Board-space coordinates, in the same units as `Board.width`/`height`. */
  readonly x: number
  readonly y: number
}

export interface Space {
  readonly id: SpaceId
  readonly kind: SpaceKind
  /** Short label printed on the tile. Keep under ~18 characters. */
  readonly title: string
  /** Full sentence shown in the event card. */
  readonly description: string
  readonly effect: SpaceEffect
  /**
   * Outgoing edges. Length 0 = terminal, 1 = linear, 2+ = a fork the player
   * chooses between when their pawn reaches this space.
   */
  readonly next: readonly SpaceId[]
  readonly layout: SpaceLayout
  readonly tone: SpaceTone
  readonly icon: IconName
  /**
   * Set on the first space of a lane. A fork decision names the road the
   * player is choosing, not the tile they happen to land on first — "College
   * Lane, tuition up front, better careers later" tells them what they are
   * deciding; "Move-In Day" does not.
   */
  readonly lane?: LaneIdentity
}

export interface LaneIdentity {
  readonly name: string
  /** One line on what the road costs and what it pays back. */
  readonly summary: string
}

export interface Board {
  readonly spaces: Readonly<Record<SpaceId, Space>>
  readonly startSpaceId: SpaceId
  readonly retirementSpaceId: SpaceId
  /** Layout bounds, used by the presentation layer to size its viewBox. */
  readonly width: number
  readonly height: number
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface Player {
  readonly id: PlayerId
  readonly name: string
  readonly color: PlayerColor
  readonly spaceId: SpaceId
  readonly money: Money
  /** Each outstanding loan is LOAN_PRINCIPAL borrowed, repaid with interest. */
  readonly loans: number
  readonly career: Career | null
  readonly hasDegree: boolean
  readonly isMarried: boolean
  readonly children: number
  readonly house: House | null
  readonly lifeTiles: readonly LifeTile[]
  /** Shares bought along the way, cashed out at retirement. */
  readonly stocks: readonly StockHolding[]
  /** Policies held. Each waives its hazard and `life` pays out at retirement. */
  readonly insurance: readonly InsuranceKind[]
  /** True when the seat is played by the computer rather than a person. */
  readonly isCpu: boolean
  readonly isRetired: boolean
  /** 1 for the first player to retire, 2 for the second, and so on. */
  readonly retirementRank: number | null
  /**
   * The rung this player is entitled to be re-hired at while out of work.
   *
   * Losing a job used to cost the job. With careers written as ladders it would
   * also cost the climb — twenty years of it — and a layoff and a demotion are
   * not the same size of misfortune. So a layoff costs exactly one rung, and
   * this is where the rest of the climb waits: the career fair deals the rung
   * named here rather than the bottom of the ladder.
   *
   * Only meaningful while `career` is null; absent on a player who has never
   * lost one, and on any save written before ladders existed, both of which
   * read as "hire them at the bottom".
   */
  readonly carriedSeniority?: number
}

// ---------------------------------------------------------------------------
// Decisions
// ---------------------------------------------------------------------------

export type DecisionKind = 'branch' | 'house' | 'stock' | 'insurance' | 'bank' | 'retire' | 'valueSpin'

export interface DecisionOption {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly icon: IconName
  /** Optional right-aligned detail, e.g. a price or salary. */
  readonly detail?: string
}

export interface Decision {
  readonly kind: DecisionKind
  readonly prompt: string
  readonly options: readonly DecisionOption[]
  /**
   * Which two careers a `chooseCareer`/`careerChange` spin is landing between
   * — drawn once, when the decision is raised, from a pool that is reshuffled
   * every time a player reaches one of these tiles. A `valueSpin` resolver
   * has no other way to recover that draw: the space's own `effect` is
   * static route data, the same every time the tile is landed on, so the
   * random pair has to travel on the decision instance itself rather than
   * being re-derived (which would mean drawing from the pool a second time,
   * against a random source that has since moved on).
   */
  readonly offeredCareerIds?: readonly [string, string]
}

// ---------------------------------------------------------------------------
// Events & log
// ---------------------------------------------------------------------------

/**
 * `upset` is for the moments that reorder the standings — the lead swapped
 * away, a life tile taken. It is deliberately its own tone rather than a
 * flavour of `money-out`: the table needs to notice it from across the room.
 */
export type LogTone = 'info' | 'money-in' | 'money-out' | 'event' | 'milestone' | 'upset'

export interface GameLogEntry {
  readonly id: string
  readonly turn: number
  readonly playerId: PlayerId | null
  readonly message: string
  readonly tone: LogTone
}

/** Summary of what happened when the current player finished moving. */
export interface LandingEvent {
  readonly spaceId: SpaceId
  readonly title: string
  readonly description: string
  readonly icon: IconName
  readonly tone: SpaceTone
  /** Net change to the player's cash, already applied to state. */
  readonly moneyDelta: Money
  readonly lifeTilesGained: readonly LifeTile[]
  /** Extra lines for the card, e.g. "Salary raised to $65,000". */
  readonly notes: readonly string[]
  /** How hard the card should land. Presentation escalates its animation. */
  readonly emphasis?: LandingEmphasis
  /** One line of host commentary, e.g. "That's the lead gone, just like that!" */
  readonly narration?: string
}

/** `big` gets a cut-in; `milestone` gets a cut-in plus confetti. */
export type LandingEmphasis = 'normal' | 'big' | 'milestone'

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface PlayerResult {
  readonly playerId: PlayerId
  readonly name: string
  readonly color: PlayerColor
  readonly cash: Money
  readonly lifeTileValue: Money
  readonly houseValue: Money
  /** Shares cashed out at a value rolled inside each stock's `payoutRange`. */
  readonly stockValue: Money
  /** Life-insurance maturity, 0 unless the policy was held. */
  readonly insurancePayout: Money
  readonly childrenBonus: Money
  /**
   * How many of this player's children turned out to be stars.
   *
   * Every child is spun for at the final scoring, and one in ten of them makes
   * it — which is the whole reason `childrenBonus` is worth looking at again.
   * Broken out so the moment can be announced rather than buried in a total.
   * Absent when the scoring was done without dice.
   */
  readonly childStars?: number
  readonly retirementBonus: Money
  /** Negative: loan principal plus interest. */
  readonly loanPenalty: Money
  readonly total: Money
  readonly rank: number
}

export interface GameResults {
  readonly standings: readonly PlayerResult[]
  readonly winnerId: PlayerId
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

export type GamePhase =
  /** No game yet; the title screen is showing. */
  | 'setup'
  /** Current player must spin. */
  | 'awaitingSpin'
  /** `movementPath` is populated; the UI is animating the pawn along it. */
  | 'moving'
  /** `pendingDecision` must be answered before play continues. */
  | 'awaitingDecision'
  /** The landing effect has been applied; `lastEvent` describes it. */
  | 'resolved'
  /** Everyone has retired. `results` is populated. */
  | 'gameOver'

export interface GameState {
  readonly board: Board
  /** Which board was built. Kept so "play again" can reuse the same settings. */
  readonly boardLength: BoardLength
  /**
   * Which country's edition this game is played on.
   *
   * The board and the catalogue objects are embedded in the state, so a save
   * already carries its own content; what it cannot carry is the *money* — the
   * loan principal, the wedding gift, the symbol the numbers are printed with —
   * which is resolved from this id. A save written before editions existed has
   * no id at all and reloads as `'usa'`, exactly as a save written before
   * difficulty existed reloads as `normal`.
   */
  readonly editionId: EditionId
  /**
   * How unkind this game is. Stored rather than derived so a save reloads at
   * the difficulty it was played at — the loan rates and the final scoring both
   * read it, and a game that reloaded as `normal` would settle its debts at the
   * wrong price.
   */
  readonly difficulty: Difficulty
  readonly players: readonly Player[]
  readonly currentPlayerIndex: number
  readonly phase: GamePhase
  readonly pendingDecision: Decision | null
  readonly lastSpin: SpinValue | null
  /**
   * Spaces the pawn should travel through, *excluding* its starting space and
   * ending on its destination. Empty unless `phase === 'moving'`.
   */
  readonly movementPath: readonly SpaceId[]
  /** Steps still owed after a fork or a forced stop interrupts movement. */
  readonly stepsRemaining: number
  /**
   * The road the current player committed to before spinning, when they began
   * their turn standing on a fork. Choosing after the spin let them pick the
   * lane that happened to land them well, which is a cheap advantage no board
   * game gives you — the road is chosen first, then the wheel decides how far.
   * Null whenever no choice is outstanding.
   */
  readonly chosenExit: SpaceId | null
  readonly lastEvent: LandingEvent | null
  /**
   * A payday or two the pawn swept straight past on its way here, worded the
   * same way the log line is — set by `spin`/`choose` the instant a move
   * passes one, and folded into the next landing event's own notes by
   * `settle` so it is not only ever visible by opening the log. Null once
   * `settle` has consumed it, or when nothing was passed.
   */
  readonly passedPaydayNote: string | null
  readonly log: readonly GameLogEntry[]
  readonly turn: number
  readonly results: GameResults | null
}

export interface NewGamePlayer {
  readonly name: string
  readonly color: PlayerColor
  /** A computer seat plays itself; the UI drives it on a timer. */
  readonly isCpu: boolean
}

export interface NewGameConfig {
  readonly players: readonly NewGamePlayer[]
  readonly boardLength: BoardLength
  /** Omitted means `normal`, so a caller that predates difficulty still works. */
  readonly difficulty?: Difficulty
  /** Omitted means `'usa'`, so a caller that predates editions still works. */
  readonly editionId?: EditionId
}
