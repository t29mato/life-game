import type { GameRecord, GameRecordEntry, StatsRepositoryPort } from '@application/ports/StatsRepositoryPort'
import { DEFAULT_EDITION_ID } from '@domain/edition/registry'

export const STATS_KEY = 'life-journey:stats'

/**
 * A group could play indefinitely over an evening; without a cap the record
 * list would grow localStorage without bound. This is generous enough to
 * cover a long session while staying cheap to read and write every game.
 */
export const STATS_HISTORY_CAP = 20

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPlausibleEntry(value: unknown): value is GameRecordEntry {
  if (!isRecord(value)) return false
  return (
    typeof value.name === 'string' &&
    typeof value.color === 'string' &&
    typeof value.total === 'number' &&
    typeof value.rank === 'number' &&
    typeof value.isCpu === 'boolean'
  )
}

/** The minimal shape check that keeps a corrupt or foreign entry from producing a broken records list. */
function isPlausibleRecord(value: unknown): value is GameRecord {
  if (!isRecord(value)) return false
  return (
    typeof value.playedAt === 'string' &&
    typeof value.winnerName === 'string' &&
    typeof value.turns === 'number' &&
    Array.isArray(value.standings) &&
    value.standings.every(isPlausibleEntry)
  )
}

/**
 * Resolves the `Storage` to use for this call. Storage access can throw (a
 * sandboxed iframe, Safari private browsing on old versions, a security
 * policy) so every access — including the initial lookup — is guarded.
 */
function resolveStorage(injected: Storage | undefined): Storage | null {
  if (injected) return injected
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}

/** Reads whatever is at `STATS_KEY`, discarding anything that is not a plausible record. Never throws. */
function readAll(storage: Storage): GameRecord[] {
  let raw: string | null
  try {
    raw = storage.getItem(STATS_KEY)
  } catch {
    return []
  }
  if (raw === null) return []

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return []
  }
  if (!Array.isArray(parsed)) return []

  /*
   * A record written before editions existed carries no `editionId`, and the
   * honest reading of it is the only game there was — the same defaulting the
   * missing `difficulty` field already gets. Filled in here rather than at
   * every reader, so nothing downstream has to know the field is young.
   */
  return parsed
    .filter(isPlausibleRecord)
    .map((record) => (record.editionId === undefined ? { ...record, editionId: DEFAULT_EDITION_ID } : record))
}

function writeAll(storage: Storage, records: readonly GameRecord[]): void {
  try {
    storage.setItem(STATS_KEY, JSON.stringify(records))
  } catch {
    // Quota exceeded, storage disabled, private-mode restrictions, etc.
    // Recording history is best-effort and must never take the game down with it.
  }
}

export function createLocalStorageStatsRepository(storage?: Storage): StatsRepositoryPort {
  const list = (): readonly GameRecord[] => {
    const target = resolveStorage(storage)
    if (!target) return []
    return readAll(target)
  }

  const append = (record: Omit<GameRecord, 'playedAt'>): void => {
    const target = resolveStorage(storage)
    if (!target) return

    // The adapter supplies the real clock — the pure layers above have none.
    const full: GameRecord = { ...record, playedAt: new Date().toISOString() }
    const next = [full, ...readAll(target)].slice(0, STATS_HISTORY_CAP)
    writeAll(target, next)
  }

  const clear = (): void => {
    const target = resolveStorage(storage)
    if (!target) return
    try {
      target.removeItem(STATS_KEY)
    } catch {
      // Nothing more we can do — the store is unusable either way.
    }
  }

  return { list, append, clear }
}
