import { describe, expect, it } from 'vitest'
import type { Board, Space } from '@domain/model/types'
import { LANE_PREVIEW_DEPTH, previewLane, summarizeLane } from './branchPreview'

function space(overrides: Partial<Space> & { id: string }): Space {
  return {
    id: overrides.id,
    kind: overrides.kind ?? 'normal',
    title: overrides.title ?? overrides.id,
    description: overrides.description ?? 'A space.',
    effect: overrides.effect ?? { type: 'none' },
    next: overrides.next ?? [],
    layout: overrides.layout ?? { x: 0, y: 0 },
    tone: overrides.tone ?? 'blue',
    icon: overrides.icon ?? 'space:payday',
  }
}

function board(spaces: readonly Space[]): Board {
  const record: Record<string, Space> = {}
  for (const s of spaces) record[s.id] = s
  return { spaces: record, startSpaceId: spaces[0]?.id ?? 'start', retirementSpaceId: 'retirement', width: 100, height: 100 }
}

describe('previewLane', () => {
  it('walks forward from the given space, inclusive', () => {
    const b = board([
      space({ id: 'a', next: ['b'] }),
      space({ id: 'b', next: ['c'] }),
      space({ id: 'c', next: ['d'] }),
      space({ id: 'd', next: [] }),
    ])
    const preview = previewLane(b, 'a')
    expect(preview.map((s) => s.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('stops at the requested depth even if the lane continues', () => {
    const b = board([
      space({ id: 'a', next: ['b'] }),
      space({ id: 'b', next: ['c'] }),
      space({ id: 'c', next: ['d'] }),
      space({ id: 'd', next: ['e'] }),
      space({ id: 'e', next: [] }),
    ])
    expect(previewLane(b, 'a', 2).map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('stops early when the lane dead-ends before the requested depth', () => {
    const b = board([space({ id: 'a', next: ['b'] }), space({ id: 'b', next: [] })])
    expect(previewLane(b, 'a', LANE_PREVIEW_DEPTH).map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('follows only the first edge at a further fork', () => {
    const b = board([
      space({ id: 'a', next: ['fork'] }),
      space({ id: 'fork', next: ['left', 'right'] }),
      space({ id: 'left', next: [] }),
      space({ id: 'right', next: [] }),
    ])
    expect(previewLane(b, 'a').map((s) => s.id)).toEqual(['a', 'fork', 'left'])
  })

  it('returns an empty list for an unknown starting space', () => {
    const b = board([space({ id: 'a', next: [] })])
    expect(previewLane(b, 'missing')).toEqual([])
  })
})

describe('summarizeLane', () => {
  it('calls an empty preview mixed', () => {
    expect(summarizeLane([])).toBe('mixed')
  })

  it('calls a lane of mostly payday spaces payday-heavy', () => {
    const spaces = [
      space({ id: 'a', kind: 'payday', effect: { type: 'payday' } }),
      space({ id: 'b', kind: 'payday', effect: { type: 'payday' } }),
      space({ id: 'c', effect: { type: 'none' } }),
    ]
    expect(summarizeLane(spaces)).toBe('payday-heavy')
  })

  it('calls a lane of mostly eventful spaces event-heavy', () => {
    const spaces = [
      space({ id: 'a', effect: { type: 'gainMoney', amount: 500, reason: 'x' } }),
      space({ id: 'b', effect: { type: 'payMoney', amount: 200, reason: 'x' } }),
      space({ id: 'c', effect: { type: 'gainLifeTiles', count: 1 } }),
    ]
    expect(summarizeLane(spaces)).toBe('event-heavy')
  })

  it('calls a lane of mostly quiet spaces mixed', () => {
    const spaces = [
      space({ id: 'a', effect: { type: 'none' } }),
      space({ id: 'b', effect: { type: 'none' } }),
      space({ id: 'c', effect: { type: 'gainMoney', amount: 500, reason: 'x' } }),
    ]
    expect(summarizeLane(spaces)).toBe('mixed')
  })
})
