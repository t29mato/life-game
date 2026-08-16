import type {
  Career,
  Decision,
  DecisionOption,
  GameState,
  Hazard,
  House,
  InsuranceKind,
  LandingEmphasis,
  LandingEvent,
  Money,
  Player,
  Space,
  Stock,
} from '@domain/model/types'
import type { IconName } from '@domain/model/icons'
import type { CurrencySpec, EconomyConstants, Edition } from '@domain/edition/types'
import { USA_ECONOMY } from '@domain/edition/usa'
import { editionOf } from '@domain/edition/registry'
import {
  hiringPoolFor,
  ladderPositionOf,
  nextRungOf,
  rungFor,
  seniorityOf,
} from '@domain/edition/lookup'
import { earlyLoanRepaymentFor, loanRepaymentFor } from '@domain/rules/difficulty'
import {
  addChildren,
  addLifeTiles,
  applyPayRaise,
  creditPlayer,
  debitPlayer,
  graduatePlayer,
  hasCalling,
  hasInsurance,
  isCoveredAgainst,
  loseCareer as loseCareerFor,
  paydayKindOf,
  removeLifeTile,
  retirePlayer,
  setMoney,
  totalShares,
} from '@domain/rules/player'
import { formatMoney, loanNote } from './format'
import { appendLog } from './logging'
import { collectPaydays } from './payday'
import type { UseCaseDeps } from './types'

export interface EffectResult {
  /**
   * `players`, `log` and `pendingDecision` reflect the effect. Every other
   * field (phase, lastEvent, movement bookkeeping) is left for the caller —
   * `settle`/`choose` decide those based on whether a decision was raised.
   */
  readonly state: GameState
  readonly event: LandingEvent
}

// --- Decision option ids ----------------------------------------------------
// Option ids travel from here, through the UI, and back into `choose`. They are
// namespaced so an id can never be mistaken for a career, house or stock id.

const DECLINE_HOUSE_OPTION_ID = 'decline-house'
const DECLINE_STOCK_OPTION_ID = 'decline-stock'
const DECLINE_INSURANCE_OPTION_ID = 'decline-insurance'
const BANK_LOAN_OPTION_ID = 'bank-take-loan'
const BANK_REPAY_OPTION_ID = 'bank-repay-loan'
const BANK_DECLINE_OPTION_ID = 'bank-walk-on'
const FIRE_RETIRE_OPTION_ID = 'retire-early-now'
const FIRE_DECLINE_OPTION_ID = 'retire-early-keep-working'
const CAREER_STAY_OPTION_ID = 'career-stay-put'
const VALUE_SPIN_OPTION_ID = 'value-spin'

/** Prefix that turns an `InsuranceKind` into its decision option id, and back. */
const INSURANCE_OPTION_PREFIX = 'insurance-'

export function insuranceOptionId(kind: InsuranceKind): string {
  return `${INSURANCE_OPTION_PREFIX}${kind}`
}

export function insuranceKindFromOptionId(optionId: string): InsuranceKind | null {
  if (!optionId.startsWith(INSURANCE_OPTION_PREFIX)) return null
  const kind = optionId.slice(INSURANCE_OPTION_PREFIX.length)
  return kind === 'home' || kind === 'auto' || kind === 'life' ? kind : null
}

/**
 * Cash movement at or above this reshapes the standings, so the card gets a
 * cut-in rather than sliding quietly past. The USA edition's figure; the
 * threshold itself is edition data, because it is a judgement about *money*
 * and an edition counting in a hundred-times unit would cut in on a bus fare.
 */
export const BIG_MONEY: Money = USA_ECONOMY.bigMoney

/** `milestone` is reserved for the life events; everything else is sized by money. */
export function emphasisForMoney(delta: Money, economy: EconomyConstants = USA_ECONOMY): LandingEmphasis {
  return Math.abs(delta) >= economy.bigMoney ? 'big' : 'normal'
}

/**
 * The wheel at the altar, and why the numbers are these numbers.
 *
 * Whether you marry is spun for now, which is what the player asked for — but
 * a single number deciding a whole strategy is how you make a game somebody
 * loses on turn eleven and spends the next hour watching. So there are two
 * asks. The first needs a 3, the second needs a 2, and the two of them
 * together leave marriage failing about **two games in a hundred**: rare
 * enough that nobody's evening is decided by it, common enough that the table
 * genuinely holds its breath on the second spin.
 *
 * A refusal is not a dead end even when it lands, and that is deliberate.
 * Nothing else on the board is gated on `isMarried` — children, Family Lane,
 * the per-child bonus and the whole family scoring lane are open to a single
 * player exactly as they are to a married one — so what a refusal actually
 * costs is one round of gift envelopes. It buys a LIFE tile back, because a
 * year you spend entirely on yourself is worth something too.
 *
 * The same wheel now decides *which* marriage, because a wedding everybody pays
 * you for and nothing else was the last uniformly good thing on this board. The
 * bands live in the edition (`MarriageSpec`), so what a wedding costs and what a
 * partner brings to it is a country's business rather than the engine's.
 */

/**
 * The spin a review needs when the rung it is leaving does not say.
 *
 * Every rung the USA edition ships names its own bar; this is the fallback for
 * an edition that writes a ladder and forgets to price it, and a coin flip is
 * the honest default for "somebody did not decide".
 */
const DEFAULT_PROMOTION_SPIN = 5

/** A perfect spin at a review carries you two rungs, when there are two to carry. */
const DOUBLE_PROMOTION_SPIN = 10

const INSURANCE_LABELS: Record<InsuranceKind, string> = {
  home: 'Home Policy',
  auto: 'Auto Policy',
  life: 'Life Policy',
}

function insuranceDescriptions(
  economy: EconomyConstants,
  currency: CurrencySpec,
): Record<InsuranceKind, string> {
  return {
    home: 'While it is in force, a house fire costs you nothing at all.',
    auto: 'While it is in force, a road accident costs you nothing at all.',
    life: `Matures at retirement and pays ${formatMoney(economy.lifeInsurancePayout, currency)} into your final total.`,
  }
}

const INSURANCE_ICONS: Record<InsuranceKind, IconName> = {
  home: 'finance:policy-home',
  auto: 'finance:policy-auto',
  life: 'finance:policy-life',
}

const HAZARD_POLICY: Record<Hazard, InsuranceKind> = {
  fire: 'home',
  accident: 'auto',
}

function replacePlayer(players: readonly Player[], updated: Player): readonly Player[] {
  return players.map((player) => (player.id === updated.id ? updated : player))
}

function baseEvent(
  space: Space,
  moneyDelta: Money,
  notes: readonly string[],
  emphasis: LandingEmphasis,
  narration: string,
): LandingEvent {
  return {
    spaceId: space.id,
    title: space.title,
    description: space.description,
    icon: space.icon,
    tone: space.tone,
    moneyDelta,
    lifeTilesGained: [],
    notes,
    emphasis,
    narration,
  }
}

/**
 * What the player earns today, for a prompt that asks them to give it up.
 * A forced career change without this is an uninformed decision: the offers
 * carry their own salaries, but nothing to measure them against.
 */
function currentIncomeNote(player: Player, economy: EconomyConstants, currency: CurrencySpec): string {
  if (!player.career) {
    return `You are between jobs, picking up shifts at ${formatMoney(economy.casualWagePerPip, currency)} a pip.`
  }
  return `You currently earn ${formatMoney(player.career.salary, currency)}/payday as a ${player.career.title}.`
}

/**
 * The offers, with the ladder each one sits on written on the front of it.
 *
 * "Rung 2 of 4" is the whole reason a career choice is interesting now: two
 * jobs on the same money are not the same job when one of them has a salon
 * above it and the other is the top of a two-rung trade. A player who cannot
 * see the height is being asked to guess.
 */
function careerDecisionOptions(
  careers: readonly Career[],
  currency: CurrencySpec,
  edition: Edition,
): readonly DecisionOption[] {
  return careers.map((career) => {
    const ladder = ladderPositionOf(career.id, edition)
    const rung =
      career.isCalling || !ladder || ladder.height === 1
        ? ' · no ladder'
        : ` · rung ${ladder.rung} of ${ladder.height}`
    return {
      id: career.id,
      label: career.title,
      description: career.description,
      icon: career.icon,
      detail: `${formatMoney(career.salary, currency)}/payday${rung}`,
    }
  })
}

function houseDecisionOptions(
  houses: readonly House[],
  declineLabel: string,
  declineDescription: string,
  currency: CurrencySpec,
): DecisionOption[] {
  return [
    ...houses.map((house) => ({
      id: house.id,
      label: house.name,
      description: house.description,
      icon: house.icon,
      detail: formatMoney(house.price, currency),
    })),
    {
      id: DECLINE_HOUSE_OPTION_ID,
      label: declineLabel,
      description: declineDescription,
      icon: 'space:retirement' as const,
    },
  ]
}

/** The other players still in the game — the only ones an upset can touch. */
export function rivalsOf(state: GameState, player: Player): readonly Player[] {
  return state.players.filter((other) => other.id !== player.id && !other.isRetired)
}

function tileValueOf(player: Player): Money {
  return player.lifeTiles.reduce((sum, tile) => sum + tile.value, 0)
}

/** Resolves the `SpaceEffect` of `space` for the current player. Pure; never mutates its inputs. */
export function applyEffect(state: GameState, space: Space, deps: UseCaseDeps): EffectResult {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('applyEffect: no current player')

  /*
   * Everything below spends the *edition's* money: the catalogues it deals
   * from, the wedding gift it collects, the symbol it prints. Bound once here
   * so no branch can quietly reach for a dollar figure of its own.
   */
  const edition = editionOf(state)
  const { economy, currency } = edition
  const { marriage, household } = economy
  const money = (amount: Money): string => formatMoney(amount, currency)
  const emphasisOf = (delta: Money): LandingEmphasis => emphasisForMoney(delta, economy)
  const borrowed = (loansTaken: number): string =>
    loanNote(loansTaken, economy.loanPrincipal, loanRepaymentFor(state.difficulty, edition), currency)

  const effect = space.effect

  switch (effect.type) {
    case 'none': {
      const event = baseEvent(space, 0, [], 'normal', `A quiet stretch of road for ${player.name} — nothing to do but enjoy the view.`)
      const log = appendLog(state, player.id, `${player.name} lands on ${space.title}.`, 'event')
      return { state: { ...state, log, pendingDecision: null }, event }
    }

    case 'gainMoney': {
      const updated = creditPlayer(player, effect.amount)
      const delta = updated.money - player.money
      const emphasis = emphasisOf(delta)
      const narration =
        emphasis === 'big'
          ? `${money(delta)} into ${player.name}'s pocket — that is a serious jump up the board!`
          : `A little extra for ${player.name}. Every dollar counts at the end!`
      const event = baseEvent(space, delta, [effect.reason], emphasis, narration)
      const log = appendLog(
        state,
        player.id,
        `${player.name}: ${effect.reason} (${money(delta)})`,
        'money-in',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'payMoney': {
      // The whole point of a premium: a covered player watches the bill go by.
      if (effect.hazard && isCoveredAgainst(player, effect.hazard)) {
        const policy = HAZARD_POLICY[effect.hazard]
        const notes = [effect.reason, `Your ${INSURANCE_LABELS[policy].toLowerCase()} covers it — you pay nothing.`]
        const event = baseEvent(
          space,
          0,
          notes,
          'big',
          `Insured! That ${effect.hazard} just cost ${player.name} nothing at all.`,
        )
        const log = appendLog(
          state,
          player.id,
          `${player.name} is covered: the ${INSURANCE_LABELS[policy].toLowerCase()} waives ${money(effect.amount)}.`,
          'milestone',
        )
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      const updated = debitPlayer(player, effect.amount, economy)
      const delta = updated.money - player.money
      const loansTaken = updated.loans - player.loans
      const notes = [effect.reason]
      if (loansTaken > 0) notes.push(borrowed(loansTaken))
      const emphasis = emphasisOf(delta)
      const narration =
        emphasis === 'big'
          ? `Ouch! ${money(Math.abs(delta))} straight out of ${player.name}'s wallet.`
          : `A small bill for ${player.name} — nothing the next payday won't fix.`
      const event = baseEvent(space, delta, notes, emphasis, narration)
      const log = appendLog(
        state,
        player.id,
        `${player.name}: ${effect.reason} (${money(delta)})`,
        'money-out',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'payday': {
      // A salaried player's packet is a fixed number — nothing to roll for,
      // so nothing to make a player press a button over. It collects exactly
      // as it always has.
      const kind = paydayKindOf(player)
      if (kind === 'salary') {
        const collection = collectPaydays(player, 1, deps, economy)
        const updated = collection.player
        const delta = updated.money - player.money
        const event = baseEvent(space, delta, [`Payday! ${money(delta)}`], emphasisOf(delta), `Payday! ${player.name} clocks out ${money(delta)} richer.`)
        const log = appendLog(state, player.id, `${player.name} collects payday: ${money(delta)}.`, 'money-in')
        return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
      }

      /*
       * Unsteady work and a player between jobs are paid by the wheel — and a
       * wheel a player never touches is not a wheel, it is a number the game
       * quietly decided for them. So the roll waits for `resolveValueSpin` in
       * `choose.ts`, and this card names the rate before anyone commits to it:
       * the formula is always `rate × the spin`, so higher is always better,
       * whichever rate applies.
       */
      const rate = kind === 'variable' && player.career?.payPerPip !== undefined
        ? player.career.payPerPip
        : economy.casualWagePerPip
      const description =
        kind === 'casual'
          ? `Between jobs, so you pick up shifts. ${money(rate)} a pip you roll, 1 to 10 — higher is always better.`
          : `${player.career?.title ?? 'Your trade'} — no two weeks pay the same. ${money(rate)} a pip you roll, 1 to 10 — higher is always better.`
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Spin', description, icon: 'space:payday' }],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} lines up to spin for the week's pay.`)
      const log = appendLog(state, player.id, `${player.name} is up for a payday spin.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'payRaise': {
      if (!player.career) {
        const event = baseEvent(
          space,
          0,
          ['No job yet — no raise to give.'],
          'normal',
          `Hard to get a raise with no job. Better luck at the next career fair, ${player.name}!`,
        )
        const log = appendLog(state, player.id, `${player.name} has no job yet, so there's no raise.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }
      const updated = applyPayRaise(player)
      const newSalary = updated.career?.salary ?? player.career.salary
      const event = baseEvent(
        space,
        0,
        [`Salary raised to ${money(newSalary)}`],
        'normal',
        `A raise for ${player.name}! Every payday from here on is worth more.`,
      )
      const log = appendLog(state, player.id, `${player.name}'s salary is raised to ${money(newSalary)}.`, 'milestone')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'promotion': {
      const career = player.career
      if (!career) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'No job yet — nothing to be promoted out of.'],
          'normal',
          `Hard to be promoted with no job. Get hired first, ${player.name}!`,
        )
        const log = appendLog(state, player.id, `${player.name} has no job, so there is nothing to review.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      /*
       * A calling has no rung above it, and that is the whole point of one.
       * The review still happens; what it hands over is a story rather than a
       * title, which is the only currency this kind of work has ever paid in —
       * and LIFE tiles score, so it is real money at the end of the night.
       */
      if (hasCalling(player)) {
        const tiles = deps.random.shuffle(edition.lifeTiles).slice(0, 1)
        const raised = applyPayRaise(addLifeTiles(player, tiles))
        const newSalary = raised.career?.salary ?? career.salary
        const event: LandingEvent = {
          ...baseEvent(
            space,
            0,
            [
              effect.reason,
              `There is no rung above ${career.title}, and there was never going to be.`,
              ...tiles.map((tile) => tile.title),
              `Pay rises to ${money(newSalary)}`,
            ],
            'milestone',
            `No promotion for ${player.name} — this is the work, and it is the whole point. A LIFE tile and a raise instead!`,
          ),
          lifeTilesGained: tiles,
        }
        const log = appendLog(
          state,
          player.id,
          `${player.name} deepens their calling as a ${career.title}: a LIFE tile, and pay of ${money(newSalary)}.`,
          'milestone',
        )
        return { state: { ...state, players: replacePlayer(state.players, raised), log, pendingDecision: null }, event }
      }

      const next = nextRungOf(career, edition)
      if (!next) {
        /*
         * Top of the ladder. There is nothing to be promoted to, so the review
         * pays: a double step, because reaching the top rung is exactly what
         * the ladder was for and the board should keep saying so.
         */
        const raised = applyPayRaise(applyPayRaise(player))
        const newSalary = raised.career?.salary ?? career.salary
        const event = baseEvent(
          space,
          0,
          [effect.reason, `Nobody above you to be promoted past.`, `Pay rises to ${money(newSalary)}`],
          'big',
          `${player.name} already runs the place — so they simply write themselves a better number. Pay is now ${money(newSalary)}!`,
        )
        const log = appendLog(
          state,
          player.id,
          `${player.name} is already at the top as a ${career.title}, and takes a rise to ${money(newSalary)}.`,
          'milestone',
        )
        return { state: { ...state, players: replacePlayer(state.players, raised), log, pendingDecision: null }, event }
      }

      /*
       * Genuine uncertainty from here — deferred to `resolveValueSpin` in
       * `choose.ts`, same as `spinForMoney` and an unsteady payday, and for
       * the same reason: the game already knew the number before this card
       * existed, which is a worse feeling than not knowing at all. The bar to
       * clear is named up front so pressing Spin is an informed bet, not a
       * blind one.
       */
      const needed = career.promotionSpin ?? DEFAULT_PROMOTION_SPIN
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Spin',
            description: `${effect.reason} You need a ${needed} or higher (out of 10) to move up to ${next.title}. Miss it and you still take a raise.`,
            icon: 'space:pay-raise-talk',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} is up for review.`)
      const log = appendLog(state, player.id, `${player.name} is up for review: ${next.title} on the line.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'gainLifeTiles': {
      const shuffled = deps.random.shuffle(edition.lifeTiles)
      const tiles = shuffled.slice(0, effect.count)
      const updated = addLifeTiles(player, tiles)
      const names = tiles.map((tile) => tile.title).join(', ')
      const event: LandingEvent = {
        ...baseEvent(
          space,
          0,
          tiles.map((tile) => tile.title),
          'normal',
          `${player.name} picks up a LIFE tile — those all count at the very end!`,
        ),
        lifeTilesGained: tiles,
      }
      const log = appendLog(state, player.id, `${player.name} gains a life tile: ${names}.`, 'event')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'chooseCareer': {
      // Bottom rungs only. Nobody walks out of a job fair running a salon.
      const pool = hiringPoolFor(edition, effect.pool === 'graduate' && player.hasDegree)
      const offered = deps.random.shuffle(pool).slice(0, 2)
      const decision: Decision = {
        kind: 'career',
        prompt: player.career
          ? `Choose your career path. ${currentIncomeNote(player, economy, currency)}`
          : 'Choose your career path',
        options: careerDecisionOptions(offered, currency, edition),
      }
      const event = baseEvent(space, 0, [], 'normal', `Two offers on the table. Choose wisely, ${player.name}!`)
      const log = appendLog(state, player.id, `${player.name} is offered a choice of career.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'graduate': {
      const updated = graduatePlayer(player)
      const event = baseEvent(
        space,
        0,
        ['Earned a degree!'],
        'milestone',
        `Cap in the air! ${player.name} is a graduate, and the big careers just opened up.`,
      )
      const log = appendLog(state, player.id, `${player.name} graduates and earns a degree!`, 'milestone')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'getMarried': {
      if (player.isMarried) {
        const event = baseEvent(
          space,
          0,
          ['Already married, and still very pleased about it.'],
          'normal',
          `${player.name} is already spoken for. They wave at the happy couple and walk on.`,
        )
        const log = appendLog(state, player.id, `${player.name} is already married.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      /*
       * Whether, and then which — deferred to `resolveValueSpin` in
       * `choose.ts`. Two rolls happen behind one press rather than two,
       * because the second ask only exists to soften a low first one; making
       * a player press again just to hear the game's own follow-up would be
       * ceremony, not agency. What the press is actually deciding is real,
       * so the card says what it takes: at least `marriage.proposalSpin`
       * and the wedding is on, on whatever terms the number lands on.
       */
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Spin',
            description: `Spin — a ${marriage.proposalSpin} or higher (out of 10) and it's a yes outright. Lower gets a kinder second ask before it's a no.`,
            icon: 'space:wedding-day',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} takes a knee.`)
      const log = appendLog(state, player.id, `${player.name} is up for the wheel: will they marry?`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'household': {
      /*
       * A single player has nobody to split the bill with and nobody to argue
       * with about it, so the tile passes them by entirely. This is the half of
       * marriage that keeps happening after the wedding.
       */
      if (!player.isMarried) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'Nobody else on the account, so nobody else to blame.'],
          'normal',
          `${player.name} answers to nobody about money this month.`,
        )
        const log = appendLog(state, player.id, `${player.name} has only themselves to answer to.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      /*
       * Deferred to `resolveValueSpin` in `choose.ts` — same reasoning as
       * every other wheel-decided tile. Below `household.breakEvenSpin` the
       * account is down; at or above it, up — so the card says exactly that
       * rather than a number that means nothing without the formula behind it.
       */
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Spin',
            description: `${effect.reason} Below a ${household.breakEvenSpin} and the spending outran the account; at or above it, two incomes carried the month.`,
            icon: 'finance:bank-visit',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} opens the joint statement.`)
      const log = appendLog(state, player.id, `${player.name} is up for the wheel: how did the joint account do?`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'haveChildren': {
      const updated = addChildren(player, effect.count)
      const label = effect.count === 1 ? 'child' : 'children'
      // A new arrival is as much a life milestone as a wedding, and the card should say so.
      const event = baseEvent(
        space,
        0,
        [`+${effect.count} ${label}`],
        'milestone',
        `Congratulations ${player.name} — the family just got bigger!`,
      )
      const log = appendLog(state, player.id, `${player.name} welcomes ${effect.count} ${label}.`, 'milestone')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'buyHouse': {
      const offered = deps.random.shuffle(edition.houses).slice(0, 3)
      const decision: Decision = {
        kind: 'house',
        prompt: 'Pick a home to buy',
        options: houseDecisionOptions(offered, 'Keep renting for now', 'Skip buying a house this turn.', currency),
      }
      const event = baseEvent(space, 0, [], 'normal', `Time to go house hunting, ${player.name}. Pick a front door!`)
      const log = appendLog(state, player.id, `${player.name} is house hunting.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'collectFromEach': {
      const payers = rivalsOf(state, player)
      let players = state.players
      let mover = player
      const notes = [effect.reason]
      for (const payer of payers) {
        players = replacePlayer(players, debitPlayer(payer, effect.amount, economy))
        mover = creditPlayer(mover, effect.amount)
        notes.push(`${payer.name} pays you ${money(effect.amount)}.`)
      }
      players = replacePlayer(players, mover)
      const delta = mover.money - player.money
      const event = baseEvent(
        space,
        delta,
        notes,
        emphasisOf(delta),
        `Everybody pays up — ${player.name} is collecting!`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} collects ${money(effect.amount)} from each other player.`,
        'money-in',
      )
      return { state: { ...state, players, log, pendingDecision: null }, event }
    }

    case 'payEach': {
      const recipients = rivalsOf(state, player)
      let players = state.players
      let mover = player
      const notes = [effect.reason]
      for (const recipient of recipients) {
        mover = debitPlayer(mover, effect.amount, economy)
        players = replacePlayer(players, creditPlayer(recipient, effect.amount))
        notes.push(`You pay ${recipient.name} ${money(effect.amount)}.`)
      }
      players = replacePlayer(players, mover)
      const delta = mover.money - player.money
      const event = baseEvent(
        space,
        delta,
        notes,
        emphasisOf(delta),
        `The round is on ${player.name} — everybody else gets paid!`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} pays ${money(effect.amount)} to each other player.`,
        'money-out',
      )
      return { state: { ...state, players, log, pendingDecision: null }, event }
    }

    case 'spinForMoney': {
      // Deferred to `resolveValueSpin` in `choose.ts` — see the 'payday' case
      // above for why. The rate is right there in the description because the
      // formula is always `perPip × the spin`, so a player deciding whether to
      // press the button already knows higher is better before they do.
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Spin',
            description: `${effect.reason} ${money(effect.perPip)} a pip you roll, 1 to 10 — higher is always better.`,
            icon: 'space:payday',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} lines up for the spin.`)
      const log = appendLog(state, player.id, `${player.name} is up for a spin: ${effect.reason.toLowerCase()}`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'retire': {
      const rank = state.players.filter((candidate) => candidate.isRetired).length + 1
      const updated = retirePlayer(player, rank)
      const event = baseEvent(
        space,
        0,
        [`Retirement rank #${rank}`],
        'milestone',
        `${player.name} retires in position number ${rank}! Feet up, the hard part is over.`,
      )
      const log = appendLog(state, player.id, `${player.name} retires!`, 'milestone')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'retireEarly': {
      const { fireNumber, firePayoutPerPip } = economy
      const affordable = player.money >= fireNumber
      const options: DecisionOption[] = []
      if (affordable) {
        options.push({
          id: FIRE_RETIRE_OPTION_ID,
          label: 'Call it a life',
          description: `Put ${money(fireNumber)} into the fund and stop working today. One spin decides what it comes back as — anything from ${money(firePayoutPerPip)} to ${money(firePayoutPerPip * 10)} — and you take the next retirement place, forfeiting every payday still on the road.`,
          icon: 'space:retirement-fund',
          detail: `-${money(fireNumber)}`,
        })
      }
      options.push({
        id: FIRE_DECLINE_OPTION_ID,
        label: affordable ? 'Not yet — keep working' : 'Keep working',
        description: affordable
          ? 'Walk on, collect the rest of the paydays, and take whatever else the last stretch of road has in it.'
          : `The number is ${money(fireNumber)} and you are not there. Walk on and keep earning.`,
        icon: 'space:steady-hustle',
      })
      const decision: Decision = {
        kind: 'retire',
        prompt: affordable
          ? `You have ${money(player.money)}. Is that enough?`
          : `The number is ${money(fireNumber)}. You have ${money(player.money)}.`,
        options,
      }
      const event = baseEvent(
        space,
        0,
        affordable
          ? [`The fund costs ${money(fireNumber)}, and one spin decides what it comes back as.`]
          : [`You need ${money(fireNumber)} in hand to buy your way out here.`],
        'normal',
        affordable
          ? `${player.name} does the sums at the kitchen table. Enough to stop — or is one more year better?`
          : `${player.name} does the sums at the kitchen table, and the sums say keep going.`,
      )
      const log = appendLog(
        state,
        player.id,
        affordable
          ? `${player.name} works out whether to stop working for good.`
          : `${player.name} is short of the number and walks on.`,
        'event',
      )
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    // --- career churn ------------------------------------------------------

    case 'careerChange': {
      /*
       * A change of trade, not a demotion.
       *
       * Your experience walks in the door with you: a stylist who takes a job
       * at a bakery starts as a pastry chef, not peeling almonds, and a ladder
       * with only two rungs takes them at its top. Without this rule every
       * career fair on the board would send a mid-career player back to the
       * bottom, which would turn a re-draw from a gamble into a punishment and
       * make Job-Hopper Alley a road nobody sane would ever take.
       *
       * A player between jobs has no rung to carry, so a layoff really does
       * cost the climb as well as the wage. That is the sharpest thing a
       * layoff does now, and it is why a calling — which cannot be lost — is
       * worth having.
       */
      const here = player.career ? ladderPositionOf(player.career.id, edition) : undefined
      const seniority = seniorityOf(player, edition)
      const pool = hiringPoolFor(edition, player.hasDegree).filter((entry) => entry.id !== here?.entry.id)
      const offered = deps.random
        .shuffle(pool)
        .slice(0, 2)
        .map((entry) => rungFor(entry, seniority, edition))

      /*
       * Staying put is an answer, and on most of these tiles it is the right
       * one. A career is a ladder: somebody who has climbed to the top of the
       * salon and is then marched onto a fresh one has not had a setback, they
       * have had the arc they were playing for deleted, by a tile they landed
       * on by accident.
       *
       * It is not a free pass either, which is the other failure mode — a
       * decline everybody always takes is a tile that does nothing. What stops
       * it being one is the ladder. The offers are dealt at the rung the
       * player has *already reached*, so a move is a sideways step and never a
       * demotion — but onto a different trade, which may be two rungs taller
       * than the one they are on, or one rung shorter. A player near the top
       * of a short ladder should absolutely take the taller one; a player
       * halfway up a good one should stay and compound it. The option details
       * quote the rung and the height, so that is a question a player can
       * actually answer.
       *
       * Two cases have no decline. A player with no job has nothing to stay in
       * — which is also what keeps the board's promise that a layoff always
       * has a way back — and a tile marked `compulsory` is one where nobody
       * asked: a reorganisation, or a road the player chose at a fork *in
       * order* to re-draw. Handing Job-Hopper Alley a decline would make it a
       * free look at two jobs, and Company Road would never be worth taking.
       */
      const mayStay = player.career !== null && effect.compulsory !== true
      const options = [...careerDecisionOptions(offered, currency, edition)]
      if (mayStay && player.career) {
        options.push({
          id: CAREER_STAY_OPTION_ID,
          label: `Stay as a ${player.career.title}`,
          description: hasCalling(player)
            ? 'This is the work you were made for. Let the recruiters talk to somebody else.'
            : 'Keep the job, the ladder, and every rung still above you.',
          icon: player.career.icon,
          detail: `${money(player.career.salary)}/payday`,
        })
      }

      const decision: Decision = {
        kind: 'career',
        prompt: mayStay
          ? `Two other trades would take you at the level you are on. ${currentIncomeNote(player, economy, currency)}`
          : `Your job is changing — pick your next one. ${currentIncomeNote(player, economy, currency)}`,
        options,
      }
      const event = baseEvent(
        space,
        0,
        [
          effect.reason,
          ...(mayStay ? ['Same rung, same money today — but a different ladder above it.'] : []),
        ],
        'milestone',
        mayStay
          ? `Two offers on the table for ${player.name} — and nobody is making them take either.`
          : `New offers on the table — ${player.name} is changing careers whether they like it or not!`,
      )
      const log = appendLog(
        state,
        player.id,
        mayStay
          ? `${effect.reason} ${player.name} weighs up two offers.`
          : `${effect.reason} ${player.name} must pick a new career.`,
        'event',
      )
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'loseCareer': {
      if (!player.career) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'Already out of work — nothing left to lose.'],
          'normal',
          `You cannot lose a job you never had. ${player.name} shrugs and walks on.`,
        )
        const log = appendLog(state, player.id, `${player.name} is already out of work.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      /*
       * You cannot be laid off from a calling. There is no personnel file, no
       * floor to be called into, and no badge to stop working — this is the
       * steadiness the road offers in exchange for never climbing, and it is
       * worth most at exactly this tile.
       */
      if (hasCalling(player)) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, `Nobody can take a ${player.career.title} away from you. The work is yours.`],
          'big',
          `They cannot lay ${player.name} off — this is a calling, and it does not come with a badge to hand back.`,
        )
        const log = appendLog(
          state,
          player.id,
          `${player.name} cannot lose their calling as a ${player.career.title}.`,
          'milestone',
        )
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      const lost = player.career.title
      const rungLost = ladderPositionOf(player.career.id, edition)?.rung ?? 1
      const updated = loseCareerFor(player, rungLost - 1)
      const event = baseEvent(
        space,
        0,
        [
          effect.reason,
          `No longer a ${lost} — until somebody hires you, a payday is whatever shifts you can pick up: ${money(economy.casualWagePerPip)} a pip.`,
        ],
        'milestone',
        `Laid off! ${player.name} is out of work — from here every payday is shift work, and the wheel decides how good the week was.`,
      )
      const log = appendLog(state, player.id, `${player.name} loses their job as a ${lost}.`, 'event')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    // --- investing ---------------------------------------------------------

    case 'buyStock': {
      const offered: readonly Stock[] = deps.random.shuffle(edition.stocks).slice(0, 3)
      const options: DecisionOption[] = [
        ...offered.map((stock) => ({
          id: stock.id,
          label: `${stock.name} (${stock.ticker})`,
          description: stock.description,
          icon: stock.icon,
          detail: `${money(stock.price)} a share`,
        })),
        {
          id: DECLINE_STOCK_OPTION_ID,
          label: 'Keep your cash',
          description: 'Walk past the trading floor this turn.',
          icon: 'finance:trading-floor',
        },
      ]
      const decision: Decision = { kind: 'stock', prompt: 'Buy a share?', options }
      const event = baseEvent(
        space,
        0,
        [],
        'normal',
        `The trading floor is open, ${player.name}. Fancy a punt?`,
      )
      const log = appendLog(state, player.id, `${player.name} is offered shares to buy.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'stockDividend': {
      const shares = totalShares(player)
      if (shares === 0) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'No shares held — nothing to collect.'],
          'normal',
          `Dividend day, but ${player.name} does not own a single share. Nothing to collect!`,
        )
        const log = appendLog(state, player.id, `${player.name} holds no shares, so the dividend pays nothing.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }
      const payout = effect.perShare * shares
      const updated = creditPlayer(player, payout)
      const delta = updated.money - player.money
      const event = baseEvent(
        space,
        delta,
        [effect.reason, `${shares} share${shares > 1 ? 's' : ''} × ${money(effect.perShare)}`],
        emphasisOf(delta),
        `Dividend day! ${player.name}'s portfolio pays out ${money(payout)}.`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} collects a dividend on ${shares} share${shares > 1 ? 's' : ''}: ${money(payout)}.`,
        'money-in',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'buyInsurance': {
      const available = effect.kinds.filter((kind) => !hasInsurance(player, kind))
      if (available.length === 0) {
        const event = baseEvent(
          space,
          0,
          ['Already covered on every policy offered here.'],
          'normal',
          `${player.name} is already covered on everything on offer. Walk on!`,
        )
        const log = appendLog(state, player.id, `${player.name} is already covered here.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }
      const descriptions = insuranceDescriptions(economy, currency)
      const options: DecisionOption[] = [
        ...available.map((kind) => ({
          id: insuranceOptionId(kind),
          label: INSURANCE_LABELS[kind],
          description: descriptions[kind],
          icon: INSURANCE_ICONS[kind],
          detail: money(economy.insurancePremium[kind]),
        })),
        {
          id: DECLINE_INSURANCE_OPTION_ID,
          label: 'Take the risk',
          description: 'Leave the office uninsured this turn.',
          icon: 'finance:insurance-office',
        },
      ]
      const decision: Decision = { kind: 'insurance', prompt: 'Take out a policy?', options }
      const event = baseEvent(
        space,
        0,
        [],
        'normal',
        `The insurance office is open, ${player.name}. A premium now can save a fortune later.`,
      )
      const log = appendLog(state, player.id, `${player.name} is offered insurance.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'bank': {
      // The bank charges by difficulty, and says so: borrowing on Very Hard
      // costs better than double what it lends, which is only a fair trap if
      // the prompt quotes the real number before the player agrees to it.
      const settlement = loanRepaymentFor(state.difficulty, edition)
      const earlySettlement = earlyLoanRepaymentFor(state.difficulty, edition)
      const options: DecisionOption[] = [
        {
          id: BANK_LOAN_OPTION_ID,
          label: 'Take out a loan',
          description: `Borrow ${money(economy.loanPrincipal)} now and pay back ${money(settlement)} at retirement.`,
          icon: 'finance:bank-visit',
          detail: `+${money(economy.loanPrincipal)}`,
        },
      ]
      // Repaying early is only on the table when there is a debt and the cash to clear it.
      if (player.loans > 0 && player.money >= earlySettlement) {
        options.push({
          id: BANK_REPAY_OPTION_ID,
          label: 'Repay a loan early',
          description: `Clear one loan now for ${money(earlySettlement)}, instead of ${money(settlement)} at retirement.`,
          icon: 'finance:bank-visit',
          detail: `-${money(earlySettlement)}`,
        })
      }
      options.push({
        id: BANK_DECLINE_OPTION_ID,
        label: 'Walk on by',
        description: 'Leave the bank without borrowing or repaying.',
        icon: 'finance:bank-visit',
      })
      const decision: Decision = { kind: 'bank', prompt: 'Business at the bank?', options }
      const event = baseEvent(
        space,
        0,
        [],
        'normal',
        `The bank is open, ${player.name}. Borrow, repay, or stroll right past.`,
      )
      const log = appendLog(state, player.id, `${player.name} stops at the bank.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    // --- family ------------------------------------------------------------

    case 'payPerChild': {
      if (player.children === 0) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'No children — no bill to pay.'],
          'normal',
          `No children, no bill. ${player.name} strolls straight past this one.`,
        )
        const log = appendLog(state, player.id, `${player.name} has no children, so there is nothing to pay.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }
      const owed = effect.amount * player.children
      const updated = debitPlayer(player, owed, economy)
      const delta = updated.money - player.money
      const loansTaken = updated.loans - player.loans
      const notes = [effect.reason, `${player.children} × ${money(effect.amount)}`]
      if (loansTaken > 0) notes.push(borrowed(loansTaken))
      const event = baseEvent(
        space,
        delta,
        notes,
        emphasisOf(delta),
        `${player.children} children, ${money(owed)} out the door. Family life is not cheap!`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} pays ${money(owed)} for ${player.children} children.`,
        'money-out',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'collectPerChild': {
      if (player.children === 0) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'No children — nothing to claim.'],
          'normal',
          `No children to claim for, so nothing for ${player.name} this time.`,
        )
        const log = appendLog(state, player.id, `${player.name} has no children, so there is nothing to claim.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }
      const gained = effect.amount * player.children
      const updated = creditPlayer(player, gained)
      const delta = updated.money - player.money
      const event = baseEvent(
        space,
        delta,
        [effect.reason, `${player.children} × ${money(effect.amount)}`],
        emphasisOf(delta),
        `${player.children} children means ${money(gained)} in — the family pays off this time!`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} collects ${money(gained)} for ${player.children} children.`,
        'money-in',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    // --- upsets ------------------------------------------------------------

    case 'swapMoneyWithLeader': {
      const leader = rivalsOf(state, player).reduce<Player | null>(
        (best, other) => (best === null || other.money > best.money ? other : best),
        null,
      )

      if (!leader || leader.money <= player.money) {
        const notes = [effect.reason, leader ? 'Nobody is holding more — nothing to swap.' : 'Nobody left to swap with.']
        const event = baseEvent(
          space,
          0,
          notes,
          'normal',
          leader
            ? `${player.name} is already out in front, so there is nothing to swap!`
            : `There is nobody left to swap wallets with. ${player.name} keeps every penny.`,
        )
        const log = appendLog(state, player.id, `${player.name} has nobody to swap money with.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      let players = replacePlayer(state.players, setMoney(player, leader.money))
      players = replacePlayer(players, setMoney(leader, player.money))
      const delta = leader.money - player.money
      const event = baseEvent(
        space,
        delta,
        [effect.reason, `Swapped wallets with ${leader.name}: ${money(player.money)} ↔ ${money(leader.money)}`],
        'big',
        `Swap! ${player.name} takes ${leader.name}'s wallet, and the whole board just changed shape!`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} swaps money with ${leader.name} — ${money(leader.money)} changes hands!`,
        'upset',
      )
      return { state: { ...state, players, log, pendingDecision: null }, event }
    }

    case 'stealLifeTile': {
      const victim = rivalsOf(state, player)
        .filter((other) => other.lifeTiles.length > 0)
        .reduce<Player | null>((best, other) => (best === null || tileValueOf(other) > tileValueOf(best) ? other : best), null)

      if (!victim) {
        const event = baseEvent(
          space,
          0,
          [effect.reason, 'Nobody else is holding a LIFE tile.'],
          'normal',
          `Nobody else is holding a LIFE tile, so ${player.name} leaves empty-handed.`,
        )
        const log = appendLog(state, player.id, `${player.name} finds no LIFE tile to take.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      const tile = deps.random.pick(victim.lifeTiles)
      let players = replacePlayer(state.players, removeLifeTile(victim, tile.id))
      players = replacePlayer(players, addLifeTiles(player, [tile]))
      const event: LandingEvent = {
        ...baseEvent(
          space,
          0,
          [effect.reason, `Took "${tile.title}" from ${victim.name} (${money(tile.value)})`],
          'big',
          `${player.name} swipes "${tile.title}" right out of ${victim.name}'s hands!`,
        ),
        lifeTilesGained: [tile],
      }
      const log = appendLog(
        state,
        player.id,
        `${player.name} takes the "${tile.title}" LIFE tile from ${victim.name}!`,
        'upset',
      )
      return { state: { ...state, players, log, pendingDecision: null }, event }
    }

    case 'upgradeHouse': {
      const current = player.house
      if (!current) {
        // Nothing to trade up from, so this becomes an ordinary house hunt.
        const offered = deps.random.shuffle(edition.houses).slice(0, 3)
        const decision: Decision = {
          kind: 'house',
          prompt: 'No home to trade up — buy your first?',
          options: houseDecisionOptions(offered, 'Keep renting for now', 'Skip buying a house this turn.', currency),
        }
        const event = baseEvent(
          space,
          0,
          ['No home to trade up from yet.'],
          'normal',
          `No home to upgrade yet, so let's go shopping instead, ${player.name}!`,
        )
        const log = appendLog(state, player.id, `${player.name} has no home to trade up, so goes house hunting.`, 'event')
        return { state: { ...state, log, pendingDecision: decision }, event }
      }

      const better = edition.houses.filter((house) => house.price > current.price)
      if (better.length === 0) {
        const event = baseEvent(
          space,
          0,
          [`The ${current.name} is already the finest home on the board.`],
          'normal',
          `There is nothing left to trade up to — ${player.name} already owns the best address in town!`,
        )
        const log = appendLog(state, player.id, `${player.name} already owns the best home available.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      const offered = deps.random.shuffle(better).slice(0, 3)
      const decision: Decision = {
        kind: 'house',
        prompt: `Trade up from the ${current.name}?`,
        options: houseDecisionOptions(
          offered,
          `Stay in the ${current.name}`,
          'Keep the home you have and move on.',
          currency,
        ),
      }
      const event = baseEvent(
        space,
        0,
        [`Your ${current.name} is worth ${money(current.price)} towards the move.`],
        'normal',
        `Time to trade up, ${player.name}. What is it going to be?`,
      )
      const log = appendLog(state, player.id, `${player.name} is offered a bigger home.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    default: {
      const exhaustive: never = effect
      throw new Error(`applyEffect: unhandled effect ${JSON.stringify(exhaustive)}`)
    }
  }
}

export {
  BANK_DECLINE_OPTION_ID,
  BANK_LOAN_OPTION_ID,
  BANK_REPAY_OPTION_ID,
  CAREER_STAY_OPTION_ID,
  DECLINE_HOUSE_OPTION_ID,
  DECLINE_INSURANCE_OPTION_ID,
  DECLINE_STOCK_OPTION_ID,
  DEFAULT_PROMOTION_SPIN,
  DOUBLE_PROMOTION_SPIN,
  FIRE_DECLINE_OPTION_ID,
  FIRE_RETIRE_OPTION_ID,
  VALUE_SPIN_OPTION_ID,
}
