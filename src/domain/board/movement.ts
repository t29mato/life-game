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
  paydaysPassed: number,
): MovementPlan {
  const lastVisited = path[path.length - 1]
  return {
    path,
    destinationId: lastVisited ?? originId,
    stepsRemaining,
    stoppedBy,
    paydaysPassed,
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
  paydaysPassed: number,
): MovementPlan {
  let travelled = path
  let remaining = stepsOwed
  let paydays = paydaysPassed
  let cursor = currentId

  while (true) {
    const currentSpace = getSpace(board, cursor)

    if (currentSpace.next.length === 0) {
      return finish(originId, travelled, 'terminal', 0, paydays)
    }
    if (currentSpace.next.length > 1) {
      return finish(originId, travelled, 'fork', remaining, paydays)
    }
    if (remaining === 0) {
      return finish(originId, travelled, 'stepsExhausted', 0, paydays)
    }

    const nextId = currentSpace.next[0]
    if (nextId === undefined) {
      throw new Error(`Space "${cursor}" declares a single exit but none is present`)
    }
    const nextSpace = getSpace(board, nextId)

    travelled = [...travelled, nextId]
    remaining -= 1
    cursor = nextId

    if (nextSpace.kind === 'stop') {
      return finish(originId, travelled, 'forcedStop', 0, paydays)
    }
    if (nextId === board.retirementSpaceId) {
      return finish(originId, travelled, 'terminal', 0, paydays)
    }
    if (remaining === 0) {
      return finish(originId, travelled, 'stepsExhausted', 0, paydays)
    }
    if (nextSpace.kind === 'payday') {
      paydays += 1
    }
  }
}

export function planMovement(board: Board, fromSpaceId: SpaceId, steps: number): MovementPlan {
  return walk(board, fromSpaceId, fromSpaceId, steps, [], 0)
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
    return finish(forkSpaceId, path, 'forcedStop', 0, 0)
  }
  if (chosenNextId === board.retirementSpaceId) {
    return finish(forkSpaceId, path, 'terminal', 0, 0)
  }
  if (remaining === 0) {
    return finish(forkSpaceId, path, 'stepsExhausted', 0, 0)
  }

  const paydaysPassed = chosenSpace.kind === 'payday' ? 1 : 0
  return walk(board, forkSpaceId, chosenNextId, remaining, path, paydaysPassed)
}
