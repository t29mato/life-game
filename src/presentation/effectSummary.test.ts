import { describe, expect, it } from 'vitest'

import { createBoard } from '@domain/board/createBoard'
import { allEditions, editionFor } from '@domain/edition/registry'
import type { Difficulty } from '@domain/model/types'

import { describeEffect } from './effectSummary'

const DIFFICULTIES: readonly Difficulty[] = ['normal', 'hard', 'veryHard']

describe('describeEffect', () => {
  it('has a line for every tile on every board', () => {
    const silent: string[] = []
    for (const edition of allEditions()) {
      for (const difficulty of DIFFICULTIES) {
        for (const space of Object.values(createBoard(difficulty, edition).spaces)) {
          const line = describeEffect(space.effect, edition)
          if (line.trim().length === 0) silent.push(`${edition.id} / ${space.title}`)
        }
      }
    }
    expect(silent).toEqual([])
  })

  it('prices a bill in the edition’s own money', () => {
    const usa = editionFor('usa')
    const japan = editionFor('japan')
    const bill = { type: 'payMoney', amount: 1_800, reason: 'Deposit' } as const

    expect(describeEffect(bill, usa)).toBe('-$1,800')
    expect(describeEffect(bill, japan)).toContain('¥')
  })

  /*
   * The direction is the whole point: a playtester drove past a coin and was
   * charged $1,800. Whatever else a line says, its sign has to be the truth.
   */
  it('signs money in and money out apart', () => {
    const usa = editionFor('usa')
    expect(describeEffect({ type: 'gainMoney', amount: 9_000, reason: 'Wages' }, usa)).toBe('+$9,000')
    expect(describeEffect({ type: 'payEach', amount: 800, reason: 'Gifts' }, usa)).toBe(
      '-$800 to every other player',
    )
    expect(describeEffect({ type: 'collectFromEach', amount: 800, reason: 'Winnings' }, usa)).toBe(
      '+$800 from every other player',
    )
  })

  it('says when a policy makes a hazard free', () => {
    const usa = editionFor('usa')
    expect(
      describeEffect({ type: 'payMoney', amount: 6_000, reason: 'Repairs', hazard: 'accident' }, usa),
    ).toContain('if you hold the policy')
  })

  it('reads tuition off the edition’s own bands rather than a written-in figure', () => {
    const usa = editionFor('usa')
    const line = describeEffect({ type: 'tuition', reason: 'College tuition' }, usa)
    const dearest = Math.max(...usa.economy.tuition.outcomes.map((outcome) => outcome.cost))
    expect(line).toContain('on the wheel')
    expect(line).toContain(dearest.toLocaleString(usa.currency.locale))
  })
})
