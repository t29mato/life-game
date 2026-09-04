import type { GameState, Player, SpinValue } from '@domain/model/types'
import { nextMovementLeg, planMovementVia } from '@domain/board/movement'
import { movePlayerTo } from '@domain/rules/player'
import { applyEffect } from './applyEffect'
import { appendLog } from './logging'
import { branchDecision, resolveForkBranch, roadName } from './branch'
import { applyPassedEvent } from './passedEvents'
import type { UseCaseDeps } from './types'

/**
 * Resolves whatever the pawn's move still owes: a payday or `event` tile
 * swept past that hasn't had its own card yet, a fork choice, a landing
 * effect, or some of each in sequence. Called once per card — the UI
 * dispatches it again every time a `passingEvent` card is dismissed, the
 * same way it already dispatches `settle` again for a fork reached with
 * distance still owed.
 */
export function settle(state: GameState, deps: UseCaseDeps): GameState {
  if (state.phase !== 'moving' && state.phase !== 'passingEvent') {
    throw new Error(`settle: only valid in 'moving' or 'passingEvent', got '${state.phase}'`)
  }

  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('settle: no current player')

  /*
   * A card just dismissed, with road still owed: hand back the next leg and
   * let the pawn carry on before anything else is resolved.
   *
   * This is what makes the sweep read as a journey rather than a stack of
   * receipts. The pawn is standing *on* the tile whose card was just read —
   * it stopped there, which is the whole point — so the next thing that has
   * to happen is the hop onward, not the next card. `phase` goes back to
   * `moving`, the board animates, and `onMovementComplete` calls straight
   * back in here for whatever is owed at the far end of it.
   */
  if (state.phase === 'passingEvent' && state.pendingPath.length > 0) {
    const { leg, rest } = nextMovementLeg(state.pendingPath, state.pendingPassedItems)
    return {
      ...state,
      activePassedEvent: null,
      movementPath: leg,
      pendingPath: rest,
      phase: 'moving',
    }
  }

  /*
   * The queue drains before anything else does — a payday or an `event`
   * tile this move already crossed, each getting its own card, named for
   * the tile it actually happened on, before play can reach the fork
   * choice or the landing still further down the road. `movementPath`
   * clears here: the pawn has just finished the leg that ends *on* this
   * tile, and showing its card is not a moment that hops it anywhere else.
   */
  if (state.pendingPassedItems.length > 0) {
    const [next, ...rest] = state.pendingPassedItems
    const space = state.board.spaces[next!.spaceId]
    if (!space) throw new Error(`settle: unknown space "${next!.spaceId}" in the passed-item queue`)

    const { state: afterEvent, event } = applyPassedEvent(state, space, deps)
    return {
      ...afterEvent,
      pendingPassedItems: rest,
      activePassedEvent: event,
      phase: 'passingEvent',
      movementPath: [],
    }
  }

  const space = state.board.spaces[player.spaceId]
  if (!space) throw new Error(`settle: player stands on unknown space "${player.spaceId}"`)

  /*
   * A fork reached with distance still owed — a longer roll that started a
   * few tiles back rather than the ordinary case of standing on one already
   * (see `spin.ts`). Resolved with the *same* roll here: the distance still
   * owed is what decides the road and carries the player down it.
   *
   * Which means this path still carries the tension `spin.ts` has since
   * split in two — a road entered on a 4 is entered four tiles in — and
   * that is deliberate rather than overlooked. There is no second press to
   * make here: the player is already mid-flight on a number that was rolled
   * turns-of-the-hourglass ago and is owed as travel, so "roll again for the
   * distance" would be rolling for a distance the board has already
   * promised them. Fixing it is a different shape of problem, and this is
   * the rarer half of the case besides — every opening fork in the game is
   * `spin.ts`'s. Whatever this next leg itself sweeps past joins the queue
   * rather than resolving here, same as the first leg did in `spin.ts`.
   */
  if (state.stepsRemaining > 0 && space.next.length > 1) {
    const roll = state.stepsRemaining as SpinValue
    const branchTaken = resolveForkBranch(state.board, space.id, roll, player)
    if (branchTaken === undefined) {
      // Defensive only: `resolveForkBranch` returns a road whenever `next`
      // actually holds one, which a fork (`next.length > 1`) always does.
      return {
        ...state,
        pendingDecision: branchDecision(state.board, space.id, state.stepsRemaining, player),
        phase: 'awaitingDecision',
      }
    }

    const plan = planMovementVia(state.board, space.id, branchTaken, roll)
    const movedPlayer = movePlayerTo(player, plan.destinationId)
    const label = roadName(state.board, branchTaken)
    const log = appendLog(state, player.id, `${player.name}'s spin carries them onto ${label}.`, 'info')
    const players: readonly Player[] = state.players.map((candidate) =>
      candidate.id === movedPlayer.id ? movedPlayer : candidate,
    )
    const { leg, rest } = nextMovementLeg(plan.path, plan.passed)

    return {
      ...state,
      players,
      pendingPassedItems: plan.passed,
      movementPath: leg,
      pendingPath: rest,
      stepsRemaining: plan.stepsRemaining,
      phase: 'moving',
      log,
    }
  }

  const { state: nextState, event } = applyEffect(state, space, deps)

  if (nextState.pendingDecision) {
    return {
      ...nextState,
      phase: 'awaitingDecision',
      movementPath: [],
      pendingPath: [],
      stepsRemaining: 0,
    }
  }

  return {
    ...nextState,
    lastEvent: event,
    phase: 'resolved',
    movementPath: [],
    pendingPath: [],
    stepsRemaining: 0,
  }
}
