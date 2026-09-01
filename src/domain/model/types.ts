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

/**
 * How unkind the board is. Picked on the title screen.
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

/**
 * The die always yields 1–6.
 *
 * It used to be a ten-wedge wheel, and the width was the problem: a ten sent
 * one player racing half a stage ahead of the table while a one left somebody
 * standing still, and a board game everybody is playing at once wants the
 * seats to travel at roughly the same pace. Six faces halve the spread and
 * take the average roll from 5.5 to 3.5 — which every per-pip figure in the
 * editions is priced against, so the two changes are one change.
 */
export type SpinValue = 1 | 2 | 3 | 4 | 5 | 6

export type PlayerColor =
  | 'red'
  | 'blue'
  | 'green'
  | 'yellow'
  | 'purple'
  | 'orange'
  | 'teal'
  | 'pink'
  | 'navy'
  | 'brown'
  | 'charcoal'
  | 'cream'

/** Palette token a space renders with. Presentation maps these to real colours. */
export type SpaceTone = 'blue' | 'orange' | 'green' | 'pink' | 'purple' | 'gold' | 'slate'

// ---------------------------------------------------------------------------
// Catalogue items
// ---------------------------------------------------------------------------

/**
 * How far a player's schooling reaches, and which shelf of work that opens.
 *
 * Three rungs of one ladder rather than three unrelated pools, and the order
 * matters: a tile names the *best* shelf it can deal from, a player carries
 * the best shelf they are entitled to, and a fair deals from whichever of the
 * two is lower. That is what lets the school-leaver's own job fair and the
 * graduate's stand on the same board without either one having to check who
 * is standing on it.
 *
 * `doctorate` is the only tier an edition may decline to write. A country
 * whose board has no grad school never consults the shelf, so requiring one
 * would be asking four editions to invent careers nobody can be dealt.
 */
export type CareerTier = 'basic' | 'graduate' | 'doctorate'

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
   * Keep it close to `salary / 3.5`, the average roll of the die, so the
   * headline figure stays honest.
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
   * lands four times in six and a corner office that lands twice says, in two
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
  /**
   * A milestone whose effect always fires, passed or landed on — but never
   * halts movement, so a big roll is never cut short just for having found
   * one along the way. This is what almost every effect-bearing `stop` used
   * to be before that also forced a halt; see `resolveForkBranch`'s own
   * history in `branch.ts` for the sibling story about `stop` itself. The
   * only effects allowed on an `event` space are ones a spin alone settles —
   * `validateRoute` enforces that so a future tile with a real decision on
   * it (a house to pick between, a loan to weigh) cannot land here by
   * accident and lose its own stop.
   */
  | 'event'
  /**
   * Movement always halts here even with steps left over — now reserved for
   * the rare tile whose effect is a real decision a player has to weigh
   * (which house, whether to retire), not just a spin to press.
   */
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
  | {
      readonly type: 'tuition'
      readonly reason: string
      /**
       * Which of the edition's tuition bills this tile is settling.
       *
       * Absent is the first degree, which is what every board had when there
       * was only one bill to send. A grad school charges its own, out of
       * `EconomyConstants.doctorateTuition`, and it is a separate spec rather
       * than a multiplier on the first because the two bills are not the same
       * shape of gamble: an undergraduate can win a full ride, and a doctoral
       * candidate is far more likely to be funded than to be forgiven.
       */
      readonly bill?: 'doctorate'
    }
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
  /**
   * A year in the work the player already does — and the only career tile on
   * the board that leaves the career alone.
   *
   * Everything else that touches a job takes it, swaps it, or promotes
   * somebody out of it, so a restaurant owner and a climate modeller lived the
   * same life tile for tile with a different number on their payday. This one
   * is resolved against the trade the player is *holding*: the family it
   * belongs to (see `src/domain/rules/careerFamily.ts`) picks the year's
   * story, and the die picks which of that family's six years happened. Nobody
   * is hired, nobody is laid off, and the ladder is exactly where it was.
   *
   * `share` is the stake, written as a fraction of a year's salary rather than
   * a sum of money, so the swing means the same thing to a Salon Apprentice
   * and a Salon Owner. The die is symmetric about its middle, so the best year
   * pays what the worst one costs and the tile is worth nothing on average —
   * see `expectedTradeYearValue`, which is what says so in a test.
   *
   * A player with no career has no year to have, and the tile passes them by
   * entirely, the same way `household` passes a single player by.
   */
  | { readonly type: 'tradeYear'; readonly reason: string; readonly share: number }
  | { readonly type: 'gainLifeTiles'; readonly count: number }
  /**
   * A hall of booths. `pool` is the best shelf *this fair* deals from, not
   * the shelf the player gets: a graduate fair hands a school-leaver the
   * basic pool, exactly as it always did, and the rule generalises to three
   * tiers as "whichever of the two is lower".
   */
  | { readonly type: 'chooseCareer'; readonly pool: CareerTier }
  | { readonly type: 'graduate' }
  /**
   * The doctorate, and the third rung of the schooling ladder.
   *
   * Its own effect rather than a flag on `graduate`, because the two are
   * different milestones on different roads: everybody who walks College Lane
   * graduates, and only whoever the wheel sends back to school ever reaches
   * this. It opens the `doctorate` career shelf and nothing else — the pay
   * rise arrives at the fair a tile or two later, where the player can see
   * what it bought them.
   */
  | { readonly type: 'doctorate' }
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
  /**
   * What a player must already hold before this road is open to them at all.
   *
   * The board's first genuinely *conditional* road, and the reason it is a
   * property of the lane rather than a rule written into a country's route:
   * grad school is not a third lane off the opening fork, it is the next rung
   * of one that starts at College Lane, and somebody who took Straight to Work
   * has no more business being sent down it than they have graduating twice.
   *
   * The gate is enforced in exactly one place — `resolveForkBranch` in
   * `application/usecases/branch.ts`, which is the single point every fork in
   * the game is settled through — so a road that is closed to a player is
   * simply never the road the die picks for them, and the fork rail never
   * offers it either. `validateRoute` refuses a fork whose *both* roads are
   * gated, since that is a junction nobody can leave.
   *
   * Absent means the road is open to everybody, which is every other road on
   * every board.
   */
  readonly requires?: 'degree'
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
  /**
   * Went back, and finished.
   *
   * Its own flag rather than a level on `hasDegree`, so that every existing
   * reading of "did they go to college" keeps working untouched — a doctor
   * still has a degree, and the mortarboard, the graduate pool and the CPU's
   * own lane valuation all still see one. What this adds on top is the third
   * career shelf, and it can only ever be true of somebody for whom
   * `hasDegree` is already true: the only tile that sets it stands on a road
   * gated behind the degree (see `LaneIdentity.requires`).
   */
  readonly hasDoctorate: boolean
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

/**
 * One band of a die's outcome table — "1-3" and what that face deals.
 *
 * `icon` names the subject a face is dealing, when it deals a *thing* rather
 * than a sum: a career fair's rows each carry the trade's own portrait, so a
 * player weighing "1-3: Second Shooter" against "4-6: Salon Apprentice" sees
 * the two jobs and not just their names in prose. Absent on a row that only
 * moves money — a tuition band has an amount, not a face.
 */
export interface RollTableRow {
  readonly range: string
  readonly amount: string
  readonly icon?: IconName
}

export interface DecisionOption {
  readonly id: string
  readonly label: string
  readonly description: string
  readonly icon: IconName
  /** Optional right-aligned detail, e.g. a price or salary. */
  readonly detail?: string
  /**
   * The die's own outcome table, when a roll decides more than one thing —
   * "1-3: Warehouse Picker, $32,000" and "4-6: Line Cook, $28,000" as rows a
   * player can actually scan, instead of a sentence folded into `description`
   * that says the same names three times over by the time the title and the
   * narration above it have already said them once each. Rendered as a real
   * table; `description` stays the plain-language framing and must not repeat
   * what a row here already says in full. Absent for a decision with nothing
   * to break down — a flat charge, a single outcome, a real choice between
   * named options that are not rolled for.
   */
  readonly table?: readonly RollTableRow[]
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
  /**
   * What the player is actually holding once this landing is settled. Set
   * whenever `moneyDelta` is non-zero, and absent otherwise — a card that
   * moved no money has no new balance to report.
   *
   * The delta alone answers "how much moved", never "where does that leave
   * me", and the second question is the one a player at the table is really
   * asking. It matters most exactly where the delta is *not* the whole
   * story: a debit bigger than the wallet takes an automatic loan, so the
   * cash lands somewhere the player cannot reach by adding the plate to
   * what they remember having. Read straight off the post-effect state at
   * the one point every card passes through rather than composed by the
   * handler that happened to move the money — arithmetic done in a note is
   * arithmetic that can disagree with the ledger, and this cannot.
   */
  readonly balanceAfter?: Money
  readonly lifeTilesGained: readonly LifeTile[]
  /**
   * The ledger: what changed, in lines a player can scan — "Salary raised to
   * $65,000", "Now carrying 2 loans".
   *
   * Every fact on a card belongs to exactly one element, and this is the rule
   * that keeps it that way. `narration` is colour and says a thing once;
   * `moneyDelta` is on the plate; `lifeTilesGained` is dealt as chips;
   * `rolled` is printed as the die. A note that restates any of them is the
   * player reading the same sentence twice in two voices, which is what a
   * real Tuition Bill card did — the roll, the reason and the amount each
   * said in the narration and then again here.
   */
  readonly notes: readonly string[]
  /** How hard the card should land. Presentation escalates its animation. */
  readonly emphasis?: LandingEmphasis
  /**
   * One line of host commentary, e.g. "That's the lead gone, just like that!"
   *
   * Colour, not the ledger: it may land the one number that *is* the
   * punchline, but the mechanical breakdown belongs in `notes`, and neither
   * repeats the other. See `notes`.
   */
  readonly narration?: string
  /**
   * Every other player whose own balance moved because of this landing —
   * `collectFromEach`, `payEach`, a wallet swap — signed from *that*
   * player's own point of view (positive: they gained; negative: they
   * paid). This is where the amount and the direction are told — the lane
   * the presentation layer flies prints both — so the note beside it says
   * only what neither can: where the money left that player standing.
   */
  readonly transfers?: readonly MoneyTransfer[]
  /**
   * The die that decided this outcome, when a die decided it at all.
   *
   * A tile the pawn actually stops on shows its roll before this card even
   * exists — the die goes up on screen and the player watches it land, then
   * the card is built from what it landed on. A tile a move only *sweeps
   * past* has no press to hang that on, so `applyPassedEvent` rolls for it
   * and hands over the finished card; without this field the only trace of
   * the roll would be a hand-written "Rolled a 3." line in `notes`, a fact
   * about something nobody saw happen. This is what lets the presentation
   * layer throw that same die where it can be watched before the card is
   * readable — and, once it has landed, print it on the card itself, which
   * is why no handler writes the roll into `notes` or `narration` any more.
   * Absent means nothing was rolled — a flat salary, a fixed
   * charge, a graduation — exactly as an absent `face` reads as the plain
   * moulding, so nothing that never touches the die has to change.
   */
  readonly rolled?: SpinValue
  /**
   * The plain-language framing a landed tile's own press-the-die screen
   * already shows before the press ("Roll to find out what you owe."),
   * carried over for a tile the move only swept past. Without it, the die
   * thrown for a swept tile turns with nothing on screen to hope for or
   * dread — a player watching it land deserves the same framing anyone who
   * pressed for it themselves gets. Absent alongside `rolled` for exactly
   * the same reason: no die, nothing riding on it.
   */
  readonly stakes?: string
  /**
   * The die's own outcome table, carried over the same way `stakes` is — see
   * `DecisionOption.table` for what a row means. A swept tile's die deserves
   * the same table a pressed one shows, not just the framing sentence.
   */
  readonly table?: readonly RollTableRow[]
  /**
   * Where this player stood, 1-based, right before and right after this
   * landing settled — the same numbers `rankPlayers` hands the strip behind
   * the card, read at the two moments that bracket the effect. Present only
   * when they differ: a card that moved money without moving the standings
   * (most of them) has nothing to say here, the same way `balanceAfter` says
   * nothing when `moneyDelta` is zero. A rank can move even when cash does
   * not — a life tile is worth something the moment it is gained — which is
   * why this is its own pair rather than derived from `balanceAfter`.
   */
  readonly rankBefore?: number
  readonly rankAfter?: number
}

export interface MoneyTransfer {
  readonly playerId: PlayerId
  readonly playerName: string
  readonly playerColor: PlayerColor
  /** Signed from this player's own point of view: positive is a gain. */
  readonly amount: Money
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
   * Every child is rolled for at the final scoring, and one in six of them makes
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
  /**
   * The road out of a fork is settled and named; the current player must roll
   * again for how far down it they travel.
   *
   * A fork used to be settled and travelled by one single roll, which quietly
   * made the first tiles of the far road unreachable: only a 4, 5 or 6 sends
   * anybody down it, and that same number then carries them four, five or six
   * tiles past its opening. So the two questions a fork asks — which road, and
   * how far — get a press each now, and `chosenExit` holds the answer to the
   * first while the second is still in the air.
   */
  | 'awaitingDistanceSpin'
  /** `movementPath` is populated; the UI is animating the pawn along it. */
  | 'moving'
  /**
   * A payday or `event` tile the current move swept past, not the tile the
   * pawn is actually stopping on — `activePassedEvent` names it and
   * `pendingPassedItems` says how many more are still owed their own card
   * before play can reach the real landing.
   */
  | 'passingEvent'
  /** `pendingDecision` must be answered before play continues. */
  | 'awaitingDecision'
  /** The landing effect has been applied; `lastEvent` describes it. */
  | 'resolved'
  /** Everyone has retired. `results` is populated. */
  | 'gameOver'

export interface GameState {
  readonly board: Board
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
  /**
   * The rest of the hop, held back while this leg of it is animating.
   *
   * A move is walked one leg at a time — see `nextMovementLeg` in
   * `src/domain/board/movement.ts` — so `movementPath` is only ever as far as
   * the next tile that owes a card, and this is the road beyond it. `settle`
   * hands the next leg over when the card on that tile is dismissed, so the
   * pawn visibly carries on rather than the remaining tiles being conjured
   * away while a modal was up. Empty for a move with nothing to stop for,
   * which is every move that sweeps past nothing.
   */
  readonly pendingPath: readonly SpaceId[]
  /** Steps still owed after a fork or a forced stop interrupts movement. */
  readonly stepsRemaining: number
  /**
   * The road settled for the current player, waiting on the roll that says how
   * far down it they go — the road is decided first, then the die decides the
   * distance, and never both by the same number (see `awaitingDistanceSpin`).
   * Null whenever no road is outstanding, which is every turn that did not
   * begin on a fork.
   */
  readonly chosenExit: SpaceId | null
  readonly lastEvent: LandingEvent | null
  /**
   * Every payday and every `event`-kind milestone this move is still owed a
   * card for — in the order the road actually crossed them, set by
   * `spin`/`choose` the instant a move passes one and worked through one at
   * a time by `settle`, each producing its own `activePassedEvent` before
   * play can reach the tile the pawn actually stops on. A tile passed at
   * speed used to be folded silently into whatever tile the pawn finally
   * stood on — indistinguishable from a tile that was never on the road at
   * all, and the reason this is a queue of its own cards now rather than a
   * line of text borrowed by someone else's.
   */
  readonly pendingPassedItems: readonly PassedQueueItem[]
  /**
   * The card `phase === 'passingEvent'` is showing — the *next* item off
   * `pendingPassedItems`, already resolved (its spin already spun, its
   * money already moved), waiting only to be read and dismissed. Null once
   * dismissed or when nothing is mid-move.
   */
  readonly activePassedEvent: LandingEvent | null
  readonly log: readonly GameLogEntry[]
  readonly turn: number
  readonly results: GameResults | null
}

/** One payday or `event`-kind tile a move swept past, still owed its own card. */
export interface PassedQueueItem {
  readonly kind: 'payday' | 'event'
  readonly spaceId: SpaceId
}

export interface NewGamePlayer {
  readonly name: string
  readonly color: PlayerColor
  /** A computer seat plays itself; the UI drives it on a timer. */
  readonly isCpu: boolean
}

export interface NewGameConfig {
  readonly players: readonly NewGamePlayer[]
  /** Omitted means `normal`, so a caller that predates difficulty still works. */
  readonly difficulty?: Difficulty
  /** Omitted means `'usa'`, so a caller that predates editions still works. */
  readonly editionId?: EditionId
}
