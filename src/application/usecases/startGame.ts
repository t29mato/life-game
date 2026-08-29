import type { GameState, NewGameConfig, Player } from '@domain/model/types'
import { createBoard } from '@domain/board/createBoard'
import { DEFAULT_EDITION_ID, editionFor } from '@domain/edition/registry'
import { createPlayer } from '@domain/rules/player'
import { turnStart } from './branch'
import { appendLog } from './logging'
import type { UseCaseDeps } from './types'

function validate(config: NewGameConfig): void {
  const count = config.players.length
  if (count < 2 || count > 4) {
    throw new Error(`LIFE JOURNEY needs 2-4 players (got ${count}).`)
  }

  const seen = new Set<string>()
  for (const player of config.players) {
    const trimmed = player.name.trim()
    if (trimmed.length === 0) {
      throw new Error('Every player needs a name.')
    }
    const key = trimmed.toLowerCase()
    if (seen.has(key)) {
      throw new Error(`Player names must be unique (duplicate: "${trimmed}").`)
    }
    seen.add(key)
  }
}

/** Builds a fresh game: validates the roster, lays out the board, and moves everyone to `awaitingSpin`. */
export function startGame(config: NewGameConfig, _deps: UseCaseDeps): GameState {
  validate(config)

  // An all-CPU roster is legal on purpose: watching the computers play each
  // other is a perfectly good way to spend an evening.
  // Difficulty is optional on the way in and settled here, so the rest of the
  // game only ever sees a concrete setting.
  // The edition is settled here for the same reason: everything downstream
  // reads the game's money off it, so it must be concrete before play starts.
  const difficulty = config.difficulty ?? 'normal'
  const editionId = config.editionId ?? DEFAULT_EDITION_ID
  const edition = editionFor(editionId)
  const board = createBoard(config.boardLength, difficulty, edition)
  const players: Player[] = config.players.map((entry, index) =>
    createPlayer(
      `player-${index + 1}`,
      entry.name.trim(),
      entry.color,
      board.startSpaceId,
      entry.isCpu,
      edition.economy,
    ),
  )

  const empty: GameState = {
    board,
    boardLength: config.boardLength,
    editionId: edition.id,
    difficulty,
    players,
    currentPlayerIndex: 0,
    phase: 'awaitingSpin',
    pendingDecision: null,
    lastSpin: null,
    movementPath: [],
    stepsRemaining: 0,
    chosenExit: null,
    lastEvent: null,
    passedNotes: [],
    log: [],
    turn: 1,
    results: null,
  }

  const names = players.map((player) => player.name).join(', ')
  const log = appendLog(empty, null, `Welcome to LIFE JOURNEY! Players: ${names}.`, 'info')

  // Everybody starts standing on the very first fork, but the opening move
  // of the game is a spin like any other now — see `turnStart` in
  // `branch.ts` for why a fork no longer opens its own decision screen.
  const opening: GameState = { ...empty, log }
  return { ...opening, ...turnStart(opening, 0) }
}
