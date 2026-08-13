import type { Board, Decision, DecisionOption, GameState, SpaceId } from '@domain/model/types'

/**
 * Choosing which road to take.
 *
 * Every fork on this board sits on a `stop` space, so a player always begins
 * their turn standing on one rather than arriving mid-move. That makes it
 * possible — and fairer — to ask which way they are going *before* they spin:
 * choosing afterwards let them pick whichever lane the number happened to
 * land them well on, an advantage no board game gives you.
 */

export function isFork(board: Board, spaceId: SpaceId): boolean {
  return (board.spaces[spaceId]?.next.length ?? 0) > 1
}

/**
 * The decision offered at a fork. `steps` is the distance already rolled when
 * the fork interrupts a move in progress, and null when the choice is being
 * made before the wheel is spun at all.
 */
export function branchDecision(board: Board, spaceId: SpaceId, steps: number | null): Decision {
  const space = board.spaces[spaceId]
  if (!space) throw new Error(`branchDecision: unknown space "${spaceId}"`)

  const options: DecisionOption[] = space.next.map((nextId) => {
    const target = board.spaces[nextId]
    if (!target) throw new Error(`branchDecision: fork points to unknown space "${nextId}"`)
    return {
      id: target.id,
      // A lane names itself where it can; otherwise fall back to the first
      // tile, which is all an unnamed branch has to offer.
      label: target.lane?.name ?? target.title,
      description: target.lane?.summary ?? target.description,
      icon: target.icon,
    }
  })

  const prompt =
    steps === null
      ? 'Which way do you go? Choose your road, then spin.'
      : steps > 0
        ? `Which way do you go? You'll travel ${steps} space${steps === 1 ? '' : 's'} down it.`
        : 'Which way do you go?'

  return { kind: 'branch', prompt, options }
}

/** What a player faces the moment their turn begins: a road to pick, or the wheel. */
export function turnStart(state: GameState, playerIndex: number): Pick<GameState, 'phase' | 'pendingDecision'> {
  const player = state.players[playerIndex]
  if (player && !player.isRetired && isFork(state.board, player.spaceId)) {
    return { phase: 'awaitingDecision', pendingDecision: branchDecision(state.board, player.spaceId, null) }
  }
  return { phase: 'awaitingSpin', pendingDecision: null }
}
