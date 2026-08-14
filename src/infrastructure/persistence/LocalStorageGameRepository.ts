import { SAVE_SLOT_COUNT } from '@application/ports/GameRepositoryPort'
import type { GameRepositoryPort, GameSnapshot, SaveSlotInfo } from '@application/ports/GameRepositoryPort'
import type { GameState } from '@domain/model/types'

export const SAVE_KEY_PREFIX = 'life-journey:save:'
/**
 * Bumped whenever the persisted `GameState` shape changes. Round 2 added
 * `boardLength` to `GameState` and `stocks`/`insurance`/`isCpu` to `Player`,
 * so a version-1 snapshot is half-shaped and must never be loaded.
 */
export const SAVE_VERSION = 2

function keyFor(slot: number): string {
  return `${SAVE_KEY_PREFIX}${slot}`
}

function isValidSlot(slot: number): boolean {
  return Number.isInteger(slot) && slot >= 0 && slot < SAVE_SLOT_COUNT
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The minimal shape check that keeps a corrupt or half-written snapshot from producing a broken game. */
function isPlausibleGameState(value: unknown): value is GameState {
  if (!isRecord(value)) return false
  return Array.isArray(value.players) && isRecord(value.board) && typeof value.boardLength === 'string'
}

function isLoadableSnapshot(value: unknown): value is GameSnapshot {
  if (!isRecord(value)) return false
  if (value.version !== SAVE_VERSION) return false
  return isPlausibleGameState(value.state)
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

/** Best-effort removal; a broken store failing to clear itself is not worth crashing over. */
function clearEntry(storage: Storage, slot: number): void {
  try {
    storage.removeItem(keyFor(slot))
  } catch {
    // Nothing more we can do — the store is unusable either way.
  }
}

function emptySlotInfo(slot: number): SaveSlotInfo {
  return { slot, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null }
}

/**
 * Reads just the fields `SaveSlotInfo` needs, without reconstructing (or
 * even fully validating) the whole `GameState`. This is what keeps `list()`
 * cheap enough to call on every render, and it must never throw — corrupt or
 * foreign data at this key simply reports the slot as empty.
 */
function readSlotInfo(storage: Storage, slot: number): SaveSlotInfo {
  try {
    const raw = storage.getItem(keyFor(slot))
    if (raw === null) return emptySlotInfo(slot)

    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || parsed.version !== SAVE_VERSION) return emptySlotInfo(slot)

    const state = parsed.state
    if (!isRecord(state) || !Array.isArray(state.players)) return emptySlotInfo(slot)

    const playerNames = state.players
      .map((player) => (isRecord(player) && typeof player.name === 'string' ? player.name : null))
      .filter((name): name is string => name !== null)
    const savedAt = typeof parsed.savedAt === 'string' ? parsed.savedAt : null
    const turn = typeof state.turn === 'number' ? state.turn : null
    // Read as a bare string, not checked against the registry: this function
    // must not throw, and a save naming an edition that has since been
    // withdrawn is still a save. `editionFor` already handles the unknown id.
    const editionId = typeof state.editionId === 'string' ? state.editionId : null

    return { slot, occupied: true, savedAt, playerNames, turn, editionId }
  } catch {
    return emptySlotInfo(slot)
  }
}

export function createLocalStorageGameRepository(storage?: Storage): GameRepositoryPort {
  const save = (slot: number, state: GameState): void => {
    if (!isValidSlot(slot)) return
    const target = resolveStorage(storage)
    if (!target) return

    const snapshot: GameSnapshot = {
      version: SAVE_VERSION,
      savedAt: new Date().toISOString(),
      state,
    }

    try {
      target.setItem(keyFor(slot), JSON.stringify(snapshot))
    } catch {
      // Quota exceeded, storage disabled, private-mode restrictions, etc.
      // Saving is best-effort and must never take the game down with it.
    }
  }

  const load = (slot: number): GameState | null => {
    if (!isValidSlot(slot)) return null
    const target = resolveStorage(storage)
    if (!target) return null

    let raw: string | null
    try {
      raw = target.getItem(keyFor(slot))
    } catch {
      return null
    }
    if (raw === null) return null

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      clearEntry(target, slot)
      return null
    }

    if (!isRecord(parsed)) {
      // Valid JSON but the wrong shape entirely (a string, a number, an
      // array…). Not necessarily corruption from this repository, so it is
      // left alone rather than deleted.
      return null
    }

    if (!isLoadableSnapshot(parsed)) {
      // Either the version has moved on or the state shape is broken —
      // either way this entry will never become loadable, so clear it.
      clearEntry(target, slot)
      return null
    }

    return parsed.state
  }

  const has = (slot: number): boolean => load(slot) !== null

  const clear = (slot: number): void => {
    if (!isValidSlot(slot)) return
    const target = resolveStorage(storage)
    if (!target) return
    clearEntry(target, slot)
  }

  const list = (): readonly SaveSlotInfo[] => {
    const target = resolveStorage(storage)
    const slots: SaveSlotInfo[] = []
    for (let slot = 0; slot < SAVE_SLOT_COUNT; slot++) {
      slots.push(target ? readSlotInfo(target, slot) : emptySlotInfo(slot))
    }
    return slots
  }

  return { save, load, has, clear, list }
}
