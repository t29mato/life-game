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
  MoneyTransfer,
  Player,
  RollTableRow,
  Space,
  Stock,
} from '@domain/model/types'
import type { IconName } from '@domain/model/icons'
import { SPIN_FACES } from '@domain/model/constants'
import type { CurrencySpec, EconomyConstants, Edition, TuitionSpec } from '@domain/edition/types'
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
  divorcePlayer,
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
import { withBalanceAfter } from './balanceAfter'
import { formatMoney, loanNote, paydayReceipt, raiseNote, salaryPeriod, salaryRate } from './format'
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
const DEFAULT_PROMOTION_SPIN = 4

/** A perfect roll at a review carries you two rungs, when there are two to carry. */
const DOUBLE_PROMOTION_SPIN = SPIN_FACES

/**
 * The two halves of the die, written out — "1-3" and "4-6".
 *
 * Every tile that deals two outcomes splits them down the middle of the die,
 * the same way `resolveForkBranch` splits a fork, so the ranges are derived
 * from the number of faces rather than printed by hand in four places.
 */
const LOW_HALF = `1-${SPIN_FACES / 2}`
const HIGH_HALF = `${SPIN_FACES / 2 + 1}-${SPIN_FACES}`

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
 * Every band of the tuition die, as rows — "1-2 → $90,000", "6 → full ride"
 * — built fresh from whatever bands the edition actually defines, so a
 * country that ever ships a different number of them still reads correctly.
 * Data, not a sentence: the presentation layer renders this as a table
 * rather than a player having to parse a comma-joined string themselves.
 */
function tuitionBands(tuition: TuitionSpec, currency: CurrencySpec): readonly RollTableRow[] {
  const money = (amount: Money): string => formatMoney(amount, currency)
  let previousUpTo = 0
  return tuition.outcomes.map((band) => {
    const range = band.upTo === previousUpTo + 1 ? `${band.upTo}` : `${previousUpTo + 1}-${band.upTo}`
    previousUpTo = band.upTo
    return { range, amount: band.cost === 0 ? 'Full ride' : money(band.cost) }
  })
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
  return `You currently earn ${formatMoney(salaryRate(player.career.salary, currency), currency)}/${salaryPeriod(currency)} as a ${player.career.title}.`
}

/**
 * One offer, named in full for a spin's pre-roll description: title, salary,
 * and the ladder it sits on. "Rung 2 of 4" is the whole reason a career
 * spin is interesting rather than a coin flip in the dark — two jobs on the
 * same money are not the same job when one of them has a salon above it and
 * the other is the top of a two-rung trade, and a player who cannot see the
 * height is being asked to gamble blind rather than to gamble informed.
 */
function careerOfferSummary(career: Career, currency: CurrencySpec, edition: Edition): string {
  const ladder = ladderPositionOf(career.id, edition)
  const rung =
    career.isCalling || !ladder || ladder.height === 1 ? '' : `, rung ${ladder.rung} of ${ladder.height}`
  return `${career.title} (${formatMoney(salaryRate(career.salary, currency), currency)}/${salaryPeriod(currency)}${rung})`
}

/**
 * The two offers, as table rows instead of a sentence — `LOW_HALF`/
 * `HIGH_HALF` name which side of the die each one is on, exactly the way
 * `resolveForkBranch` splits a fork, so a player scans two rows rather than
 * parsing "1-3: X. 4-6: Y." out of prose. Each row carries the trade's own
 * portrait: two jobs on the same money are told apart by what the work looks
 * like, and a fair whose rows are prose alone is a fair with no booths.
 */
function careerOfferTable(
  first: Career,
  second: Career,
  currency: CurrencySpec,
  edition: Edition,
): readonly RollTableRow[] {
  return [
    { range: LOW_HALF, amount: careerOfferSummary(first, currency, edition), icon: first.icon },
    { range: HIGH_HALF, amount: careerOfferSummary(second, currency, edition), icon: second.icon },
  ]
}

function houseDecisionOptions(
  houses: readonly House[],
  declineLabel: string,
  declineDescription: string,
  currency: CurrencySpec,
): DecisionOption[] {
  return [
    ...houses.map((house) => {
      const [low, high] = house.resaleRange
      const resale =
        low === high
          ? formatMoney(low, currency)
          : `${formatMoney(low, currency)}–${formatMoney(high, currency)}`
      return {
        id: house.id,
        label: house.name,
        // Buying is the one board decision whose entire point is a number
        // nobody sees for the rest of the game — the price is right there
        // on the tile, but what it sells for at retirement is buried in
        // `resaleRange` and never shown anywhere else a first-time player
        // would think to look. Appended, not replacing the house's own
        // description, since that is still what makes one house a
        // different pick from another.
        description: `${house.description} Sells for ${resale} at retirement.`,
        icon: house.icon,
        detail: formatMoney(house.price, currency),
      }
    }),
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
/**
 * Resolves a landing, then stamps the balance it left the player holding.
 *
 * The switch below is long enough that "every branch remembers to report the
 * new balance" is not a rule that survives contact with the next effect
 * anybody adds. So no branch does: they each return the state they produced,
 * and the balance is read off it here, once, on the single way out.
 */
export function applyEffect(state: GameState, space: Space, deps: UseCaseDeps): EffectResult {
  const actingPlayerId = state.players[state.currentPlayerIndex]?.id
  const result = resolveEffect(state, space, deps)
  if (actingPlayerId === undefined) return result
  return { ...result, event: withBalanceAfter(result.event, result.state.players, actingPlayerId) }
}

function resolveEffect(state: GameState, space: Space, deps: UseCaseDeps): EffectResult {
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
      /*
       * A routine credit gets one clause, not two. "A little extra for X.
       * Every dollar counts at the end!" was a whole second sentence spent
       * saying nothing the plate had not already said louder — and, said
       * over a tile whose own description called the money enormous, it
       * argued with the card it was printed on. Commentary about the act of
       * collecting travels safely over any tile; commentary about the size
       * of the sum is the plate's job, and only the `big` line takes it.
       */
      const narration =
        emphasis === 'big'
          ? `${money(delta)} into ${player.name}'s pocket — that is a serious jump up the board!`
          : `Straight into ${player.name}'s pocket.`
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
        // "You pay nothing" is the narration's own line — the note is here
        // to name *which* policy just earned its premium back.
        const notes = [effect.reason, `Your ${INSURANCE_LABELS[policy].toLowerCase()} covers it.`]
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
          // No promise about the next payday: this line runs over bills the
          // player has no payday coming to fix.
          : `${player.name} settles it and walks on.`
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
        const event = baseEvent(
          space,
          delta,
          // Only where the receipt is actually working — the rate times the
          // periods it adds up over. An edition that reads salary as one
          // lump has no working to show, and printing the lump again under
          // the plate that already shouts it is not a note, it is an echo.
          currency.salaryDisplay ? [paydayReceipt(delta, currency)] : [],
          emphasisOf(delta),
          `Payday — ${player.name} clocks out with the packet in hand.`,
        )
        const log = appendLog(state, player.id, `${player.name} collects payday: ${paydayReceipt(delta, currency)}.`, 'money-in')
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
          ? `Between jobs, so you pick up shifts. ${money(rate)} a pip you roll, 1 to ${SPIN_FACES} — higher is always better.`
          : `${player.career?.title ?? 'Your trade'} — no two weeks pay the same. ${money(rate)} a pip you roll, 1 to ${SPIN_FACES} — higher is always better.`
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [{ id: VALUE_SPIN_OPTION_ID, label: 'Roll', description, icon: 'space:payday' }],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} lines up to roll for the week's pay.`)
      const log = appendLog(state, player.id, `${player.name} is up for a payday roll.`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'payRaise': {
      if (!player.career) {
        const event = baseEvent(
          space,
          0,
          [],
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
        [raiseNote(player.career.salary, newSalary, currency)],
        'normal',
        `A raise for ${player.name}! Every payday from here on is worth more.`,
      )
      const log = appendLog(
        state,
        player.id,
        currency.salaryDisplay
          ? `${player.name}: ${raiseNote(player.career.salary, newSalary, currency)}.`
          : `${player.name}'s salary is raised to ${money(newSalary)}.`,
        'milestone',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'tuition': {
      /*
       * Deferred to `resolveValueSpin` in `choose.ts`, same as every other
       * wheel-decided tile — but named in full before anyone presses Roll,
       * not just the bar to clear: a tuition bill is the single largest
       * charge on the board, and "spin and find out" without the bands in
       * front of you first is a worse version of the surprise-fee bill this
       * tile already is in real life.
       */
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Roll',
            // The title and the narration above this have already said what
            // tile this is; the table below says exactly what each face is
            // worth. Nothing here needs to repeat either.
            description: 'Roll to find out what you owe.',
            icon: 'space:tuition-bill',
            table: tuitionBands(economy.tuition, currency),
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} opens the tuition bill.`)
      const log = appendLog(state, player.id, `${player.name} is up for the roll: what does tuition come to?`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'promotion': {
      const career = player.career
      if (!career) {
        const event = baseEvent(
          space,
          0,
          [effect.reason],
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
            // The tiles are dealt as their own chips further up the card;
            // listing their titles here printed each of them twice.
            [
              effect.reason,
              `There is no rung above ${career.title}, and there was never going to be.`,
              raiseNote(career.salary, newSalary, currency),
            ],
            'milestone',
            `No promotion for ${player.name} — this is the work, and it is the whole point. A LIFE tile and a raise instead!`,
          ),
          lifeTilesGained: tiles,
        }
        const log = appendLog(
          state,
          player.id,
          `${player.name} deepens their calling as a ${career.title}: a LIFE tile, and pay of ${money(salaryRate(newSalary, currency))} a ${salaryPeriod(currency)}.`,
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
          // "Nobody above you" is exactly what "already runs the place"
          // says, and the new pay is the raise note's own job.
          [effect.reason, raiseNote(career.salary, newSalary, currency)],
          'big',
          `${player.name} already runs the place — so they simply write themselves a better number.`,
        )
        const log = appendLog(
          state,
          player.id,
          `${player.name} is already at the top as a ${career.title}, and takes a rise to ${money(salaryRate(newSalary, currency))} a ${salaryPeriod(currency)}.`,
          'milestone',
        )
        return { state: { ...state, players: replacePlayer(state.players, raised), log, pendingDecision: null }, event }
      }

      /*
       * Genuine uncertainty from here — deferred to `resolveValueSpin` in
       * `choose.ts`, same as `spinForMoney` and an unsteady payday, and for
       * the same reason: the game already knew the number before this card
       * existed, which is a worse feeling than not knowing at all. The bar to
       * clear is named up front so pressing Roll is an informed bet, not a
       * blind one.
       */
      const needed = career.promotionSpin ?? DEFAULT_PROMOTION_SPIN
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Roll',
            description: `${effect.reason} You need a ${needed} or higher (out of ${SPIN_FACES}) to move up to ${next.title}. Miss it and you still take a raise.`,
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
          // `lifeTilesGained` below already deals these onto the card as
          // chips, icon and all — a note per title was the same list twice.
          [],
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
      const [first, second] = deps.random.shuffle(pool).slice(0, 2) as [Career, Career]

      /*
       * Which offer lands is deferred to `resolveValueSpin` in `choose.ts`,
       * same as every other value-spin tile — 1-3 for the first offer, 4-6
       * for the second, both named up front so the press means something.
       * `offeredCareerIds` carries the pair across, since the space's own
       * `effect` is static route data and cannot hold a per-instance draw.
       */
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: player.career
          ? `Choose your career path. ${currentIncomeNote(player, economy, currency)}`
          : 'Choose your career path',
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Roll',
            description: 'Roll to see who hires you.',
            icon: space.icon,
            table: careerOfferTable(first, second, currency, edition),
          },
        ],
        offeredCareerIds: [first.id, second.id],
      }
      const event = baseEvent(space, 0, [], 'normal', `Two offers on the table — roll to see which one is yours, ${player.name}!`)
      const log = appendLog(state, player.id, `${player.name} rolls for a career.`, 'event')
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
          [],
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
            label: 'Roll',
            description: `Roll — a ${marriage.proposalSpin} or higher (out of ${SPIN_FACES}) and it's a yes outright. Lower gets a kinder second ask before it's a no.`,
            icon: 'space:wedding-day',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} takes a knee.`)
      const log = appendLog(state, player.id, `${player.name} is up for the roll: will they marry?`, 'event')
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
          [effect.reason],
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
            label: 'Roll',
            description: `${effect.reason} Below a ${household.breakEvenSpin} and the spending outran the account; at or above it, two incomes carried the month.`,
            icon: 'finance:bank-visit',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} opens the joint statement.`)
      const log = appendLog(state, player.id, `${player.name} is up for the roll: how did the joint account do?`, 'event')
      return { state: { ...state, log, pendingDecision: decision }, event }
    }

    case 'haveChildren': {
      /*
       * The arrival itself is certain — a spin has no business deciding
       * whether a baby shows up — so that part still happens the instant the
       * pawn lands here, milestone card and all. What waits for a press is
       * the gift envelopes: real money, same `rate × the spin` formula as
       * every other value-spin tile, deferred to `resolveValueSpin` in
       * `choose.ts` for the same reason the rest of them are.
       */
      const updated = addChildren(player, effect.count)
      const label = effect.count === 1 ? 'child' : 'children'
      const decision: Decision = {
        kind: 'valueSpin',
        prompt: space.title,
        options: [
          {
            id: VALUE_SPIN_OPTION_ID,
            label: 'Roll',
            description: `Roll for the gift envelopes — ${money(effect.celebrationPerPip)} a pip you roll, 1 to ${SPIN_FACES}.`,
            icon: 'space:new-baby',
          },
        ],
      }
      const event = baseEvent(
        space,
        0,
        [`+${effect.count} ${label}`],
        'milestone',
        `Congratulations ${player.name} — the family just got bigger!`,
      )
      const log = appendLog(state, player.id, `${player.name} welcomes ${effect.count} ${label}.`, 'milestone')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: decision }, event }
    }

    case 'buyHouse': {
      const offered = deps.random.shuffle(edition.houses).slice(0, 3)
      const decision: Decision = {
        kind: 'house',
        prompt: 'Buy a home now, sell it again at retirement',
        options: houseDecisionOptions(offered, 'Keep renting for now', 'Keep the cash, and own nothing to sell at retirement.', currency),
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
      const transfers: MoneyTransfer[] = []
      for (const payer of payers) {
        const debited = debitPlayer(payer, effect.amount, economy)
        players = replacePlayer(players, debited)
        mover = creditPlayer(mover, effect.amount)
        // The lane above already flies the coin between the two names and
        // prints the amount on the end of it. What it cannot show is where
        // the payer was left, which is the half a table actually argues over.
        notes.push(`${payer.name} is down to ${money(debited.money)}.`)
        transfers.push({ playerId: payer.id, playerName: payer.name, playerColor: payer.color, amount: -effect.amount })
      }
      players = replacePlayer(players, mover)
      const delta = mover.money - player.money
      const event: LandingEvent = {
        ...baseEvent(
          space,
          delta,
          notes,
          emphasisOf(delta),
          `Everybody pays up — ${player.name} is collecting!`,
        ),
        transfers,
      }
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
      const transfers: MoneyTransfer[] = []
      for (const recipient of recipients) {
        mover = debitPlayer(mover, effect.amount, economy)
        const credited = creditPlayer(recipient, effect.amount)
        players = replacePlayer(players, credited)
        // Same division as `collectFromEach`: the lane carries the amount,
        // the note carries where it left them.
        notes.push(`${recipient.name} is up to ${money(credited.money)}.`)
        transfers.push({
          playerId: recipient.id,
          playerName: recipient.name,
          playerColor: recipient.color,
          amount: effect.amount,
        })
      }
      players = replacePlayer(players, mover)
      const delta = mover.money - player.money
      const event: LandingEvent = {
        ...baseEvent(
          space,
          delta,
          notes,
          emphasisOf(delta),
          `The round is on ${player.name} — everybody else gets paid!`,
        ),
        transfers,
      }
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
            label: 'Roll',
            description: `${effect.reason} ${money(effect.perPip)} a pip you roll, 1 to ${SPIN_FACES} — higher is always better.`,
            icon: 'space:payday',
          },
        ],
      }
      const event = baseEvent(space, 0, [], 'normal', `${player.name} lines up for the roll.`)
      const log = appendLog(state, player.id, `${player.name} is up for a roll: ${effect.reason.toLowerCase()}`, 'event')
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
        `${player.name} is home free! Feet up, the hard part is over.`,
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
          description: `Put ${money(fireNumber)} into the fund and stop working today. One roll decides what it comes back as — anything from ${money(firePayoutPerPip)} to ${money(firePayoutPerPip * SPIN_FACES)} — and you take the next retirement place, forfeiting every payday still on the road.`,
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
          ? [`The fund costs ${money(fireNumber)}, and one roll decides what it comes back as.`]
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
      const [first, second] = deps.random
        .shuffle(pool)
        .slice(0, 2)
        .map((entry) => rungFor(entry, seniority, edition)) as [Career, Career]

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
      const options: DecisionOption[] = [
        {
          id: VALUE_SPIN_OPTION_ID,
          label: 'Roll',
          description: 'Roll to see which one you take.',
          icon: space.icon,
          table: careerOfferTable(first, second, currency, edition),
        },
      ]
      if (mayStay && player.career) {
        options.push({
          id: CAREER_STAY_OPTION_ID,
          label: `Stay as a ${player.career.title}`,
          description: hasCalling(player)
            ? 'This is the work you were made for. Let the recruiters talk to somebody else.'
            : 'Keep the job, the ladder, and every rung still above you.',
          icon: player.career.icon,
          detail: `${money(salaryRate(player.career.salary, currency))}/${salaryPeriod(currency)}`,
        })
      }

      const decision: Decision = {
        kind: 'valueSpin',
        prompt: mayStay
          ? `Two other trades would take you at the level you are on. ${currentIncomeNote(player, economy, currency)}`
          : `Your job is changing — pick your next one. ${currentIncomeNote(player, economy, currency)}`,
        options,
        offeredCareerIds: [first.id, second.id],
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
          [effect.reason],
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
          // The narration already says they cannot be laid off; the note is
          // here for the title that survived it.
          [effect.reason, `Still a ${player.career.title}, and nobody can take that away.`],
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
        // That every payday is shift work now is the narration's line; what
        // it cannot say is the job that was lost and what a shift is worth.
        [effect.reason, `No longer a ${lost}. Shifts pay ${money(economy.casualWagePerPip)} a pip.`],
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
        ...offered.map((stock) => {
          const [low, high] = stock.payoutRange
          return {
            id: stock.id,
            label: `${stock.name} (${stock.ticker})`,
            // Same reasoning as a house's own resale line: the price is
            // right there in `detail`, but what a share actually cashes out
            // at is buried in `payoutRange` and nowhere else a first-time
            // player would think to look.
            description: `${stock.description} Pays out ${money(low)}–${money(high)} a share at retirement.`,
            icon: stock.icon,
            detail: `${money(stock.price)} a share`,
          }
        }),
        {
          id: DECLINE_STOCK_OPTION_ID,
          label: 'Keep your cash',
          description: 'Nothing spent, and nothing paying out at retirement either.',
          icon: 'finance:trading-floor',
        },
      ]
      const decision: Decision = { kind: 'stock', prompt: 'Buy in now for a payout at retirement?', options }
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
          [effect.reason],
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
          [],
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
          description: 'Keep the premium, and pay the whole bill yourself if the worst turns up.',
          icon: 'finance:insurance-office',
        },
      ]
      const decision: Decision = { kind: 'insurance', prompt: 'A premium now, or the whole bill if it happens?', options }
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
          description: `Borrow ${money(economy.loanPrincipal)} now and pay back ${money(settlement)} at retirement — cash in hand for a house, shares, or a bill you cannot cover.`,
          icon: 'finance:bank-visit',
          detail: `+${money(economy.loanPrincipal)}`,
        },
      ]
      // Repaying early is only on the table when there is a debt and the cash to clear it.
      if (player.loans > 0 && player.money >= earlySettlement) {
        options.push({
          id: BANK_REPAY_OPTION_ID,
          label: 'Repay a loan early',
          description: `Clear one loan now for ${money(earlySettlement)} instead of ${money(settlement)} at retirement — ${money(settlement - earlySettlement)} that stays in your final total.`,
          icon: 'finance:bank-visit',
          detail: `-${money(earlySettlement)}`,
        })
      }
      options.push({
        id: BANK_DECLINE_OPTION_ID,
        label: 'Walk on by',
        description: 'No cash today, and nothing new owed at retirement.',
        icon: 'finance:bank-visit',
      })
      // The prompt carries the trade, not just the address: a player who has
      // never seen this tile should be able to weigh it without already
      // knowing what a loan costs here.
      const decision: Decision = { kind: 'bank', prompt: 'Cash now, or a smaller bill at retirement?', options }
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
          [effect.reason],
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
        // The note carries the multiplication, so the narration need only
        // land the total once.
        `${money(owed)} out the door. Family life is not cheap!`,
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
          [effect.reason],
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
        `That is ${money(gained)} in — the family pays off this time!`,
      )
      const log = appendLog(
        state,
        player.id,
        `${player.name} collects ${money(gained)} for ${player.children} children.`,
        'money-in',
      )
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    case 'divorce': {
      /*
       * Single players have nobody to separate from, so the tile passes them
       * by — same shape as `household`.
       */
      if (!player.isMarried) {
        const event = baseEvent(
          space,
          0,
          [effect.reason],
          'normal',
          `${player.name} has nobody to separate from. They walk on.`,
        )
        const log = appendLog(state, player.id, `${player.name} is not married, so there is nothing to end.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      const hadChildren = player.children
      const settled = debitPlayer(player, economy.divorceSettlement, economy)
      const updated = divorcePlayer(settled)
      const delta = updated.money - player.money
      const loansTaken = updated.loans - player.loans
      const notes = [effect.reason, `Settlement: ${money(economy.divorceSettlement)}`]
      if (hadChildren > 0) {
        const label = hadChildren === 1 ? 'child' : 'children'
        notes.push(`${hadChildren} ${label} leave with them.`)
      }
      if (loansTaken > 0) notes.push(borrowed(loansTaken))
      const event = baseEvent(
        space,
        delta,
        notes,
        emphasisOf(delta),
        `${player.name}'s marriage ends, and the house is a good deal quieter than it was.`,
      )
      const log = appendLog(state, player.id, `${player.name} divorces and pays a ${money(economy.divorceSettlement)} settlement.`, 'event')
      return { state: { ...state, players: replacePlayer(state.players, updated), log, pendingDecision: null }, event }
    }

    // --- upsets ------------------------------------------------------------

    case 'swapMoneyWithLeader': {
      const leader = rivalsOf(state, player).reduce<Player | null>(
        (best, other) => (best === null || other.money > best.money ? other : best),
        null,
      )

      if (!leader || leader.money <= player.money) {
        const event = baseEvent(
          space,
          0,
          [effect.reason],
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
      const event: LandingEvent = {
        ...baseEvent(
          space,
          delta,
          // Whose wallet, and how much of a jump it is, are the narration's
          // and the lane's; the note is the two figures that traded places.
          [effect.reason, `Wallets swapped: ${money(player.money)} ↔ ${money(leader.money)}`],
          'big',
          `Swap! ${player.name} takes ${leader.name}'s wallet, and the whole board just changed shape!`,
        ),
        transfers: [
          { playerId: leader.id, playerName: leader.name, playerColor: leader.color, amount: -delta },
        ],
      }
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
          [effect.reason],
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
          // Which tile, and off whom, are the narration's own sentence — and
          // the tile itself is dealt as a chip above. What neither shows is
          // what it will be worth at the final count.
          [effect.reason, `Worth ${money(tile.value)} at the final count.`],
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
          prompt: 'Nothing to trade up — buy your first, and sell it at retirement?',
          options: houseDecisionOptions(offered, 'Keep renting for now', 'Keep the cash, and own nothing to sell at retirement.', currency),
        }
        const event = baseEvent(
          space,
          0,
          [],
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
          [],
          'normal',
          `There is nothing left to trade up to — ${player.name} already owns the best address in town!`,
        )
        const log = appendLog(state, player.id, `${player.name} already owns the best home available.`, 'info')
        return { state: { ...state, log, pendingDecision: null }, event }
      }

      const offered = deps.random.shuffle(better).slice(0, 3)
      const decision: Decision = {
        kind: 'house',
        prompt: `Trade up from the ${current.name}? A dearer house sells for more`,
        options: houseDecisionOptions(
          offered,
          `Stay in the ${current.name}`,
          'Keep the home you have, and whatever it already sells for at retirement.',
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
