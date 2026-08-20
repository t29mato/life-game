import { describe, expect, it } from 'vitest'
import type { Decision } from '../model/types'
import { spinOriginOf } from './spin'

function decision(kind: Decision['kind'], optionCount = 1): Decision {
  return {
    kind,
    prompt: 'Pick one',
    options: Array.from({ length: optionCount }, (_, i) => ({
      id: `option-${i}`,
      label: `Option ${i}`,
      description: '',
      icon: 'space:payday',
    })),
  }
}

describe('spinOriginOf', () => {
  it('is "movement" whenever the phase is awaiting the ordinary roll, decision or not', () => {
    expect(spinOriginOf('awaitingSpin', null)).toBe('movement')
  })

  it('is "event" for a value-spin decision, whether it offers one option or two', () => {
    expect(spinOriginOf('awaitingDecision', decision('valueSpin', 1))).toBe('event')
    expect(spinOriginOf('awaitingDecision', decision('valueSpin', 2))).toBe('event')
  })

  it('is null for a decision that is not a spin at all', () => {
    expect(spinOriginOf('awaitingDecision', decision('branch'))).toBeNull()
    expect(spinOriginOf('awaitingDecision', decision('house'))).toBeNull()
  })

  it('is null with no decision pending and no spin awaited', () => {
    expect(spinOriginOf('resolved', null)).toBeNull()
    expect(spinOriginOf('setup', null)).toBeNull()
    expect(spinOriginOf('moving', null)).toBeNull()
    expect(spinOriginOf('gameOver', null)).toBeNull()
  })

  it('is null for awaitingDecision with no decision actually attached', () => {
    expect(spinOriginOf('awaitingDecision', null)).toBeNull()
  })
})
