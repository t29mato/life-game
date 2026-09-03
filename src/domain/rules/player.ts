import type {
  Career,
  Hazard,
  House,
  InsuranceKind,
  LifeTile,
  LifeTileId,
  Money,
  Player,
  PlayerColor,
  PlayerId,
  SpaceId,
  SpinValue,
  Stock,
} from '../model/types'
import { SPIN_FACES } from '../model/constants'
import type { EconomyConstants, EditionSchooling } from '../edition/types'
import { USA_ECONOMY } from '../edition/usa/economy'

/**
 * Where the money in these rules comes from.
 *
 * Every function below that creates or destroys cash takes the edition's
 * `economy` as a trailing argument, defaulting to the USA edition's. The
 * default is the same bargain `repayLoan`'s `amount` already struck: a caller
 * with no game around it — a panel rendering one player, a test naming a
 * premium directly — keeps the price it always paid, while the engine, which
 * always knows which edition it is running, passes the real one.
 */

/**
 * A fresh seat.
 *
 * `schooling` is the board's premise about education rather than anything this
 * player has done — see `EditionSchooling`. On every country board it is
 * absent and everybody starts where the base game always started them: no
 * degree, and College Lane is where one is got. On a researcher's board
 * university is not one of the roads, it is the ground both roads stand on, so
 * the seat starts holding a degree and the opening fork gets to be about
 * research instead of about school.
 */
export function createPlayer(
  id: PlayerId,
  name: string,
  color: PlayerColor,
  startSpaceId: SpaceId,
  isCpu: boolean,
  economy: EconomyConstants = USA_ECONOMY,
  schooling?: EditionSchooling,
): Player {
  return {
    id,
    name,
    color,
    spaceId: startSpaceId,
    money: economy.startingMoney,
    loans: 0,
    career: null,
    hasDegree: schooling?.everyoneGraduates === true,
    hasDoctorate: false,
    isMarried: false,
    children: 0,
    house: null,
    lifeTiles: [],
    stocks: [],
    insurance: [],
    isCpu,
    isRetired: false,
    retirementRank: null,
  }
}

export function creditPlayer(player: Player, amount: Money): Player {
  return { ...player, money: player.money + amount }
}

/**
 * Subtracts `amount` from the player's cash, auto-borrowing as many loans as
 * needed first so the balance never has to be checked for "can they afford
 * this" anywhere else in the domain.
 */
export function debitPlayer(
  player: Player,
  amount: Money,
  economy: EconomyConstants = USA_ECONOMY,
): Player {
  if (amount < 0) {
    throw new Error(`debitPlayer amount must be non-negative, got ${amount}`)
  }

  let money = player.money
  let loans = player.loans
  while (money < amount) {
    loans += 1
    money += economy.loanPrincipal
  }

  return { ...player, money: money - amount, loans }
}

/** Overwrites cash outright. Used by the swap-with-the-leader upset. */
export function setMoney(player: Player, amount: Money): Player {
  return { ...player, money: amount }
}

/** The mean of one throw of the die: what a pip is worth over a whole game. */
export const AVERAGE_SPIN = (SPIN_FACES + 1) / 2

/**
 * How a player's next packet is decided.
 *
 * - `salary` — a contract; the same figure every payday.
 * - `variable` — an unsteady trade, paid `payPerPip × spin`.
 * - `casual` — no job at all, picking up shifts at the edition's casual wage.
 */
export type PaydayKind = 'salary' | 'variable' | 'casual'

export function paydayKindOf(player: Player): PaydayKind {
  if (!player.career) return 'casual'
  return player.career.payPerPip === undefined ? 'salary' : 'variable'
}

/**
 * What one payday pays, given the spin that produced it. Pure: the *rolling*
 * belongs to the application layer, which hands a spin in — one per payday,
 * because three paydays passed in one move are three different weeks.
 */
export function paydayPayFor(
  player: Player,
  spin: SpinValue,
  economy: EconomyConstants = USA_ECONOMY,
): Money {
  if (!player.career) return economy.casualWagePerPip * spin
  const { payPerPip, salary } = player.career
  return payPerPip === undefined ? salary : payPerPip * spin
}

/**
 * What a payday is worth on an average spin — the figure to plan against, and
 * the one the computer prices a job by. For any career that is `salary`, which
 * is exactly what `salary` promises for unsteady work too.
 */
export function expectedPayday(player: Player, economy: EconomyConstants = USA_ECONOMY): Money {
  return player.career ? player.career.salary : economy.casualWagePerPip * AVERAGE_SPIN
}

/** Credits one payday, worked out from `spin`. Nobody ever collects nothing. */
export function payPlayerSalary(
  player: Player,
  spin: SpinValue,
  economy: EconomyConstants = USA_ECONOMY,
): Player {
  return creditPlayer(player, paydayPayFor(player, spin, economy))
}

/**
 * A raise has to lift an unsteady trade too, or a food truck owner would work
 * their way through every raise space on the board for nothing. The pip rate
 * moves by the same step spread over an average spin, which keeps `salary` an
 * honest headline for what the job now pays.
 */
export function applyPayRaise(player: Player): Player {
  if (!player.career) return player
  const { salary, raiseStep, payPerPip } = player.career
  return {
    ...player,
    career: {
      ...player.career,
      salary: salary + raiseStep,
      ...(payPerPip === undefined ? {} : { payPerPip: payPerPip + Math.round(raiseStep / AVERAGE_SPIN) }),
    },
  }
}

/**
 * Climbs one rung: the new job, at no less than the old pay.
 *
 * A promotion must never be a pay cut, and it very nearly can be — a player
 * who has walked over four raise spaces as a stylist can out-earn the salon
 * owner's opening figure. So the new salary is the higher of the rung's own
 * number and what they were already on plus the new rung's step, which keeps
 * a promotion worth taking however long they waited for it.
 *
 * The pip rate is recomputed from the salary rather than carried across,
 * because `salary` is an unsteady job's *expected* packet: derived any other
 * way the headline figure and the money would drift apart, and the panel would
 * quote a wage nobody is paid.
 */
export function promoteCareer(player: Player, next: Career): Player {
  const current = player.career
  if (!current) return player
  const salary = Math.max(next.salary, current.salary + next.raiseStep)
  return {
    ...player,
    career: {
      ...next,
      salary,
      ...(next.payPerPip === undefined ? {} : { payPerPip: Math.round(salary / AVERAGE_SPIN) }),
    },
  }
}

/** True when this player's work is a calling: no ladder, and nobody can take it. */
export function hasCalling(player: Player): boolean {
  return player.career?.isCalling === true
}

export function graduatePlayer(player: Player): Player {
  return { ...player, hasDegree: true }
}

/**
 * The doctorate.
 *
 * Sets the degree as well, and not defensively: the only road that reaches
 * this tile is gated behind having one, so the flag is already true and
 * writing it again costs nothing — but a doctorate that could somehow exist
 * without a degree would quietly close the graduate shelf to whoever held it,
 * and no invariant in the game is worth leaving to the board's good behaviour
 * when it can be stated here in four characters.
 */
export function doctoratePlayer(player: Player): Player {
  return { ...player, hasDegree: true, hasDoctorate: true }
}

export function marryPlayer(player: Player): Player {
  return { ...player, isMarried: true }
}

/** Ends a marriage. Every child leaves with the departing partner. */
export function divorcePlayer(player: Player): Player {
  return { ...player, isMarried: false, children: 0 }
}

export function addChildren(player: Player, count: number): Player {
  return { ...player, children: player.children + count }
}

export function setCareer(player: Player, career: Career): Player {
  return { ...player, career }
}

/**
 * Moves to a different trade, carrying every raise already earned.
 *
 * Without this a career change quietly confiscates a working life: a player
 * who has been given three raises walks into the new job on the catalogue's
 * opening figure, and the board has punished them for the one thing it spent
 * the whole game encouraging. What travels is the *premium* — whatever their
 * pay had been lifted above the rung's own number — so a good negotiator
 * starts the new job on what they were already worth.
 *
 * `currentBase` is the catalogue entry for the job being left, which is where
 * the premium is measured from; with none to hand the move is a plain hire.
 */
export function switchCareer(player: Player, next: Career, currentBase: Career | undefined): Player {
  const earned =
    player.career && currentBase ? Math.max(0, player.career.salary - currentBase.salary) : 0
  if (earned === 0) return setCareer(player, next)
  const salary = next.salary + earned
  return setCareer(player, {
    ...next,
    salary,
    ...(next.payPerPip === undefined ? {} : { payPerPip: Math.round(salary / AVERAGE_SPIN) }),
  })
}

/**
 * Out of work: raises stop and paydays drop to casual shifts until somebody
 * hires them again — but the climb is only dented, not erased.
 *
 * `carriedSeniority` is the rung the career fair will deal them, and the
 * caller works it out from the ladder they were on: one below where they
 * stood, floored at the bottom. Losing a job costs a rung; it does not cost
 * the twenty years, because a layoff and a demotion to apprentice are not the
 * same misfortune and the board should not charge the same for them.
 */
export function loseCareer(player: Player, carriedSeniority = 1): Player {
  return { ...player, career: null, carriedSeniority: Math.max(1, carriedSeniority) }
}

export function buyHouse(player: Player, house: House, economy: EconomyConstants = USA_ECONOMY): Player {
  return { ...debitPlayer(player, house.price, economy), house }
}

/**
 * Moves into a better home, selling the old one back at what it cost.
 *
 * Crediting the sticker price rather than a rolled resale keeps the upgrade a
 * decision about the *new* house: the player is spending the difference, not
 * gambling on the old one twice. With no house held this is an ordinary
 * purchase, which is exactly what the board wants when a player reaches the
 * upgrade space having skipped house hunting.
 */
export function tradeUpHouse(
  player: Player,
  house: House,
  economy: EconomyConstants = USA_ECONOMY,
): Player {
  const sold = player.house ? creditPlayer(player, player.house.price) : player
  return { ...debitPlayer(sold, house.price, economy), house }
}

export function addLifeTiles(player: Player, tiles: readonly LifeTile[]): Player {
  return { ...player, lifeTiles: [...player.lifeTiles, ...tiles] }
}

/**
 * Drops one copy of `tileId`. The deck can hand out the same story to two
 * players, so only the first match goes — a theft takes one tile, never a pair.
 */
export function removeLifeTile(player: Player, tileId: LifeTileId): Player {
  const index = player.lifeTiles.findIndex((tile) => tile.id === tileId)
  if (index === -1) return player
  const lifeTiles = [...player.lifeTiles]
  lifeTiles.splice(index, 1)
  return { ...player, lifeTiles }
}

/** Buys `shares` of `stock`, paying the sticker price for each one. */
export function buyShares(
  player: Player,
  stock: Stock,
  shares: number,
  economy: EconomyConstants = USA_ECONOMY,
): Player {
  if (shares < 0) {
    throw new Error(`buyShares count must be non-negative, got ${shares}`)
  }
  if (shares === 0) return player

  const paid = debitPlayer(player, stock.price * shares, economy)
  const held = paid.stocks.find((holding) => holding.stockId === stock.id)
  const stocks = held
    ? paid.stocks.map((holding) =>
        holding.stockId === stock.id ? { ...holding, shares: holding.shares + shares } : holding,
      )
    : [...paid.stocks, { stockId: stock.id, shares }]

  return { ...paid, stocks }
}

/** Every share held, across every holding — what a dividend is measured in. */
export function totalShares(player: Player): number {
  return player.stocks.reduce((sum, holding) => sum + holding.shares, 0)
}

export function hasInsurance(player: Player, kind: InsuranceKind): boolean {
  return player.insurance.includes(kind)
}

/** Takes out a policy and pays its premium. Buying the same cover twice is free. */
export function addInsurance(
  player: Player,
  kind: InsuranceKind,
  economy: EconomyConstants = USA_ECONOMY,
): Player {
  if (hasInsurance(player, kind)) return player
  const paid = debitPlayer(player, economy.insurancePremium[kind], economy)
  return { ...paid, insurance: [...paid.insurance, kind] }
}

const COVER_FOR: Record<Hazard, InsuranceKind> = {
  fire: 'home',
  accident: 'auto',
}

/** True when a policy the player holds waives this hazard's bill entirely. */
export function isCoveredAgainst(player: Player, hazard: Hazard): boolean {
  return hasInsurance(player, COVER_FOR[hazard])
}

export function takeLoan(player: Player, economy: EconomyConstants = USA_ECONOMY): Player {
  return { ...player, money: player.money + economy.loanPrincipal, loans: player.loans + 1 }
}

/**
 * Clears one loan early, at a discount on what it would cost at retirement.
 *
 * A player with nothing outstanding is left alone rather than handed a refund.
 * `amount` lets a harder game charge its own rate; it defaults to the normal
 * one, so every existing caller keeps the price it always paid.
 */
export function repayLoan(
  player: Player,
  amount: Money = USA_ECONOMY.earlyLoanRepayment.normal,
  economy: EconomyConstants = USA_ECONOMY,
): Player {
  if (player.loans === 0) return player
  const paid = debitPlayer(player, amount, economy)
  return { ...paid, loans: paid.loans - 1 }
}

export function movePlayerTo(player: Player, spaceId: SpaceId): Player {
  return { ...player, spaceId }
}

export function retirePlayer(player: Player, rank: number): Player {
  return { ...player, isRetired: true, retirementRank: rank }
}
