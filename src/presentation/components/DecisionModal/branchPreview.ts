import type { Board, Space, SpaceId } from '@domain/model/types'
import { EN, type UiText } from '../../i18n/en'

/** How many spaces ahead a lane preview walks by default. */
export const LANE_PREVIEW_DEPTH = 4

/**
 * Walks a lane starting at `startSpaceId`, following the first outgoing edge
 * at every space (including a further fork) for up to `depth` spaces. Used to
 * give the player a look at what a branch holds before they commit to it —
 * picking blind is the weakest decision in the game without this.
 */
export function previewLane(board: Board, startSpaceId: SpaceId, depth = LANE_PREVIEW_DEPTH): readonly Space[] {
  const spaces: Space[] = []
  let currentId: SpaceId | undefined = startSpaceId

  while (currentId && spaces.length < depth) {
    const space: Space | undefined = board.spaces[currentId]
    if (!space) break
    spaces.push(space)
    currentId = space.next[0]
  }

  return spaces
}

export type LaneCharacter = 'payday-heavy' | 'event-heavy' | 'mixed'

/** How a previewed lane's character reads, in the language the player is in. */
export function laneCharacterLabel(character: LaneCharacter, t: UiText = EN): string {
  if (character === 'payday-heavy') return t.decision.lanePaydayHeavy
  if (character === 'event-heavy') return t.decision.laneEventHeavy
  return t.decision.laneMixed
}

/** Spaces that resolve to nothing happening — they do not make a lane "eventful". */
const QUIET_EFFECTS = new Set(['none'])

/**
 * Summarises the character of a previewed lane so it can be read at a glance:
 * mostly paydays, mostly other events, or a genuine mix.
 */
export function summarizeLane(spaces: readonly Space[]): LaneCharacter {
  if (spaces.length === 0) return 'mixed'

  const paydayCount = spaces.filter(
    (space) => space.kind === 'payday' || space.effect.type === 'payday' || space.effect.type === 'payRaise',
  ).length
  const eventCount = spaces.filter(
    (space) => space.kind !== 'payday' && !QUIET_EFFECTS.has(space.effect.type),
  ).length

  if (paydayCount / spaces.length >= 0.4) return 'payday-heavy'
  if (eventCount / spaces.length >= 0.6) return 'event-heavy'
  return 'mixed'
}
