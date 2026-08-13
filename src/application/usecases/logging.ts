import type { GameLogEntry, GameState, LogTone, PlayerId } from '@domain/model/types'

/**
 * Builds a log entry with a deterministic id derived from the turn number and
 * the log's current length (plus an offset, for callers appending more than
 * one entry in a single use case call). Never touches `Math.random`.
 */
export function makeLogEntry(
  state: GameState,
  offset: number,
  playerId: PlayerId | null,
  message: string,
  tone: LogTone,
): GameLogEntry {
  return {
    id: `log-${state.turn}-${state.log.length + offset}`,
    turn: state.turn,
    playerId,
    message,
    tone,
  }
}

/** Appends one log entry to `state.log`, returning a new array. */
export function appendLog(
  state: GameState,
  playerId: PlayerId | null,
  message: string,
  tone: LogTone,
): readonly GameLogEntry[] {
  return [...state.log, makeLogEntry(state, 0, playerId, message, tone)]
}
