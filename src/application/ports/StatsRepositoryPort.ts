import type { EditionId, Money, PlayerColor } from '@domain/model/types'

export interface GameRecordEntry {
  readonly name: string
  readonly color: PlayerColor
  readonly total: Money
  readonly rank: number
  readonly isCpu: boolean
}

export interface GameRecord {
  /** ISO timestamp. Stamped by the adapter — the pure layers have no clock. */
  readonly playedAt: string
  readonly winnerName: string
  readonly turns: number
  readonly standings: readonly GameRecordEntry[]
  /**
   * Which edition was played. A record written before editions existed has no
   * id and reads back as `'usa'`, so an evening's history stays comparable
   * across the change — and once a second edition ships, a $310,000 win and a
   * ¥31,000,000 one stop looking like the same table.
   */
  readonly editionId: EditionId
}

/**
 * The hall of records: every finished game, so a group can keep score across a
 * whole evening rather than one board.
 */
export interface StatsRepositoryPort {
  /** Newest first. */
  list(): readonly GameRecord[]
  /** The adapter supplies `playedAt`. */
  append(record: Omit<GameRecord, 'playedAt'>): void
  clear(): void
}
