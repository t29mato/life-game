import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlayerProfile } from '@application/ports/PlayerProfileRepositoryPort'
import { PROFILE_LIST_CAP } from '@application/ports/PlayerProfileRepositoryPort'
import { PROFILES_KEY, createLocalStoragePlayerProfileRepository } from './LocalStoragePlayerProfileRepository'
import { createMemoryStorage } from './memoryStorage'

function fixtureProfile(
  overrides: Partial<Omit<PlayerProfile, 'lastUsedAt'>> = {},
): Omit<PlayerProfile, 'lastUsedAt'> {
  return { name: 'Ada', color: 'teal', face: 'cheerful', ...overrides }
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

describe('createLocalStoragePlayerProfileRepository', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-29T12:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  it('returns an empty list when nobody has been remembered yet', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    expect(repo.list()).toEqual([])
  })

  it('round-trips a profile through upsert then list', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    repo.upsert(fixtureProfile())
    expect(repo.list()).toEqual([{ ...fixtureProfile(), lastUsedAt: '2026-08-29T12:00:00.000Z' }])
  })

  it('stamps lastUsedAt with the real clock, not something supplied by the caller', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    repo.upsert(fixtureProfile())
    expect(repo.list()[0]!.lastUsedAt).toBe('2026-08-29T12:00:00.000Z')

    vi.setSystemTime(new Date('2026-08-29T12:05:00.000Z'))
    repo.upsert(fixtureProfile({ name: 'Grace' }))
    expect(repo.list()[0]!.lastUsedAt).toBe('2026-08-29T12:05:00.000Z')
  })

  it('lists profiles most recently used first', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    repo.upsert(fixtureProfile({ name: 'Ada' }))
    vi.setSystemTime(new Date('2026-08-29T12:05:00.000Z'))
    repo.upsert(fixtureProfile({ name: 'Grace' }))

    expect(repo.list().map((p) => p.name)).toEqual(['Grace', 'Ada'])
  })

  it('treats "Alex" and "alex" as the same person, keeping the newer design and spelling', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    repo.upsert(fixtureProfile({ name: 'Alex', color: 'red', face: 'classic' }))
    repo.upsert(fixtureProfile({ name: 'alex', color: 'navy', face: 'cool' }))

    const profiles = repo.list()
    expect(profiles).toHaveLength(1)
    expect(profiles[0]).toMatchObject({ name: 'alex', color: 'navy', face: 'cool' })
  })

  it('moves a returning player back to the front of the list', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    repo.upsert(fixtureProfile({ name: 'Ada' }))
    repo.upsert(fixtureProfile({ name: 'Grace' }))
    repo.upsert(fixtureProfile({ name: 'Ada' }))

    expect(repo.list().map((p) => p.name)).toEqual(['Ada', 'Grace'])
  })

  it('caps the list at PROFILE_LIST_CAP, evicting the least recently used', () => {
    const repo = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    for (let i = 0; i < PROFILE_LIST_CAP + 3; i++) {
      vi.setSystemTime(new Date(2026, 0, 1, 0, i))
      repo.upsert(fixtureProfile({ name: `player-${i}` }))
    }

    const names = repo.list().map((p) => p.name)
    expect(names).toHaveLength(PROFILE_LIST_CAP)
    expect(names[0]).toBe(`player-${PROFILE_LIST_CAP + 2}`)
    expect(names).not.toContain('player-0')
  })

  it('clear() forgets everyone', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStoragePlayerProfileRepository(storage)
    repo.upsert(fixtureProfile())
    repo.clear()
    expect(repo.list()).toEqual([])
    expect(storage.getItem(PROFILES_KEY)).toBeNull()
  })

  it('returns an empty list rather than throwing when the stored JSON is malformed', () => {
    const storage = createMemoryStorage()
    storage.setItem(PROFILES_KEY, '{not valid json')
    const repo = createLocalStoragePlayerProfileRepository(storage)
    expect(repo.list()).toEqual([])
  })

  it('returns an empty list when the stored payload is not an array', () => {
    const storage = createMemoryStorage()
    storage.setItem(PROFILES_KEY, JSON.stringify({ not: 'an array' }))
    const repo = createLocalStoragePlayerProfileRepository(storage)
    expect(repo.list()).toEqual([])
  })

  it('drops individual entries that are not plausible profiles rather than the whole list', () => {
    const storage = createMemoryStorage()
    const good: PlayerProfile = { ...fixtureProfile(), lastUsedAt: '2026-08-29T12:00:00.000Z' }
    storage.setItem(PROFILES_KEY, JSON.stringify([good, { garbage: true }, 'nonsense', { name: '  ' }]))
    const repo = createLocalStoragePlayerProfileRepository(storage)
    expect(repo.list()).toEqual([good])
  })

  it('swallows a setItem quota/security exception instead of crashing', () => {
    const repo = createLocalStoragePlayerProfileRepository(throwingStorage())
    expect(() => repo.upsert(fixtureProfile())).not.toThrow()
  })

  it('is a safe no-op end to end when constructed with a throwing storage', () => {
    const repo = createLocalStoragePlayerProfileRepository(throwingStorage())
    expect(() => repo.upsert(fixtureProfile())).not.toThrow()
    expect(repo.list()).toEqual([])
    expect(() => repo.clear()).not.toThrow()
  })

  it('is a safe no-op when no storage argument is given and global localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    const repo = createLocalStoragePlayerProfileRepository()
    expect(() => repo.upsert(fixtureProfile())).not.toThrow()
    expect(repo.list()).toEqual([])
    expect(() => repo.clear()).not.toThrow()
  })

  it('keeps separate storages independent', () => {
    const a = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    const b = createLocalStoragePlayerProfileRepository(createMemoryStorage())
    a.upsert(fixtureProfile())
    expect(b.list()).toEqual([])
  })
})
