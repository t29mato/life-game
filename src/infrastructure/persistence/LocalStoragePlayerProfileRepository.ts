import type { PlayerProfile, PlayerProfileRepositoryPort } from '@application/ports/PlayerProfileRepositoryPort'
import { PROFILE_LIST_CAP } from '@application/ports/PlayerProfileRepositoryPort'

export const PROFILES_KEY = 'life-journey:profiles'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** The minimal shape check that keeps a corrupt or foreign entry from producing a broken profile list. */
function isPlausibleProfile(value: unknown): value is PlayerProfile {
  if (!isRecord(value)) return false
  return (
    typeof value.name === 'string' &&
    value.name.trim().length > 0 &&
    typeof value.color === 'string' &&
    typeof value.face === 'string' &&
    typeof value.lastUsedAt === 'string'
  )
}

/**
 * How two saved names are compared: trimmed and lowercased, so "Alex" and
 * " alex " are one person typing with different care, never two entries.
 */
function nameKey(name: string): string {
  return name.trim().toLowerCase()
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

/** Reads whatever is at `PROFILES_KEY`, discarding anything that is not a plausible profile. Never throws. */
function readAll(storage: Storage): PlayerProfile[] {
  let raw: string | null
  try {
    raw = storage.getItem(PROFILES_KEY)
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

  return parsed.filter(isPlausibleProfile)
}

function writeAll(storage: Storage, profiles: readonly PlayerProfile[]): void {
  try {
    storage.setItem(PROFILES_KEY, JSON.stringify(profiles))
  } catch {
    // Quota exceeded, storage disabled, private-mode restrictions, etc.
    // Remembering players is best-effort and must never take the game down with it.
  }
}

export function createLocalStoragePlayerProfileRepository(storage?: Storage): PlayerProfileRepositoryPort {
  const list = (): readonly PlayerProfile[] => {
    const target = resolveStorage(storage)
    if (!target) return []
    return readAll(target)
  }

  const upsert = (profile: Omit<PlayerProfile, 'lastUsedAt'>): void => {
    const target = resolveStorage(storage)
    if (!target) return

    // The adapter supplies the real clock — the pure layers above have none.
    const full: PlayerProfile = { ...profile, lastUsedAt: new Date().toISOString() }
    // Moving the fresh entry to the front is what keeps the list in
    // most-recently-used order without ever sorting it, and what makes the
    // trailing slice an LRU eviction rather than an arbitrary one.
    const rest = readAll(target).filter((entry) => nameKey(entry.name) !== nameKey(full.name))
    writeAll(target, [full, ...rest].slice(0, PROFILE_LIST_CAP))
  }

  const clear = (): void => {
    const target = resolveStorage(storage)
    if (!target) return
    try {
      target.removeItem(PROFILES_KEY)
    } catch {
      // Nothing more we can do — the store is unusable either way.
    }
  }

  return { list, upsert, clear }
}
