import type { Board, Difficulty, Space, SpaceEffect, SpaceId } from '../model/types'
import type { Edition } from '../edition/types'
import { DIFFICULTIES } from '../rules/difficulty'
import { createBoard, laneFor } from './createBoard'
import type { AnyLane, RouteDefinition, SpaceContent } from './route'
import { laneNameOf, spacesOf } from './route'

/**
 * What a route has to be true of, said out loud.
 *
 * Until now every one of these invariants held by construction. There was one
 * route; it was hand-wired by whoever wrote the layout engine; a lane could not
 * be emptied by a difficulty gate because the gate and the lane were fifty
 * lines apart in the same file, and the person editing one was reading the
 * other. That is not a property of the invariants. It is a property of there
 * having been exactly one author.
 *
 * A route is data now, and the next four countries will be written by people
 * who have never opened `createBoard.ts` and should not have to. Every rule
 * below is one they can break by editing a number in a data file, and every
 * message below is written for the moment they do: which lane, which board,
 * and what the board would have done about it.
 *
 * Nothing calls this at run time. It is a test's tool — run it against every
 * registered edition — because a route is fixed at build time and a check that
 * runs in the player's browser is a check that ran too late.
 */

/**
 * The milestones every board needs, and needs to make unskippable.
 *
 * Each of these has machinery behind it that a country cannot opt out of — a
 * degree gates the graduate career pool, a marriage gates children, a house is
 * half of the final score — so a board without one has dead engine attached to
 * it. And each has to be an `event` or a `stop` — the only two kinds a
 * milestone's effect is guaranteed to fire on, whether landed on exactly or
 * swept past: written as an ordinary tile, a career fair is one a laid-off
 * player spins straight over, and the milestone then happens to some players
 * and not others depending on a wheel.
 */
const REQUIRED_MILESTONES: readonly SpaceEffect['type'][] = [
  'graduate',
  'chooseCareer',
  'getMarried',
  'buyHouse',
]

/**
 * Effects an `event` tile is allowed to carry — every one of them settled by
 * a spin alone, nothing a player has to weigh. `buyHouse` is the reason this
 * list exists rather than a single `kind !== 'stop'` check: it is a real
 * decision (which house, or none), and a decision paused mid-move for is a
 * decision a player never actually got to make. An effect not on this list
 * gets a `stop`, the same as it always did, until someone has actually
 * confirmed it never raises more than the one "press Spin" option and adds
 * it here on purpose.
 */
const AUTO_RESOLVABLE_EFFECT_TYPES: readonly SpaceEffect['type'][] = [
  'none',
  'gainMoney',
  'payMoney',
  'graduate',
  'tuition',
  'chooseCareer',
  'careerChange',
  'promotion',
  'getMarried',
  'haveChildren',
]

// ---------------------------------------------------------------------------
// The finished board: graph and geometry.
// ---------------------------------------------------------------------------

const reachableFrom = (board: Board, from: SpaceId): Set<SpaceId> => {
  const seen = new Set<SpaceId>()
  const stack: SpaceId[] = [from]
  while (stack.length > 0) {
    const id = stack.pop()!
    if (seen.has(id)) continue
    seen.add(id)
    for (const next of board.spaces[id]?.next ?? []) stack.push(next)
  }
  return seen
}

/**
 * Everything that can be wrong with a board once it has been built.
 *
 * Separate from the route checks, and exported, because these are the rules a
 * *route* cannot state: whether two tiles ended up drawn on top of each other
 * is a fact about the layout engine's arithmetic on this particular set of
 * lane lengths, and the only way to know is to build it and look. `label` is
 * the board being checked — every problem carries it, because "a tile is
 * unreachable" is not actionable until you know it is unreachable at normal
 * and nowhere else.
 */
export function boardProblems(board: Board, label: string): readonly string[] {
  const problems: string[] = []
  const say = (message: string): void => void problems.push(`[${label}] ${message}`)
  const all = Object.values(board.spaces)

  const seenAt = new Map<string, SpaceId>()
  for (const space of all) {
    const key = `${space.layout.x},${space.layout.y}`
    const other = seenAt.get(key)
    if (other !== undefined) {
      say(`"${space.id}" and "${other}" are both drawn at (${key}) — the layout engine cannot place this route`)
    } else {
      seenAt.set(key, space.id)
    }
    if (
      space.layout.x < 0 ||
      space.layout.x > board.width ||
      space.layout.y < 0 ||
      space.layout.y > board.height
    ) {
      say(`"${space.id}" is drawn at (${key}), outside the ${board.width}×${board.height} board`)
    }
  }

  for (const space of all) {
    for (const nextId of space.next) {
      if (!board.spaces[nextId]) say(`"${space.id}" leads to "${nextId}", which is not on the board`)
    }
  }

  const reachable = reachableFrom(board, board.startSpaceId)
  const arrivals = new Map<SpaceId, number>()
  for (const space of all) {
    for (const nextId of space.next) arrivals.set(nextId, (arrivals.get(nextId) ?? 0) + 1)
  }

  for (const space of all) {
    if (!reachable.has(space.id)) {
      say(`"${space.id}" cannot be reached from the start — no route leads to it`)
    }
    if (space.id !== board.startSpaceId && (arrivals.get(space.id) ?? 0) === 0) {
      say(`"${space.id}" is an orphan: nothing on the board points at it`)
    }
    if (space.id !== board.retirementSpaceId && !reachableFrom(board, space.id).has(board.retirementSpaceId)) {
      say(`"${space.id}" is a dead end — a player standing on it never reaches retirement`)
    }
  }

  if ((arrivals.get(board.startSpaceId) ?? 0) > 0) {
    say(`the start space "${board.startSpaceId}" is pointed back at, so the route loops`)
  }

  const terminals = all.filter((space) => space.next.length === 0)
  if (terminals.length !== 1 || terminals[0]?.id !== board.retirementSpaceId) {
    say(
      `the only space with nowhere to go should be "${board.retirementSpaceId}", but it is ${
        terminals.map((space) => `"${space.id}"`).join(', ') || 'nothing at all'
      }`,
    )
  }

  problems.push(...strandedByALayoff(board).map((message) => `[${label}] ${message}`))

  for (const fork of all.filter((space) => space.next.length > 1)) {
    if (fork.next.length !== 2) {
      say(`fork "${fork.id}" offers ${fork.next.length} roads — a fork offers exactly two`)
    }
    /*
     * The rule this validator was built for, and outgrew.
     *
     * A road used to be a choice a player made deliberately before the wheel
     * was spun, so a fork on a `normal` tile handed a real advantage to
     * whoever overshot it with steps already known — `main-crossroads`
     * shipped that way and this is the check that found it. There is no
     * longer a choice to hand an advantage back on: `spin`/`settle` read
     * *any* fork, `stop` or not, and let the very roll that reaches it pick
     * the road and the distance both — see `resolveForkBranch` in
     * `branch.ts`. A `stop` fork still works exactly as it always did; a
     * `normal` one now does too, which is what lets an edition thin how many
     * of its stops a short board carries without touching which forks exist.
     */
    const names = new Set<string>()
    for (const headId of fork.next) {
      const head: Space | undefined = board.spaces[headId]
      if (!head) continue
      if (!head.lane?.name) {
        say(`the road out of fork "${fork.id}" through "${headId}" has no name, so the fork offers a tile instead of a road`)
        continue
      }
      names.add(head.lane.name)
    }
    if (names.size > 0 && names.size !== fork.next.length) {
      say(`fork "${fork.id}" offers the same name twice: ${[...names].join(', ')}`)
    }
  }

  return problems
}

/**
 * Layoffs with no way back.
 *
 * Losing a job is a good swing; losing it with no re-hire ahead is a seat that
 * spends the rest of the game collecting casual wages, and because it depends
 * on which lane a player happened to take, it shows up as a statistic rather
 * than as a bug. Only a `stop` or an `event` guarantees anything — an ordinary
 * tile's effect is only ever certain for whoever lands on it exactly — so an
 * ordinary `careerChange` tile on the way is no guarantee at all.
 */
function strandedByALayoff(board: Board): readonly string[] {
  const hires = (space: Space): boolean =>
    (space.effect.type === 'careerChange' || space.effect.type === 'chooseCareer') &&
    (space.kind === 'stop' || space.kind === 'event')

  const memo = new Map<SpaceId, boolean>()
  const escapesUnemployed = (id: SpaceId): boolean => {
    const cached = memo.get(id)
    if (cached !== undefined) return cached
    const space = board.spaces[id]
    let result: boolean
    if (!space) result = true
    else if (hires(space)) result = false
    else if (space.next.length === 0) result = true
    else result = space.next.some((nextId) => escapesUnemployed(nextId))
    memo.set(id, result)
    return result
  }

  const problems: string[] = []
  for (const layoff of Object.values(board.spaces)) {
    if (layoff.effect.type !== 'loseCareer') continue
    const stranded = layoff.next.filter((nextId) => escapesUnemployed(nextId))
    if (stranded.length > 0) {
      problems.push(
        `a player who loses their job at "${layoff.id}" can walk to retirement still unemployed, via ${stranded
          .map((id) => `"${id}"`)
          .join(', ')} — every road out of a layoff needs a "stop" that hires`,
      )
    }
  }
  return problems
}

// ---------------------------------------------------------------------------
// The route as written.
// ---------------------------------------------------------------------------

/**
 * Every problem with `route`, in the order a reader would want them.
 *
 * An empty array means the route is sound. Problems are returned rather than
 * thrown, all of them at once: an author who has emptied a lane on three
 * boards wants all three lines, not the first one and another test run.
 */
export function validateRoute(route: RouteDefinition, edition: Edition): readonly string[] {
  const problems: string[] = []
  const say = (message: string): void => void problems.push(message)

  // --- the shape of the whole thing ---------------------------------------

  if (route.segments.length === 0) {
    say('the route has no segments: there is no board to build')
    return problems
  }

  const written = spacesOf(route)

  const seen = new Set<SpaceId>()
  for (const space of written) {
    if (seen.has(space.id)) say(`"${space.id}" is used twice — every tile on a route needs its own id`)
    seen.add(space.id)
  }

  const first = route.segments[0]!
  const opener = first.kind === 'fork' ? first.at : first.lane.spaces[0]
  if (!opener || opener.kind !== 'start') {
    say(
      `the route opens on "${opener?.id ?? 'nothing'}" (kind "${opener?.kind ?? 'none'}") — the first tile of a route is where players stand, and it must be a "start"`,
    )
  }
  for (const space of written) {
    if (space.kind === 'start' && space.id !== opener?.id) {
      say(`"${space.id}" is a second start tile — a route has exactly one, and it opens the route`)
    }
  }

  const terminal = route.terminal
  if (terminal.kind !== 'retirement' || terminal.effect.type !== 'retire') {
    say(
      `the terminal "${terminal.id}" is a ${terminal.kind} tile with a ${terminal.effect.type} effect — a route ends in a "retirement" tile that retires the player`,
    )
  }
  for (const space of written) {
    if (space.kind === 'retirement' && space.id !== terminal.id) {
      say(`"${space.id}" is a second retirement tile — only the route's terminal ends the game`)
    }
  }

  // --- junctions and the terminal are never gated away ---------------------

  const ungated: readonly SpaceContent[] = [
    ...route.segments.flatMap((segment) => (segment.kind === 'fork' ? [segment.at] : [])),
    terminal,
  ]
  for (const space of ungated) {
    if (space.appearsFrom) {
      say(
        `"${space.id}" is gated at "${space.appearsFrom}", but junctions and the terminal are never gated — the gate does nothing`,
      )
    }
  }

  // --- the two roads out of every fork ------------------------------------

  for (const segment of route.segments) {
    if (segment.kind !== 'fork') continue
    // A junction no longer has to be a `stop` — see the matching comment on
    // the built-board check above, which is the one that used to live here.
    const names = new Set<string>()
    for (const branch of segment.branches) {
      if (!branch.identity.name.trim()) {
        say(`a branch of fork "${segment.at.id}" has no name, so the fork would offer its first tile instead of the road`)
        continue
      }
      if (!branch.identity.summary.trim()) {
        say(`"${branch.identity.name}" (fork "${segment.at.id}") has no summary — a fork is an argument, and this side does not make one`)
      }
      names.add(branch.identity.name)
    }
    if (names.size === 1) {
      say(`fork "${segment.at.id}" offers "${[...names][0]}" twice — its two roads need different names`)
    }
  }

  // --- every board this route can be asked for ----------------------------

  for (const difficulty of DIFFICULTIES) {
    problems.push(...problemsOn(route, edition, difficulty))
  }

  return problems
}

/** Everything wrong with the route once it has been gated for one board. */
function problemsOn(
  route: RouteDefinition,
  edition: Edition,
  difficulty: Difficulty,
): readonly string[] {
  const label = difficulty
  const problems: string[] = []
  const say = (message: string): void => void problems.push(`[${label}] ${message}`)

  // A lane gated down to nothing leaves the wiring pointing at a road with no
  // tiles on it, so this is checked before anything tries to build the board.
  const survivors = new Map<AnyLane, readonly SpaceContent[]>()
  let empty = false
  for (const segment of route.segments) {
    const lanes: readonly AnyLane[] = segment.kind === 'run' ? [segment.lane] : [...segment.branches]
    for (const lane of lanes) {
      try {
        survivors.set(lane, laneFor(lane, difficulty))
      } catch {
        empty = true
        const where =
          segment.kind === 'fork'
            ? `the road out of fork "${segment.at.id}" toward "${laneNameOf(lane)}"`
            : `the "${laneNameOf(lane)}" run`
        say(
          `${where} has no tiles left: every space on it is gated above "${difficulty}". A lane needs one ungated space to survive every board.`,
        )
      }
    }
  }
  if (empty) return problems

  // --- the milestones, on this board --------------------------------------

  const live = [
    ...[...survivors.values()].flat(),
    ...route.segments.flatMap((segment) => (segment.kind === 'fork' ? [segment.at] : [])),
    route.terminal,
  ]

  for (const type of REQUIRED_MILESTONES) {
    if (!live.some((space) => space.effect.type === type)) {
      say(`no "${type}" space survives to this board — the engine has a milestone with nowhere to happen`)
    }
  }
  for (const space of live) {
    if (REQUIRED_MILESTONES.includes(space.effect.type) && space.kind !== 'stop' && space.kind !== 'event') {
      say(
        `"${space.id}" carries a "${space.effect.type}" but is a "${space.kind}" tile — only "stop" and "event" guarantee an effect fires, so a player can spin straight past this milestone and half the table never has it happen`,
      )
    }
    if (space.kind === 'event' && !AUTO_RESOLVABLE_EFFECT_TYPES.includes(space.effect.type)) {
      say(
        `"${space.id}" is an "event" tile carrying a "${space.effect.type}" effect, which is not on the auto-resolvable list — an "event" tile can never pause for a real choice, since a player mid-move never gets asked. Give it a "stop" instead, or confirm the effect never raises more than one option and add it to AUTO_RESOLVABLE_EFFECT_TYPES.`,
      )
    }
    /*
     * `careerChange` is on the auto-resolvable list, but only earns it when
     * `compulsory` — the redraw itself is the whole point of the road, so
     * there is nothing to weigh (`applyEffect`'s "Stay" option never gets
     * built). Without `compulsory`, a player who already has a job is
     * offered a real "Stay or Spin" choice, same as `main-career-fair`
     * shipped with once — the bug this check exists to catch, discovered by
     * the balance suite hanging rather than by a reviewer's eye.
     */
    if (space.kind === 'event' && space.effect.type === 'careerChange' && !space.effect.compulsory) {
      say(
        `"${space.id}" is an "event" tile carrying a non-compulsory "careerChange" — a player who already has a job gets a real "Stay or Spin" choice there, which an "event" tile can never pause mid-move to ask. Give it a "stop" instead, or mark the effect "compulsory".`,
      )
    }
  }

  // --- and finally, the board it actually builds ---------------------------

  let board: Board
  try {
    // Built from the route under test rather than from `edition.route`: a
    // candidate route is usually not the one its edition ships yet.
    board = createBoard(difficulty, { ...edition, route })
  } catch (error) {
    say(`the board cannot be built: ${error instanceof Error ? error.message : String(error)}`)
    return problems
  }
  problems.push(...boardProblems(board, label))

  return problems
}
