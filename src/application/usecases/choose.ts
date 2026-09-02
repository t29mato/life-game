import type {
  GameState,
  LandingEmphasis,
  LandingEvent,
  LogTone,
  Money,
  Player,
  Space,
  SpinValue,
} from '@domain/model/types'
import type { CurrencySpec } from '@domain/edition/types'
import { SHARES_PER_PURCHASE, SPIN_FACES } from '@domain/model/constants'
import { nextMovementLeg, planMovementVia } from '@domain/board/movement'
import { editionOf } from '@domain/edition/registry'
import { findCareer, findHouse, findStock, nextRungOf, tradeYearStoriesFor } from '@domain/edition/lookup'
import { earlyLoanRepaymentFor, loanRepaymentFor } from '@domain/rules/difficulty'
import { marriageBandFor } from '@domain/rules/marriage'
import { tuitionBandFor, tuitionSpecFor } from '@domain/rules/tuition'
import { tradeFamilyOf, tradeYearFor } from '@domain/rules/tradeYear'
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
import { withBalanceAfter } from './balanceAfter'
import { withStandingChange } from './standingChange'
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
  // The one way out for every answered decision, so it is also the one place
  // that needs to report the balance the answer left behind — `players` here
  // is already the post-decision roster. See `withBalanceAfter`.
  const withBalance = player ? withBalanceAfter(event, players, player.id) : event
  const settled = player
    ? withStandingChange(withBalance, state.players, players, player.id, state.difficulty, state.editionId)
    : withBalance
  return {
    ...state,
    players,
    pendingDecision: null,
    lastEvent: settled,
    phase: 'resolved',
    movementPath: [],
    pendingPath: [],
    stepsRemaining: 0,
    log: appendLog(state, player?.id ?? null, logMessage, tone),
  }
}

function resolveBranch(state: GameState, optionId: string, _deps: UseCaseDeps): GameState {
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
      pendingPath: [],
      log,
    }
  }

  const plan = planMovementVia(state.board, player.spaceId, optionId, state.stepsRemaining)
  const movedPlayer = movePlayerTo(player, plan.destinationId)
  const log = appendLog(state, player.id, `${player.name} heads toward ${plan.destinationId}.`, 'info')

  /*
   * Left for `settle` to drain, same as every other leg of a move — see
   * `PassedQueueItem` in `types.ts`. `resolveBranch` itself is unreachable
   * in the live path (`turnStart` never raises a `branch` decision any
   * more — see `branch.ts`), kept only as the same defensive fallback
   * `settle.ts`'s own dead branch is.
   */
  const { leg, rest } = nextMovementLeg(plan.path, plan.passed)

  return {
    ...state,
    players: replacePlayer(state.players, movedPlayer),
    pendingDecision: null,
    pendingPassedItems: plan.passed,
    movementPath: leg,
    pendingPath: rest,
    stepsRemaining: plan.stepsRemaining,
    phase: 'moving',
    log,
  }
}

/**
 * Staying put. Nothing changes, and nothing is supposed to: the value of
 * this answer is the ladder the player keeps, which they already have. The
 * only decline in a value-spin decision, and the only one that never turns
 * the wheel — same as every other decline in the game.
 */
function resolveCareerStay(
  state: GameState,
  player: Player,
  space: Space | undefined,
  currency: CurrencySpec,
  money: (amount: Money) => string,
): GameState {
  const staying = player.career
  if (!staying) throw new Error('choose: nothing to stay in')
  const event = outcomeEvent(
    space,
    player,
    'Staying Put',
    0,
    // The ladder they keep is the narration's whole point; the note carries
    // the one thing it does not say — what the job actually pays.
    [`Still a ${staying.title}, on ${money(salaryRate(staying.salary, currency))} a ${salaryPeriod(currency)}.`],
    'normal',
    `${player.name} turns them both down. They like it here, and there is further to go yet.`,
  )
  return resolved(state, state.players, event, `${player.name} stays a ${staying.title}.`, 'info')
}

/**
 * Which of the two offers `applyEffect` dealt — the low half of the die for
 * the first, the high half for the second, both read off `offeredCareerIds` since the space's
 * own `effect` is static route data and cannot hold a per-instance draw.
 */
function resolveCareerSpin(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  edition: ReturnType<typeof editionOf>,
  money: (amount: Money) => string,
): GameState {
  const offeredIds = state.pendingDecision?.offeredCareerIds
  if (!offeredIds) throw new Error('choose: career spin with no offers on the table')
  const pickedId = spinValue <= SPIN_FACES / 2 ? offeredIds[0] : offeredIds[1]
  const career = findCareer(pickedId, edition)
  if (!career) throw new Error(`choose: unknown career option "${pickedId}"`)

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
  // The card prints the die itself and the narration names the job, so the
  // only thing left to say is the wage.
  const notes = [`${money(salaryRate(taken.salary, edition.currency))} every ${salaryPeriod(edition.currency)}.`]

  const narration = previous
    ? `Out with the old — ${player.name} leaves the ${previous.title} life behind to become a ${taken.title}.`
    : `${player.name} is hired as a ${taken.title} — the paydays start counting now!`
  const event = outcomeEvent(space, player, 'New Career', 0, notes, 'milestone', narration)

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    `${player.name} rolls a ${spinValue} and becomes a ${taken.title}.`,
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
      // Nothing moved and nothing changed hands: the narration is the whole
      // of it, and a note repeating it back was the only thing here.
      [],
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

  // Which house, and which house it replaced, are the narration's own
  // sentence — what it cannot say is what the old place was credited at.
  const notes: string[] = previous ? [`Old home credited back at ${money(previous.price)}.`] : []
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
      [],
      'normal',
      `${player.name} keeps their money in their pocket — nobody ever lost it that way.`,
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
      [],
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
    `${player.name} is covered, and that premium could look very clever before the game is out.`,
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
      [],
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
      // How much was borrowed is on the delta plate and in the narration
      // both; how deep the pile now is, is neither.
      [`Now carrying ${updated.loans} loan${updated.loans > 1 ? 's' : ''}.`],
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
      // "Debt free!" is the narration's line when the pile clears; the note
      // only speaks when there is a pile left to count.
      updated.loans === 0
        ? [`Repaid one loan for ${money(earlySettlement)}.`]
        : [
            `Repaid one loan for ${money(earlySettlement)}.`,
            `${updated.loans} loan${updated.loans > 1 ? 's' : ''} still outstanding.`,
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

/** The tuition bill: one spin, one band, from the edition's own `tuition.outcomes`. */
function resolveTuitionSpin(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  edition: ReturnType<typeof editionOf>,
  money: (amount: Money) => string,
): GameState {
  const { economy } = edition
  // Which of the two bills this tile is sending — the tile says so, and
  // `applyEffect` printed the same spec's bands before the press.
  const bill = space?.effect.type === 'tuition' ? space.effect.bill : undefined
  const band = tuitionBandFor(tuitionSpecFor(bill, economy).outcomes, spinValue)
  const updated = band.cost > 0 ? debitPlayer(player, band.cost, economy) : player
  const delta = updated.money - player.money
  const loansTaken = updated.loans - player.loans

  /*
   * Three facts, one home each. The die is printed on the card itself; the
   * band's own line is the colour and says it once; the bill gets a note of
   * its own because it is the one number the delta plate cannot be trusted
   * for — a player who cannot cover it is topped up by the bank, so the
   * plate reads the cash that actually moved, not what the semester cost.
   * That forced borrowing is the other thing worth saying, and until now
   * this tile was the one debit on the board that never mentioned it.
   */
  const notes = [band.cost > 0 ? `Tuition: ${money(band.cost)}` : 'No tuition due — a full ride.']
  if (loansTaken > 0) {
    notes.push(loanNote(loansTaken, economy.loanPrincipal, loanRepaymentFor(state.difficulty, edition), edition.currency))
  }

  const event = outcomeEvent(space, player, 'Tuition Bill', delta, notes, emphasisForMoney(delta, economy), band.note)
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    `${player.name} rolls a ${spinValue} for tuition: ${band.cost > 0 ? money(band.cost) : 'a full ride'}.`,
    band.cost > 0 ? 'money-out' : 'event',
  )
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
        `${needed} was the bar — the ${next.title} job goes to somebody else.`,
        edition.currency.salaryDisplay
          ? raiseNote(career.salary, newSalary, edition.currency)
          : `A raise anyway: ${money(newSalary)}`,
      ],
      'normal',
      `Not this time, ${player.name} — but they find you a raise on the way out of the room.`,
    )
    return resolved(
      state,
      replacePlayer(state.players, raised),
      event,
      `${player.name} rolls a ${spinValue} and is passed over for ${next.title}, taking a rise to ${money(salaryRate(newSalary, edition.currency))} a ${salaryPeriod(edition.currency)}.`,
      'event',
    )
  }

  let promoted = promoteCareer(player, next)
  const twoAtOnce = spinValue >= DOUBLE_PROMOTION_SPIN ? nextRungOf(next, edition) : undefined
  if (twoAtOnce) promoted = promoteCareer(promoted, twoAtOnce)
  const arrived = promoted.career ?? next
  // The narration names the rung arrived at, and the card prints the die
  // that cleared the bar — so the notes carry the bar itself and the wage,
  // which are the two things neither of those says.
  const notes = [
    `Cleared the bar of ${needed}.`,
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
      ? `The top of the die! They skip a whole rung: ${player.name} is a ${arrived.title}, and the room is not sure what just happened.`
      : `Promoted! ${player.name} is a ${arrived.title} now.`,
  )
  return resolved(
    state,
    replacePlayer(state.players, promoted),
    event,
    `${player.name} rolls a ${spinValue} and is promoted to ${arrived.title}: ${money(salaryRate(arrived.salary, edition.currency))} a ${salaryPeriod(edition.currency)}.`,
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
        // The card prints the first ask; only the second one needs saying.
        // The tiles are already dealt as their own chips above the notes,
        // so listing their titles here said them twice on one card.
        [
          `Asked again, rolled a ${askedAgain} — not this year, and not next year either.`,
          'Single, and the road ahead is entirely yours: children, Family Lane and every bonus on it are still open.',
        ],
        'milestone',
        `No wedding for ${player.name} — so they spend the year on themselves instead, and it makes a far better story.`,
      ),
      lifeTilesGained: tiles,
    }
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} rolls a ${asked} and a ${askedAgain}: no wedding, but a LIFE tile out of the year.`,
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
  // The first ask is printed on the card; a second one is a fact of its own
  // and the only roll the card cannot show.
  const notes: string[] = askedAgain !== null
    ? [`Asked again, rolled a ${askedAgain} — and this time, yes.`, outcome.note]
    : [outcome.note]

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

  /*
   * A statement whose every fact was said three times over: the roll on the
   * card and again in both lines, the figure in the note, the narration and
   * the delta plate. The die is printed above, the plate carries the money,
   * and the narration says what kind of month it was — which leaves the
   * notes nothing to add that is not already on screen.
   */
  const narration =
    amount < 0
      ? `Your partner has been shopping, ${player.name}. That is the month gone.`
      : amount === 0
        ? `The joint account lands exactly where it started. Nobody wins that argument.`
        : `Two incomes and a good month for ${player.name}!`

  const event = outcomeEvent(space, player, 'The Joint Account', delta, [], emphasisForMoney(delta, economy), narration)
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    amount < 0
      ? `${player.name}'s joint account takes a hit, rolling a ${spinValue}: ${money(delta)}.`
      : `${player.name}'s household comes out ahead, rolling a ${spinValue}: ${money(delta)}.`,
    amount < 0 ? 'money-out' : 'money-in',
  )
}

/**
 * The year the trade had, settled.
 *
 * The card is put together out of three parts that each say a different thing,
 * which is the rule every event card on this board follows. The plate carries
 * the money and the die is printed above it, so neither is repeated here. The
 * narration is the family's own vignette — the reveal the roll was for. And
 * the one note is the fact that separates this tile from every other career
 * tile on the board: the job did not change. A player who has just watched a
 * health inspector close their kitchen deserves to be told, in the ledger,
 * that they are still a Restaurant Owner in the morning.
 *
 * The card wears the trade's own portrait rather than the tile's glyph, for
 * the same reason a career fair's roll table does: this is a thing that
 * happened to *that* work, and the plaque says which work faster than any
 * sentence can.
 */
function resolveTradeYearSpin(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  share: number,
  edition: ReturnType<typeof editionOf>,
  money: (amount: Money) => string,
): GameState {
  const { economy, currency } = edition
  const career = player.career
  const family = tradeFamilyOf(career)
  const stories = family ? tradeYearStoriesFor(edition, family) : undefined
  const year = tradeYearFor(career, spinValue, share, currency.tileRounding, stories)
  // `applyEffect` never raises this decision for a player without a career, so
  // there is no live path here — the guard only keeps the types honest for a
  // decision built by hand in a test.
  if (!year || !career) {
    const event = outcomeEvent(space, player, 'The Year in the Trade', 0, [], 'normal', `${player.name} has no trade to have a year in.`)
    return resolved(state, state.players, event, `${player.name} is between jobs, so the year passes them by.`, 'info')
  }

  const updated =
    year.swing >= 0 ? creditPlayer(player, year.swing) : debitPlayer(player, -year.swing, economy)
  const delta = updated.money - player.money
  const event: LandingEvent = {
    ...outcomeEvent(
      space,
      player,
      'The Year in the Trade',
      delta,
      [`Still a ${career.title}, on the same rung.`],
      emphasisForMoney(delta, economy),
      year.story,
    ),
    icon: career.icon,
  }
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    year.swing >= 0
      ? `${player.name} has a good year as a ${career.title}, rolling a ${spinValue}: ${money(delta)}.`
      : `${player.name} has a bad year as a ${career.title}, rolling a ${spinValue}: ${money(delta)}.`,
    year.swing >= 0 ? 'money-in' : 'money-out',
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

  const edition = editionOf(state)
  const { currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)

  // Staying put is the one decline a value-spin decision can offer, and it
  // never touches the wheel — same as every other decline in the game.
  if (optionId === CAREER_STAY_OPTION_ID) {
    return resolveCareerStay(state, player, space, currency, money)
  }

  if (optionId !== VALUE_SPIN_OPTION_ID) throw new Error(`choose: unknown value-spin option "${optionId}"`)

  const spinValue = deps.random.spin()
  /*
   * `lastSpin` is what lets the actual wheel in the rail animate to this
   * number — the same field the ordinary move-roll uses — rather than the
   * number simply appearing in an event card with no wheel ever turning for
   * it. Stamped on every branch below via this one wrapper, so a future
   * value-spin tile gets it for free instead of by remembering to add it.
   */
  return { ...resolveSpinOutcome(state, player, space, spinValue, edition, deps, money), lastSpin: spinValue }
}

/**
 * Everything a value-spin decision resolves into, once a `SpinValue` exists
 * for it — exported so `passedEvents.ts` can settle the same tile the same
 * way for a roll that only swept past it, without a press to answer.
 *
 * The die that decided it is stamped onto the card here rather than inside
 * each branch below, because this is the one funnel every wheel-decided
 * outcome already passes through — landed on or swept past — so a value-spin
 * tile added later carries the mark without anyone having to remember it.
 * What the presentation layer does with it depends on where the roll
 * happened: a landing has already shown its die by the time this card
 * exists, a tile crossed mid-move has not. See `LandingEvent.rolled`.
 */
export function resolveSpinOutcome(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  edition: ReturnType<typeof editionOf>,
  deps: UseCaseDeps,
  money: (amount: Money) => string,
): GameState {
  const outcome = spinOutcome(state, player, space, spinValue, edition, deps, money)
  // `resolved()` sets `lastEvent` on every branch `spinOutcome` can reach;
  // the fallback only guards the type.
  if (!outcome.lastEvent) return outcome
  return { ...outcome, lastEvent: { ...outcome.lastEvent, rolled: spinValue } }
}

function spinOutcome(
  state: GameState,
  player: Player,
  space: Space | undefined,
  spinValue: SpinValue,
  edition: ReturnType<typeof editionOf>,
  deps: UseCaseDeps,
  money: (amount: Money) => string,
): GameState {
  const { economy } = edition

  // A career spin is identified by the offers it carries, not by the space's
  // own effect — a decision built for a test, or dealt from a tile whose
  // effect the board no longer holds, still resolves correctly this way.
  if (state.pendingDecision?.offeredCareerIds) {
    return resolveCareerSpin(state, player, space, spinValue, edition, money)
  }

  if (space?.effect.type === 'spinForMoney') {
    const gain = space.effect.perPip * spinValue
    const updated = creditPlayer(player, gain)
    const delta = updated.money - player.money
    const event = outcomeEvent(
      space,
      player,
      'Roll',
      delta,
      [space.effect.reason],
      emphasisForMoney(delta, economy),
      `And that is worth ${money(gain)} to ${player.name}!`,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${space.effect.reason} ${player.name} rolls a ${spinValue}: ${money(gain)}.`,
      gain >= 0 ? 'money-in' : 'money-out',
    )
  }

  if (space?.effect.type === 'tuition') {
    return resolveTuitionSpin(state, player, space, spinValue, edition, money)
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

  if (space?.effect.type === 'tradeYear') {
    return resolveTradeYearSpin(state, player, space, spinValue, space.effect.share, edition, money)
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
      [],
      emphasisForMoney(delta, economy),
      `The gift envelopes add up to ${money(gain)} for ${player.name}!`,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} rolls ${spinValue} for the gift envelopes: ${money(gain)}.`,
      'money-in',
    )
  }

  // Otherwise this is a payday — casual or unsteady, the only two kinds that
  // reach a value-spin decision at all (a flat salary never raises one).
  const amount = paydayPayFor(player, spinValue, economy)
  const updated = payPlayerSalary(player, spinValue, economy)
  const delta = updated.money - player.money
  const kind = paydayKindOf(player)
  // The note says how this player is paid at all — the standing fact, true
  // every week. The narration says what *this* week came to, once.
  const notes =
    kind === 'casual'
      ? ['Between jobs, so you pick up shifts.']
      : [`${player.career?.title ?? 'Your trade'} — no two weeks pay the same.`]
  const narration =
    kind === 'casual'
      ? `No wasted week either — ${player.name} picks up shifts worth ${money(amount)}.`
      : `That is what the week was worth: ${money(amount)} for ${player.name}.`
  const logMessage =
    kind === 'casual'
      ? `${player.name} picks up casual shifts, rolling ${spinValue}: ${money(amount)}.`
      : `${player.name} collects payday, rolling ${spinValue}: ${money(amount)}.`
  const event = {
    ...outcomeEvent(space, player, 'Payday', delta, notes, emphasisForMoney(delta, economy), narration),
    // The trade this week's shifts were worked at — absent for a casual
    // player between jobs, who has none. See `careerIcon` on `LandingEvent`.
    ...(player.career === null ? {} : { careerIcon: player.career.icon }),
  }
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
      [],
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

  /*
   * The bonus itself, named first and named plainly — "Bonus: $Y" rather
   * than buried after the stake. The card's own delta plate reads net of
   * what went in, which on a low spin prints a red, discouraging number even
   * though the fund the player just locked in for the rest of the game is a
   * real one; the bonus figure is what answers "was it worth stopping",
   * which the net delta alone does not.
   */
  const event: LandingEvent = {
    ...outcomeEvent(
      space,
      player,
      'The Number',
      delta,
      [
        `Bonus: ${money(payout)}`,
        `${money(economy.fireNumber)} went into the fund to get there.`,
        `Retirement rank #${rank}, and every payday still on the road belongs to somebody else now.`,
      ],
      'milestone',
      // The payout is a note of its own and the rank is another; what the
      // narration is for is whether stopping here was the right call.
      spin >= 5
        ? `The fund comes back well ahead and ${player.name} never works another day. That is how it is done.`
        : spin <= 2
          ? `The fund comes back at less than went into it. ${player.name} stopped a year too soon, and there is no going back.`
          : `${player.name} stops working for good. No more paydays — and no more bills either.`,
    ),
    // This roll never passes through `resolveSpinOutcome`, so the mark that
    // lets the card print its own die has to be stamped here by hand.
    rolled: spin,
  }

  return {
    ...resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      `${player.name} retires early: ${money(economy.fireNumber)} into the fund, a roll of ${spin}, ${money(payout)} back.`,
      'milestone',
    ),
    // …and so does the number the die on screen has to land on. `rolled` is
    // what the finished card prints; `lastSpin` is what the die animates to,
    // and a roll that publishes one without the other leaves a die with
    // nothing to settle on — it simply never turns, and the turn hangs behind
    // it. `resolveValueSpin` stamps both through its own wrapper.
    lastSpin: spin,
  }
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
