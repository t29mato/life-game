import { describe, expect, it } from 'vitest'
import { fixtureState } from '../testing/fixtures'
import { appendLog, makeLogEntry } from './logging'

describe('makeLogEntry', () => {
  it('derives a deterministic id from turn and log length', () => {
    const state = fixtureState({ turn: 3, log: [] })
    const entry = makeLogEntry(state, 0, 'p1', 'hello', 'info')
    expect(entry.id).toBe('log-3-0')
    expect(entry.turn).toBe(3)
    expect(entry.playerId).toBe('p1')
    expect(entry.message).toBe('hello')
    expect(entry.tone).toBe('info')
  })

  it('offsets the id for a second entry added in the same call', () => {
    const state = fixtureState({ turn: 1, log: [] })
    const first = makeLogEntry(state, 0, null, 'a', 'info')
    const second = makeLogEntry(state, 1, null, 'b', 'info')
    expect(first.id).not.toBe(second.id)
  })

  it('never collides across two states that share the same log length', () => {
    const stateA = fixtureState({ turn: 5, log: [] })
    const stateB = fixtureState({ turn: 7, log: [] })
    expect(makeLogEntry(stateA, 0, null, 'x', 'info').id).not.toBe(makeLogEntry(stateB, 0, null, 'y', 'info').id)
  })
})

describe('appendLog', () => {
  it('returns a new array with the entry appended, leaving the original untouched', () => {
    const state = fixtureState({ log: [] })
    const next = appendLog(state, null, 'welcome', 'info')
    expect(next).toHaveLength(1)
    expect(state.log).toHaveLength(0)
  })

  it('appends after any existing entries', () => {
    const state = fixtureState({ log: [{ id: 'log-1-0', turn: 1, playerId: null, message: 'first', tone: 'info' }] })
    const next = appendLog(state, 'p1', 'second', 'event')
    expect(next).toHaveLength(2)
    expect(next[1]!.message).toBe('second')
  })
})
