import type { Difficulty, EditionId, Player, PlayerId } from '@domain/model/types'
import { editionFor } from '@domain/edition/registry'
import { estimateNetWorth } from '@domain/rules/scoring'

export interface Standing {
  readonly netWorth: number
  readonly rank: number
}

/**
 * Ranks by live net worth, tying players who are exactly even — the same
 * rule `computeResults` uses at final scoring, so a mid-game glance and the
 * results screen never disagree about what a tie looks like. Returns a map
 * keyed by player id rather than a sorted array: callers render in seat
 * order and only look rank up here.
 *
 * `difficulty` matters because a harder game settles loans at a steeper
 * rate — two players holding different numbers of loans would otherwise be
 * ranked in the wrong order. `editionId` matters on the same grounds: each
 * edition prices loans and child bonuses in its own economy, so omitting it
 * would rank a non-USA game by USA rates. Optional, defaulting to the USA
 * board, on the usual terms — nothing that does not care about editions has
 * to know.
 */
export function rankPlayers(
  players: readonly Player[],
  difficulty: Difficulty,
  editionId?: EditionId,
): ReadonlyMap<PlayerId, Standing> {
  const edition = editionFor(editionId)
  const scored = players.map((player) => ({
    id: player.id,
    netWorth: estimateNetWorth(player, difficulty, edition),
  }))
  const sorted = [...scored].sort((a, b) => b.netWorth - a.netWorth)

  const result = new Map<PlayerId, Standing>()
  sorted.forEach((entry, index) => {
    const previous = index > 0 ? sorted[index - 1] : undefined
    const previousRank = previous ? result.get(previous.id)?.rank : undefined
    const rank =
      previous && previousRank !== undefined && entry.netWorth === previous.netWorth
        ? previousRank
        : index + 1
    result.set(entry.id, { netWorth: entry.netWorth, rank })
  })
  return result
}
