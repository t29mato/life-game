import { describe, expect, it } from 'vitest'

import type { Board, LaneIdentity, Space, SpinValue } from '@domain/model/types'
import { fixturePlayer } from '../testing/fixtures'
import { branchDecision, forkRoadNames, resolveForkBranch, roadIsOpenTo } from './branch'

/**
 * The gate on a road, which is the whole of what makes the doctorate a third
 * rung on an existing ladder rather than a fourth lane off the opening fork.
 *
 * There is exactly one place in the game a player can be put onto a road —
 * `resolveForkBranch`, which both `spin` and `settle` go through — so these are
 * the tests that say a road nobody qualifies for is a road nobody can reach.
 * Everything else about the gate is `LaneIdentity.requires`, which is data.
 */

const GATED: LaneIdentity = {
  name: 'Grad School',
  summary: 'Four more years.',
  requires: 'degree',
}

const OPEN: LaneIdentity = { name: 'Keep Working', summary: 'Stay in the job you have.' }

const DOCTORATE_GATED: LaneIdentity = {
  name: 'The Tenure Track',
  summary: 'The dossier, and the vote.',
  requires: 'doctorate',
}

const space = (id: string, next: readonly string[], lane?: LaneIdentity): Space => ({
  id,
  kind: 'normal',
  title: id,
  description: `${id} happens.`,
  effect: { type: 'none' },
  next,
  layout: { x: 0, y: 0 },
  tone: 'slate',
  icon: 'space:lucky-find',
  ...(lane ? { lane } : {}),
})

/** A junction whose first road is gated and whose second is not. */
const forkBoard = (): Board => ({
  spaces: {
    junction: space('junction', ['gated', 'open']),
    gated: space('gated', ['merge'], GATED),
    open: space('open', ['merge'], OPEN),
    merge: space('merge', []),
  },
  startSpaceId: 'junction',
  retirementSpaceId: 'merge',
  width: 4,
  height: 3,
})

/** A junction whose first road is gated on the doctorate specifically. */
const doctorateForkBoard = (): Board => ({
  spaces: {
    junction: space('junction', ['gated', 'open']),
    gated: space('gated', ['merge'], DOCTORATE_GATED),
    open: space('open', ['merge'], OPEN),
    merge: space('merge', []),
  },
  startSpaceId: 'junction',
  retirementSpaceId: 'merge',
  width: 4,
  height: 3,
})

const EVERY_FACE: readonly SpinValue[] = [1, 2, 3, 4, 5, 6]

describe('roadIsOpenTo', () => {
  const board = forkBoard()

  it('opens an ungated road to everybody', () => {
    expect(roadIsOpenTo(board, 'open', fixturePlayer())).toBe(true)
    expect(roadIsOpenTo(board, 'open', fixturePlayer({ hasDegree: true }))).toBe(true)
  })

  it('closes a degree-gated road to a player who never went', () => {
    expect(roadIsOpenTo(board, 'gated', fixturePlayer())).toBe(false)
  })

  it('opens it to a graduate', () => {
    expect(roadIsOpenTo(board, 'gated', fixturePlayer({ hasDegree: true }))).toBe(true)
  })

  /*
   * Fails open rather than closed. A road that is not on the board is somebody
   * else's bug to report, and stranding a player at a junction is a worse way
   * to report it than simply behaving the way the board did before gates.
   */
  it('treats a road that is not on the board as open', () => {
    expect(roadIsOpenTo(board, 'nowhere', fixturePlayer())).toBe(true)
  })
})

/*
 * `'doctorate'` reads narrower than `'degree'`: a lane gated on it stays
 * closed to a player who holds a lesser degree, and needs `hasDoctorate`
 * specifically before it opens.
 */
describe('roadIsOpenTo, gated on the doctorate', () => {
  const board = doctorateForkBoard()

  it('closes a doctorate-gated road to a player with no degree at all', () => {
    expect(roadIsOpenTo(board, 'gated', fixturePlayer())).toBe(false)
  })

  it('closes it to a player who holds a lesser degree but not a doctorate', () => {
    expect(roadIsOpenTo(board, 'gated', fixturePlayer({ hasDegree: true, hasDoctorate: false }))).toBe(
      false,
    )
  })

  it('opens it to a player who holds the doctorate', () => {
    expect(roadIsOpenTo(board, 'gated', fixturePlayer({ hasDegree: true, hasDoctorate: true }))).toBe(
      true,
    )
  })
})

describe('resolveForkBranch', () => {
  const board = forkBoard()

  it('splits the die evenly between two open roads', () => {
    const plain = { ...board, spaces: { ...board.spaces, gated: space('gated', ['merge'], OPEN) } }
    const taken = EVERY_FACE.map((roll) => resolveForkBranch(plain, 'junction', roll, fixturePlayer()))
    expect(taken).toEqual(['gated', 'gated', 'gated', 'open', 'open', 'open'])
  })

  /*
   * The gate, stated as the only thing that actually matters about it: not
   * "the road is discouraged" or "the road is rarely picked", but that no face
   * of the die reaches it. Someone who never went to college is left with one
   * road, and one road is not a fork.
   */
  it('never sends a player without a degree down the gated road, on any face', () => {
    const school = fixturePlayer()
    for (const roll of EVERY_FACE) {
      expect(resolveForkBranch(board, 'junction', roll, school), `roll ${roll}`).toBe('open')
    }
  })

  it('offers a graduate both roads, split the usual way', () => {
    const graduate = fixturePlayer({ hasDegree: true })
    const taken = EVERY_FACE.map((roll) => resolveForkBranch(board, 'junction', roll, graduate))
    expect(taken).toEqual(['gated', 'gated', 'gated', 'open', 'open', 'open'])
  })

  it('answers nothing for a tile that is not a fork', () => {
    expect(resolveForkBranch(board, 'gated', 1, fixturePlayer({ hasDegree: true }))).toBe('merge')
    expect(resolveForkBranch(board, 'merge', 1, fixturePlayer())).toBeUndefined()
  })
})

describe('resolveForkBranch, gated on the doctorate', () => {
  const board = doctorateForkBoard()

  it('never sends a graduate without a doctorate down the gated road, on any face', () => {
    const graduate = fixturePlayer({ hasDegree: true, hasDoctorate: false })
    for (const roll of EVERY_FACE) {
      expect(resolveForkBranch(board, 'junction', roll, graduate), `roll ${roll}`).toBe('open')
    }
  })

  it('offers a doctorate holder both roads, split the usual way', () => {
    const doctor = fixturePlayer({ hasDegree: true, hasDoctorate: true })
    const taken = EVERY_FACE.map((roll) => resolveForkBranch(board, 'junction', roll, doctor))
    expect(taken).toEqual(['gated', 'gated', 'gated', 'open', 'open', 'open'])
  })
})

describe('forkRoadNames', () => {
  const board = forkBoard()

  it('names both roads for a player who can take either', () => {
    expect(forkRoadNames(board, 'junction', fixturePlayer({ hasDegree: true }))).toEqual([
      'Grad School',
      'Keep Working',
    ])
  })

  /*
   * Nothing at all, rather than one name or two. A player with one road open
   * is not standing at a fork, and the rail promising a choice the die has
   * already been told not to make is the exact misreading it was built to
   * prevent, arriving from the other direction.
   */
  it('shows no rail to a player who has only one road', () => {
    expect(forkRoadNames(board, 'junction', fixturePlayer())).toBeUndefined()
  })

  it('shows no rail on a tile that is not a fork', () => {
    expect(forkRoadNames(board, 'open', fixturePlayer())).toBeUndefined()
  })
})

describe('branchDecision', () => {
  const board = forkBoard()

  it('offers a graduate both roads, named by their lanes', () => {
    const decision = branchDecision(board, 'junction', null, fixturePlayer({ hasDegree: true }))
    expect(decision.kind).toBe('branch')
    expect(decision.options.map((option) => option.label)).toEqual(['Grad School', 'Keep Working'])
  })

  /*
   * The dormant fallback is gated the same way the die is. Nothing reaches it
   * in the live game any more, but a fallback that offered a road
   * `resolveForkBranch` refuses would hand out the very thing the gate exists
   * to withhold.
   */
  it('offers a school-leaver only the road they can actually take', () => {
    const decision = branchDecision(board, 'junction', 3, fixturePlayer())
    expect(decision.options.map((option) => option.id)).toEqual(['open'])
  })
})
