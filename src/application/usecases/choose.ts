import type { GameState, LandingEmphasis, LandingEvent, LogTone, Money, Player, Space, SpinValue } from '@domain/model/types'
import { SHARES_PER_PURCHASE } from '@domain/model/constants'
import { planMovementVia } from '@domain/board/movement'
import { editionOf } from '@domain/edition/registry'
import { findCareer, findHouse, findStock, nextRungOf } from '@domain/edition/lookup'
import { earlyLoanRepaymentFor, loanRepaymentFor } from '@domain/rules/difficulty'
import { marriageBandFor } from '@domain/rules/marriage'
import {
  addInsurance,
  addLifeTiles,
  applyPayRaise,
  buyHouse as buyHouseForPlayer,
  buyShares,
  creditPlayer,
  debitPlayer,
  expectedPayday,
  marryPlayer,
  movePlayerTo,
  paydayKindOf,
  paydayPayFor,
  payPlayerSalary,
  promoteCareer,
  repayLoan,
  retirePlayer,
  switchCareer,
  takeLoan,
  tradeUpHouse,
} from '@domain/rules/player'
import {
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
  emphasisForMoney,
  insuranceKindFromOptionId,
  rivalsOf,
} from './applyEffect'
import { formatMoney, loanNote, raiseNote, salaryPeriod, salaryRate } from './format'
import { appendLog } from './logging'
import { collectPaydays, passedPaydayLine } from './payday'
import type { UseCaseDeps } from './types'

function replacePlayer(players: readonly Player[], updated: Player): readonly Player[] {
  return players.map((player) => (player.id === updated.id ? updated : player))
}

/** The space the deciding player is standing on, if the board still knows about it. */
function currentSpace(state: GameState, player: Player): Space | undefined {
  return state.board.spaces[player.spaceId]
}

function outcomeEvent(
  space: Space | undefined,
  player: Player,
  fallbackTitle: string,
  moneyDelta: Money,
  notes: readonly string[],
  emphasis: LandingEmphasis,
  narration: string,
): LandingEvent {
  return {
    spaceId: space?.id ?? player.spaceId,
    title: space?.title ?? fallbackTitle,
    description: space?.description ?? '',
    icon: space?.icon ?? 'space:payday',
    tone: space?.tone ?? 'blue',
    moneyDelta,
    lifeTilesGained: [],
    notes,
    emphasis,
    narration,
  }
}

/** Every non-branch decision lands the turn: the answer *is* the event. */
function resolved(state: GameState, players: readonly Player[], event: LandingEvent, logMessage: string, tone: LogTone): GameState {
  const player = state.players[state.currentPlayerIndex]
  return {
    ...state,
    players,
    pendingDecision: null,
    lastEvent: event,
    phase: 'resolved',
    movementPath: [],
    stepsRemaining: 0,
    log: appendLog(state, player?.id ?? null, logMessage, tone),
  }
}

function resolveBranch(state: GameState, optionId: string, deps: UseCaseDeps): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')

  /*
   * Chosen before the wheel was spun: commit to the road and hand the turn to
   * the spinner. Picking after the number is known let a player take whichever
   * lane happened to land them well, which is a cheap advantage — the road is
   * chosen first, then the wheel decides how far down it you get.
   */
  if (state.stepsRemaining === 0) {
    const target = state.board.spaces[optionId]
    const log = appendLog(
      state,
      player.id,
      `${player.name} takes ${target?.lane?.name ?? target?.title ?? 'the road ahead'}.`,
      'info',
    )
    return {
      ...state,
      pendingDecision: null,
      chosenExit: optionId,
      phase: 'awaitingSpin',
      movementPath: [],
      log,
    }
  }

  const plan = planMovementVia(state.board, player.spaceId, optionId, state.stepsRemaining)

  let movedPlayer = movePlayerTo(player, plan.destinationId)
  let log = appendLog(state, player.id, `${player.name} heads toward ${plan.destinationId}.`, 'info')

  if (plan.paydaysPassed > 0) {
    // Same rule as `spin`: one roll per payday, because they are separate weeks.
    const collection = collectPaydays(movedPlayer, plan.paydaysPassed, deps, editionOf(state).economy)
    movedPlayer = collection.player
    if (collection.total !== 0) {
      log = appendLog({ ...state, log }, player.id, passedPaydayLine(player.name, collection, editionOf(state).currency), 'money-in')
    }
  }

  return {
    ...state,
    players: replacePlayer(state.players, movedPlayer),
    pendingDecision: null,
    movementPath: plan.path,
    stepsRemaining: plan.stepsRemaining,
    phase: 'moving',
    log,
  }
}

function resolveCareer(state: GameState, optionId: string): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  /*
   * Staying put. Nothing changes, and nothing is supposed to: the value of
   * this answer is the ladder the player keeps, which they already have.
   */
  if (optionId === CAREER_STAY_OPTION_ID) {
    const staying = player.career
    if (!staying) throw new Error('choose: nothing to stay in')
    const event = outcomeEvent(
      space,
      player,
      'Staying Put',
      0,
      [
        `Still a ${staying.title}, on ${money(salaryRate(staying.salary, currency))} a ${salaryPeriod(currency)}.`,
        'Every rung still above you is still yours to climb.',
      ],
      'normal',
      `${player.name} turns them both down. They like it here, and there is further to go yet.`,
    )
    return resolved(state, state.players, event, `${player.name} stays a ${staying.title}.`, 'info')
  }

  const career = findCareer(optionId, edition)
  if (!career) throw new Error(`choose: unknown career option "${optionId}"`)

  const previous = player.career
  // Raises follow the player, not the job title they happened to earn them in.
  const updated = switchCareer(player, career, previous ? findCareer(previous.id, edition) : undefined)
  const taken = updated.career ?? career

  /*
   * No signing bonus, and that was measured rather than assumed.
   *
   * Paying one full payday for moving made moving correct every time — the
   * computer took it in 150 of 160 seats — and it inflated the whole economy
   * by a payday per career fair per player. What makes moving worth
   * considering instead is the *ladder*: an offer is dealt at the rung you
   * already stand on, and the trade underneath it may be two rungs taller than
   * the one you are on, or one rung shorter. Same money today, a different
   * ceiling. That is a real question and it costs the economy nothing.
   */
  const notes = [
    `${player.name} becomes a ${taken.title}!`,
    `${money(salaryRate(taken.salary, currency))} every ${salaryPeriod(currency)}.`,
  ]

  const narration = previous
    ? `Out with the old! ${player.name} leaves the ${previous.title} life behind to become a ${taken.title}.`
    : `${player.name} is hired as a ${taken.title} — the paydays start counting now!`
  const event = outcomeEvent(space, player, 'New Career', 0, notes, 'milestone', narration)

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    `${player.name} chooses to become a ${taken.title}.`,
    'milestone',
  )
}

function resolveHouse(state: GameState, optionId: string): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  if (optionId === DECLINE_HOUSE_OPTION_ID) {
    const staying = player.house
    const event = outcomeEvent(
      space,
      player,
      'House Hunting',
      0,
      [staying ? `Staying put in the ${staying.name}.` : 'Decided to keep renting for now.'],
      'normal',
      staying
        ? `${player.name} likes the ${staying.name} just fine, thank you very much.`
        : `${player.name} keeps renting — that cash might be worth more elsewhere!`,
    )
    return resolved(
      state,
      state.players,
      event,
      staying ? `${player.name} stays in the ${staying.name}.` : `${player.name} keeps renting for now.`,
      'info',
    )
  }

  const house = findHouse(optionId, edition)
  if (!house) throw new Error(`choose: unknown house option "${optionId}"`)

  const previous = player.house
  // A trade-up credits the old home at its list price; a first purchase does not.
  const updated = previous ? tradeUpHouse(player, house, economy) : buyHouseForPlayer(player, house, economy)
  const delta = updated.money - player.money
  const loansTaken = updated.loans - player.loans

  const notes = previous
    ? [`Traded the ${previous.name} for the ${house.name}.`, `Old home credited back at ${money(previous.price)}.`]
    : [`Bought the ${house.name}!`]
  if (loansTaken > 0) {
    notes.push(
      loanNote(loansTaken, economy.loanPrincipal, loanRepaymentFor(state.difficulty, edition), currency),
    )
  }

  const narration = previous
    ? `Moving up in the world! ${player.name} trades the ${previous.name} for the ${house.name}.`
    : `${player.name} gets the keys to the ${house.name} — a home of their own at last!`

  const event = outcomeEvent(space, player, 'New Home', delta, notes, emphasisForMoney(delta, economy), narration)

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    previous
      ? `${player.name} trades up to the ${house.name}.`
      : `${player.name} buys the ${house.name}.`,
    'milestone',
  )
}

function resolveStock(state: GameState, optionId: string): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  if (optionId === DECLINE_STOCK_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      'Trading Floor',
      0,
      ['Kept the cash instead.'],
      'normal',
      `${player.name} keeps their money in their pocket. Cautious — but nobody ever lost it that way!`,
    )
    return resolved(state, state.players, event, `${player.name} passes on the shares.`, 'info')
  }

  const stock = findStock(optionId, edition)
  if (!stock) throw new Error(`choose: unknown stock option "${optionId}"`)

  const updated = buyShares(player, stock, SHARES_PER_PURCHASE, economy)
  const delta = updated.money - player.money
  const loansTaken = updated.loans - player.loans
  const shareLabel = SHARES_PER_PURCHASE === 1 ? 'share' : 'shares'

  const notes = [
    `Bought ${SHARES_PER_PURCHASE} ${shareLabel} of ${stock.name} (${stock.ticker}).`,
    `Each share cashes out between ${money(stock.payoutRange[0])} and ${money(stock.payoutRange[1])} at retirement.`,
  ]
  if (loansTaken > 0) {
    notes.push(
      loanNote(loansTaken, economy.loanPrincipal, loanRepaymentFor(state.difficulty, edition), currency),
    )
  }

  const event = outcomeEvent(
    space,
    player,
    'Trading Floor',
    delta,
    notes,
    emphasisForMoney(delta, economy),
    `${player.name} buys into ${stock.ticker}! We find out at retirement whether that was genius or nerve.`,
  )

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    `${player.name} buys ${SHARES_PER_PURCHASE} ${shareLabel} of ${stock.ticker} for ${money(Math.abs(delta))}.`,
    'money-out',
  )
}

function resolveInsurance(state: GameState, optionId: string): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  if (optionId === DECLINE_INSURANCE_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      'Insurance Office',
      0,
      ['Left the office uninsured.'],
      'normal',
      `${player.name} takes the risk and walks out uninsured. Fingers crossed!`,
    )
    return resolved(state, state.players, event, `${player.name} declines a policy.`, 'info')
  }

  const kind = insuranceKindFromOptionId(optionId)
  if (!kind) throw new Error(`choose: unknown insurance option "${optionId}"`)

  const updated = addInsurance(player, kind, economy)
  const delta = updated.money - player.money
  const loansTaken = updated.loans - player.loans

  const notes = [`Took out a ${kind} policy for ${money(economy.insurancePremium[kind])}.`]
  if (kind === 'life') notes.push('It matures at retirement and pays straight into the final total.')
  else notes.push(`A ${kind === 'home' ? 'house fire' : 'road accident'} now costs you nothing.`)
  if (loansTaken > 0) {
    notes.push(
      loanNote(loansTaken, economy.loanPrincipal, loanRepaymentFor(state.difficulty, edition), currency),
    )
  }

  const event = outcomeEvent(
    space,
    player,
    'Insurance Office',
    delta,
    notes,
    emphasisForMoney(delta, economy),
    `${player.name} is covered! That premium could look very clever indeed before the night is out.`,
  )

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    `${player.name} takes out ${kind} insurance for ${money(economy.insurancePremium[kind])}.`,
    'money-out',
  )
}

function resolveBank(state: GameState, optionId: string): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  if (optionId === BANK_DECLINE_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      'The Bank',
      0,
      ['No business at the bank today.'],
      'normal',
      `${player.name} walks straight past the bank. No debts, no drama.`,
    )
    return resolved(state, state.players, event, `${player.name} leaves the bank empty-handed.`, 'info')
  }

  if (optionId === BANK_LOAN_OPTION_ID) {
    const updated = takeLoan(player, economy)
    const delta = updated.money - player.money
    const event = outcomeEvent(
      space,
      player,
      'The Bank',
      delta,
      [`Borrowed ${money(economy.loanPrincipal)}.`, `Now carrying ${updated.loans} loan${updated.loans > 1 ? 's' : ''}.`],
      emphasisForMoney(delta, economy),
      `${money(economy.loanPrincipal)} of the bank's money for ${player.name} — spend it well, it wants more back!`,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} takes out a loan: ${money(economy.loanPrincipal)}.`,
      'money-in',
    )
  }

  if (optionId === BANK_REPAY_OPTION_ID) {
    const earlySettlement = earlyLoanRepaymentFor(state.difficulty, edition)
    const updated = repayLoan(player, earlySettlement, economy)
    const delta = updated.money - player.money
    const event = outcomeEvent(
      space,
      player,
      'The Bank',
      delta,
      [
        `Repaid one loan for ${money(earlySettlement)}.`,
        updated.loans === 0 ? 'Debt free!' : `${updated.loans} loan${updated.loans > 1 ? 's' : ''} still outstanding.`,
      ],
      emphasisForMoney(delta, economy),
      updated.loans === 0
        ? `Debt free! ${player.name} clears the last loan and walks out of that bank standing tall.`
        : `${player.name} chips a loan off the pile — cheaper now than it would be at retirement.`,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} repays a loan early for ${money(earlySettlement)}.`,
      'money-out',
    )
  }

  throw new Error(`choose: unknown bank option "${optionId}"`)
}

/** Promotion review: pass/fail, and a possible second rung, from one press. */
function resolvePromotionSpin(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  edition: ReturnType<typeof editionOf>,
  money: (amount: Money) => string,
): GameState {
  const career = player.career
  if (!career) throw new Error('choose: promotion spin with no career')
  const next = nextRungOf(career, edition)
  if (!next) throw new Error('choose: promotion spin with nobody to promote to')
  const needed = career.promotionSpin ?? DEFAULT_PROMOTION_SPIN

  if (spinValue < needed) {
    // Never a dead tile: passed over is still a raise.
    const raised = applyPayRaise(player)
    const newSalary = raised.career?.salary ?? career.salary
    const event = outcomeEvent(
      space,
      player,
      'Review',
      0,
      [
        `Spun a ${spinValue}, and ${needed} was the bar — the ${next.title} job goes to somebody else.`,
        edition.currency.salaryDisplay
          ? raiseNote(career.salary, newSalary, edition.currency)
          : `A raise anyway: ${money(newSalary)}`,
      ],
      'normal',
      `A ${spinValue}. Not this time, ${player.name} — but they find you a raise on the way out of the room.`,
    )
    return resolved(
      state,
      replacePlayer(state.players, raised),
      event,
      `${player.name} spins a ${spinValue} and is passed over for ${next.title}, taking a rise to ${money(salaryRate(newSalary, edition.currency))} a ${salaryPeriod(edition.currency)}.`,
      'event',
    )
  }

  let promoted = promoteCareer(player, next)
  const twoAtOnce = spinValue >= DOUBLE_PROMOTION_SPIN ? nextRungOf(next, edition) : undefined
  if (twoAtOnce) promoted = promoteCareer(promoted, twoAtOnce)
  const arrived = promoted.career ?? next
  const notes = [
    `Spun a ${spinValue} against a bar of ${needed}.`,
    twoAtOnce
      ? `Two rungs in one morning: ${career.title} straight to ${arrived.title}.`
      : `${career.title} no longer — you are a ${arrived.title}.`,
    `${money(salaryRate(arrived.salary, edition.currency))} every ${salaryPeriod(edition.currency)}.`,
  ]
  const event = outcomeEvent(
    space,
    player,
    'Review',
    0,
    notes,
    'milestone',
    twoAtOnce
      ? `A ten! They skip a whole rung — ${player.name} is a ${arrived.title}, and the room is not sure what just happened.`
      : `Promoted! ${player.name} is a ${arrived.title} now, on ${money(salaryRate(arrived.salary, edition.currency))} a ${salaryPeriod(edition.currency)}.`,
  )
  return resolved(
    state,
    replacePlayer(state.players, promoted),
    event,
    `${player.name} spins a ${spinValue} and is promoted to ${arrived.title}: ${money(salaryRate(arrived.salary, edition.currency))} a ${salaryPeriod(edition.currency)}.`,
    'milestone',
  )
}

/** Marriage: whether, then which, both from one press — see `applyEffect`'s 'getMarried' case for why. */
function resolveMarriageSpin(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  deps: UseCaseDeps,
  edition: ReturnType<typeof editionOf>,
  money: (amount: Money) => string,
): GameState {
  const { economy } = edition
  const { marriage } = economy
  const asked = spinValue
  const askedAgain = asked >= marriage.proposalSpin ? null : deps.random.spin()

  if (askedAgain !== null && askedAgain < marriage.secondAskSpin) {
    const tiles = deps.random.shuffle(edition.lifeTiles).slice(0, 1)
    const updated = addLifeTiles(player, tiles)
    const event: LandingEvent = {
      ...outcomeEvent(
        space,
        player,
        'Wedding Day',
        0,
        [
          `Spun a ${asked}, then a ${askedAgain} — not this year, and not next year either.`,
          'Single, and the road ahead is entirely yours: children, Family Lane and every bonus on it are still open.',
          ...tiles.map((tile) => tile.title),
        ],
        'milestone',
        `A ${asked} and then a ${askedAgain}! No wedding for ${player.name} — so they spend the year on themselves instead, and it makes a far better story.`,
      ),
      lifeTilesGained: tiles,
    }
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} spins a ${asked} and a ${askedAgain}: no wedding, but a LIFE tile out of the year.`,
      'event',
    )
  }

  /*
   * Which marriage, not merely whether. The wheel that decided they said yes
   * decides what it cost: a rescued proposal arrives with somebody else's
   * debts, a low first ask is a reception nobody budgeted for, and only the
   * top of the wheel is the marriage everybody pictures.
   */
  const outcome = askedAgain !== null ? marriage.rescued : marriageBandFor(marriage.outcomes, asked)
  const gift = Math.round(economy.weddingGift * outcome.giftMultiplier)
  const payers = rivalsOf(state, player)

  let players = state.players
  let mover = marryPlayer(player)
  const notes: string[] = [
    askedAgain !== null
      ? `Spun a ${asked}, asked again, spun a ${askedAgain} — and this time, yes.`
      : `Spun a ${asked}.`,
    outcome.note,
  ]

  for (const payer of payers) {
    players = replacePlayer(players, debitPlayer(payer, gift, economy))
    mover = creditPlayer(mover, gift)
    notes.push(`${payer.name} pays a ${money(gift)} wedding gift.`)
  }
  if (outcome.windfall > 0) {
    mover = creditPlayer(mover, outcome.windfall)
    notes.push(`Two incomes: ${money(outcome.windfall)}`)
  }
  if (outcome.cost > 0) {
    mover = debitPlayer(mover, outcome.cost, economy)
    notes.push(`The bill for it all: ${money(-outcome.cost)}`)
  }
  players = replacePlayer(players, mover)

  const delta = mover.money - player.money
  const narration =
    delta < 0
      ? `Married! And already ${money(-delta)} down, ${player.name} — nobody tells you about that part.`
      : payers.length === 0
        ? `Wedding bells for ${player.name} — a quiet ceremony, but a very happy one.`
        : outcome.giftMultiplier > 1
          ? `The wedding of the year! Everybody at this table is paying for it, ${player.name}.`
          : `Wedding bells for ${player.name}! Everybody else, hand over those gift envelopes.`
  const event = outcomeEvent(space, player, 'Wedding Day', delta, notes, 'milestone', narration)
  return resolved(
    state,
    players,
    event,
    delta < 0
      ? `${player.name} gets married, and is ${money(-delta)} worse off for it.`
      : `${player.name} gets married!`,
    'milestone',
  )
}

/** The joint account, settled up: one spin, one statement. */
function resolveHouseholdSpin(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  edition: ReturnType<typeof editionOf>,
  money: (amount: Money) => string,
): GameState {
  const { economy } = edition
  const { household } = economy
  const amount = Math.round(
    (spinValue - household.breakEvenSpin) * expectedPayday(player, economy) * household.shareOfPayday,
  )
  const updated = amount >= 0 ? creditPlayer(player, amount) : debitPlayer(player, -amount, economy)
  const delta = updated.money - player.money

  const notes =
    amount < 0
      ? [`Spun a ${spinValue} — the spending outran the account: ${money(delta)}`]
      : amount === 0
        ? [`Spun a ${spinValue} — the account comes out exactly level.`]
        : [`Spun a ${spinValue} — two incomes carried it: ${money(delta)}`]
  const narration =
    amount < 0
      ? `A ${spinValue}, and your partner has been shopping, ${player.name}. ${money(delta)}.`
      : amount === 0
        ? `A ${spinValue}, and the joint account lands exactly where it started. Nobody wins that argument.`
        : `A ${spinValue}! Two incomes and a good month — ${money(delta)} for ${player.name}.`

  const event = outcomeEvent(space, player, 'The Joint Account', delta, notes, emphasisForMoney(delta, economy), narration)
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    amount < 0
      ? `${player.name}'s joint account takes a hit, spinning a ${spinValue}: ${money(delta)}.`
      : `${player.name}'s household comes out ahead, spinning a ${spinValue}: ${money(delta)}.`,
    amount < 0 ? 'money-out' : 'money-in',
  )
}

/**
 * The roll every wheel-decided tile held back until now — a `spinForMoney`
 * tile, an unsteady payday, a promotion review, a marriage proposal, or the
 * joint account. `applyEffect` named the stakes and stopped there in every
 * case; the roll itself waits for the player to press the one button this
 * decision offers, so the number that decides it is one they asked the wheel
 * for rather than one the game already knew before they saw the card.
 */
function resolveValueSpin(state: GameState, optionId: string, deps: UseCaseDeps): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  if (optionId !== VALUE_SPIN_OPTION_ID) throw new Error(`choose: unknown value-spin option "${optionId}"`)

  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)
  const spinValue = deps.random.spin()

  if (space?.effect.type === 'spinForMoney') {
    const gain = space.effect.perPip * spinValue
    const updated = creditPlayer(player, gain)
    const delta = updated.money - player.money
    const event = outcomeEvent(
      space,
      player,
      'Spin',
      delta,
      [space.effect.reason, `Rolled a ${spinValue} → ${money(gain)}`],
      emphasisForMoney(delta, economy),
      `${player.name} spins a ${spinValue} — and that is worth ${money(gain)}!`,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${space.effect.reason} ${player.name} spins a ${spinValue}: ${money(gain)}.`,
      gain >= 0 ? 'money-in' : 'money-out',
    )
  }

  if (space?.effect.type === 'promotion') {
    return resolvePromotionSpin(state, player, space, spinValue, edition, money)
  }

  if (space?.effect.type === 'getMarried') {
    return resolveMarriageSpin(state, player, space, spinValue, deps, edition, money)
  }

  if (space?.effect.type === 'household') {
    return resolveHouseholdSpin(state, player, space, spinValue, edition, money)
  }

  if (space?.effect.type === 'haveChildren') {
    const gain = space.effect.celebrationPerPip * spinValue
    const updated = creditPlayer(player, gain)
    const delta = updated.money - player.money
    const event = outcomeEvent(
      space,
      player,
      'Gift Envelopes',
      delta,
      [`Rolled a ${spinValue} → ${money(gain)}`],
      emphasisForMoney(delta, economy),
      `The gift envelopes add up to ${money(gain)} for ${player.name}!`,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} spins ${spinValue} for the gift envelopes: ${money(gain)}.`,
      'money-in',
    )
  }

  // Otherwise this is a payday — casual or unsteady, the only two kinds that
  // reach a value-spin decision at all (a flat salary never raises one).
  const amount = paydayPayFor(player, spinValue, economy)
  const updated = payPlayerSalary(player, spinValue, economy)
  const delta = updated.money - player.money
  const kind = paydayKindOf(player)
  const notes =
    kind === 'casual'
      ? ['Between jobs, so you pick up shifts.', `Spun ${spinValue} → ${money(amount)}`]
      : [`${player.career?.title ?? 'Your trade'} — no two weeks pay the same.`, `Spun ${spinValue} → ${money(amount)}`]
  const narration =
    kind === 'casual'
      ? `No job, but no wasted week either — ${player.name} picks up shifts and spins ${spinValue} for ${money(amount)}.`
      : `A ${spinValue} on the wheel, and that is what the week was worth: ${money(amount)} for ${player.name}.`
  const logMessage =
    kind === 'casual'
      ? `${player.name} picks up casual shifts, spinning ${spinValue}: ${money(amount)}.`
      : `${player.name} collects payday, spinning ${spinValue}: ${money(amount)}.`
  const event = outcomeEvent(space, player, 'Payday', delta, notes, emphasisForMoney(delta, economy), narration)
  return resolved(state, replacePlayer(state.players, updated), event, logMessage, 'money-in')
}

/**
 * Financial independence, taken or refused.
 *
 * Taking it does three things at once and all three are the point: the fund is
 * realised on a single spin, so nobody knows what stopping was worth until
 * they have stopped; the player takes the next retirement place, which is the
 * bonus the whole board races for; and their pawn goes straight to retirement,
 * forfeiting every payday, windfall and disaster between here and the end. A
 * player who is ahead is buying safety. A player who is behind is throwing
 * away the only stretch of road long enough to catch up on.
 */
function resolveRetireEarly(state: GameState, optionId: string, deps: UseCaseDeps): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  if (optionId === FIRE_DECLINE_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      'The Number',
      0,
      ['One more year, then.'],
      'normal',
      `${player.name} decides the number can wait. There is road left, and road pays.`,
    )
    return resolved(state, state.players, event, `${player.name} keeps working.`, 'info')
  }

  if (optionId !== FIRE_RETIRE_OPTION_ID) {
    throw new Error(`choose: unknown early retirement option "${optionId}"`)
  }

  const spin = deps.random.spin()
  const payout = economy.firePayoutPerPip * spin
  const staked = debitPlayer(player, economy.fireNumber, economy)
  const rank = state.players.filter((candidate) => candidate.isRetired).length + 1
  const updated = retirePlayer(
    movePlayerTo(creditPlayer(staked, payout), state.board.retirementSpaceId),
    rank,
  )
  const delta = updated.money - player.money

  const event = outcomeEvent(
    space,
    player,
    'The Number',
    delta,
    [
      `${money(economy.fireNumber)} into the fund.`,
      `Spun a ${spin}: it comes back as ${money(payout)}.`,
      `Retirement rank #${rank}, and every payday still on the road belongs to somebody else now.`,
    ],
    'milestone',
    spin >= 8
      ? `A ${spin}! The fund comes back at ${money(payout)} and ${player.name} never works another day. That is how it is done.`
      : spin <= 4
        ? `A ${spin}. The fund comes back at ${money(payout)} — less than went into it. ${player.name} stopped a year too soon, and there is no going back.`
        : `${player.name} stops working for good. The fund returns ${money(payout)}, and that is retirement place number ${rank}.`,
  )

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    `${player.name} retires early: ${money(economy.fireNumber)} into the fund, a spin of ${spin}, ${money(payout)} back.`,
    'milestone',
  )
}

/** Answers `state.pendingDecision`, dispatching on its `kind`. */
export function choose(state: GameState, optionId: string, deps: UseCaseDeps): GameState {
  if (state.phase !== 'awaitingDecision' || !state.pendingDecision) {
    throw new Error(`choose: only valid in 'awaitingDecision', got '${state.phase}'`)
  }

  const validOption = state.pendingDecision.options.some((option) => option.id === optionId)
  if (!validOption) {
    throw new Error(`choose: "${optionId}" is not one of the offered options`)
  }

  switch (state.pendingDecision.kind) {
    case 'branch':
      return resolveBranch(state, optionId, deps)
    case 'career':
      return resolveCareer(state, optionId)
    case 'house':
      return resolveHouse(state, optionId)
    case 'stock':
      return resolveStock(state, optionId)
    case 'insurance':
      return resolveInsurance(state, optionId)
    case 'bank':
      return resolveBank(state, optionId)
    case 'retire':
      return resolveRetireEarly(state, optionId, deps)
    case 'valueSpin':
      return resolveValueSpin(state, optionId, deps)
    default: {
      const exhaustive: never = state.pendingDecision.kind
      throw new Error(`choose: unhandled decision kind ${JSON.stringify(exhaustive)}`)
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
  FIRE_DECLINE_OPTION_ID,
  FIRE_RETIRE_OPTION_ID,
}
