import type { Board, Hazard, Money, PassedQueueItem, Space, SpaceId } from '../model/types'
import type { MovementPlan, MovementStopReason } from './movementTypes'

function getSpace(board: Board, id: SpaceId): Space {
  const space = board.spaces[id]
  if (!space) {
    throw new Error(`Board has no space with id "${id}"`)
  }
  return space
}

function finish(
  originId: SpaceId,
  path: readonly SpaceId[],
  stoppedBy: MovementStopReason,
  stepsRemaining: number,
  passed: readonly PassedQueueItem[],
): MovementPlan {
  const lastVisited = path[path.length - 1]
  return {
    path,
    destinationId: lastVisited ?? originId,
    stepsRemaining,
    stoppedBy,
    passed,
  }
}

/**
 * Shared step-by-step walk used by both `planMovement` and `planMovementVia`
 * once the pawn already sits on the space it should start walking from.
 */
function walk(
  board: Board,
  originId: SpaceId,
  currentId: SpaceId,
  stepsOwed: number,
  path: readonly SpaceId[],
  passedSoFar: readonly PassedQueueItem[],
): MovementPlan {
  let travelled = path
  let remaining = stepsOwed
  let passed = passedSoFar
  let cursor = currentId

  while (true) {
    const currentSpace = getSpace(board, cursor)

    if (currentSpace.next.length === 0) {
      return finish(originId, travelled, 'terminal', 0, passed)
    }
    if (currentSpace.next.length > 1) {
      return finish(originId, travelled, 'fork', remaining, passed)
    }
    if (remaining === 0) {
      return finish(originId, travelled, 'stepsExhausted', 0, passed)
    }

    const nextId = currentSpace.next[0]
    if (nextId === undefined) {
      throw new Error(`Space "${cursor}" declares a single exit but none is present`)
    }
    const nextSpace = getSpace(board, nextId)

    travelled = [...travelled, nextId]
    remaining -= 1
    cursor = nextId

    // A true `stop` is now the rare tile whose effect is a real decision —
    // see `SpaceKind` — so it is still the one kind that halts movement
    // outright, steps and all.
    if (nextSpace.kind === 'stop') {
      return finish(originId, travelled, 'forcedStop', 0, passed)
    }
    if (nextId === board.retirementSpaceId) {
      return finish(originId, travelled, 'terminal', 0, passed)
    }
    if (remaining === 0) {
      return finish(originId, travelled, 'stepsExhausted', 0, passed)
    }
    if (nextSpace.kind === 'payday') {
      passed = [...passed, { kind: 'payday', spaceId: nextId }]
    }
    if (nextSpace.kind === 'event') {
      passed = [...passed, { kind: 'event', spaceId: nextId }]
    }
  }
}

export function planMovement(board: Board, fromSpaceId: SpaceId, steps: number): MovementPlan {
  return walk(board, fromSpaceId, fromSpaceId, steps, [], [])
}

export function planMovementVia(
  board: Board,
  forkSpaceId: SpaceId,
  chosenNextId: SpaceId,
  steps: number,
): MovementPlan {
  const forkSpace = getSpace(board, forkSpaceId)
  if (!forkSpace.next.includes(chosenNextId)) {
    throw new Error(
      `"${chosenNextId}" is not a valid branch from fork "${forkSpaceId}"; expected one of: ${forkSpace.next.join(', ')}`,
    )
  }

  const chosenSpace = getSpace(board, chosenNextId)
  const path = [chosenNextId]
  const remaining = steps - 1

  if (chosenSpace.kind === 'stop') {
    return finish(forkSpaceId, path, 'forcedStop', 0, [])
  }
  if (chosenNextId === board.retirementSpaceId) {
    return finish(forkSpaceId, path, 'terminal', 0, [])
  }
  if (remaining === 0) {
    return finish(forkSpaceId, path, 'stepsExhausted', 0, [])
  }

  const passed: readonly PassedQueueItem[] =
    chosenSpace.kind === 'payday'
      ? [{ kind: 'payday', spaceId: chosenNextId }]
      : chosenSpace.kind === 'event'
        ? [{ kind: 'event', spaceId: chosenNextId }]
        : []
  return walk(board, forkSpaceId, chosenNextId, remaining, path, passed)
}

/** One leg of a hop: where the pawn stops next, and what road is left after it. */
export interface MovementLeg {
  /**
   * Spaces to hop through now, ending on the tile the pawn comes to rest on —
   * either the next tile that owes a card, or the real destination.
   */
  readonly leg: readonly SpaceId[]
  /** Everything still to hop after that rest, in order. Empty on the last leg. */
  readonly rest: readonly SpaceId[]
}

/**
 * Cuts a hop at the next tile that owes the player a card.
 *
 * The pawn used to travel the whole rolled distance in one uninterrupted
 * sweep and only then be handed a stack of cards for everything it had gone
 * past — which read as the tiles having happened to somebody else, somewhere
 * back down the road, while the car sat parked on a space with nothing to do
 * with any of them. So a move is walked one leg at a time now: hop, stop *on*
 * the tile, read its card, and only then carry on. This is the cut, and it is
 * pure so that both `spin` and `settle` make it the same way.
 *
 * `queue` is in road order — see `MovementPlan.passed`, where that ordering is
 * established and why it matters. With nothing queued the whole path is one
 * leg, which is exactly the uninterrupted hop an ordinary move has always
 * been.
 */
export function nextMovementLeg(
  path: readonly SpaceId[],
  queue: readonly PassedQueueItem[],
): MovementLeg {
  const next = queue[0]
  if (!next) return { leg: path, rest: [] }
  const stopAt = path.indexOf(next.spaceId)
  // A queued tile the path does not contain would be a bug in whoever built
  // the queue; travelling the whole way at once is the honest fallback, and
  // it degrades to exactly the behaviour that shipped before legs existed.
  if (stopAt === -1) return { leg: path, rest: [] }
  return { leg: path.slice(0, stopAt + 1), rest: path.slice(stopAt + 1) }
}

/** Every space still reachable from `from`, following the board forwards. */
export function reachableFrom(board: Board, from: SpaceId): Set<SpaceId> {
  const seen = new Set<SpaceId>()
  let frontier: SpaceId[] = [from]
  while (frontier.length > 0) {
    const nextFrontier: SpaceId[] = []
    for (const id of frontier) {
      if (seen.has(id)) continue
      seen.add(id)
      const space = board.spaces[id]
      if (space) nextFrontier.push(...space.next)
    }
    frontier = nextFrontier
  }
  return seen
}

/**
 * Every bill of one hazard still on the road ahead, and what they add up to.
 *
 * The one number the insurance office actually needs, and it has to be read
 * off the board rather than written down anywhere: the bills are scaled by
 * difficulty, differ by edition, and — because the office comes round twice —
 * a policy sold at the second window may have nothing left ahead of it to
 * claim on at all. A card that says so is the difference between an honest
 * price and a shop selling cover for a road already travelled.
 *
 * `worst` is the largest single bill, which is what a player is really being
 * asked about: one claim, not a lifetime of them.
 */
export function hazardBillsAhead(
  board: Board,
  from: SpaceId,
  hazard: Hazard,
): { readonly count: number; readonly total: Money; readonly worst: Money } {
  let count = 0
  let total = 0
  let worst = 0
  for (const id of reachableFrom(board, from)) {
    const effect = board.spaces[id]?.effect
    if (effect?.type !== 'payMoney' || effect.hazard !== hazard) continue
    count += 1
    total += effect.amount
    worst = Math.max(worst, effect.amount)
  }
  return { count, total, worst }
}
