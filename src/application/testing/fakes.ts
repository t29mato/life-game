import type { GameState, SpinValue } from '@domain/model/types'
import type { RandomPort } from '../ports/RandomPort'
import type { GameRepositoryPort, SaveSlotInfo } from '../ports/GameRepositoryPort'
import { SAVE_SLOT_COUNT } from '../ports/GameRepositoryPort'
import type { GameRecord, StatsRepositoryPort } from '../ports/StatsRepositoryPort'

/** Values a `createFakeRandom` port will replay, in call order, cycling once exhausted. */
export interface FakeRandomScript {
  readonly spins: SpinValue[]
  readonly ints: number[]
  /** Indices into whatever array is passed to `pick`/`shuffle`'s `items`. */
  readonly picks: number[]
}

/** Tallies every call made to a fake port, for assertions. */
export interface FakeRandomCalls {
  spins: number
  ints: Array<{ min: number; max: number }>
  picks: number
  shuffles: number
}

export interface FakeRandomPort extends RandomPort {
  readonly calls: FakeRandomCalls
}

/**
 * A scripted, deterministic `RandomPort`. Each method advances its own cursor
 * through the matching script array and wraps back to the start once
 * exhausted, so a short script can still drive a long test.
 */
export function createFakeRandom(script?: Partial<FakeRandomScript>): FakeRandomPort {
  const spins = script?.spins && script.spins.length > 0 ? script.spins : [1]
  const ints = script?.ints && script.ints.length > 0 ? script.ints : [0]
  const picks = script?.picks && script.picks.length > 0 ? script.picks : [0]

  let spinCursor = 0
  let intCursor = 0
  let pickCursor = 0

  const calls: FakeRandomCalls = { spins: 0, ints: [], picks: 0, shuffles: 0 }

  return {
    calls,
    spin(): SpinValue {
      const value = spins[spinCursor % spins.length] as SpinValue
      spinCursor += 1
      calls.spins += 1
      return value
    },
    int(min: number, max: number): number {
      const scripted = ints[intCursor % ints.length] as number
      intCursor += 1
      calls.ints.push({ min, max })
      // Clamp so a script written for one call site still behaves sanely at another.
      return Math.min(Math.max(scripted, min), max)
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('cannot pick from an empty array')
      const index = picks[pickCursor % picks.length] as number
      pickCursor += 1
      calls.picks += 1
      return items[((index % items.length) + items.length) % items.length] as T
    },
    shuffle<T>(items: readonly T[]): T[] {
      calls.shuffles += 1
      if (items.length === 0) return []
      // Stable identity-ish rotation: deterministic, easy to reason about in tests,
      // and still reorders the array so callers can't rely on index 0 staying put.
      const rotateBy = calls.shuffles % items.length
      return [...items.slice(rotateBy), ...items.slice(0, rotateBy)]
    },
  }
}

/** mulberry32: a tiny, fast, deterministic PRNG — good enough for replayable games. */
function mulberry32(seed: number): () => number {
  let state = seed | 0
  return () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * A whole-game-reproducible `RandomPort` seeded from a single number. Same
 * seed, same sequence of spins/ints/picks/shuffles, forever.
 */
export function createSeededRandom(seed: number): RandomPort {
  const next = mulberry32(seed)

  const nextInt = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1))

  return {
    spin(): SpinValue {
      return nextInt(1, 10) as SpinValue
    },
    int(min: number, max: number): number {
      return nextInt(min, max)
    },
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) throw new Error('cannot pick from an empty array')
      return items[nextInt(0, items.length - 1)] as T
    },
    shuffle<T>(items: readonly T[]): T[] {
      const result = [...items]
      for (let i = result.length - 1; i > 0; i -= 1) {
        const j = nextInt(0, i)
        const a = result[i] as T
        const b = result[j] as T
        result[i] = b
        result[j] = a
      }
      return result
    },
  }
}

/**
 * Deterministic stand-in for a wall clock. Real adapters stamp saves and
 * records with `Date.now()`; the fakes count instead, so a test can assert on
 * an exact timestamp and two runs never disagree.
 */
function createFakeClock(): () => string {
  let tick = 0
  return () => {
    tick += 1
    return new Date(Date.UTC(2026, 0, 1, 0, 0, tick)).toISOString()
  }
}

interface StoredSlot {
  readonly state: GameState
  readonly savedAt: string
}

/**
 * A slot-aware `GameRepositoryPort` backed by a plain in-memory map. Nothing
 * persists past the process, and every timestamp comes from a counting clock
 * so save-slot assertions stay reproducible.
 */
export function createInMemoryRepository(): GameRepositoryPort {
  const stored = new Map<number, StoredSlot>()
  const now = createFakeClock()

  return {
    save(slot: number, state: GameState): void {
      stored.set(slot, { state, savedAt: now() })
    },
    load(slot: number): GameState | null {
      return stored.get(slot)?.state ?? null
    },
    clear(slot: number): void {
      stored.delete(slot)
    },
    has(slot: number): boolean {
      return stored.has(slot)
    },
    list(): readonly SaveSlotInfo[] {
      return Array.from({ length: SAVE_SLOT_COUNT }, (_unused, slot): SaveSlotInfo => {
        const entry = stored.get(slot)
        if (!entry) {
          return { slot, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null }
        }
        return {
          slot,
          occupied: true,
          savedAt: entry.savedAt,
          playerNames: entry.state.players.map((player) => player.name),
          turn: entry.state.turn,
          editionId: entry.state.editionId ?? null,
        }
      })
    },
  }
}

/** A `StatsRepositoryPort` backed by an in-memory array, newest record first. */
export function createInMemoryStatsRepository(): StatsRepositoryPort {
  let records: GameRecord[] = []
  const now = createFakeClock()

  return {
    list(): readonly GameRecord[] {
      return records
    },
    append(record: Omit<GameRecord, 'playedAt'>): void {
      records = [{ ...record, playedAt: now() }, ...records]
    },
    clear(): void {
      records = []
    },
  }
}
