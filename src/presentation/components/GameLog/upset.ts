import type { GameLogEntry } from '@domain/model/types'

/** True for a log entry that reports someone losing the lead. */
export function isUpsetEntry(entry: GameLogEntry): boolean {
  return entry.tone === 'upset'
}
