import { describe, expect, it } from 'vitest'

import type { Board, Space, SpaceId } from '../model/types'
import { allEditions } from '../edition/registry'
import { EDITION_USA } from '../edition/usa'
import { createBoard } from './createBoard'
import type { RouteBranch, RouteDefinition, RouteSegment, SpaceContent } from './route'
import { flavour, fork, run, spacesOf } from './route'
import { boardProblems, validateRoute } from './validateRoute'

/**
 * `validateRoute` exists for the content author, not for the integrator.
 *
 * Every invariant it checks, the board used to enforce by construction: there
 * was one route, hand-wired by the person who wrote the layout engine, and it
 * could not be wrong in these ways because they were not expressible. Now they
 * are — a route is a data file, and five countries will be written by five
 * people who have never read `createBoard`.
 *
 * So the tests below are almost all *breakage* tests. A validator that only
 * ever sees healthy input is indistinguishable from `() => []`, which is why
 * each rule is proved by breaking the USA route in exactly the way a content
 * author would break it and reading back the sentence they would get.
 */

// ---------------------------------------------------------------------------
// Ways to vandalise a working route.
// ---------------------------------------------------------------------------

const mapSpaces = (
  route: RouteDefinition,
  fn: (space: SpaceContent) => SpaceContent,
): RouteDefinition => ({
  segments: route.segments.map((segment) => {
    if (segment.kind === 'run') {
      return { ...segment, lane: { ...segment.lane, spaces: segment.lane.spaces.map(fn) } }
    }
    return {
      ...segment,
      at: fn(segment.at),
      branches: segment.branches.map((branch) => ({ ...branch, spaces: branch.spaces.map(fn) })) as unknown as readonly [RouteBranch, RouteBranch],
    }
  }),
  terminal: fn(route.terminal),
})

/** Retiers every space in one lane, by the name it is known by — the classic thinning mistake. */
const retierLane = (route: RouteDefinition, laneName: string, tier: 0 | 1 | 2): RouteDefinition => ({
  segments: route.segments.map((segment) => {
    if (segment.kind === 'run') {
      if (segment.lane.name !== laneName) return segment
      return { ...segment, lane: { ...segment.lane, spaces: segment.lane.spaces.map((s) => ({ ...s, tier })) } }
    }
    return {
      ...segment,
      branches: segment.branches.map((branch) =>
        branch.identity.name === laneName
          ? { ...branch, spaces: branch.spaces.map((s) => ({ ...s, tier })) }
          : branch,
      ) as unknown as readonly [RouteBranch, RouteBranch],
    }
  }),
  terminal: route.terminal,
})

const editSpace = (route: RouteDefinition, id: SpaceId, patch: Partial<SpaceContent>): RouteDefinition =>
  mapSpaces(route, (space) => (space.id === id ? { ...space, ...patch } : space))

const editBranch = (
  route: RouteDefinition,
  branchName: string,
  patch: Partial<RouteBranch>,
): RouteDefinition => ({
  segments: route.segments.map((segment) => {
    if (segment.kind === 'run') return segment
    return {
      ...segment,
      branches: segment.branches.map((branch) =>
        branch.identity.name === branchName ? { ...branch, ...patch } : branch,
      ) as unknown as readonly [RouteBranch, RouteBranch],
    }
  }),
  terminal: route.terminal,
})

const check = (route: RouteDefinition): readonly string[] => validateRoute(route, EDITION_USA)

const complains = (route: RouteDefinition, fragment: string): string[] =>
  check(route).filter((problem) => problem.includes(fragment))

// ---------------------------------------------------------------------------

describe('every shipped route is sound', () => {
  it.each(allEditions().map((edition) => [edition.id, edition] as const))(
    'the %s edition has no route problems',
    (_id, edition) => {
      expect(validateRoute(edition.route, edition)).toEqual([])
    },
  )

  it('is checking a route that genuinely has lanes and forks to check', () => {
    // Guards the guard: a validator handed an empty route would also pass
    // silently, and then every test above would be measuring nothing.
    const forks = EDITION_USA.route.segments.filter((segment) => segment.kind === 'fork')
    expect(forks.length).toBeGreaterThanOrEqual(3)
    expect(EDITION_USA.route.segments.length).toBeGreaterThan(forks.length)
  })
})

describe('a lane that cannot survive the thinning', () => {
  it('names the lane and the board it empties on', () => {
    // The mistake: someone decides Safe Street's tiles are all scenery and
    // promotes the lot to tier 1. The standard and long boards still work, so
    // it passes a casual look; the short board has a fork pointing at nothing.
    const broken = retierLane(EDITION_USA.route, 'Safe Street', 1)
    const problems = complains(broken, 'Safe Street')

    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toContain('short')
    expect(problems.every((p) => !p.includes('[long/'))).toBe(true)
  })

  it('says which fork is left pointing at nothing', () => {
    const broken = retierLane(EDITION_USA.route, 'Risky Road', 2)
    expect(complains(broken, 'home-buying').join('\n')).toMatch(/Risky Road/)
  })

  it('names a trunk run by its own name rather than a fork it does not belong to', () => {
    const broken = retierLane(EDITION_USA.route, 'midtown', 2)
    const problems = complains(broken, 'midtown')
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toContain('[short/normal]')
  })

  it('catches a lane that only disappears on the easier settings', () => {
    // `appearsFrom` runs the opposite way to tiers: a lane whose every tile is
    // gated at `hard` is missing from the *gentlest* board, which is the one
    // most likely to be play-tested last.
    const broken = mapSpaces(EDITION_USA.route, (space) =>
      space.id.startsWith('midtown') ? { ...space, appearsFrom: 'hard' } : space,
    )
    expect(complains(broken, '[standard/normal]').join('\n')).toContain('midtown')
  })
})

describe('the two roads out of a fork', () => {
  it('insists a branch says what it is', () => {
    const broken = editBranch(EDITION_USA.route, 'Family Lane', {
      identity: { name: '', summary: 'Children and life tiles to collect.' },
    })
    expect(complains(broken, 'marriage').join('\n')).toMatch(/no name/i)
  })

  it('insists a branch argues its case', () => {
    const broken = editBranch(EDITION_USA.route, 'Fast Track', {
      identity: { name: 'Fast Track', summary: '' },
    })
    expect(complains(broken, 'Fast Track').join('\n')).toMatch(/summary/i)
  })

  /*
   * The rule this validator shipped without, and the bug it briefly had.
   *
   * `main-crossroads` — the mid-career fork — went out as a `normal` tile
   * once, back when a road was a choice a player made deliberately before
   * the wheel was spun: reaching the fork already knowing how many steps
   * were left over let a player take whichever road landed them well. A
   * fork is the wheel's own call now (see `resolveForkBranch` in
   * `branch.ts`), which is what let `main-crossroads` go back to being a
   * `normal` tile on purpose — there is no longer a choice to hand an
   * advantage back on, `stop` or not.
   */
  it('accepts a fork on a `normal` tile now that a fork is the wheel\'s own call', () => {
    const asNormal = editSpace(EDITION_USA.route, 'main-crossroads', { kind: 'normal' })
    expect(complains(asNormal, 'main-crossroads')).toEqual([])
  })

  it.each(['start', 'marriage', 'home-buying'])(
    'is still satisfied by the shipped fork at "%s", which keeps its own effect and so keeps its `stop`',
    (id) => {
      const junction = spacesOf(EDITION_USA.route).find((space) => space.id === id)
      expect(junction, `"${id}" is no longer on the route`).toBeDefined()
      expect(junction!.kind === 'stop' || junction!.kind === 'start').toBe(true)
    },
  )

  it('is satisfied by the shipped fork at "main-crossroads", now a `normal` tile', () => {
    const junction = spacesOf(EDITION_USA.route).find((space) => space.id === 'main-crossroads')
    expect(junction?.kind).toBe('normal')
    expect(complains(EDITION_USA.route, 'main-crossroads')).toEqual([])
  })

  it('refuses two roads with the same name', () => {
    // A real hazard when a country's forks are written by copy-paste: the
    // panel then offers the player the same choice twice.
    const broken = editBranch(EDITION_USA.route, 'Straight to Work', {
      identity: { name: 'College Lane', summary: 'Hired on the first tile.' },
    })
    expect(complains(broken, 'College Lane').join('\n')).toMatch(/twice|same name|both/i)
  })
})

describe('the milestones the engine cannot do without', () => {
  it('notices a degree that only exists on the long board', () => {
    const broken = editSpace(EDITION_USA.route, 'college-8', { tier: 2 })
    const problems = complains(broken, 'graduate')
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toContain('[short/normal]')
  })

  it('notices a wedding nobody has to stop for', () => {
    const broken = editSpace(EDITION_USA.route, 'marriage', { kind: 'normal' })
    expect(complains(broken, 'marriage').join('\n')).toMatch(/stop/)
  })

  it('notices a layoff with no re-hire a player is made to stop at', () => {
    // Downgrading the career fair to an ordinary tile leaves the layoff two
    // tiles earlier survivable only by luck: spin past the booths once and the
    // rest of the game is casual shifts.
    const broken = editSpace(EDITION_USA.route, 'main-career-fair', { kind: 'normal' })
    const problems = complains(broken, 'main-layoff')
    expect(problems.length).toBeGreaterThan(0)
    expect(problems.join('\n')).toMatch(/unemployed/)
  })

  it('notices a board with nowhere to buy a house', () => {
    const broken = editSpace(EDITION_USA.route, 'home-buying', {
      effect: { type: 'none' },
      kind: 'normal',
    })
    expect(complains(broken, 'buyHouse').length).toBeGreaterThan(0)
  })
})

describe('the shape of the route itself', () => {
  it('rejects a route that does not begin at a start tile', () => {
    const broken = editSpace(EDITION_USA.route, 'start', { kind: 'normal' })
    expect(complains(broken, 'start').length).toBeGreaterThan(0)
  })

  it('rejects a second start tile hiding in a lane', () => {
    const broken = editSpace(EDITION_USA.route, 'main-bank', { kind: 'start' })
    expect(complains(broken, 'main-bank').length).toBeGreaterThan(0)
  })

  it('rejects a terminal that is not retirement', () => {
    const broken: RouteDefinition = {
      segments: EDITION_USA.route.segments,
      terminal: { ...EDITION_USA.route.terminal, kind: 'normal' },
    }
    expect(complains(broken, 'retirement').length).toBeGreaterThan(0)
  })

  it('rejects a junction that the thinning would delete', () => {
    // A fork tile is never thinned, so a tier on one is not a smaller board —
    // it is a number that silently does nothing, which is worse.
    const broken = editSpace(EDITION_USA.route, 'marriage', { tier: 2 })
    expect(complains(broken, 'marriage').join('\n')).toMatch(/tier|thinn/i)
  })

  it('rejects the same tile used twice', () => {
    const broken = mapSpaces(EDITION_USA.route, (space) =>
      space.id === 'safe-3' ? { ...space, id: 'main-bank' } : space,
    )
    expect(complains(broken, 'main-bank').join('\n')).toMatch(/twice|duplicate/i)
  })

  it('rejects an empty route rather than passing it', () => {
    const empty: RouteDefinition = { segments: [], terminal: EDITION_USA.route.terminal }
    expect(check(empty).length).toBeGreaterThan(0)
  })
})

/**
 * The graph and geometry checks, proved directly.
 *
 * These run over every board a route builds, and a healthy route never trips
 * them — which is exactly the problem: nothing in a passing suite would show
 * they work. So they are also exported as a check on a finished `Board`, and
 * pointed at boards broken by hand in each of the ways the layout engine could
 * one day break one.
 */
describe('the board a route builds', () => {
  const healthy = createBoard('standard', 'normal')

  const withSpaces = (edit: (spaces: Record<SpaceId, Space>) => void): Board => {
    const spaces: Record<SpaceId, Space> = {}
    for (const [id, space] of Object.entries(healthy.spaces)) {
      spaces[id] = { ...space, layout: { ...space.layout }, next: [...space.next] }
    }
    edit(spaces)
    return { ...healthy, spaces }
  }

  it('passes a board that is actually fine', () => {
    expect(boardProblems(healthy, 'standard/normal')).toEqual([])
  })

  it('catches two tiles drawn on top of each other', () => {
    const collided = withSpaces((spaces) => {
      spaces['main-bank'] = { ...spaces['main-bank']!, layout: { ...spaces['main-9']!.layout } }
    })
    expect(boardProblems(collided, 'standard/normal').join('\n')).toMatch(/main-bank|main-9/)
  })

  it('catches a tile drawn off the edge of the board', () => {
    const escaped = withSpaces((spaces) => {
      spaces['main-bank'] = { ...spaces['main-bank']!, layout: { x: -3, y: 0 } }
    })
    expect(boardProblems(escaped, 'standard/normal').join('\n')).toMatch(/main-bank/)
  })

  it('catches an orphan nothing points at', () => {
    const orphaned = withSpaces((spaces) => {
      const before = Object.values(spaces).find((s) => s.next.includes('main-bank'))!
      spaces[before.id] = { ...before, next: ['main-4'] }
    })
    expect(boardProblems(orphaned, 'standard/normal').join('\n')).toMatch(/main-bank/)
  })

  it('catches a dead end short of retirement', () => {
    const stuck = withSpaces((spaces) => {
      spaces['main-bank'] = { ...spaces['main-bank']!, next: [] }
    })
    expect(boardProblems(stuck, 'standard/normal').join('\n')).toMatch(/main-bank/)
  })

  it('catches a next pointing at a tile that is not there', () => {
    const dangling = withSpaces((spaces) => {
      spaces['main-bank'] = { ...spaces['main-bank']!, next: ['main-bank-annexe'] }
    })
    expect(boardProblems(dangling, 'standard/normal').join('\n')).toMatch(/main-bank-annexe/)
  })

  it('catches a fork whose road has no name', () => {
    const unnamed = withSpaces((spaces) => {
      const start = spaces[healthy.startSpaceId]!
      const headId = start.next[0]!
      const { lane: _lane, ...rest } = spaces[headId]!
      spaces[headId] = rest as Space
    })
    expect(boardProblems(unnamed, 'standard/normal').join('\n')).toMatch(/name/i)
  })

  it('labels every problem with the board it came from', () => {
    const stuck = withSpaces((spaces) => {
      spaces['main-bank'] = { ...spaces['main-bank']!, next: [] }
    })
    for (const problem of boardProblems(stuck, 'long/veryHard')) {
      expect(problem.startsWith('[long/veryHard]')).toBe(true)
    }
  })
})

/**
 * The route grammar has to be worth having.
 *
 * The USA board has three forks in three fixed places, which is exactly the
 * shape the old hand-wired `createBoard` could build — so a walker that only
 * ever handled *that* would pass every test in this repository. The proof that
 * the route is really data is a route the shipped board does not have: a fourth
 * fork, dropped into the middle of a trunk run, added the way a content author
 * would add one (§1.1's mid-game mini-fork is this edit, with copy).
 */
describe('a route shape no shipped edition has', () => {
  const tile = (id: SpaceId, title: string): SpaceContent =>
    flavour(0, id, title, `Something happens on the way through ${title}.`, 'slate', 'space:side-hustle')

  const withMiniFork = (): RouteDefinition => {
    const segments = [...EDITION_USA.route.segments]
    const mainIndex = segments.findIndex((s) => s.kind === 'run' && s.lane.name === 'main street')
    const main = segments[mainIndex] as Extract<RouteSegment, { kind: 'run' }>
    const half = Math.floor(main.lane.spaces.length / 2)

    segments.splice(
      mainIndex,
      1,
      run('main street', main.lane.spaces.slice(0, half)),
      fork(
        { ...tile('mini-fork', 'The Crossroads'), kind: 'stop' },
        {
          identity: { name: 'Loyalty Road', summary: 'Stay put; the raises come slowly and without fail.' },
          spaces: [tile('loyal-1', 'Long Service'), tile('loyal-2', 'The Same Desk')],
        },
        {
          identity: { name: 'Job-Hopper Alley', summary: 'Change firms and name your price.' },
          spaces: [tile('hop-1', 'The Recruiter'), tile('hop-2', 'New Badge'), tile('hop-3', 'Notice Period')],
        },
      ),
      run('main street, part two', main.lane.spaces.slice(half)),
    )
    return { segments, terminal: EDITION_USA.route.terminal }
  }

  const route = withMiniFork()

  it('validates clean', () => {
    expect(check(route)).toEqual([])
  })

  it('builds a board with four forks, every road named', () => {
    for (const length of ['short', 'standard', 'long'] as const) {
      const board = createBoard(length, 'normal', { ...EDITION_USA, route })
      const forks = Object.values(board.spaces).filter((space) => space.next.length > 1)
      // Four on the shipped route, and this one makes five.
      expect(forks, `${length} board`).toHaveLength(5)
      for (const forked of forks) {
        for (const headId of forked.next) {
          expect(board.spaces[headId]?.lane?.name, `${forked.id} -> ${headId}`).toBeTruthy()
        }
      }
    }
  })

  it('leaves the shipped board untouched', () => {
    // Building a variant must not mutate the edition everyone else is playing.
    expect(createBoard('standard')).toEqual(createBoard('standard', 'normal', EDITION_USA))
    expect(Object.keys(createBoard('standard').spaces)).not.toContain('mini-fork')
  })
})
