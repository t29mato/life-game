import type { GameState, LandingEvent, Money, Space } from '@domain/model/types'
import { editionOf } from '@domain/edition/registry'
import { applyEffect } from './applyEffect'
import { formatMoney } from './format'
import { resolveSpinOutcome } from './choose'
import type { UseCaseDeps } from './types'

/**
 * Settling one payday or `event` tile a move swept past, not stopped on —
 * its own full card, exactly the shape a landing already gets, not a line
 * of text borrowed by whatever tile the pawn actually stops on. The player
 * asked for this by name: a card that never named its own tile made it
 * impossible to tell which space on the road had actually paid out.
 *
 * `applyEffect` already knows how to build this tile's decision — the exact
 * same call a landing makes — so the only thing missing for a tile crossed
 * mid-move is the press that would have answered it. That press decided
 * nothing a player could have steered anyway (every tile that reaches this
 * function carries a spin-only effect — an `event`-kind tile by
 * `validateRoute`'s own rule, a `payday`-kind tile because casual and
 * unsteady pay have never offered anything else to press), so the roll
 * answers it itself, through the exact same `resolveSpinOutcome` a manual
 * press would reach — no second implementation of what a tuition band or a
 * week's pay is worth to drift out of step with the one a landing shows.
 *
 * That roll leaves a mark on the card it produces (`LandingEvent.rolled`),
 * which is what lets the shell throw the die on screen before the card is
 * readable. A player who was never asked to press anything still gets to
 * watch the number arrive rather than read about it afterwards.
 */
export function applyPassedEvent(
  state: GameState,
  space: Space,
  deps: UseCaseDeps,
): { readonly state: GameState; readonly event: LandingEvent } {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('applyPassedEvent: no current player')

  const { state: afterEffect, event: initialEvent } = applyEffect(state, space, deps)

  let finalState = afterEffect
  let event = initialEvent
  if (afterEffect.pendingDecision) {
    const decision = afterEffect.pendingDecision
    if (decision.kind !== 'valueSpin' || decision.options.length !== 1) {
      // A route bug, not a player-facing one: `validateRoute` is meant to
      // catch this before it ships. Failing loudly here beats silently
      // asking a question nobody mid-move can actually answer.
      throw new Error(
        `applyPassedEvent: "${space.id}" raised a "${decision.kind}" decision with ${decision.options.length} option(s) — a tile passed mid-move must never need a real choice`,
      )
    }
    // `resolveSpinOutcome` below throws this decision away the moment it
    // picks a winner — grabbed here or it is gone. This is the same framing
    // and the same table a landed tile's own press-the-die screen shows
    // before the press; a swept tile deserves the same thing to hope for
    // while its die turns.
    const stakes = decision.options[0]?.description
    const table = decision.options[0]?.table
    const edition = editionOf(state)
    const money = (amount: Money) => formatMoney(amount, edition.currency)
    const spinValue = deps.random.spin()
    finalState = resolveSpinOutcome(afterEffect, player, space, spinValue, edition, deps, money)
    // `resolved()` in choose.ts always sets this for every branch
    // `resolveSpinOutcome` can reach; the fallback only guards the type.
    // Conditional spreads, not plain keys, because `exactOptionalPropertyTypes`
    // means an explicit `undefined` is not the same thing as the key being
    // absent — a decision's own description is effectively always present,
    // but nothing here should assume it, and most decisions carry no table.
    event = finalState.lastEvent
      ? {
          ...finalState.lastEvent,
          ...(stakes === undefined ? {} : { stakes }),
          ...(table === undefined ? {} : { table }),
        }
      : initialEvent
  }

  /*
   * Ends on the balance it left behind — an amount swept past mid-move is
   * easy to lose track of with play already moving on to the tile the pawn
   * actually stopped on, so the card says what it was worth *and* what it
   * left behind, not just the first. Only when it actually moved money — a
   * graduation or a career change has nothing to add here.
   */
  const finalPlayer = finalState.players.find((candidate) => candidate.id === player.id)
  const movedMoney = finalPlayer && finalPlayer.money !== player.money
  const edition = editionOf(state)
  const notes = movedMoney
    ? [...event.notes, `Now ${formatMoney(finalPlayer.money, edition.currency)}.`]
    : event.notes

  return {
    state: { ...state, players: finalState.players, log: finalState.log },
    event: { ...event, notes },
  }
}
