import type {
  Board,
  Career,
  CareerTier,
  Decision,
  DecisionOption,
  GameState,
  Hazard,
  Money,
  Player,
  Space,
  SpaceId,
} from '@domain/model/types'
import type { Edition, EconomyConstants } from '@domain/edition/types'
import { SHARES_PER_PURCHASE } from '@domain/model/constants'
import { difficultyProfile, earlyLoanRepaymentFor, loanRepaymentFor } from '@domain/rules/difficulty'
import { editionOf } from '@domain/edition/registry'
import {
  careerTierOf,
  findCareer,
  findHouse,
  findStock,
  hiringPoolFor,
  ladderPositionOf,
  lowerTier,
  nextRungOf,
} from '@domain/edition/lookup'
import { AVERAGE_SPIN, expectedPayday, isCoveredAgainst, totalShares } from '@domain/rules/player'
import { expectedChildValue } from '@domain/rules/children'
import { expectedMarriageValue } from '@domain/rules/marriage'
import { expectedTuitionCost, tuitionSpecFor } from '@domain/rules/tuition'
import type { GameCommand } from '../GameStore'
import { nextScoreRoll } from '../usecases/settlement'
import {
  BANK_LOAN_OPTION_ID,
  BANK_REPAY_OPTION_ID,
  DECLINE_HOUSE_OPTION_ID,
  DECLINE_INSURANCE_OPTION_ID,
  CAREER_STAY_OPTION_ID,
  DECLINE_STOCK_OPTION_ID,
  FIRE_RETIRE_OPTION_ID,
  insuranceKindFromOptionId,
} from '../usecases/applyEffect'

/**
 * How long the UI should pretend to think before dispatching, per phase.
 *
 * Long enough that a person can read what just happened and see the computer
 * "decide"; short enough that three CPU seats never feel like a cutscene.
 */
export const CPU_THINK_MS: Readonly<
  Record<'awaitingSpin' | 'awaitingDistanceSpin' | 'awaitingDecision' | 'resolved' | 'passingEvent', number>
> = {
  awaitingSpin: 700,
  // The second half of one fork press, not a fresh decision: long enough to
  // read the road that was just settled, short enough that the two throws
  // still read as one turn rather than two.
  awaitingDistanceSpin: 700,
  awaitingDecision: 1_100,
  resolved: 900,
  // A card for a tile the pawn only passed, not one it stopped on — same
  // "let a person actually read it" pause `resolved` already gets.
  passingEvent: 900,
}

// --- Tuning -----------------------------------------------------------------
// Every weight below is either a pure ratio, or a sum of money quoted in the
// edition's own unit — so scores from different decision kinds stay directly
// comparable and a score of 0 always means "no better than declining".

/**
 * The unit every money weight in this file is quoted in: a tenth of the cash a
 * player starts the game with. $1,000 on the USA board.
 *
 * These weights used to be raw dollar figures, which is a bug that never
 * announces itself: on an edition counting in a hundred-times unit, a computer
 * seat that keeps "$60,000" free is keeping back a rounding error, and one that
 * flinches below "$25,000" never flinches at all. Nothing throws; the computer
 * simply plays badly, and only a human watching a whole game would notice.
 *
 * A tenth of the starting stake is the denominator because every figure below
 * was already a whole multiple of it, so the rewrite reproduces the USA
 * board's numbers exactly rather than approximately — and because dividing by
 * ten keeps the arithmetic in integers, where `× 0.4` would not.
 */
const unitOf = (economy: EconomyConstants): Money => economy.startingMoney / 10

/**
 * Net cost of a loan: borrow the principal, settle the difficulty's rate.
 *
 * This is the one weight here that difficulty moves, and it has to move: on
 * Very Hard a loan costs $26,000 in interest rather than $5,000, which is more
 * than most single decisions on the board are worth. Left at the normal rate
 * the computer would happily borrow its way into a house it can never pay for.
 */
const loanCostFor = (state: GameState, edition: Edition): Money =>
  loanRepaymentFor(state.difficulty, edition) - edition.economy.loanPrincipal

/** Paydays a raise is expected to be collected over, so raises are worth something now. */
/** The bar a review uses when the rung it is leaving does not name one. */
const DEFAULT_PROMOTION_SPIN = 5

const RAISE_HORIZON = 5

/** Cash a CPU likes to keep free at the start of the board, tapering to nothing at retirement. */
const CASH_RESERVE_UNITS = 60

/** How dearly the CPU treats a unit of money dug out of that reserve. */
const RESERVE_WEIGHT = 0.4

/** A share whose floor sits below its price is a gamble; this is how much that scares the CPU. */
const RISK_AVERSION = 0.35

/** Rough chance of actually landing on any one space still ahead of you. */
const HAZARD_LANDING_CHANCE = 0.25

/** Below this, a CPU is short of cash and starts flinching at expensive lanes. */
const RISK_CASH_FLOOR_UNITS = 25

/** How much heavier a loss looks to a CPU that is short of cash. */
const BROKE_LOSS_WEIGHT = 1.8

/**
 * How much a shorter lane is trusted to actually win the race home. A lane a
 * few spaces shorter shifts the odds of retiring earlier; it does not decide
 * them, and spins matter far more than route length.
 */
const RANK_CONFIDENCE = 0.35

/**
 * What a payday is worth to a player with no job at all: casual shifts, paid
 * by the wheel. Being out of work is a real income now — meagre, but not the
 * nothing it used to be — so the computer has to price unemployment, the jobs
 * that rescue it, and the tiles that cause it against this floor rather than
 * against zero.
 */
const casualPaydayOf = (economy: EconomyConstants): Money => economy.casualWagePerPip * AVERAGE_SPIN

/**
 * Score for an option whose id names nothing the catalogues know. Low enough
 * that any real option beats it, finite so that a decision made entirely of
 * them still gets answered rather than deadlocking the game.
 */
const UNKNOWN_OPTION_SCORE = -Number.MAX_SAFE_INTEGER

/**
 * What a career fair is actually worth per payday.
 *
 * A career is an income stream, not a one-off prize. It was priced at a flat
 * 90,000 for the graduate pool and 35,000 otherwise, when the pools are worth
 * far more than that *per payday*, a dozen paydays before retirement.
 * Undervaluing it by that much is why a computer seat would not pay tuition
 * for a degree it then earned nothing extra from, and why CPU seats lost 23 of
 * 24 games to opponents who simply always took the first branch offered.
 *
 * This used to price the *expected maximum* of two draws, back when a fair
 * dealt two offers and the player kept the better one. Now the wheel decides
 * which of the two you take — a uniform coin flip between them — and by
 * symmetry the expected value of a uniform-random pick between two
 * uniformly-drawn-without-replacement pool members is just the pool's own
 * mean. So the plain average is the correct price again, not an
 * approximation of it.
 */
export const meanFairSalary = (careers: readonly { readonly salary: Money }[]): Money => {
  if (careers.length === 0) return 0
  return careers.reduce((sum, career) => sum + career.salary, 0) / careers.length
}

/**
 * What each of an edition's catalogues is worth on average, worked out once
 * and kept against the edition object itself. These are pure functions of the
 * content, so caching them costs nothing and saves recomputing a sort for
 * every one of the eighty-odd spaces a fork is valued over.
 */
interface CatalogueAverages {
  readonly basicFairSalary: Money
  readonly graduateFairSalary: Money
  readonly doctorateFairSalary: Money
  readonly averageTileValue: Money
}

const AVERAGES = new WeakMap<Edition, CatalogueAverages>()

function averagesOf(edition: Edition): CatalogueAverages {
  const cached = AVERAGES.get(edition)
  if (cached) return cached
  const tiles = edition.lifeTiles
  const built: CatalogueAverages = {
    // Bottom rungs only: a fair cannot deal anything else, so pricing it off
    // the whole pool would value a first job at what a salon owner earns.
    basicFairSalary: meanFairSalary(hiringPoolFor(edition, 'basic')),
    graduateFairSalary: meanFairSalary(hiringPoolFor(edition, 'graduate')),
    doctorateFairSalary: meanFairSalary(hiringPoolFor(edition, 'doctorate')),
    averageTileValue: tiles.reduce((sum, tile) => sum + tile.value, 0) / Math.max(1, tiles.length),
  }
  AVERAGES.set(edition, built)
  return built
}

function midpoint(range: readonly [Money, Money]): Money {
  return (range[0] + range[1]) / 2
}

/**
 * What paying `cost` right now really costs this player: the interest on any
 * loans it forces, plus a nag for eating into the cash reserve. `progress`
 * runs 0 (just off the start) to 1 (at retirement) and relaxes the reserve as
 * the game runs out of road to need cash on.
 */
function affordabilityPenalty(context: Context, cost: Money): Money {
  if (cost <= 0) return 0
  const { player, progress } = context
  const shortfall = Math.max(0, cost - player.money)
  const loanCost = Math.ceil(shortfall / context.edition.economy.loanPrincipal) * context.loanCost
  const reserve = context.cashReserve * (1 - progress)
  const reserveBreach = Math.max(0, reserve - Math.max(0, player.money - cost))
  return loanCost + reserveBreach * RESERVE_WEIGHT
}

// --- Board geometry ---------------------------------------------------------

/**
 * Steps from every space to the retirement space, by walking the board's edges
 * backwards. Cheap on boards this size and safe against a cyclic route.
 */
function distancesToRetirement(board: Board): ReadonlyMap<SpaceId, number> {
  const incoming = new Map<SpaceId, SpaceId[]>()
  for (const space of Object.values(board.spaces)) {
    for (const nextId of space.next) {
      const list = incoming.get(nextId)
      if (list) list.push(space.id)
      else incoming.set(nextId, [space.id])
    }
  }

  const distances = new Map<SpaceId, number>([[board.retirementSpaceId, 0]])
  let frontier: SpaceId[] = [board.retirementSpaceId]
  while (frontier.length > 0) {
    const nextFrontier: SpaceId[] = []
    for (const id of frontier) {
      const distance = distances.get(id) ?? 0
      for (const previous of incoming.get(id) ?? []) {
        if (distances.has(previous)) continue
        distances.set(previous, distance + 1)
        nextFrontier.push(previous)
      }
    }
    frontier = nextFrontier
  }
  return distances
}

/** 0 at the start space, 1 once retirement is reached. */
function progressOf(state: GameState, player: Player, distances: ReadonlyMap<SpaceId, number>): number {
  const total = distances.get(state.board.startSpaceId)
  const remaining = distances.get(player.spaceId)
  if (total === undefined || remaining === undefined || total === 0) return 0
  return Math.min(1, Math.max(0, 1 - remaining / total))
}

/** Every space within `limit` steps of `from`, following the board forwards. */
function reachableWithin(board: Board, from: SpaceId, limit: number): Set<SpaceId> {
  const seen = new Set<SpaceId>()
  let frontier: SpaceId[] = [from]
  for (let step = 0; step <= limit && frontier.length > 0; step += 1) {
    const nextFrontier: SpaceId[] = []
    for (const id of frontier) {
      if (seen.has(id)) continue
      seen.add(id)
      const space = board.spaces[id]
      if (space) nextFrontier.push(...space.next)
    }
    frontier = nextFrontier
  }
  return seen
}

/** Payday spaces still on the road ahead — how many times a salary gets paid. */
function paydaysAheadOf(board: Board, from: SpaceId): number {
  let count = 0
  for (const id of reachableWithin(board, from, Object.keys(board.spaces).length)) {
    if (board.spaces[id]?.kind === 'payday') count += 1
  }
  return count
}

// --- Valuing a single space -------------------------------------------------

/**
 * Roughly what landing on `space` is worth to `player`, in dollars. Used only
 * to compare one lane of a fork against another, so it trades precision for
 * covering every effect the board can throw. Exported so the pricing of a
 * single space can be asserted directly rather than inferred from a fork.
 */
export function valueOfSpace(space: Space, player: Player, state: GameState, paydaysAhead: number): Money {
  const effect = space.effect
  const rivals = state.players.filter((other) => other.id !== player.id && !other.isRetired)

  const edition = editionOf(state)
  const { economy } = edition
  const { basicFairSalary, graduateFairSalary, doctorateFairSalary, averageTileValue } =
    averagesOf(edition)
  const fairSalaryBy: Readonly<Record<CareerTier, Money>> = {
    basic: basicFairSalary,
    graduate: graduateFairSalary,
    doctorate: doctorateFairSalary,
  }
  const casualPayday = casualPaydayOf(economy)
  /*
   * The flat prices below — what a degree is worth, what a house-hunting stop
   * is worth, what walking into a bank with a debt is worth — are quoted in
   * units of a tenth of the starting stake rather than in dollars, so they
   * mean the same thing on a board whose money runs a hundred times larger.
   */
  const units = (n: number): Money => unitOf(economy) * n

  switch (effect.type) {
    case 'gainMoney':
      return effect.amount
    case 'payMoney':
      return effect.hazard && isCoveredAgainst(player, effect.hazard) ? 0 : -effect.amount
    case 'payday':
      /*
       * `expectedPayday` is the salary for any career — including an unsteady
       * one, whose `salary` *is* its expected packet — and the casual wage over
       * an average spin for a player between jobs.
       */
      return expectedPayday(player, economy)
    case 'payRaise':
      return (player.career?.raiseStep ?? 0) * RAISE_HORIZON
    case 'tuition':
      /*
       * A spin now, not a flat bill — but `expectedTuitionCost` is built to
       * average back to the same figure the flat bill used to be, so a
       * computer seat's read on the College Lane fork does not move just
       * because the bill itself got more interesting.
       */
      // Whichever of the two bills this tile sends — the doctoral one is the
      // heavier, and a lane priced at the undergraduate figure would look like
      // a bargain it is not.
      return -expectedTuitionCost(tuitionSpecFor(effect.bill, economy))
    case 'promotion': {
      /*
       * A review is worth the rung above it, discounted by the odds of getting
       * it, plus the raise that arrives either way. A calling has no rung
       * above, so it is worth a LIFE tile and the raise — which is exactly
       * what it hands over.
       */
      const career = player.career
      if (!career) return 0
      const raise = career.raiseStep * RAISE_HORIZON
      if (career.isCalling) return averageTileValue + raise
      const next = nextRungOf(career, edition)
      if (!next) return raise * 2
      const odds = (11 - (career.promotionSpin ?? 5)) / 10
      return odds * Math.max(0, next.salary - career.salary) * paydaysAhead + (1 - odds) * raise
    }
    case 'gainLifeTiles':
      return effect.count * averageTileValue
    case 'chooseCareer': {
      // Only worth something to a player with no job to lose, and worth the
      // salary times every payday still ahead of them.
      if (player.career) return 0
      // The same "lower of the two shelves" rule the fair itself deals by —
      // see `chooseCareer` in `applyEffect.ts`. A seat that priced a doctoral
      // fair at doctoral money while holding no doctorate would walk toward a
      // hall that has nothing on that table for it.
      const salary = fairSalaryBy[lowerTier(effect.pool, careerTierOf(player))]
      // What the job *adds*: an unemployed player is already earning casual
      // shifts at every one of those paydays.
      return (salary - casualPayday) * paydaysAhead
    }
    case 'graduate':
      return player.hasDegree ? 0 : units(40)
    /*
     * Worth what the degree is worth, and no more, because the two open the
     * same kind of door: a better shelf at the next fair. The fair itself is
     * scored separately and is where the actual money shows up — this is the
     * qualification, priced as the key rather than as the room.
     */
    case 'doctorate':
      return player.hasDoctorate ? 0 : units(40)
    case 'getMarried':
      /*
       * The envelopes, plus whatever the wheel's own bands are worth.
       *
       * Pricing this at the gifts alone was right while marrying was pure
       * upside. Now a low spin buys a reception nobody budgeted for and a
       * rescued proposal arrives with somebody else's debts, so a seat that
       * still priced it at the envelopes would walk into the good marriage and
       * the bad one at the same number.
       */
      return player.isMarried ? 0 : expectedMarriageValue(economy, rivals.length)
    case 'household':
      /*
       * Worth the average month to somebody married, and worth precisely
       * nothing to somebody who is not — which is the whole shape of the tile.
       */
      return player.isMarried
        ? (AVERAGE_SPIN - economy.household.breakEvenSpin) *
          expectedPayday(player, economy) *
          economy.household.shareOfPayday
        : 0
    case 'haveChildren':
      /*
       * Worth what a child is worth at the final scoring, in full.
       *
       * It used to be halved "for the bills children bring", which was double
       * counting: Family Lane's school fees and childcare are `payPerChild`
       * tiles on the same lane, and the fork valuation already sums every one
       * of them. Halving on top of that is why no computer seat had ever
       * chosen the lane — the bills were charged twice and the child paid
       * $10,000 once.
       *
       * On top of that, same as `spinForMoney`, the gift envelopes are a real
       * spin at a quoted rate — worth its per-pip price times the average
       * spin, regardless of whether the computer or a human presses it.
       */
      return effect.count * expectedChildValue(player, economy) + effect.celebrationPerPip * AVERAGE_SPIN
    case 'buyHouse':
    case 'upgradeHouse':
      return units(5)
    case 'collectFromEach':
      return effect.amount * rivals.length
    case 'payEach':
      return -effect.amount * rivals.length
    case 'spinForMoney':
      return effect.perPip * AVERAGE_SPIN
    case 'retire':
      return retirementBonusAhead(state, economy)
    case 'retireEarly':
      // An offer you may always decline is worth nothing to walk past. What
      // taking it is worth is `scoreRetire`, once it is actually on the table.
      return 0
    case 'careerChange':
      /*
       * An offer you can turn down is worth something small and positive: a
       * spin between two trades, with staying costing nothing if neither
       * beats what you have. A `compulsory` one is the old coin flip against
       * the job already held — no stay option, so no floor under a bad spin.
       * With no job at all, either kind is the way back.
       */
      if (!player.career) return units(30)
      return effect.compulsory ? -units(5) : units(3)
    case 'tradeYear':
      /*
       * Worth nothing, and worth saying so out loud rather than falling
       * through to a default.
       *
       * The die is symmetric about its middle, so a good year pays exactly
       * what a bad one costs (`expectedTradeYearValue`), and a seat that
       * priced this tile at anything but zero would be walking toward or away
       * from a coin it cannot influence. It is worth nothing to somebody with
       * no career either, for the plainer reason that the tile passes them by.
       */
      return 0
    case 'loseCareer':
      // Being laid off costs the drop from the wage to casual shifts, not the
      // whole wage: the pay window still pays something on the way out.
      return Math.min(0, (casualPayday - expectedPayday(player, economy)) * 3)
    case 'buyStock':
      return units(4)
    case 'stockDividend':
      return effect.perShare * totalShares(player)
    case 'buyInsurance':
      return units(4)
    case 'bank':
      return player.loans > 0 ? units(2) : 0
    case 'payPerChild':
      return -effect.amount * player.children
    case 'collectPerChild':
      return effect.amount * player.children
    case 'divorce':
      // Worth nothing to a single player, who the tile passes by. To a
      // married one it costs the settlement and every child's whole future
      // value, since Family Lane's own scoring stops counting them from here.
      return player.isMarried
        ? -(economy.divorceSettlement + player.children * expectedChildValue(player, economy))
        : 0
    case 'swapMoneyWithLeader': {
      const richest = rivals.reduce<Money>((best, other) => Math.max(best, other.money), 0)
      return Math.max(0, richest - player.money)
    }
    case 'stealLifeTile':
      return rivals.some((other) => other.lifeTiles.length > 0) ? averageTileValue : 0
    case 'none':
      return 0
    default: {
      const exhaustive: never = effect
      throw new Error(`decideCpuCommand: unhandled effect ${JSON.stringify(exhaustive)}`)
    }
  }
}

/** The retirement bonus still up for grabs, halving with each player already home. */
function retirementBonusAhead(state: GameState, economy: EconomyConstants): Money {
  const retired = state.players.filter((player) => player.isRetired).length
  return economy.firstRetirementBonus / 2 ** retired
}

// --- Scoring each decision kind ---------------------------------------------

interface Context {
  readonly state: GameState
  readonly player: Player
  readonly progress: number
  readonly distances: ReadonlyMap<SpaceId, number>
  /** The board's country: where every sum of money below comes from. */
  readonly edition: Edition
  /** Interest on one loan at this game's difficulty. */
  readonly loanCost: Money
  /** Cash the CPU likes free at the start, in this edition's money. */
  readonly cashReserve: Money
  /** Below this the CPU counts itself short of cash, in this edition's money. */
  readonly riskCashFloor: Money
  /** What this game's market actually pays for a house and for a share. */
  readonly resaleScale: number
  readonly stockScale: number
}

/**
 * What holding this rung is worth: the wage, the raises it will collect, and
 * every rung still above it, each discounted by the odds of ever getting there.
 *
 * The last term is what makes a ladder legible to a computer seat. Two jobs on
 * the same money are not the same job if one of them has a salon above it and
 * the other is the top of a two-rung trade, and without this the CPU would take
 * the flatter one half the time.
 *
 * It has to read the *whole* chain, not merely the next step up. The tall basic
 * ladders are worth taking precisely because of what sits two rungs away — a
 * session musician and a second shooter open on the same wage, with the same
 * raise, and one of them has a record producer at the top — and a seat that
 * looked one rung ahead priced that difference at $770 when it is really worth
 * $12,000. Each rung is discounted by the product of every promotion spin
 * between here and there, so the corner office counts for what it honestly is:
 * a fifth of a chance, not a certainty.
 *
 * The rungs come from the ladder index rather than by chasing `promotesTo`,
 * which is what keeps a miswritten catalogue that loops from hanging a turn.
 *
 * `salary` is the expected packet whether or not the job is steady, so an
 * unsteady trade and a contract of the same worth are compared on equal terms —
 * pricing an unsteady job off `payPerPip` would undervalue it more than five
 * to one.
 */
function careerWorth(career: Career, edition: Edition): number {
  const position = ladderPositionOf(career.id, edition)
  const above = position ? position.rungs.slice(position.rung) : []

  let reach = 1
  let climb = 0
  above.forEach((rung, index) => {
    // The spin written on the rung being *left* is what gates this step up.
    const below = index === 0 ? career : (above[index - 1] as Career)
    reach *= (11 - (below.promotionSpin ?? 5)) / 10
    climb += reach * Math.max(0, rung.salary - career.salary)
  })

  return career.salary + career.raiseStep * RAISE_HORIZON + climb
}

/**
 * Stay vs Spin, for a career decision the wheel now decides rather than the
 * player picking whichever offer pays more. Staying scores exactly as it
 * always has — the ladder already held. Spin scores the *mean* of what each
 * offered career is worth, since the wheel deals a coin flip between the two
 * named in `decision.offeredCareerIds`, never a pick of the better one.
 */
function scoreCareerSpin(option: DecisionOption, decision: Decision, context: Context): number {
  const { player, edition } = context

  // Staying is worth exactly the ladder already held, and nothing else.
  if (option.id === CAREER_STAY_OPTION_ID) {
    return player.career ? careerWorth(player.career, edition) : UNKNOWN_OPTION_SCORE
  }

  const offeredIds = decision.offeredCareerIds ?? []
  /*
   * Compared as it would actually be *taken*, raises and all.
   *
   * `switchCareer` carries a mover's earned premium into the new job, so an
   * offer scored at its catalogue figure looks worse than the job being left
   * by exactly the raises collected so far — and a computer seat that has been
   * given two raises would then decline every offer on the board for the rest
   * of the game. Measured: it stayed in 99 seats out of 99 and moved in none.
   */
  const base = player.career ? findCareer(player.career.id, edition) : undefined
  const premium = player.career && base ? Math.max(0, player.career.salary - base.salary) : 0
  const worths = offeredIds
    .map((id) => findCareer(id, edition))
    .filter((career): career is Career => career !== undefined)
    .map((career) => careerWorth({ ...career, salary: career.salary + premium }, edition))
  if (worths.length === 0) return UNKNOWN_OPTION_SCORE
  return worths.reduce((sum, worth) => sum + worth, 0) / worths.length
}

function scoreHouse(option: DecisionOption, context: Context): number {
  if (option.id === DECLINE_HOUSE_OPTION_ID) return 0
  const house = findHouse(option.id, context.edition)
  if (!house) return UNKNOWN_OPTION_SCORE

  const current = context.player.house
  // A trade-up only costs the difference, and only gains the difference.
  const cost = house.price - (current?.price ?? 0)
  /*
   * What the market will actually pay, not what the catalogue advertises. On
   * Very Hard a home fetches around two thirds of its rolled resale, which
   * turns "buy the dearest thing you can carry" — correct on normal — into a
   * quick way to lose. The CPU has to be able to see that, or it mortgages
   * itself for an asset it already knows is worth less than the asking price.
   */
  const resale = (range: readonly [Money, Money]): Money => midpoint(range) * context.resaleScale
  const gain = resale(house.resaleRange) - (current ? resale(current.resaleRange) : 0)
  return gain - cost - affordabilityPenalty(context, cost)
}

function scoreStock(option: DecisionOption, context: Context): number {
  if (option.id === DECLINE_STOCK_OPTION_ID) return 0
  const stock = findStock(option.id, context.edition)
  if (!stock) return UNKNOWN_OPTION_SCORE

  const cost = stock.price * SHARES_PER_PURCHASE
  const expected = midpoint(stock.payoutRange) * context.stockScale * SHARES_PER_PURCHASE
  const floor = stock.payoutRange[0] * context.stockScale
  const downside = Math.max(0, stock.price - floor) * SHARES_PER_PURCHASE
  return expected - cost - downside * RISK_AVERSION - affordabilityPenalty(context, cost)
}

/** Total of every hazard bill of this kind still reachable from where the CPU stands. */
function hazardExposureAhead(context: Context, hazard: Hazard): Money {
  const { state, player } = context
  let exposure = 0
  for (const id of reachableWithin(state.board, player.spaceId, Number.MAX_SAFE_INTEGER)) {
    const effect = state.board.spaces[id]?.effect
    if (effect?.type === 'payMoney' && effect.hazard === hazard) exposure += effect.amount
  }
  return exposure
}

function scoreInsurance(option: DecisionOption, context: Context): number {
  if (option.id === DECLINE_INSURANCE_OPTION_ID) return 0
  const kind = insuranceKindFromOptionId(option.id)
  if (!kind) return UNKNOWN_OPTION_SCORE

  const premium = context.edition.economy.insurancePremium[kind]
  // Life insurance is a straight bet on reaching the end, which everyone does.
  const benefit =
    kind === 'life'
      ? context.edition.economy.lifeInsurancePayout
      : hazardExposureAhead(context, kind === 'home' ? 'fire' : 'accident') * HAZARD_LANDING_CHANCE

  return benefit - premium - affordabilityPenalty(context, premium)
}

function scoreBank(option: DecisionOption, context: Context): number {
  const difficulty = context.state.difficulty
  const early = earlyLoanRepaymentFor(difficulty, context.edition)
  switch (option.id) {
    case BANK_REPAY_OPTION_ID:
      // Clearing a loan now saves the interest; only worth it with cash to spare.
      return loanRepaymentFor(difficulty, context.edition) - early - affordabilityPenalty(context, early)
    case BANK_LOAN_OPTION_ID:
      // Borrowing on purpose only ever costs interest: bills auto-borrow anyway.
      return -context.loanCost
    default:
      return 0
  }
}

/**
 * Whether to stop working for good.
 *
 * The whole argument, in one subtraction: the fund on an average spin, plus
 * the retirement place you jump, minus everything still on the road. The last
 * term is what makes this a real decision rather than a preference — a player
 * on a good salary is giving up a great deal by stopping, and a player on a
 * poor one is giving up very little, so the same tile says different things to
 * different seats at the same table.
 */
function scoreRetire(option: DecisionOption, context: Context): number {
  if (option.id !== FIRE_RETIRE_OPTION_ID) return 0
  const { state, player, edition } = context
  const { economy } = edition
  const board = state.board

  // The stake is real money out of the wallet; the payout is a wheel.
  const net = economy.firePayoutPerPip * AVERAGE_SPIN - economy.fireNumber
  // Finishing one place better is worth the gap between adjacent places, and a
  // player who stops here is skipping exactly one place's worth of race.
  const placeGained = retirementBonusAhead(state, economy) / 2

  const paydaysAhead = paydaysAheadOf(board, player.spaceId)
  let ahead = 0
  for (const id of reachableWithin(board, player.spaceId, Object.keys(board.spaces).length)) {
    if (id === player.spaceId) continue
    const space = board.spaces[id]
    if (!space) continue
    const value = valueOfSpace(space, player, state, paydaysAhead)
    // Paydays pay for being passed, so they are collected in full; everything
    // else has to be landed on, which happens perhaps once in four.
    ahead += space.kind === 'payday' ? value : value * HAZARD_LANDING_CHANCE
  }

  return net + placeGained - ahead
}

function scoreBranch(option: DecisionOption, context: Context, decision: Decision): number {
  const { state, player, edition } = context
  const board = state.board
  if (!board.spaces[option.id]) return UNKNOWN_OPTION_SCORE

  /*
   * What is unique to this lane: everything the other lanes do not also reach.
   *
   * The horizon has to cover the whole board, not a fixed number of steps.
   * With a 16-step budget the *shorter* lane saw further down the trunk both
   * lanes share, so a dozen Main Street tiles — paydays, the wedding — counted
   * as exclusive to it and dwarfed anything either lane actually offered.
   * Work Lane scored 66,012 against College Lane's 21,800 almost entirely on
   * road that belongs to both. Looking all the way to retirement makes the
   * shared route cancel on both sides, which is the only way the subtraction
   * below means what it says. Lane length is then priced once, and only once,
   * by the distance term further down.
   */
  const horizon = Object.keys(board.spaces).length
  const paydaysAhead = paydaysAheadOf(board, option.id)
  const mine = reachableWithin(board, option.id, horizon)
  const shared = new Set<SpaceId>()
  for (const other of decision.options) {
    if (other.id === option.id || !board.spaces[other.id]) continue
    for (const id of reachableWithin(board, other.id, horizon)) shared.add(id)
  }

  /*
   * A blunt 1.8x on every loss in the lane double-counted being short of cash:
   * College Lane's $40,000 tuition became a $72,000 objection on a player
   * holding $10,000, when what the shortfall actually costs is the interest on
   * the two loans it forces — about $10,000, which `affordabilityPenalty`
   * already models properly and is what every other decision here uses. The
   * multiplier is kept, but only for what genuinely cannot be paid for.
   */
  const lossWeight = player.money < context.riskCashFloor ? BROKE_LOSS_WEIGHT : 1

  /*
   * A lane has to be valued against the player it will have *made* of you by
   * the end of it, not the one standing at the fork. Every space was being
   * scored against today's state, so College Lane priced its own graduate job
   * fair as if the walker still had no degree — the fair is worth 90k to a
   * graduate and 35k to everyone else, and the degree is the very thing the
   * lane hands out three tiles earlier. The lane could therefore never argue
   * for itself, and the computer took the same route in all 80 games I
   * measured, leaving the degree, the graduate careers and Family Lane's
   * children as content no computer seat ever reached.
   */
  let walked: Player = {
    ...player,
    hasDegree: player.hasDegree || [...mine].some((id) => board.spaces[id]?.effect.type === 'graduate'),
    // The same argument one rung up: Grad School Lane hands out the doctorate
    // and then, two tiles later, the fair that is only worth anything to
    // somebody holding one. Scored against today's player, the lane would
    // price its own payoff at graduate money and never argue for itself.
    hasDoctorate:
      player.hasDoctorate || [...mine].some((id) => board.spaces[id]?.effect.type === 'doctorate'),
  }

  /*
   * The lane's own tiles, in the order they are walked, and how many of its
   * paydays are still to come after each one.
   *
   * The second number is what stops a review being counted twice. A promotion
   * is priced at the rise it earns over every payday still ahead; the paydays
   * *on this lane* are then priced again, at the salary the walk has already
   * climbed to. Both are right on their own and together they are the same
   * money twice — on Fast Track that inflated the first review by $33,000 and
   * helped keep Family Lane unpickable. So a review is paid for the paydays
   * beyond this lane, and the lane's own paydays speak for themselves.
   */
  const laneSpaces = [...mine].filter((id) => !shared.has(id) && board.spaces[id])
  let paydaysLeftOnLane = laneSpaces.filter((id) => board.spaces[id]?.kind === 'payday').length

  let laneValue = 0
  let outlay = 0
  for (const id of laneSpaces) {
    const space = board.spaces[id]
    if (!space) continue
    if (space.kind === 'payday') paydaysLeftOnLane -= 1
    const horizonFor =
      space.effect.type === 'promotion' ? Math.max(0, paydaysAhead - paydaysLeftOnLane) : paydaysAhead
    const value = valueOfSpace(space, walked, state, horizonFor)
    if (value < 0) outlay += -value
    laneValue += value

    /*
     * Carry the life forward as the lane is walked, or the lane gets counted
     * as if every tile on it happened to the player standing at the fork.
     *
     * Both of these were deciding forks on their own. Three review tiles were
     * each scored against today's rung, so Fast Track claimed the same climb
     * from stylist to salon owner three times over and came to $511,900
     * against Family Lane's $216,522 — the computer took Fast Track in all 600
     * marriage forks I measured and no seat ever had a child. And a lane's
     * `payPerChild` bills multiply by a child count that was still zero at the
     * fork, so Family Lane's school fees were free and its child benefit paid
     * nothing. Walking the state makes both lanes argue honestly.
     */
    if (space.effect.type === 'promotion' && walked.career) {
      const current = walked.career
      const next = nextRungOf(current, edition)
      if (next) {
        /*
         * Carried at the wage the review is *expected* to leave behind, not at
         * the one it would leave if it always landed. A corner office lands
         * three times in ten; walking the lane as though the climb were certain
         * priced every payday after it at the salon owner's money for a stylist
         * who will usually still be a stylist, and that single assumption was
         * worth about $70,000 of imaginary income on Fast Track.
         */
        const odds = (11 - (current.promotionSpin ?? DEFAULT_PROMOTION_SPIN)) / 10
        const promoted = Math.max(next.salary, current.salary + next.raiseStep)
        const passedOver = current.salary + current.raiseStep
        const salary = Math.round(odds * promoted + (1 - odds) * passedOver)
        walked = { ...walked, career: { ...next, salary } }
      }
    }
    if (space.effect.type === 'haveChildren') {
      walked = { ...walked, children: walked.children + space.effect.count }
    }
  }
  // What the lane's bills really cost on top of their face value: the interest
  // on any borrowing they force, plus the nag for spending down the reserve.
  laneValue -= affordabilityPenalty(context, outlay)
  if (player.money < context.riskCashFloor) laneValue -= outlay * (lossWeight - 1) * 0.25

  /*
   * Getting home sooner is worth something, but far less than it looks.
   * Spreading the whole first-place bonus across the remaining spaces priced
   * every space saved as if it bought that slice of first place outright, and
   * the term grew to ~33,000 — several times any lane's actual contents. It
   * decided every fork on length alone, which is how the computer came to walk
   * the identical route in all 80 games I measured.
   *
   * Two corrections: finishing one place better is worth the *gap* between
   * adjacent ranks, not the whole bonus; and a shorter lane only shifts the
   * odds of finishing ahead, it does not settle them, so the gap is damped.
   */
  const longest = decision.options.reduce(
    (worst, other) => Math.max(worst, context.distances.get(other.id) ?? 0),
    0,
  )
  const distance = context.distances.get(option.id) ?? longest
  const rankGap = retirementBonusAhead(state, context.edition.economy) / 2
  const route = Math.max(1, context.distances.get(board.startSpaceId) ?? 1)
  const perSpace = (rankGap * RANK_CONFIDENCE) / route
  return laneValue + (longest - distance) * perSpace
}

function scoreOption(option: DecisionOption, decision: Decision, context: Context): number {
  switch (decision.kind) {
    case 'branch':
      return scoreBranch(option, context, decision)
    case 'house':
      return scoreHouse(option, context)
    case 'stock':
      return scoreStock(option, context)
    case 'insurance':
      return scoreInsurance(option, context)
    case 'bank':
      return scoreBank(option, context)
    case 'retire':
      return scoreRetire(option, context)
    case 'valueSpin':
      /*
       * Every value-spin decision but one offers exactly one button — Spin —
       * and there is nothing to weigh, so the computer presses it. The
       * exception is a career spin, which also offers Stay: two live
       * options, scored against each other below.
       */
      return decision.offeredCareerIds ? scoreCareerSpin(option, decision, context) : 0
    default: {
      const exhaustive: never = decision.kind
      throw new Error(`decideCpuCommand: unhandled decision kind ${JSON.stringify(exhaustive)}`)
    }
  }
}

/**
 * The best of the offered options. Always one of `decision.options` — a CPU
 * that answered with anything else would freeze the game — and ties fall to the
 * option offered first, which keeps the whole function deterministic.
 */
function pickOption(decision: Decision, context: Context): DecisionOption | null {
  let best: DecisionOption | null = null
  let bestScore = -Infinity
  for (const option of decision.options) {
    const score = scoreOption(option, decision, context)
    if (score > bestScore) {
      best = option
      bestScore = score
    }
  }
  return best
}

/**
 * The command a computer seat issues for the current phase, or null when the
 * current player is human or nothing is owed. Pure; deterministic.
 */
export function decideCpuCommand(state: GameState): GameCommand | null {
  /*
   * The closing settlement is answered before the active-player test below,
   * because in `scoring` there is no active player to test: everybody is
   * retired and `currentPlayerIndex` still points at whoever happened to go
   * last. Each settlement die belongs to the seat it is scoring, so that is
   * the seat asked whether a computer owns this throw.
   *
   * Like the `spin` commands below, this says only *what* a computer seat
   * would do, never how it reaches the store: the shell throws a computer's
   * settlement die through `EventSpinModal`'s own unattended roll, so the
   * number is watched landing rather than simply appearing — which is why
   * `scoring` is absent from both `CPU_PHASES_*` lists in `App.tsx`.
   */
  if (state.phase === 'scoring') {
    const owed = nextScoreRoll(state.scoreRolls)
    if (!owed) return null
    const owner = state.players.find((entry) => entry.id === owed.playerId)
    return owner?.isCpu ? { type: 'scoreRoll' } : null
  }

  const player = state.players[state.currentPlayerIndex]
  // A seat that has just retired is still the current player for one more
  // `endTurn`, so retirement must not silence the computer.
  if (!player || !player.isCpu) return null

  switch (state.phase) {
    case 'awaitingSpin':
    // A fork's second press: the road is settled, the distance is not. A
    // computer seat throws for it exactly the way it threw for the road.
    case 'awaitingDistanceSpin':
      return { type: 'spin' }
    case 'resolved':
      return { type: 'endTurn' }
    case 'passingEvent':
      // A card for a tile the pawn only passed — dismissing it is calling
      // `settle` again, the same command that produced the card.
      return { type: 'settle' }
    case 'awaitingDecision': {
      const decision = state.pendingDecision
      if (!decision || decision.options.length === 0) return null
      const distances = distancesToRetirement(state.board)
      const edition = editionOf(state)
      const profile = difficultyProfile(state.difficulty, edition)
      const unit = unitOf(edition.economy)
      const context: Context = {
        state,
        player,
        distances,
        edition,
        progress: progressOf(state, player, distances),
        loanCost: loanCostFor(state, edition),
        cashReserve: unit * CASH_RESERVE_UNITS,
        riskCashFloor: unit * RISK_CASH_FLOOR_UNITS,
        resaleScale: profile.resaleScale,
        stockScale: profile.stockScale,
      }
      const option = pickOption(decision, context)
      return option ? { type: 'choose', optionId: option.id } : null
    }
    default:
      // `moving` belongs to the animation, `setup` and `gameOver` to the screens.
      return null
  }
}

