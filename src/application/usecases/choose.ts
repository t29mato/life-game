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
import { gateOfferIndex, gatePassed } from '@domain/rules/careerGate'
import { childrenArrivingOn } from '@domain/rules/children'
import { earlyLoanRepaymentFor } from '@domain/rules/difficulty'
import { householdSwing, perPipPayout } from '@domain/rules/diePayout'
import { marriageBandFor } from '@domain/rules/marriage'
import { tuitionBandFor, tuitionSpecFor } from '@domain/rules/tuition'
import { tradeFamilyOf, tradeYearFor } from '@domain/rules/tradeYear'
import {
  addChildren,
  addInsurance,
  addLifeTiles,
  applyPayRaise,
  buyHouse as buyHouseForPlayer,
  buyShares,
  creditPlayer,
  debitPlayer,
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
import { withBorrowing } from './borrowing'
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
import type { EditionText } from '@domain/edition/i18n/text'
import type { NarrationText } from '../i18n/en'
import type { GameText } from '../i18n/text'
import { formatMoney, payRate, raiseNote, salaryPeriodIn, salaryRate } from './format'
import { appendLog } from './logging'
import { arrivalCopy, celebrationFor } from './newBaby'
import { textOf, type UseCaseDeps } from './types'

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
    ...(space?.footnote ? { footnote: space.footnote } : {}),
  }
}

/** Every non-branch decision lands the turn: the answer *is* the event. */
function resolved(state: GameState, players: readonly Player[], event: LandingEvent, logMessage: string, tone: LogTone): GameState {
  const player = state.players[state.currentPlayerIndex]
  // The one way out for every answered decision, so it is also the one place
  // that needs to report the balance the answer left behind — `players` here
  // is already the post-decision roster. See `withBalanceAfter`.
  const withBalance = player ? withBalanceAfter(event, players, player.id) : event
  // The bank's own share of that movement, then where it left them in the
  // standings — the same two rosters, read the same way, on the same one
  // way out. See `withBorrowing`.
  const withBorrow = player
    ? withBorrowing(withBalance, state.players, players, player.id, state.difficulty, state.editionId)
    : withBalance
  const settled = player
    ? withStandingChange(withBorrow, state.players, players, player.id, state.difficulty, state.editionId)
    : withBorrow
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

function resolveBranch(state: GameState, optionId: string, deps: UseCaseDeps): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const { say, board: boardWords } = textOf(deps)

  /*
   * Chosen before the wheel was spun: commit to the road and hand the turn to
   * the spinner. Picking after the number is known let a player take whichever
   * lane happened to land them well, which is a cheap advantage — the road is
   * chosen first, then the wheel decides how far down it you get.
   */
  if (state.stepsRemaining === 0) {
    const target = state.board.spaces[optionId]
    const words = boardWords(editionOf(state))
    const lane = target?.lane?.name
    const road =
      (lane ? (words.lane(lane)?.name ?? lane) : undefined) ??
      (target ? (words.space(target.id, target.description)?.title ?? target.title) : undefined) ??
      say.move.roadAhead
    const log = appendLog(state, player.id, say.move.takesRoadLog(player.name, road), 'info')
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
  const log = appendLog(state, player.id, say.move.headsTowardLog(player.name, plan.destinationId), 'info')

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
  say: NarrationText,
  words: EditionText,
): GameState {
  const staying = player.career
  if (!staying) throw new Error('choose: nothing to stay in')
  const title = words.career(staying.id)?.title ?? staying.title
  const event = outcomeEvent(
    space,
    player,
    say.career.stayCardTitle,
    0,
    // The ladder they keep is the narration's whole point; the note carries
    // the one thing it does not say — what the job actually pays.
    [say.career.stayNote(title, payRate(staying.salary, currency, say))],
    'normal',
    say.career.stayNarration(player.name),
  )
  return resolved(state, state.players, event, say.career.stayLog(player.name, title), 'info')
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
  say: NarrationText,
  words: EditionText,
): GameState {
  const offeredIds = state.pendingDecision?.offeredCareerIds
  if (!offeredIds) throw new Error('choose: career spin with no offers on the table')

  /*
   * A gate, and the face that did not clear it — the one career roll on the
   * board that can end with nothing happening at all.
   *
   * Fail-soft in the fullest sense: the job, the rung, the raises and the
   * money are exactly where they were, and the only thing spent is the year.
   * How many years there are to spend is the number of gate tiles the lane
   * carries; the board is what runs out, not a counter. See
   * `SpaceEffect`'s `passSpin`.
   */
  const gate = space?.effect.type === 'careerChange' ? space.effect.passSpin : undefined
  if (gate !== undefined && !gatePassed(spinValue, gate)) {
    const event = outcomeEvent(
      space,
      player,
      say.career.gateMissCardTitle,
      0,
      player.career
        ? [
            say.career.gateMissEmployedNote(
              words.career(player.career.id)?.title ?? player.career.title,
              payRate(player.career.salary, edition.currency, say),
            ),
          ]
        : [say.career.gateMissJoblessNote],
      'normal',
      say.career.gateMissNarration(player.name),
    )
    return resolved(
      state,
      state.players,
      event,
      say.career.gateMissLog(player.name, spinValue),
      'info',
    )
  }

  const pickedId =
    gate === undefined
      ? spinValue <= SPIN_FACES / 2
        ? offeredIds[0]
        : offeredIds[1]
      : offeredIds[gateOfferIndex(spinValue, gate)]
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
  const takenTitle = words.career(taken.id)?.title ?? taken.title
  const notes = [
    say.format.everyPeriod(
      formatMoney(salaryRate(taken.salary, edition.currency), edition.currency),
      salaryPeriodIn(edition.currency, say),
    ),
  ]

  const narration = previous
    ? say.career.switchedNarration(
        player.name,
        words.career(previous.id)?.title ?? previous.title,
        takenTitle,
      )
    : say.career.hiredNarration(player.name, takenTitle)
  const event = outcomeEvent(space, player, say.career.hiredCardTitle, 0, notes, 'milestone', narration)

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    say.career.hiredLog(player.name, spinValue, takenTitle),
    'milestone',
  )
}

function resolveHouse(state: GameState, optionId: string, text: GameText): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)
  const { say } = text
  const words = text.board(edition)
  const named = (house: { id: string; name: string }): string =>
    words.house(house.id)?.name ?? house.name

  if (optionId === DECLINE_HOUSE_OPTION_ID) {
    const staying = player.house
    const event = outcomeEvent(
      space,
      player,
      say.house.cardTitle,
      0,
      // Nothing moved and nothing changed hands: the narration is the whole
      // of it, and a note repeating it back was the only thing here.
      [],
      'normal',
      staying
        ? say.house.stayNarration(player.name, named(staying))
        : say.house.keepRentingNarration(player.name),
    )
    return resolved(
      state,
      state.players,
      event,
      staying ? say.house.stayLog(player.name, named(staying)) : say.house.keepRentingLog(player.name),
      'info',
    )
  }

  const house = findHouse(optionId, edition)
  if (!house) throw new Error(`choose: unknown house option "${optionId}"`)

  const previous = player.house
  // A trade-up credits the old home at its list price; a first purchase does not.
  const updated = previous ? tradeUpHouse(player, house, economy) : buyHouseForPlayer(player, house, economy)
  const delta = updated.money - player.money

  // Which house, and which house it replaced, are the narration's own
  // sentence — what it cannot say is what the old place was credited at.
  const notes: string[] = previous ? [say.house.tradeInCreditNote(money(previous.price))] : []

  const narration = previous
    ? say.house.tradedUpNarration(player.name, named(previous), named(house))
    : say.house.boughtNarration(player.name, named(house))

  const event = outcomeEvent(
    space,
    player,
    say.house.boughtCardTitle,
    delta,
    notes,
    emphasisForMoney(delta, economy),
    narration,
  )

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    previous
      ? say.house.tradedUpLog(player.name, named(house))
      : say.house.boughtLog(player.name, named(house)),
    'milestone',
  )
}

function resolveStock(state: GameState, optionId: string, text: GameText): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)
  const { say } = text

  if (optionId === DECLINE_STOCK_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      say.stock.cardTitle,
      0,
      [],
      'normal',
      say.stock.declinedNarration(player.name),
    )
    return resolved(state, state.players, event, say.stock.declinedLog(player.name), 'info')
  }

  const stock = findStock(optionId, edition)
  if (!stock) throw new Error(`choose: unknown stock option "${optionId}"`)

  const updated = buyShares(player, stock, SHARES_PER_PURCHASE, economy)
  const delta = updated.money - player.money

  // What the purchase cost is on the plate and the company is in the
  // narration; the count of shares and what one is worth at the end are the
  // two facts neither of those carries.
  const notes = [
    say.stock.boughtNote(SHARES_PER_PURCHASE),
    say.stock.payoutNote(money(stock.payoutRange[0]), money(stock.payoutRange[1])),
  ]

  const event = outcomeEvent(
    space,
    player,
    say.stock.cardTitle,
    delta,
    notes,
    emphasisForMoney(delta, economy),
    say.stock.boughtNarration(player.name, stock.ticker),
  )

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    say.stock.boughtLog(player.name, SHARES_PER_PURCHASE, stock.ticker, money(Math.abs(delta))),
    'money-out',
  )
}

function resolveInsurance(state: GameState, optionId: string, text: GameText): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)
  const { say } = text

  if (optionId === DECLINE_INSURANCE_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      say.insurance.cardTitle,
      0,
      [],
      'normal',
      say.insurance.declinedNarration(player.name),
    )
    return resolved(state, state.players, event, say.insurance.declinedLog(player.name), 'info')
  }

  const kind = insuranceKindFromOptionId(optionId)
  if (!kind) throw new Error(`choose: unknown insurance option "${optionId}"`)

  const updated = addInsurance(player, kind, economy)
  const delta = updated.money - player.money

  // Not what it cost — the delta plate is showing exactly that, signed, one
  // line up. What a policy is *for* is the note nobody else prints.
  const notes: string[] = [kind === 'life' ? say.insurance.lifeNote : say.insurance.coverNote(kind)]

  const event = outcomeEvent(
    space,
    player,
    say.insurance.cardTitle,
    delta,
    notes,
    emphasisForMoney(delta, economy),
    say.insurance.boughtNarration(player.name),
  )

  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    say.insurance.boughtLog(
      player.name,
      say.insurance.policyInline(kind),
      money(economy.insurancePremium[kind]),
    ),
    'money-out',
  )
}

function resolveBank(state: GameState, optionId: string, text: GameText): GameState {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('choose: no current player')
  const edition = editionOf(state)
  const { economy, currency } = edition
  const money = (amount: Money): string => formatMoney(amount, currency)
  const space = currentSpace(state, player)
  const { say } = text

  if (optionId === BANK_DECLINE_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      say.bank.cardTitle,
      0,
      [],
      'normal',
      say.bank.declinedNarration(player.name),
    )
    return resolved(state, state.players, event, say.bank.declinedLog(player.name), 'info')
  }

  if (optionId === BANK_LOAN_OPTION_ID) {
    const updated = takeLoan(player, economy)
    const delta = updated.money - player.money
    const event = outcomeEvent(
      space,
      player,
      say.bank.cardTitle,
      delta,
      // How much was borrowed is on the delta plate and in the narration
      // both; how deep the pile now is, is neither.
      [say.bank.carryingNote(updated.loans)],
      emphasisForMoney(delta, economy),
      say.bank.borrowedNarration(money(economy.loanPrincipal), player.name),
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      say.bank.borrowedLog(player.name, money(economy.loanPrincipal)),
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
      say.bank.cardTitle,
      delta,
      // "Debt free!" is the narration's line when the pile clears; the note
      // only speaks when there is a pile left to count.
      // What the settlement cost is the plate's figure, signed; the note is
      // only for what is left on the pile behind it.
      updated.loans === 0 ? [] : [say.bank.outstandingNote(updated.loans)],
      emphasisForMoney(delta, economy),
      updated.loans === 0
        ? say.bank.debtFreeNarration(player.name)
        : say.bank.repaidNarration(player.name),
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      say.bank.repaidLog(player.name, money(earlySettlement)),
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
  say: NarrationText,
  words: EditionText,
): GameState {
  const { economy } = edition
  // Which of the two bills this tile is sending — the tile says so, and
  // `applyEffect` printed the same spec's bands before the press.
  const bill = space?.effect.type === 'tuition' ? space.effect.bill : undefined
  const outcomes = tuitionSpecFor(bill, economy).outcomes
  const band = tuitionBandFor(outcomes, spinValue)
  /*
   * Three ways this die can land, not two.
   *
   * A bill is debited (and the bank tops the player up if they cannot cover
   * it). Zero is a full ride. And a *negative* band pays: the doctorate done
   * inside a company, on an employment contract, which is a real thing in one
   * country and the only face of this die anywhere in the game that puts
   * money into a pocket. See `TuitionOutcome.cost`.
   */
  const updated =
    band.cost > 0
      ? debitPlayer(player, band.cost, economy)
      : band.cost < 0
        ? creditPlayer(player, -band.cost)
        : player
  const delta = updated.money - player.money

  /*
   * Two facts, one home each. The die is printed on the card itself, and the
   * band's own line is the colour and says it once. The bill used to need a
   * note of its own because the plate could not be trusted for it — a player
   * who cannot cover tuition is topped up by the bank, so the plate read the
   * cash that moved rather than what the semester cost, and on a bad enough
   * roll it read that cash as a *gain*. The plate now carries the charge and
   * the loan as their own signed rows (`event.borrowing`), so the note that
   * used to argue with it says nothing it does not already say — except on a
   * full ride, where there is no plate at all and the good news needs saying.
   */
  const notes = band.cost === 0 ? [say.tuition.fullRideNote] : []

  /*
   * The band's own line, in the reader's language.
   *
   * `EconomyText.tuitionNotes` has been translated in all ten overlays since
   * they landed and read by nobody: this is the only place a tuition note ever
   * reaches a card, and it read `band.note` straight off the English economy.
   * Positional, because a band has no id — only an order, worst spin first —
   * and `overlays.test.ts` pins the array lengths so a band added later cannot
   * shift every note by one.
   */
  const narration = words.tuitionNote(outcomes.indexOf(band)) ?? band.note

  const event = outcomeEvent(
    space,
    player,
    say.tuition.cardTitle,
    delta,
    notes,
    emphasisForMoney(delta, economy),
    narration,
  )
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    say.tuition.billLog(
      player.name,
      spinValue,
      band.cost > 0
        ? say.tuition.billCharged(money(band.cost))
        : band.cost < 0
          ? say.tuition.billPaid(money(-band.cost))
          : say.tuition.billFullRide,
    ),
    band.cost > 0 ? 'money-out' : band.cost < 0 ? 'money-in' : 'event',
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
  say: NarrationText,
  words: EditionText,
): GameState {
  const career = player.career
  if (!career) throw new Error('choose: promotion spin with no career')
  const next = nextRungOf(career, edition)
  if (!next) throw new Error('choose: promotion spin with nobody to promote to')
  const needed = career.promotionSpin ?? DEFAULT_PROMOTION_SPIN
  const nextTitle = words.career(next.id)?.title ?? next.title

  if (spinValue < needed) {
    // Never a dead tile: passed over is still a raise.
    const raised = applyPayRaise(player)
    const newSalary = raised.career?.salary ?? career.salary
    const event = outcomeEvent(
      space,
      player,
      say.promotion.cardTitle,
      0,
      /*
       * One line, and it is the good news.
       *
       * This card used to carry two: "the job goes to somebody else" and "a
       * raise anyway", side by side as equal bullets. A playtester read them
       * as a contradiction — no promotion, and a promotion's money — because
       * nothing on the card said which of the two was the outcome. The bar it
       * missed is already on the card as the die itself, and the narration
       * above already says "not this time", so the footnote is left with the
       * one fact neither of them carries: the new wage.
       */
      [
        edition.currency.salaryDisplay
          ? raiseNote(career.salary, newSalary, edition.currency, say)
          : say.promotion.raiseAnywayNote(money(newSalary)),
      ],
      'normal',
      say.promotion.missedNarration(player.name),
    )
    return resolved(
      state,
      replacePlayer(state.players, raised),
      event,
      say.promotion.missedLog(
        player.name,
        spinValue,
        nextTitle,
        payRate(newSalary, edition.currency, say),
      ),
      'event',
    )
  }

  let promoted = promoteCareer(player, next)
  const twoAtOnce = spinValue >= DOUBLE_PROMOTION_SPIN ? nextRungOf(next, edition) : undefined
  if (twoAtOnce) promoted = promoteCareer(promoted, twoAtOnce)
  const arrived = promoted.career ?? next
  // The narration names the rung arrived at and the card prints the die, so
  // the footnote carries the one thing neither says: the wage. The bar it
  // cleared used to sit here too — a second line saying, in words, what the
  // die on the card above it already said in a number.
  const arrivedTitle = words.career(arrived.id)?.title ?? arrived.title
  const notes = [
    say.format.everyPeriod(
      formatMoney(salaryRate(arrived.salary, edition.currency), edition.currency),
      salaryPeriodIn(edition.currency, say),
    ),
  ]
  const event = outcomeEvent(
    space,
    player,
    say.promotion.cardTitle,
    0,
    notes,
    'milestone',
    twoAtOnce
      ? say.promotion.doubleNarration(player.name, arrivedTitle)
      : say.promotion.promotedNarration(player.name, arrivedTitle),
  )
  return resolved(
    state,
    replacePlayer(state.players, promoted),
    event,
    say.promotion.promotedLog(
      player.name,
      spinValue,
      arrivedTitle,
      payRate(arrived.salary, edition.currency, say),
    ),
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
  say: NarrationText,
  words: EditionText,
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
        say.marriage.cardTitle,
        0,
        // The card prints the first ask; only the second one needs saying.
        // The tiles are already dealt as their own chips above the notes,
        // so listing their titles here said them twice on one card.
        [say.marriage.refusedNote(askedAgain), say.marriage.refusedSecondNote],
        'milestone',
        say.marriage.refusedNarration(player.name),
      ),
      lifeTilesGained: tiles,
    }
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      say.marriage.refusedLog(player.name, asked, askedAgain),
      'event',
    )
  }

  /*
   * Which marriage, not merely whether. The wheel that decided they said yes
   * decides what it cost: a rescued proposal arrives with somebody else's
   * debts, a low first ask is a reception nobody budgeted for, and only the
   * top of the wheel is the marriage everybody pictures.
   */
  const rescued = askedAgain !== null
  const outcome = rescued ? marriage.rescued : marriageBandFor(marriage.outcomes, asked)
  /*
   * The band's own line, translated — the other half of the channel
   * `EconomyText` has been carrying since the overlays landed, unread. A
   * rescued proposal has its own entry rather than an index, because it is not
   * one of `outcomes` at all.
   */
  const outcomeNote = rescued
    ? (words.marriageRescuedNote() ?? outcome.note)
    : (words.marriageNote(marriage.outcomes.indexOf(outcome)) ?? outcome.note)
  const gift = Math.round(economy.weddingGift * outcome.giftMultiplier)
  const payers = rivalsOf(state, player)

  let players = state.players
  let mover = marryPlayer(player)
  // The first ask is printed on the card; a second one is a fact of its own
  // and the only spin the card cannot show.
  const notes: string[] =
    askedAgain !== null ? [say.marriage.rescuedNote(askedAgain), outcomeNote] : [outcomeNote]

  for (const payer of payers) {
    players = replacePlayer(players, debitPlayer(payer, gift, economy))
    mover = creditPlayer(mover, gift)
    notes.push(say.marriage.giftNote(payer.name, money(gift)))
  }
  if (outcome.windfall > 0) {
    mover = creditPlayer(mover, outcome.windfall)
    notes.push(say.marriage.windfallNote(money(outcome.windfall)))
  }
  if (outcome.cost > 0) {
    mover = debitPlayer(mover, outcome.cost, economy)
    notes.push(say.marriage.costNote(money(-outcome.cost)))
  }
  players = replacePlayer(players, mover)

  const delta = mover.money - player.money
  const narration =
    delta < 0
      ? say.marriage.costlyNarration(money(-delta), player.name)
      : payers.length === 0
        ? say.marriage.quietNarration(player.name)
        : outcome.giftMultiplier > 1
          ? say.marriage.lavishNarration(player.name)
          : say.marriage.marriedNarration(player.name)
  const event = outcomeEvent(space, player, say.marriage.cardTitle, delta, notes, 'milestone', narration)
  return resolved(
    state,
    players,
    event,
    delta < 0
      ? say.marriage.costlyLog(player.name, money(-delta))
      : say.marriage.marriedLog(player.name),
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
  say: NarrationText,
): GameState {
  const { economy } = edition
  // The same function the card printed all six months from before the press.
  const amount = householdSwing(player, economy, spinValue)
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
      ? say.household.downNarration(player.name)
      : amount === 0
        ? say.household.evenNarration
        : say.household.upNarration(player.name)

  const event = outcomeEvent(
    space,
    player,
    say.household.cardTitle,
    delta,
    [],
    emphasisForMoney(delta, economy),
    narration,
  )
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    amount < 0
      ? say.household.downLog(player.name, spinValue, money(delta))
      : say.household.upLog(player.name, spinValue, money(delta)),
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
  say: NarrationText,
  words: EditionText,
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
    const event = outcomeEvent(
      space,
      player,
      say.tradeYear.cardTitle,
      0,
      [],
      'normal',
      say.tradeYear.noTradeNarration(player.name),
    )
    return resolved(state, state.players, event, say.tradeYear.noJobLog(player.name), 'info')
  }

  const title = words.career(career.id)?.title ?? career.title
  const updated =
    year.swing >= 0 ? creditPlayer(player, year.swing) : debitPlayer(player, -year.swing, economy)
  const delta = updated.money - player.money
  const event: LandingEvent = {
    ...outcomeEvent(
      space,
      player,
      say.tradeYear.cardTitle,
      delta,
      [say.tradeYear.sameRungNote(title)],
      emphasisForMoney(delta, economy),
      /*
       * The trade's own vignette, and the one string on this card still read
       * off the English edition data in every language. `EditionTranslation`
       * has no slot for `tradeYearStories` — see the PR notes; adding one is a
       * change to the overlay contract and to all ten overlays, which is a
       * separate piece of work from opening this channel.
       */
      year.story,
    ),
    icon: career.icon,
  }
  return resolved(
    state,
    replacePlayer(state.players, updated),
    event,
    year.swing >= 0
      ? say.tradeYear.goodLog(player.name, title, spinValue, money(delta))
      : say.tradeYear.badLog(player.name, title, spinValue, money(delta)),
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
  const text = textOf(deps)

  // Staying put is the one decline a value-spin decision can offer, and it
  // never touches the wheel — same as every other decline in the game.
  if (optionId === CAREER_STAY_OPTION_ID) {
    return resolveCareerStay(state, player, space, currency, text.say, text.board(edition))
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
  const text = textOf(deps)
  const { say } = text
  const words = text.board(edition)
  /** The tile's own defence of where the money went, in the reader's language. */
  const tileReason = space ? words.space(space.id, space.description)?.reason : undefined

  // A career spin is identified by the offers it carries, not by the space's
  // own effect — a decision built for a test, or dealt from a tile whose
  // effect the board no longer holds, still resolves correctly this way.
  if (state.pendingDecision?.offeredCareerIds) {
    return resolveCareerSpin(state, player, space, spinValue, edition, say, words)
  }

  if (space?.effect.type === 'spinForMoney') {
    const gain = perPipPayout(space.effect.perPip, spinValue)
    const updated = creditPlayer(player, gain)
    const delta = updated.money - player.money
    const reason = tileReason ?? space.effect.reason
    const event = outcomeEvent(
      space,
      player,
      say.spinForMoney.cardTitle,
      delta,
      [reason],
      emphasisForMoney(delta, economy),
      // The plate says how much. What the host is for is that it is done.
      say.spinForMoney.resultNarration(player.name),
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      say.spinForMoney.resultLog(reason, player.name, spinValue, money(gain)),
      gain >= 0 ? 'money-in' : 'money-out',
    )
  }

  if (space?.effect.type === 'tuition') {
    return resolveTuitionSpin(state, player, space, spinValue, edition, money, say, words)
  }

  if (space?.effect.type === 'promotion') {
    return resolvePromotionSpin(state, player, space, spinValue, edition, money, say, words)
  }

  if (space?.effect.type === 'getMarried') {
    return resolveMarriageSpin(state, player, space, spinValue, deps, edition, money, say, words)
  }

  if (space?.effect.type === 'household') {
    return resolveHouseholdSpin(state, player, space, spinValue, edition, money, say)
  }

  if (space?.effect.type === 'tradeYear') {
    return resolveTradeYearSpin(
      state,
      player,
      space,
      spinValue,
      space.effect.share,
      edition,
      money,
      say,
      words,
    )
  }

  if (space?.effect.type === 'haveChildren') {
    /*
     * The whole tile, settled here — who arrived and what the envelopes came
     * to, in that order, because the second follows from the first. The die
     * used to decide only the money, with the baby handed over on landing;
     * see the `haveChildren` case in `applyEffect` for why that changed.
     *
     * The empty face credits nothing and debits nothing. It is not a loss and
     * is not dressed as one — `arrivalCopy` owns every word of it.
     */
    const arriving = childrenArrivingOn(space.effect.arrivals, spinValue)
    const gift = celebrationFor(arriving, space.effect.celebrationPerChild)
    const updated = creditPlayer(addChildren(player, arriving), gift)
    const delta = updated.money - player.money
    // The children rework owns this outcome now: the roll decides whether
    // anyone arrived at all, so the card can no longer be titled after the
    // envelopes or narrated as opening them.
    const copy = arrivalCopy(player.name, arriving, spinValue, gift, money, say)
    const event = outcomeEvent(
      space,
      player,
      say.baby.cardTitle,
      delta,
      copy.notes,
      copy.emphasis,
      copy.narration,
    )
    return resolved(
      state,
      replacePlayer(state.players, updated),
      event,
      copy.logMessage,
      arriving === 0 ? 'info' : 'milestone',
    )
  }

  // Otherwise this is a payday — casual or unsteady, the only two kinds that
  // reach a value-spin decision at all (a flat salary never raises one).
  const amount = paydayPayFor(player, spinValue, economy)
  const updated = payPlayerSalary(player, spinValue, economy)
  const delta = updated.money - player.money
  const kind = paydayKindOf(player)
  /*
   * The note is the rate — the standing fact, true every week, and the only
   * one of the three numbers on this card that the card cannot otherwise
   * show. It used to be a sentence the player had already read verbatim as
   * the stakes line over the die they just threw ("no two weeks pay the
   * same"), which is a card spending its one note repeating the screen
   * before it.
   *
   * The rate is what makes the rest of the card check out. A player is
   * looking at a face and a figure — "Spun 4", "+¥5,600,000" — and without
   * the rate between them those are two unrelated numbers. With it they are
   * one piece of arithmetic they can do in their head, which is the whole
   * bargain an unsteady wage offers.
   */
  const perPip = player.career?.payPerPip ?? economy.casualWagePerPip
  const notes =
    kind === 'casual'
      ? [say.payday.casualRateNote(money(perPip))]
      : [
          say.payday.tradeRateNote(
            player.career
              ? (words.career(player.career.id)?.title ?? player.career.title)
              : say.payday.yourTrade,
            money(perPip),
          ),
        ]
  /*
   * And the narration no longer says the total. It said it in full — "That
   * is what the week was worth: ¥2,800,000 for Mato." — directly above a
   * plate that prints the same ¥2,800,000 in a signed chip and counts the
   * balance up to it. The owner read one card and found the figure twice.
   * The plate is where a sum belongs; what the host is for is the part no
   * plate can print, which on this card is that the number would have been a
   * different one on any other week.
   */
  const narration =
    kind === 'casual'
      ? say.payday.casualNarration(player.name)
      : say.payday.unsteadyNarration(player.name)
  const logMessage =
    kind === 'casual'
      ? say.payday.casualLog(player.name, spinValue, money(amount))
      : say.payday.unsteadyLog(player.name, spinValue, money(amount))
  const event = {
    ...outcomeEvent(
      space,
      player,
      say.payday.cardTitle,
      delta,
      notes,
      emphasisForMoney(delta, economy),
      narration,
    ),
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
  const { say } = textOf(deps)

  if (optionId === FIRE_DECLINE_OPTION_ID) {
    const event = outcomeEvent(
      space,
      player,
      say.fire.cardTitle,
      0,
      [],
      'normal',
      say.fire.declinedNarration(player.name),
    )
    return resolved(state, state.players, event, say.fire.declinedLog(player.name), 'info')
  }

  if (optionId !== FIRE_RETIRE_OPTION_ID) {
    throw new Error(`choose: unknown early retirement option "${optionId}"`)
  }

  const spin = deps.random.spin()
  const payout = perPipPayout(economy.firePayoutPerPip, spin)
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
      say.fire.cardTitle,
      delta,
      [
        say.fire.bonusNote(money(payout)),
        say.fire.stakeNote(money(economy.fireNumber)),
        say.fire.rankNote(rank),
      ],
      'milestone',
      // The payout is a note of its own and the rank is another; what the
      // narration is for is whether stopping here was the right call.
      spin >= 5
        ? say.fire.goodNarration(player.name)
        : spin <= 2
          ? say.fire.badNarration(player.name)
          : say.fire.evenNarration(player.name),
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
      say.fire.retiredLog(player.name, money(economy.fireNumber), spin, money(payout)),
      'milestone',
    ),
    // …and so does the number the wheel on screen has to land on. `rolled` is
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
      return resolveHouse(state, optionId, textOf(deps))
    case 'stock':
      return resolveStock(state, optionId, textOf(deps))
    case 'insurance':
      return resolveInsurance(state, optionId, textOf(deps))
    case 'bank':
      return resolveBank(state, optionId, textOf(deps))
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
