import type { GameState, Money, Space, SpaceId } from '@domain/model/types'
import { editionOf } from '@domain/edition/registry'
import { applyEffect } from './applyEffect'
import { formatMoney } from './format'
import { resolveSpinOutcome } from './choose'
import type { UseCaseDeps } from './types'

/**
 * Settling an `event` tile the roll only swept past, not stopped on.
 *
 * `applyEffect` already knows how to build this tile's decision — the exact
 * same call a landing makes — so the only thing missing for a tile crossed
 * mid-move is the press that would have answered it. That press decided
 * nothing a player could have steered anyway (every `event` tile carries a
 * spin-only effect; `validateRoute`'s `AUTO_RESOLVABLE_EFFECT_TYPES` is what
 * keeps it that way), so the roll answers it itself, through the exact same
 * `resolveSpinOutcome` a manual press would reach — no second implementation
 * of what a tuition band or a promotion bar is worth to drift out of step
 * with the one the result card already shows.
 */
export function applyPassedEvent(
  state: GameState,
  space: Space,
  deps: UseCaseDeps,
): { readonly state: GameState; readonly note: string } {
  const player = state.players[state.currentPlayerIndex]
  if (!player) throw new Error('applyPassedEvent: no current player')

  const { state: afterEffect } = applyEffect(state, space, deps)

  let finalState = afterEffect
  if (afterEffect.pendingDecision) {
    const decision = afterEffect.pendingDecision
    if (decision.kind !== 'valueSpin' || decision.options.length !== 1) {
      // A route bug, not a player-facing one: `validateRoute` is meant to
      // catch this before it ships. Failing loudly here beats silently
      // asking a question nobody mid-move can actually answer.
      throw new Error(
        `applyPassedEvent: "${space.id}" raised a "${decision.kind}" decision with ${decision.options.length} option(s) — an "event" tile must never need a real choice`,
      )
    }
    const edition = editionOf(state)
    const money = (amount: Money) => formatMoney(amount, edition.currency)
    const spinValue = deps.random.spin()
    finalState = resolveSpinOutcome(afterEffect, player, space, spinValue, edition, deps, money)
  }

  const lastEntry = finalState.log[finalState.log.length - 1]
  const baseNote = lastEntry?.message ?? `${player.name} passes ${space.title}.`

  /*
   * Ends on the balance it left behind, same as `passedPaydayLine` — the
   * player asked for this specifically: an amount swept past mid-move is
   * easy to lose track of with the wheel still spinning towards somewhere
   * else, so the note it leaves in the log says what it was worth *and*
   * what it left behind, not just the first. Only when it actually moved
   * money — a graduation or a career change has nothing to add here.
   */
  const finalPlayer = finalState.players.find((candidate) => candidate.id === player.id)
  const movedMoney = finalPlayer && finalPlayer.money !== player.money
  const edition = editionOf(state)
  const note = movedMoney
    ? `${baseNote} Now ${formatMoney(finalPlayer.money, edition.currency)}.`
    : baseNote

  return {
    state: { ...state, players: finalState.players, log: finalState.log },
    note,
  }
}

/**
 * Every `event` tile a move swept past, settled in the order the road
 * crossed them — same shape as `collectPaydays`, generalised past the one
 * kind of tile that used to be the only thing a move could pass without
 * stopping on.
 */
export function applyPassedEvents(
  state: GameState,
  spaceIds: readonly SpaceId[],
  deps: UseCaseDeps,
): { readonly state: GameState; readonly notes: readonly string[] } {
  let current = state
  const notes: string[] = []
  for (const spaceId of spaceIds) {
    const space = current.board.spaces[spaceId]
    if (!space) throw new Error(`applyPassedEvents: unknown space "${spaceId}"`)
    const result = applyPassedEvent(current, space, deps)
    current = result.state
    notes.push(result.note)
  }
  return { state: current, notes }
}
