import { describe, expect, it } from 'vitest'
import type { NewGameConfig } from '@domain/model/types'
import { createFakeRandom } from '../testing/fakes'
import { startGame } from './startGame'

const deps = { random: createFakeRandom() }

function config(names: string[]): NewGameConfig {
  const colors = ['red', 'blue', 'green', 'yellow'] as const
  return {
    players: names.map((name, i) => ({ name, color: colors[i % colors.length]!, isCpu: false })),
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
  it('opens on the wheel, turn 1, first player active', () => {
    // Standing on the opening fork is no longer a decision to make before
    // spinning — see `spin.ts` for where that choice moved to.
    const state = startGame(config(['Alex', 'Bo']), deps)
    expect(state.phase).toBe('awaitingSpin')
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
    expect(() => startGame({ players: [] }, deps)).toThrow(/2-4 players/)
  })

  describe('player designs', () => {
    it('carries a chosen face onto the player', () => {
      const state = startGame(
        {
          players: [
            { name: 'Alex', color: 'teal', face: 'cool', isCpu: false },
            { name: 'Bo', color: 'pink', face: 'cheerful', isCpu: false },
          ],
        },
        deps,
      )
      expect(state.players[0]).toMatchObject({ color: 'teal', face: 'cool' })
      expect(state.players[1]).toMatchObject({ color: 'pink', face: 'cheerful' })
    })

    it('leaves an omitted design absent, the same way an old save reads', () => {
      const state = startGame(config(['Alex', 'Bo']), deps)
      // Absent, not `undefined`-with-a-key: `exactOptionalPropertyTypes`
      // makes those different shapes, and absent is the one old saves have.
      expect('face' in state.players[0]!).toBe(false)
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
        },
        deps,
      )
      expect(state.players.every((player) => player.isCpu)).toBe(true)
      expect(state.phase).toBe('awaitingSpin')
    })
  })
})
