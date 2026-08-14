import { afterEach, describe, expect, it, vi } from 'vitest'
import { SAVE_SLOT_COUNT } from '@application/ports/GameRepositoryPort'
import type { Board, GameState, Player } from '@domain/model/types'
import { SAVE_KEY_PREFIX, SAVE_VERSION, createLocalStorageGameRepository } from './LocalStorageGameRepository'
import { createMemoryStorage } from './memoryStorage'

const fixtureBoard: Board = {
  spaces: {
    start: {
      id: 'start',
      kind: 'start',
      title: 'Start',
      description: 'The beginning of the road.',
      effect: { type: 'none' },
      next: ['end'],
      layout: { x: 0, y: 0 },
      tone: 'blue',
      icon: 'space:payday',
    },
    end: {
      id: 'end',
      kind: 'retirement',
      title: 'Retirement',
      description: 'The end of the road.',
      effect: { type: 'retire' },
      next: [],
      layout: { x: 1, y: 0 },
      tone: 'gold',
      icon: 'space:payday',
    },
  },
  startSpaceId: 'start',
  retirementSpaceId: 'end',
  width: 2,
  height: 1,
}

function fixturePlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    name: 'Ada',
    color: 'red',
    spaceId: 'start',
    money: 10_000,
    loans: 0,
    career: null,
    hasDegree: false,
    isMarried: false,
    children: 0,
    house: null,
    lifeTiles: [],
    stocks: [],
    insurance: [],
    isCpu: false,
    isRetired: false,
    retirementRank: null,
    ...overrides,
  }
}

function fixtureState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: fixtureBoard,
    editionId: 'usa',
    boardLength: 'standard',
    difficulty: 'normal',
    players: [fixturePlayer()],
    currentPlayerIndex: 0,
    phase: 'awaitingSpin',
    pendingDecision: null,
    lastSpin: null,
    movementPath: [],
    stepsRemaining: 0,
    chosenExit: null,
    lastEvent: null,
    log: [],
    turn: 1,
    results: null,
    ...overrides,
  }
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

describe('createLocalStorageGameRepository', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('round-trips a game state through save then load on a slot', () => {
    const repo = createLocalStorageGameRepository(createMemoryStorage())
    repo.save(1, fixtureState())
    expect(repo.load(1)).toEqual(fixtureState())
  })

  it('stores the snapshot under a per-slot key as version-tagged JSON', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    repo.save(2, fixtureState())
    const raw = storage.getItem(`${SAVE_KEY_PREFIX}2`)
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.version).toBe(SAVE_VERSION)
    expect(typeof parsed.savedAt).toBe('string')
    expect(parsed.state).toEqual(fixtureState())
  })

  it('returns null for an empty slot', () => {
    const repo = createLocalStorageGameRepository(createMemoryStorage())
    expect(repo.load(0)).toBeNull()
  })

  it('returns null and clears the entry when the stored JSON is malformed (a corrupt slot)', () => {
    const storage = createMemoryStorage()
    storage.setItem(`${SAVE_KEY_PREFIX}0`, '{not valid json')
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.load(0)).toBeNull()
    expect(storage.getItem(`${SAVE_KEY_PREFIX}0`)).toBeNull()
  })

  it('returns null when the parsed payload is not an object', () => {
    const storage = createMemoryStorage()
    storage.setItem(`${SAVE_KEY_PREFIX}0`, JSON.stringify('just a string'))
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.load(0)).toBeNull()
  })

  it('returns null and clears the entry when the version does not match (a stale slot)', () => {
    const storage = createMemoryStorage()
    storage.setItem(
      `${SAVE_KEY_PREFIX}0`,
      JSON.stringify({ version: SAVE_VERSION - 1, savedAt: new Date().toISOString(), state: fixtureState() }),
    )
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.load(0)).toBeNull()
    expect(storage.getItem(`${SAVE_KEY_PREFIX}0`)).toBeNull()
  })

  it('returns null when the state is missing players', () => {
    const storage = createMemoryStorage()
    const broken: Record<string, unknown> = { ...fixtureState() }
    delete broken.players
    storage.setItem(
      `${SAVE_KEY_PREFIX}0`,
      JSON.stringify({ version: SAVE_VERSION, savedAt: new Date().toISOString(), state: broken }),
    )
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.load(0)).toBeNull()
  })

  it('returns null when the state is missing the board', () => {
    const storage = createMemoryStorage()
    const broken: Record<string, unknown> = { ...fixtureState() }
    delete broken.board
    storage.setItem(
      `${SAVE_KEY_PREFIX}0`,
      JSON.stringify({ version: SAVE_VERSION, savedAt: new Date().toISOString(), state: broken }),
    )
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.load(0)).toBeNull()
  })

  it('returns null when the state is missing boardLength (a pre-round-2 shape)', () => {
    const storage = createMemoryStorage()
    const broken: Record<string, unknown> = { ...fixtureState() }
    delete broken.boardLength
    storage.setItem(
      `${SAVE_KEY_PREFIX}0`,
      JSON.stringify({ version: SAVE_VERSION, savedAt: new Date().toISOString(), state: broken }),
    )
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.load(0)).toBeNull()
  })

  it('writing one slot does not disturb another (slot isolation)', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    const stateOne = fixtureState({ turn: 1 })
    const stateTwo = fixtureState({ turn: 99 })
    repo.save(1, stateOne)
    repo.save(2, stateTwo)

    expect(repo.load(1)).toEqual(stateOne)
    expect(repo.load(2)).toEqual(stateTwo)

    repo.clear(1)
    expect(repo.load(1)).toBeNull()
    expect(repo.load(2)).toEqual(stateTwo)
  })

  it('rejects negative slot numbers without writing anything', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    repo.save(-1, fixtureState())
    expect(storage.length).toBe(0)
  })

  it('rejects slot numbers at or beyond SAVE_SLOT_COUNT without writing anything', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    repo.save(SAVE_SLOT_COUNT, fixtureState())
    expect(storage.length).toBe(0)
  })

  it('rejects a non-integer slot number', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    repo.save(1.5, fixtureState())
    expect(storage.length).toBe(0)
  })

  it('load/has/clear all report an out-of-range slot as empty rather than throwing', () => {
    const repo = createLocalStorageGameRepository(createMemoryStorage())
    expect(repo.load(SAVE_SLOT_COUNT)).toBeNull()
    expect(repo.has(-1)).toBe(false)
    expect(() => repo.clear(SAVE_SLOT_COUNT)).not.toThrow()
  })

  it('swallows a setItem quota/security exception instead of crashing', () => {
    const repo = createLocalStorageGameRepository(throwingStorage())
    expect(() => repo.save(0, fixtureState())).not.toThrow()
  })

  it('has() is false when nothing is stored in that slot', () => {
    const repo = createLocalStorageGameRepository(createMemoryStorage())
    expect(repo.has(0)).toBe(false)
  })

  it('has() is true only for a slot holding a loadable snapshot', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    repo.save(0, fixtureState())
    expect(repo.has(0)).toBe(true)
    expect(repo.has(1)).toBe(false)
  })

  it('has() is false when the stored snapshot is corrupt', () => {
    const storage = createMemoryStorage()
    storage.setItem(`${SAVE_KEY_PREFIX}0`, '{not valid json')
    const repo = createLocalStorageGameRepository(storage)
    expect(repo.has(0)).toBe(false)
  })

  it('clear() removes a saved snapshot from that slot only', () => {
    const storage = createMemoryStorage()
    const repo = createLocalStorageGameRepository(storage)
    repo.save(0, fixtureState())
    repo.clear(0)
    expect(repo.has(0)).toBe(false)
    expect(storage.getItem(`${SAVE_KEY_PREFIX}0`)).toBeNull()
  })

  it('clear() does not throw when storage is unavailable', () => {
    const repo = createLocalStorageGameRepository(throwingStorage())
    expect(() => repo.clear(0)).not.toThrow()
  })

  it('is a safe no-op end to end when constructed with a throwing storage', () => {
    const repo = createLocalStorageGameRepository(throwingStorage())
    expect(() => repo.save(0, fixtureState())).not.toThrow()
    expect(repo.load(0)).toBeNull()
    expect(repo.has(0)).toBe(false)
    expect(() => repo.clear(0)).not.toThrow()
    expect(() => repo.list()).not.toThrow()
  })

  it('is a safe no-op when no storage argument is given and global localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', undefined)
    const repo = createLocalStorageGameRepository()
    expect(() => repo.save(0, fixtureState())).not.toThrow()
    expect(repo.load(0)).toBeNull()
    expect(repo.has(0)).toBe(false)
    expect(() => repo.clear(0)).not.toThrow()
  })

  it('is a safe no-op when accessing global localStorage throws', () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'localStorage')
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('access denied')
      },
    })
    try {
      const repo = createLocalStorageGameRepository()
      expect(() => repo.save(0, fixtureState())).not.toThrow()
      expect(repo.load(0)).toBeNull()
    } finally {
      if (original) {
        Object.defineProperty(globalThis, 'localStorage', original)
      } else {
        delete (globalThis as { localStorage?: Storage }).localStorage
      }
    }
  })

  it('does not throw when constructed with no storage argument at all', () => {
    // Whatever global `localStorage` resolves to in this environment (a real
    // one, undefined, or a throwing accessor), construction and every method
    // must remain safe.
    expect(() => {
      const repo = createLocalStorageGameRepository()
      repo.save(0, fixtureState())
      repo.load(0)
      repo.has(0)
      repo.clear(0)
      repo.list()
    }).not.toThrow()
  })

  describe('list()', () => {
    it('returns exactly SAVE_SLOT_COUNT entries, in slot order, when nothing is saved', () => {
      const repo = createLocalStorageGameRepository(createMemoryStorage())
      const slots = repo.list()
      expect(slots).toHaveLength(SAVE_SLOT_COUNT)
      slots.forEach((info, index) => {
        expect(info).toEqual({ slot: index, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null })
      })
    })

    it('reports an occupied slot with its player names, turn and savedAt', () => {
      const storage = createMemoryStorage()
      const repo = createLocalStorageGameRepository(storage)
      const state = fixtureState({
        players: [fixturePlayer({ name: 'Ada' }), fixturePlayer({ id: 'p2', name: 'Grace' })],
        turn: 7,
      })
      repo.save(1, state)

      const info = repo.list()[1]
      expect(info).toMatchObject({ slot: 1, occupied: true, playerNames: ['Ada', 'Grace'], turn: 7 })
      expect(typeof info!.savedAt).toBe('string')
    })

    it('reports which country the slot was played on', () => {
      const storage = createMemoryStorage()
      const repo = createLocalStorageGameRepository(storage)
      repo.save(1, fixtureState({ editionId: 'japan' }))
      expect(repo.list()[1]!.editionId).toBe('japan')
    })

    it('reads an id it has never heard of rather than reporting the slot empty', () => {
      // A save naming a withdrawn edition is still a save. Resolving the id is
      // `editionFor`'s job; this function only has to not throw over it.
      const storage = createMemoryStorage()
      const repo = createLocalStorageGameRepository(storage)
      repo.save(1, fixtureState({ editionId: 'atlantis' }))
      expect(repo.list()[1]).toMatchObject({ occupied: true, editionId: 'atlantis' })
    })

    it('reports a save written before editions existed as having no country', () => {
      const storage = createMemoryStorage()
      const repo = createLocalStorageGameRepository(storage)
      repo.save(1, fixtureState())
      const raw: Record<string, unknown> = JSON.parse(storage.getItem(`${SAVE_KEY_PREFIX}1`)!)
      const state = raw.state as Record<string, unknown>
      delete state.editionId
      storage.setItem(`${SAVE_KEY_PREFIX}1`, JSON.stringify(raw))

      expect(repo.list()[1]).toMatchObject({ occupied: true, editionId: null })
    })

    it('reports exactly SAVE_SLOT_COUNT entries, occupied or not, in slot order', () => {
      const storage = createMemoryStorage()
      const repo = createLocalStorageGameRepository(storage)
      repo.save(0, fixtureState({ turn: 3 }))
      repo.save(3, fixtureState({ turn: 5 }))

      const slots = repo.list()
      expect(slots.map((s) => s.slot)).toEqual([0, 1, 2, 3])
      expect(slots[0]!.occupied).toBe(true)
      expect(slots[1]!.occupied).toBe(false)
      expect(slots[2]!.occupied).toBe(false)
      expect(slots[3]!.occupied).toBe(true)
    })

    it('reports a corrupt slot as empty rather than throwing', () => {
      const storage = createMemoryStorage()
      storage.setItem(`${SAVE_KEY_PREFIX}0`, '{not valid json')
      const repo = createLocalStorageGameRepository(storage)
      expect(() => repo.list()).not.toThrow()
      expect(repo.list()[0]).toEqual({ slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null })
    })

    it('reports foreign data at the key as empty rather than throwing', () => {
      const storage = createMemoryStorage()
      storage.setItem(`${SAVE_KEY_PREFIX}0`, JSON.stringify({ some: 'unrelated payload' }))
      const repo = createLocalStorageGameRepository(storage)
      expect(repo.list()[0]!.occupied).toBe(false)
    })

    it('reports a stale-version slot as empty', () => {
      const storage = createMemoryStorage()
      storage.setItem(
        `${SAVE_KEY_PREFIX}0`,
        JSON.stringify({ version: SAVE_VERSION - 1, savedAt: new Date().toISOString(), state: fixtureState() }),
      )
      const repo = createLocalStorageGameRepository(storage)
      expect(repo.list()[0]!.occupied).toBe(false)
    })

    it('is a safe no-op returning SAVE_SLOT_COUNT empty entries when storage throws', () => {
      const repo = createLocalStorageGameRepository(throwingStorage())
      const slots = repo.list()
      expect(slots).toHaveLength(SAVE_SLOT_COUNT)
      expect(slots.every((s) => !s.occupied)).toBe(true)
    })
  })
})
