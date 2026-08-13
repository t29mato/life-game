import { describe, expect, it } from 'vitest'
import type { GameLogEntry } from '@domain/model/types'
import { isUpsetEntry } from './upset'

function entry(overrides: Partial<GameLogEntry>): GameLogEntry {
  return {
    id: overrides.id ?? 'e1',
    turn: overrides.turn ?? 1,
    playerId: overrides.playerId ?? null,
    message: overrides.message ?? 'Something happened',
    tone: overrides.tone ?? 'info',
  }
}

describe('isUpsetEntry', () => {
  it('flags an entry tagged upset', () => {
    expect(isUpsetEntry(entry({ tone: 'upset', message: 'Bob swapped fortunes with Alice, stealing the lead!' }))).toBe(
      true,
    )
  })

  it('does not flag a money-out entry even when its wording mentions the lead', () => {
    // Pins the tone-only rule: wording alone must never re-trigger this, which
    // is exactly the coupling to application-layer copy that got removed.
    expect(
      isUpsetEntry(entry({ tone: 'money-out', message: 'Bob swapped fortunes with Alice, stealing the lead!' })),
    ).toBe(false)
  })

  it('does not flag an event entry even when its wording reads like a steal', () => {
    expect(
      isUpsetEntry(entry({ tone: 'event', message: "Cy snatched Alice's prize invention, taking the lead." })),
    ).toBe(false)
  })

  it('does not flag a milestone entry', () => {
    expect(isUpsetEntry(entry({ tone: 'milestone', message: 'Alice takes the lead by retiring first!' }))).toBe(
      false,
    )
  })

  it('does not flag an info or money-in entry', () => {
    expect(isUpsetEntry(entry({ tone: 'info' }))).toBe(false)
    expect(isUpsetEntry(entry({ tone: 'money-in' }))).toBe(false)
  })
})
