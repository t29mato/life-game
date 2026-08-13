import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameRecord, GameRecordEntry } from '@application/ports/StatsRepositoryPort'
import { STATS_HISTORY_CAP, STATS_KEY, createLocalStorageStatsRepository } from './LocalStorageStatsRepository'
import { createMemoryStorage } from './memoryStorage'

function fixtureEntry(overrides: Partial<GameRecordEntry> = {}): GameRecordEntry {
  return { name: 'Ada', color: 'red', total: 42_000, rank: 1, isCpu: false, ...overrides }
}

function fixtureRecord(overrides: Partial<Omit<GameRecord, 'playedAt'>> = {}): Omit<GameRecord, 'playedAt'> {
  return { winnerName: 'Ada', turns: 30, standings: [fixtureEntry()], editionId: 'usa', ...overrides }
}

function throwingStorage(): Storage {
  return {
    length: 0,
    clear() {
      throw new Error('storage disabled')
    },
    getItem() {
      throw new Error('storage disabled')
    },
    key() {
      throw new Error('storage disabled')
    },
    removeItem() {
      throw new Error('storage disabled')
    },
    setItem() {
      throw new Error('storage disabled')
    },
  }
}

describe('createLocalStorageStatsRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-11T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns an empty list when nothing has been recorded', () => {
    const repo = createLocalStorageStatsRepository(createMemoryStorage())
    expect(repo.list()).toEqual([])
  })

  it('round-trips a record through append then list', () => {
    const repo = createLocalStorageStatsRepository(createMemoryStorage())
    repo.append(fixtureRecord())
    expect(repo.list()).toEqual([{ ...fixtureRecord(), playedAt: '2026-08-11T12:00:00.000Z' }])
  })

  it('stamps playedAt with the real clock, not something supplied by the caller', () => {
    const repo = createLocalStorageStatsRepository(createMemoryStorage())
    repo.append(fixtureRecord())
    expect(repo.list()[0]!.playedAt).toBe('2026-08-11T12:00:00.000Z')

    vi.setSystemTime(new Date('2026-08-11T12:05:00.000Z'))
    repo.append(fixtureRecord({ winnerName: 'Grace' }))
    expect(repo.list()[0]!.playedAt).toBe('2026-08-11T12:05:00.000Z')
  })

  it('lists records newest first', () => {
    const repo = createLocalStorageStatsRepository(createMemoryStorage())
    repo.append(fixtureRecord({ winnerName: 'First' }))
    vi.setSystemTime(new Date('2026-08-11T12:05:00.000Z'))
    repo.append(fixtureRecord({ winnerName: 'Second' }))

    const names = repo.list().map((r) => r.winnerName)
    expect(names).toEqual(['Second', 'First'])
  })

  it('caps stored history at STATS_HISTORY_CAP, dropping the oldest entries', () => {
    const repo = createLocalStorageStatsRepository(createMemoryStorage())
    for (let i = 0; i < STATS_HISTORY_CAP + 5; i++) {
      vi.setSystemTime(new Date(2026, 0, 1, 0, i))
      repo.append(fixtureRecord({ winnerName: `game-${i}` }))
    }

    const names = repo.list().map((r) => r.winnerName)
    expect(names).toHaveLength(STATS_HISTORY_CAP)
    // Newest first: the most recent STATS_HISTORY_CAP games survive.
    expect(names[0]).toBe(`game-${STATS_HISTORY_CAP + 4}`)
    expect(names).not.toContain('game-0')
  })

  it('clear() empties the list', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageStatsRepository(storage)
    repo.append(fixtureRecord())
    repo.clear()
    expect(repo.list()).toEqual([])
    expect(storage.getItem(STATS_KEY)).toBeNull()
  })

  it('returns an empty list rather than throwing when the stored JSON is malformed', () => {
    const storage = createMemoryStorage()
    storage.setItem(STATS_KEY, '{not valid json')
    const repo = createLocalStorageStatsRepository(storage)
    expect(repo.list()).toEqual([])
  })

  it('returns an empty list when the stored payload is not an array', () => {
    const storage = createMemoryStorage()
    storage.setItem(STATS_KEY, JSON.stringify({ not: 'an array' }))
    const repo = createLocalStorageStatsRepository(storage)
    expect(repo.list()).toEqual([])
  })

  it('drops individual entries that are not plausible records rather than the whole list', () => {
    const storage = createMemoryStorage()
    const good: GameRecord = { ...fixtureRecord(), playedAt: '2026-08-11T12:00:00.000Z' }
    storage.setItem(STATS_KEY, JSON.stringify([good, { garbage: true }, 'nonsense']))
    const repo = createLocalStorageStatsRepository(storage)
    expect(repo.list()).toEqual([good])
  })

  it('drops a record whose standings entry is malformed', () => {
    const storage = createMemoryStorage()
    const broken = { ...fixtureRecord(), playedAt: '2026-08-11T12:00:00.000Z', standings: [{ name: 'Ada' }] }
    storage.setItem(STATS_KEY, JSON.stringify([broken]))
    const repo = createLocalStorageStatsRepository(storage)
    expect(repo.list()).toEqual([])
  })

  it('swallows a setItem quota/security exception instead of crashing', () => {
    const repo = createLocalStorageStatsRepository(throwingStorage())
    expect(() => repo.append(fixtureRecord())).not.toThrow()
  })

  it('clear() does not throw when storage is unavailable', () => {
    const repo = createLocalStorageStatsRepository(throwingStorage())
    expect(() => repo.clear()).not.toThrow()
  })

  it('is a safe no-op end to end when constructed with a throwing storage', () => {
    const repo = createLocalStorageStatsRepository(throwingStorage())
    expect(() => repo.append(fixtureRecord())).not.toThrow()
    expect(repo.list()).toEqual([])
    expect(() => repo.clear()).not.toThrow()
  })

  it('is a safe no-op when no storage argument is given and global localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    const repo = createLocalStorageStatsRepository()
    expect(() => repo.append(fixtureRecord())).not.toThrow()
    expect(repo.list()).toEqual([])
    expect(() => repo.clear()).not.toThrow()
  })

  it('keeps separate storages independent', () => {
    const a = createLocalStorageStatsRepository(createMemoryStorage())
    const b = createLocalStorageStatsRepository(createMemoryStorage())
    a.append(fixtureRecord())
    expect(b.list()).toEqual([])
  })
})
