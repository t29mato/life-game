import { describe, expect, it } from 'vitest'
import type { GameState } from '@domain/model/types'
import { AUTOSAVE_SLOT, SAVE_SLOT_COUNT } from '../ports/GameRepositoryPort'
import {
  createFakeRandom,
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from './fakes'

describe('createFakeRandom', () => {
  it('replays scripted spins in order and cycles once exhausted', () => {
    const random = createFakeRandom({ spins: [3, 7] })
    expect(random.spin()).toBe(3)
    expect(random.spin()).toBe(7)
    expect(random.spin()).toBe(3)
    expect(random.calls.spins).toBe(3)
  })

  it('defaults spin to 1 when no script is given', () => {
    const random = createFakeRandom()
    expect(random.spin()).toBe(1)
  })

  it('replays scripted ints and clamps them into the requested range', () => {
    const random = createFakeRandom({ ints: [5, 99] })
    expect(random.int(0, 10)).toBe(5)
    expect(random.int(0, 10)).toBe(10) // 99 clamps down to the max
    expect(random.calls.ints).toEqual([
      { min: 0, max: 10 },
      { min: 0, max: 10 },
    ])
  })

  it('picks by scripted index, wrapping the index into the items length', () => {
    const random = createFakeRandom({ picks: [1, 0] })
    expect(random.pick(['a', 'b', 'c'])).toBe('b')
    expect(random.pick(['a', 'b', 'c'])).toBe('a')
    expect(random.calls.picks).toBe(2)
  })

  it('throws when picking from an empty array', () => {
    const random = createFakeRandom()
    expect(() => random.pick([])).toThrow()
  })

  it('shuffles as a stable, deterministic rotation', () => {
    const random = createFakeRandom()
    expect(random.shuffle(['a', 'b', 'c'])).toEqual(['b', 'c', 'a'])
    expect(random.shuffle(['a', 'b', 'c'])).toEqual(['c', 'a', 'b'])
    expect(random.calls.shuffles).toBe(2)
  })

  it('returns an empty array when shuffling an empty array', () => {
    const random = createFakeRandom()
    expect(random.shuffle([])).toEqual([])
  })
})

describe('createSeededRandom', () => {
  it('reproduces the exact same sequence for the same seed', () => {
    const a = createSeededRandom(42)
    const b = createSeededRandom(42)
    const seqA = Array.from({ length: 20 }, () => a.spin())
    const seqB = Array.from({ length: 20 }, () => b.spin())
    expect(seqA).toEqual(seqB)
  })

  it('produces a different sequence for a different seed', () => {
    const a = createSeededRandom(1)
    const b = createSeededRandom(2)
    const seqA = Array.from({ length: 20 }, () => a.spin())
    const seqB = Array.from({ length: 20 }, () => b.spin())
    expect(seqA).not.toEqual(seqB)
  })

  it('spin() only ever yields values in [1, 10]', () => {
    const random = createSeededRandom(7)
    for (let i = 0; i < 2000; i += 1) {
      const value = random.spin()
      expect(value).toBeGreaterThanOrEqual(1)
      expect(value).toBeLessThanOrEqual(10)
      expect(Number.isInteger(value)).toBe(true)
    }
  })

  it('int(min, max) always stays within the inclusive range', () => {
    const random = createSeededRandom(99)
    for (let i = 0; i < 500; i += 1) {
      const value = random.int(5, 8)
      expect(value).toBeGreaterThanOrEqual(5)
      expect(value).toBeLessThanOrEqual(8)
    }
  })

  it('pick() always returns one of the given items', () => {
    const random = createSeededRandom(3)
    const items = ['x', 'y', 'z']
    for (let i = 0; i < 100; i += 1) {
      expect(items).toContain(random.pick(items))
    }
  })

  it('pick() throws on an empty array', () => {
    const random = createSeededRandom(3)
    expect(() => random.pick([])).toThrow()
  })

  it('shuffle() returns a permutation containing exactly the same elements', () => {
    const random = createSeededRandom(11)
    const items = [1, 2, 3, 4, 5]
    const shuffled = random.shuffle(items)
    expect(shuffled).toHaveLength(items.length)
    expect([...shuffled].sort()).toEqual([...items].sort())
  })

  it('does not mutate the array passed to shuffle', () => {
    const random = createSeededRandom(11)
    const items = [1, 2, 3]
    random.shuffle(items)
    expect(items).toEqual([1, 2, 3])
  })
})

describe('createInMemoryRepository', () => {
  const fixtureState = {
    phase: 'setup',
    turn: 4,
    players: [{ name: 'Alex' }, { name: 'Bo' }],
  } as unknown as GameState

  it('reports no saved game and a null load before anything is saved', () => {
    const repo = createInMemoryRepository()
    expect(repo.has(AUTOSAVE_SLOT)).toBe(false)
    expect(repo.load(AUTOSAVE_SLOT)).toBeNull()
  })

  it('round-trips a saved state in the slot it was written to', () => {
    const repo = createInMemoryRepository()
    repo.save(2, fixtureState)
    expect(repo.has(2)).toBe(true)
    expect(repo.load(2)).toBe(fixtureState)
  })

  it('keeps slots independent of one another', () => {
    const repo = createInMemoryRepository()
    repo.save(1, fixtureState)
    expect(repo.has(2)).toBe(false)
    expect(repo.load(2)).toBeNull()
  })

  it('forgets only the cleared slot', () => {
    const repo = createInMemoryRepository()
    repo.save(1, fixtureState)
    repo.save(3, fixtureState)
    repo.clear(1)
    expect(repo.has(1)).toBe(false)
    expect(repo.has(3)).toBe(true)
  })

  it('lists one entry per slot, in slot order, describing what is stored', () => {
    const repo = createInMemoryRepository()
    repo.save(2, fixtureState)
    const slots = repo.list()

    expect(slots).toHaveLength(SAVE_SLOT_COUNT)
    expect(slots.map((entry) => entry.slot)).toEqual([0, 1, 2, 3])
    expect(slots[0]).toEqual({ slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null })
    expect(slots[2]!.occupied).toBe(true)
    expect(slots[2]!.playerNames).toEqual(['Alex', 'Bo'])
    expect(slots[2]!.turn).toBe(4)
    expect(slots[2]!.savedAt).toBe('2026-01-01T00:00:01.000Z')
  })

  it('keeps two repository instances independent', () => {
    const repoA = createInMemoryRepository()
    const repoB = createInMemoryRepository()
    repoA.save(AUTOSAVE_SLOT, fixtureState)
    expect(repoB.has(AUTOSAVE_SLOT)).toBe(false)
  })
})

describe('createInMemoryStatsRepository', () => {
  const record = { winnerName: 'Alex', turns: 12, standings: [], editionId: 'usa' }

  it('starts empty', () => {
    expect(createInMemoryStatsRepository().list()).toEqual([])
  })

  it('stamps each appended record with a deterministic timestamp, newest first', () => {
    const stats = createInMemoryStatsRepository()
    stats.append(record)
    stats.append({ ...record, winnerName: 'Bo' })

    const listed = stats.list()
    expect(listed.map((entry) => entry.winnerName)).toEqual(['Bo', 'Alex'])
    expect(listed[1]!.playedAt).toBe('2026-01-01T00:00:01.000Z')
    expect(listed[0]!.playedAt).toBe('2026-01-01T00:00:02.000Z')
  })

  it('drops every record on clear()', () => {
    const stats = createInMemoryStatsRepository()
    stats.append(record)
    stats.clear()
    expect(stats.list()).toEqual([])
  })
})
