import type { GameState, Player } from '@domain/model/types'
import { planMovement, planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { appendLog } from './logging'
import { editionOf } from '@domain/edition/registry'
import { resolveForkBranch } from './branch'
import { collectPaydays, passedPaydayLine } from './payday'
import { applyPassedEvents } from './passedEvents'
import type { UseCaseDeps } from './types'

/** Spins for the current player, plans their movement, and pays out any paydays passed along the way. */
export function spin(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'awaitingSpin') {
    throw new Error(`spin: only valid in 'awaitingSpin', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('spin: no current player')

  const spinValue = deps.random.spin()

  /*
   * A fork used to be a choice, made before this spin, by whoever was
   * experienced enough to already know which road paid better — a real
   * advantage a first-time player never had. It is this same spin's own
   * roll now: 1-5 takes the first road, 6-10 the second, and the number
   * that picked the road is also how far it carries you down it — exactly
   * the distance an ordinary spin already averages, so a fork costs a
   * player nothing they would not have spun anyway.
   */
  const branchTaken = resolveForkBranch(state.board, player.spaceId, spinValue)
  const plan =
    branchTaken !== undefined
      ? planMovementVia(state.board, player.spaceId, branchTaken, spinValue)
      : state.chosenExit
        ? planMovementVia(state.board, player.spaceId, state.chosenExit, spinValue)
        : planMovement(state.board, player.spaceId, spinValue)

  let movedPlayer = movePlayerTo(player, plan.destinationId)
  const forkNote =
    branchTaken !== undefined
      ? (() => {
          const target = state.board.spaces[branchTaken]
          const label = target?.lane?.name ?? target?.title ?? 'a new road'
          return ` and the fork sends them onto ${label}`
        })()
      : ''
  let log = appendLog(state, player.id, `${player.name} spins a ${spinValue}${forkNote}.`, 'info')
  const passedNotes: string[] = []

  if (plan.paydaysPassed > 0) {
    // Each payday passed is its own week, so each one is rolled separately.
    const collection = collectPaydays(movedPlayer, plan.paydaysPassed, deps, editionOf(state).economy)
    movedPlayer = collection.player
    if (collection.total !== 0) {
      const line = passedPaydayLine(player.name, collection, editionOf(state).currency)
      log = appendLog({ ...state, log }, player.id, line, 'money-in')
      passedNotes.push(line)
    }
  }

  let players: readonly Player[] = state.players.map((candidate) =>
    candidate.id === movedPlayer.id ? movedPlayer : candidate,
  )

  /*
   * `event` tiles this move swept past — a milestone whose effect fires
   * whether landed on or not, but never holds the move up for it (see
   * `SpaceKind` in `types.ts`). Settled after paydays rather than
   * interleaved with them in true walking order: the two never depend on
   * each other's outcome closely enough to be worth the wiring a single
   * merged pass would need, with one acknowledged exception — a payday
   * rolled here can still be at the pre-change career if a career-change
   * event tile was actually crossed earlier in the same move. Rare enough
   * (both kinds have to land in one roll) that it is noted rather than
   * solved.
   */
  if (plan.eventsPassed.length > 0) {
    const passedState = { ...state, players, log }
    const { state: afterEvents, notes } = applyPassedEvents(passedState, plan.eventsPassed, deps)
    players = afterEvents.players
    log = afterEvents.log
    passedNotes.push(...notes)
  }

  return {
    ...state,
    players,
    chosenExit: null,
    passedNotes,
    lastSpin: spinValue,
    movementPath: plan.path,
    stepsRemaining: plan.stepsRemaining,
    phase: 'moving',
    log,
  }
}
