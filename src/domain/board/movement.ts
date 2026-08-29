import type { Board, Space, SpaceId } from '../model/types'
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
  paydaysPassed: readonly SpaceId[],
  eventsPassed: readonly SpaceId[],
): MovementPlan {
  const lastVisited = path[path.length - 1]
  return {
    path,
    destinationId: lastVisited ?? originId,
    stepsRemaining,
    stoppedBy,
    paydaysPassed,
    eventsPassed,
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
  paydaysPassed: readonly SpaceId[],
  eventsPassed: readonly SpaceId[],
): MovementPlan {
  let travelled = path
  let remaining = stepsOwed
  let paydays = paydaysPassed
  let events = eventsPassed
  let cursor = currentId

  while (true) {
    const currentSpace = getSpace(board, cursor)

    if (currentSpace.next.length === 0) {
      return finish(originId, travelled, 'terminal', 0, paydays, events)
    }
    if (currentSpace.next.length > 1) {
      return finish(originId, travelled, 'fork', remaining, paydays, events)
    }
    if (remaining === 0) {
      return finish(originId, travelled, 'stepsExhausted', 0, paydays, events)
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
      return finish(originId, travelled, 'forcedStop', 0, paydays, events)
    }
    if (nextId === board.retirementSpaceId) {
      return finish(originId, travelled, 'terminal', 0, paydays, events)
    }
    if (remaining === 0) {
      return finish(originId, travelled, 'stepsExhausted', 0, paydays, events)
    }
    if (nextSpace.kind === 'payday') {
      paydays = [...paydays, nextId]
    }
    if (nextSpace.kind === 'event') {
      events = [...events, nextId]
    }
  }
}

export function planMovement(board: Board, fromSpaceId: SpaceId, steps: number): MovementPlan {
  return walk(board, fromSpaceId, fromSpaceId, steps, [], [], [])
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
    return finish(forkSpaceId, path, 'forcedStop', 0, [], [])
  }
  if (chosenNextId === board.retirementSpaceId) {
    return finish(forkSpaceId, path, 'terminal', 0, [], [])
  }
  if (remaining === 0) {
    return finish(forkSpaceId, path, 'stepsExhausted', 0, [], [])
  }

  const paydaysPassed = chosenSpace.kind === 'payday' ? [chosenNextId] : []
  const eventsPassed = chosenSpace.kind === 'event' ? [chosenNextId] : []
  return walk(board, forkSpaceId, chosenNextId, remaining, path, paydaysPassed, eventsPassed)
}
