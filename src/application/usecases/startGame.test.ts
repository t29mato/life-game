import { describe, expect, it } from 'vitest'
import type { BoardLength, NewGameConfig } from '@domain/model/types'
import { createFakeRandom } from '../testing/fakes'
import { startGame } from './startGame'

const deps = { random: createFakeRandom() }

function config(names: string[], boardLength: BoardLength = 'standard'): NewGameConfig {
  const colors = ['red', 'blue', 'green', 'yellow'] as const
  return {
    players: names.map((name, i) => ({ name, color: colors[i % colors.length]!, isCpu: false })),
    boardLength,
  }
}

describe('startGame', () => {
  it('throws when fewer than 2 players are given', () => {
    expect(() => startGame(config(['Solo']), deps)).toThrow(/2-4 players/)
  })

  it('throws when more than 4 players are given', () => {
    expect(() => startGame(config(['A', 'B', 'C', 'D', 'E']), deps)).toThrow(/2-4 players/)
  })

  it('throws when a player name is empty or blank', () => {
    expect(() => startGame(config(['Alex', '   ']), deps)).toThrow(/needs a name/)
  })

  it('throws on duplicate names, case-insensitively', () => {
    expect(() => startGame(config(['Alex', 'alex']), deps)).toThrow(/unique/)
  })

  it('builds a game with a player per config entry, all starting on the board start space', () => {
    const state = startGame(config(['Alex', 'Bo', 'Cy']), deps)
    expect(state.players).toHaveLength(3)
    for (const player of state.players) {
      expect(player.spaceId).toBe(state.board.startSpaceId)
      expect(player.isRetired).toBe(false)
      expect(player.career).toBeNull()
      expect(player.hasDegree).toBe(false)
    }
  })

  /*
   * Everyone starts standing on the very first fork, so the opening move of a
   * game is choosing a road — college or straight to work — not a spin. The
   * road is picked before the wheel so a player cannot take whichever lane the
   * number happened to land them well on.
   */
  it('opens on the first fork, turn 1, first player active', () => {
    const state = startGame(config(['Alex', 'Bo']), deps)
    expect(state.phase).toBe('awaitingDecision')
    expect(state.turn).toBe(1)
    expect(state.currentPlayerIndex).toBe(0)
  })

  it('seeds the log with a welcome entry mentioning every player', () => {
    const state = startGame(config(['Alex', 'Bo']), deps)
    expect(state.log).toHaveLength(1)
    expect(state.log[0]!.message).toContain('Alex')
    expect(state.log[0]!.message).toContain('Bo')
  })

  it('trims whitespace from player names', () => {
    const state = startGame(config(['  Alex  ', 'Bo']), deps)
    expect(state.players[0]!.name).toBe('Alex')
  })

  it('assigns each player a unique id', () => {
    const state = startGame(config(['Alex', 'Bo', 'Cy', 'Di']), deps)
    const ids = new Set(state.players.map((p) => p.id))
    expect(ids.size).toBe(4)
  })

  it('rejects an empty roster', () => {
    expect(() => startGame({ players: [], boardLength: 'standard' }, deps)).toThrow(/2-4 players/)
  })

  describe('board length', () => {
    it('records the chosen length on the state', () => {
      for (const length of ['short', 'standard', 'long'] as const) {
        expect(startGame(config(['Alex', 'Bo'], length), deps).boardLength).toBe(length)
      }
    })

    it('builds a shorter board for a shorter session', () => {
      const short = startGame(config(['Alex', 'Bo'], 'short'), deps)
      const standard = startGame(config(['Alex', 'Bo'], 'standard'), deps)
      const long = startGame(config(['Alex', 'Bo'], 'long'), deps)

      const size = (state: typeof short) => Object.keys(state.board.spaces).length
      expect(size(short)).toBeLessThan(size(standard))
      expect(size(long)).toBeGreaterThan(size(standard))
    })
  })

  describe('computer seats', () => {
    it('marks the seats the config asked to be played by the computer', () => {
      const state = startGame(
        {
          players: [
            { name: 'Alex', color: 'red', isCpu: false },
            { name: 'Botly', color: 'blue', isCpu: true },
          ],
          boardLength: 'standard',
        },
        deps,
      )
      expect(state.players.map((player) => player.isCpu)).toEqual([false, true])
    })

    it('allows an all-computer roster so a person can just watch', () => {
      const state = startGame(
        {
          players: [
            { name: 'Botly', color: 'red', isCpu: true },
            { name: 'Circuit', color: 'blue', isCpu: true },
            { name: 'Dot', color: 'green', isCpu: true },
          ],
          boardLength: 'standard',
        },
        deps,
      )
      expect(state.players.every((player) => player.isCpu)).toBe(true)
      expect(state.phase).toBe('awaitingDecision')
    })
  })
})
