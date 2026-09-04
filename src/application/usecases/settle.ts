import type { GameState } from '@domain/model/types'
import { nextMovementLeg } from '@domain/board/movement'
import { applyEffect } from './applyEffect'
import { appendLog } from './logging'
import { applyPassedEvent } from './passedEvents'
import type { UseCaseDeps } from './types'

/**
 * Resolves whatever the pawn's move still owes: a payday or `event` tile
 * swept past that hasn't had its own card yet, a junction the move ran into,
 * a landing effect, or some of each in sequence. Called once per card — the
 * UI dispatches it again every time a `passingEvent` card is dismissed.
 *
 * A junction ends the move rather than being driven through it: the pawn
 * stops there and the phase goes back to `awaitingSpin`, where `spin.ts`
 * settles the road on a press of its own. See the comment on that branch for
 * what the alternative cost.
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
   * (see `spin.ts`). The road is settled by its own press, exactly as it is
   * there: the pawn comes to rest on the junction, the rail names both roads,
   * and the next press of the wheel picks one — 1-3 the first, 4-6 the second.
   *
   * **This used to be settled by the leftover distance, and that was the bug
   * behind "the second fork always goes up."** `stepsRemaining` at a junction
   * is what is left of a roll that has already spent at least one pip getting
   * here, so it is never a 6, it is a 5 only on a 6 rolled from the tile next
   * door, and its mass sits on 1, 2 and 3 — the low half, which is to say the
   * first road, which is to say the one the layout engine draws *above* the
   * trunk (`layoutFork` in `createBoard.ts`). Measured across 40 seeded
   * four-player games on every board and every difficulty, the mid-career
   * junction sent 73-86% of everyone who reached it this way up the first
   * road; the two junctions a pawn always comes to rest on — the start tile
   * and the `stop` at the estate agent's — split 50/50, because those are the
   * two that were already being settled by a press of their own.
   *
   * The justification written here for reusing the distance was that this is
   * "the rarer half of the case besides — every opening fork in the game is
   * `spin.ts`'s". That was true only of the *opening* fork. Every junction in
   * the middle of a board is reached mid-move far more often than it is landed
   * on exactly: 64-85% of its own crossings, on the same measurement. So the road
   * gets the press `spin.ts` already gives it.
   *
   * The steps still owed are *kept*, and that is the one thing the old
   * reasoning here got right: the player is mid-flight on a number that was
   * rolled turns-of-the-hourglass ago and is owed as travel, so asking for a
   * fresh distance would be re-rolling a distance the board has already
   * promised — and it would quietly speed the whole board up, since the mean
   * of a fresh throw is 3.5 against the ~2.1 a junction is typically reached
   * with. `spin.ts` spends them the moment the road is settled, so a pawn
   * covers exactly the ground it always did. Only the road changes hands.
   */
  if (state.stepsRemaining > 0 && space.next.length > 1) {
    const log = appendLog(
      state,
      player.id,
      `${player.name} pulls up at ${space.title}, where the road splits.`,
      'info',
    )
    return {
      ...state,
      chosenExit: null,
      movementPath: [],
      pendingPath: [],
      phase: 'awaitingSpin',
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
