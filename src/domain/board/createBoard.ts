import type { Board, Difficulty, Space, SpaceEffect, SpaceId, SpaceLayout } from '../model/types'
import type { Edition, EconomyAmountKey } from '../edition/types'
import { EDITION_USA } from '../edition/usa'
import { harshenEffect } from '../rules/difficulty'
import type { AnyLane, RouteDefinition, SpaceContent } from './route'
import { identityOf, laneNameOf } from './route'

/**
 * The route walker.
 *
 * Every tile, lane and fork this file used to hold is now an edition's
 * `RouteDefinition` (`./route.ts` is the contract, `edition/usa/route.ts` the
 * first one written to it). What is left here is the part that is the same in
 * every country: keep the spaces this difficulty calls for, rewrite what the
 * difficulty rewrites, lay the whole thing out on a serpentine grid, wire it
 * up, and hand back a `Board`.
 *
 * Nothing below knows how many acts a life has or what the roads are called.
 */

// ---------------------------------------------------------------------------
// Difficulty selection: keep the spaces this setting is unkind enough to have.
// ---------------------------------------------------------------------------

/** How unkind each setting is, so "this difficulty or worse" is a comparison. */
const CRUELTY: Record<Difficulty, number> = { normal: 0, hard: 1, veryHard: 2 }

/** Whether a space exists at all on this board, before its hardship is applied. */
function appearsOn(content: SpaceContent, difficulty: Difficulty): boolean {
  return !content.appearsFrom || CRUELTY[difficulty] >= CRUELTY[content.appearsFrom]
}

/** Swaps in a space's hardship once the difficulty has climbed far enough. */
function atDifficulty(content: SpaceContent, difficulty: Difficulty): SpaceContent {
  const harsher = content.harsher
  if (!harsher || CRUELTY[difficulty] < CRUELTY[harsher.from]) return content
  return {
    ...content,
    kind: harsher.kind ?? content.kind,
    title: harsher.title ?? content.title,
    description: harsher.description,
    effect: harsher.effect,
    tone: harsher.tone ?? content.tone,
    icon: harsher.icon ?? content.icon,
  }
}

/**
 * Every lane has to come out of the gating with at least one space in it: the
 * wiring joins lanes head to tail, so an empty one would leave a fork pointing
 * at nothing. Anyone gating a lane's last ungated space finds out here rather
 * than three layers up — and `validateRoute` finds out before they ship it.
 */
export function laneFor(lane: AnyLane, difficulty: Difficulty): readonly SpaceContent[] {
  const kept = lane.spaces
    .filter((content) => appearsOn(content, difficulty))
    .map((content) => atDifficulty(content, difficulty))
  if (kept.length === 0) {
    throw new Error(`The ${laneNameOf(lane)} lane is empty at ${difficulty} — it needs an ungated space`)
  }
  const identity = identityOf(lane)
  if (!identity) return kept
  /*
   * Stamped on whichever space survives to the head of the lane, never on a
   * fixed id: a setback written at the top of a lane legitimately becomes its
   * first tile on the harder settings, and a fork that named a space not on
   * this board would fall back to naming a tile instead of the road.
   */
  return [{ ...kept[0]!, lane: identity }, ...kept.slice(1)]
}

// ---------------------------------------------------------------------------
// Walking the route: turn segments into the trunk this board actually has.
// ---------------------------------------------------------------------------

/**
 * A segment once it has been gated for this board.
 *
 * The junction of a fork is never gated away — a route without its wedding is
 * not a harder route, it is a broken one — so it carries only its hardship
 * rewrite.
 */
type WalkedSegment =
  | { readonly kind: 'run'; readonly spaces: readonly SpaceContent[] }
  | {
      readonly kind: 'fork'
      readonly at: SpaceContent
      readonly branches: readonly [readonly SpaceContent[], readonly SpaceContent[]]
    }

function walkRoute(route: RouteDefinition, difficulty: Difficulty): readonly WalkedSegment[] {
  return route.segments.map((segment): WalkedSegment => {
    if (segment.kind === 'run') {
      return { kind: 'run', spaces: laneFor(segment.lane, difficulty) }
    }
    const [a, b] = segment.branches
    return {
      kind: 'fork',
      at: atDifficulty(segment.at, difficulty),
      branches: [laneFor(a, difficulty), laneFor(b, difficulty)],
    }
  })
}

/** The first space a segment puts on the board — what the segment before it points at. */
function headOf(segment: WalkedSegment): SpaceContent {
  return segment.kind === 'run' ? segment.spaces[0]! : segment.at
}

/** Every space a walked segment contributes, in the order it is drawn. */
function spacesIn(segment: WalkedSegment): readonly SpaceContent[] {
  return segment.kind === 'run'
    ? segment.spaces
    : [segment.at, ...segment.branches[0], ...segment.branches[1]]
}

// ---------------------------------------------------------------------------
// Layout engine: a simple serpentine cursor. Linear runs step column by
// column, wrapping to a fresh row when they run out of width. Forks place
// their two branches on the rows directly above and below the fork tile,
// choosing whichever horizontal direction gives them room to stay on a
// single row (so branches read as clean parallel lanes), then resume the
// main cursor two rows below the fork for the reconverged path.
// ---------------------------------------------------------------------------

const COLUMN_MIN = 1
/**
 * How wide a row runs before the serpentine turns back.
 *
 * A board is a column of rows that gets longer; it is never a wider board. A
 * fork that runs out of room pushes the right-hand bound further out instead
 * of taking another row, so a row set too wide comes out landscape — and a
 * phone renders that as a smear. Narrowing the row is what turns tiles back
 * into rows. `Board.test.tsx` is what actually holds that promise.
 *
 * The value is load-bearing rather than arbitrary, and not monotonic either —
 * it is worth knowing that before nudging it. A row wide enough to swallow the
 * home-buying fork whole stops adding rows at all, and a row *too* narrow makes
 * every wide fork widen the board instead, which is the same failure from the
 * other side. Adding tiles to the trunk moves where the cursor meets that fork,
 * so a route change can push the board back out of shape without touching this
 * line: when it does, re-measure across a range rather than stepping down by
 * one, because 19 and 21 are both worse here than 20.
 */
const COLUMN_MAX = 20
const ROW_STEP = 3

interface Cursor {
  x: number
  y: number
  dir: 1 | -1
  /**
   * The serpentine's turning points. They are not constants because a branch
   * can come out wider than a row: rather than break a lane across two rows,
   * the cursor widens the board and every row after it simply has more room.
   * Bounds only ever grow, so a row is never asked to turn back at a column
   * the previous row ran past.
   */
  min: number
  max: number
}

/** Advance one tile, dropping straight down to a new row at either edge. */
function step(cursor: Cursor): void {
  const nextX = cursor.x + cursor.dir
  if (nextX < cursor.min || nextX > cursor.max) {
    cursor.y += ROW_STEP
    cursor.dir = (cursor.dir * -1) as 1 | -1
  } else {
    cursor.x = nextX
  }
}

function layoutLinear(cursor: Cursor, ids: readonly SpaceId[], layout: Map<SpaceId, SpaceLayout>): void {
  for (const id of ids) {
    step(cursor)
    layout.set(id, { x: cursor.x, y: cursor.y })
  }
}

/** Columns available ahead of the cursor before it would have to wrap. */
function roomAhead(cursor: Cursor): number {
  return cursor.dir === 1 ? cursor.max - cursor.x : cursor.x - cursor.min
}

/**
 * A fork's two branches have to sit on one row each, running alongside the
 * trunk, so the cursor drops to a fresh row rather than splitting near an edge.
 *
 * Dropping a row is usually enough. When it is not — wide branches, or a trunk
 * run that happened to stop mid-row — the row itself is widened instead of
 * splitting the lane, because a branch broken over two rows stops reading as a
 * lane at all.
 */
function ensureRoom(cursor: Cursor, needed: number): void {
  if (roomAhead(cursor) >= needed) return

  cursor.y += ROW_STEP
  cursor.dir = (cursor.dir * -1) as 1 | -1

  if (roomAhead(cursor) >= needed) return
  if (cursor.dir === 1) cursor.max = cursor.x + needed
  else cursor.min = cursor.x - needed
}

/**
 * Spreads a branch evenly across `span` columns.
 *
 * Branches are rarely the same length, and left to themselves the shorter one
 * finishes early — which drags a long diagonal across the board to reach the
 * merge tile. Stretching the shorter branch over the same span means both lanes
 * start and finish together and every join stays short.
 */
function layoutBranch(
  ids: readonly SpaceId[],
  originX: number,
  y: number,
  dir: 1 | -1,
  span: number,
  layout: Map<SpaceId, SpaceLayout>,
): void {
  const pitch = ids.length > 1 ? (span - 1) / (ids.length - 1) : 0
  ids.forEach((id, index) => {
    layout.set(id, { x: originX + dir * (1 + index * pitch), y })
  })
}

/**
 * Places a fork tile and its two branches as one unit.
 *
 * The whole figure — fork tile, both lanes, and the merge tile the next linear
 * run will drop in — has to live on a single trunk row, so the room check comes
 * before the fork tile is committed rather than after.
 */
function layoutFork(
  cursor: Cursor,
  forkId: SpaceId,
  branchAIds: readonly SpaceId[],
  branchBIds: readonly SpaceId[],
  layout: Map<SpaceId, SpaceLayout>,
): void {
  const span = Math.max(branchAIds.length, branchBIds.length)
  ensureRoom(cursor, span + 2)

  step(cursor)
  const forkX = cursor.x
  const forkY = cursor.y
  const dir = cursor.dir
  layout.set(forkId, { x: forkX, y: forkY })

  layoutBranch(branchAIds, forkX, forkY - 1, dir, span, layout)
  layoutBranch(branchBIds, forkX, forkY + 1, dir, span, layout)

  // Leave the cursor on the last branch column so the next linear step lands
  // the merge tile exactly one column past both lanes, back on the trunk row.
  cursor.x = forkX + dir * span
}

const idsOf = (lane: readonly SpaceContent[]): readonly SpaceId[] => lane.map((content) => content.id)

function computeLayout(walked: readonly WalkedSegment[], terminal: SpaceContent): Map<SpaceId, SpaceLayout> {
  const layout = new Map<SpaceId, SpaceLayout>()
  // Starts one column behind the first, since every placement steps first.
  const cursor: Cursor = { x: COLUMN_MIN - 1, y: 2, dir: 1, min: COLUMN_MIN, max: COLUMN_MAX }

  for (const segment of walked) {
    if (segment.kind === 'run') {
      layoutLinear(cursor, idsOf(segment.spaces), layout)
    } else {
      layoutFork(cursor, segment.at.id, idsOf(segment.branches[0]), idsOf(segment.branches[1]), layout)
    }
  }
  layoutLinear(cursor, [terminal.id], layout)

  return layout
}

// ---------------------------------------------------------------------------
// Wiring: chain a lane's ids together, with the final id pointing at
// whatever comes next (a single successor, or two branch heads for a fork).
// ---------------------------------------------------------------------------

function chain(ids: readonly SpaceId[], tailNext: readonly SpaceId[]): Map<SpaceId, readonly SpaceId[]> {
  const result = new Map<SpaceId, readonly SpaceId[]>()
  ids.forEach((id, index) => {
    if (index < ids.length - 1) {
      const nextId = ids[index + 1]
      if (nextId === undefined) throw new Error('unreachable')
      result.set(id, [nextId])
    } else {
      result.set(id, tailNext)
    }
  })
  return result
}

function computeWiring(
  walked: readonly WalkedSegment[],
  terminal: SpaceContent,
): Map<SpaceId, readonly SpaceId[]> {
  const nextById = new Map<SpaceId, readonly SpaceId[]>()

  walked.forEach((segment, index) => {
    const after = walked[index + 1]
    // Both roads out of a fork rejoin at whatever the trunk does next, which
    // is what makes a branch a branch rather than a second route.
    const successor = after ? headOf(after).id : terminal.id

    if (segment.kind === 'run') {
      for (const [id, next] of chain(idsOf(segment.spaces), [successor])) nextById.set(id, next)
      return
    }
    nextById.set(segment.at.id, [segment.branches[0][0]!.id, segment.branches[1][0]!.id])
    for (const branch of segment.branches) {
      for (const [id, next] of chain(idsOf(branch), [successor])) nextById.set(id, next)
    }
  })

  nextById.set(terminal.id, [])
  return nextById
}

/**
 * Substitutes the edition's own figure into a tile that names one.
 *
 * Only the amount moves: the tile keeps its title, its copy and its reason,
 * because a tuition bill is a tuition bill in every country.
 */
function priced(effect: SpaceEffect, amountFrom: EconomyAmountKey | undefined, edition: Edition): SpaceEffect {
  if (amountFrom === undefined) return effect
  const amount = edition.economy[amountFrom]
  if (effect.type === 'gainMoney' || effect.type === 'payMoney') return { ...effect, amount }
  if (effect.type === 'collectFromEach' || effect.type === 'payEach') return { ...effect, amount }
  if (effect.type === 'payPerChild' || effect.type === 'collectPerChild') return { ...effect, amount }
  if (effect.type === 'spinForMoney') return { ...effect, perPip: amount }
  if (effect.type === 'stockDividend') return { ...effect, perShare: amount }
  throw new Error(`createBoard: "${amountFrom}" cannot price a ${effect.type} effect`)
}

export function createBoard(difficulty: Difficulty = 'normal', edition: Edition = EDITION_USA): Board {
  const route = edition.route
  const walked = walkRoute(route, difficulty)
  const first = walked[0]
  if (first === undefined) throw new Error(`The ${edition.id} route has no segments`)

  const layout = computeLayout(walked, route.terminal)
  const nextById = computeWiring(walked, route.terminal)

  const allContent: readonly SpaceContent[] = [
    ...walked.flatMap((segment) => [...spacesIn(segment)]),
    route.terminal,
  ]

  // Widening a row can push the serpentine left of column zero, so everything
  // is slid back into positive space before the bounds are measured.
  let minX = Infinity
  for (const content of allContent) {
    const placed = layout.get(content.id)
    if (!placed) throw new Error(`Missing layout for space "${content.id}"`)
    minX = Math.min(minX, placed.x)
  }
  const shift = minX < COLUMN_MIN ? COLUMN_MIN - minX : 0

  const spaces: Record<SpaceId, Space> = {}
  let maxX = 0
  let maxY = 0
  for (const content of allContent) {
    const placed = layout.get(content.id)!
    const spaceLayout: SpaceLayout = { x: placed.x + shift, y: placed.y }
    const next = nextById.get(content.id)
    if (next === undefined) throw new Error(`Missing wiring for space "${content.id}"`)
    maxX = Math.max(maxX, spaceLayout.x)
    maxY = Math.max(maxY, spaceLayout.y)
    spaces[content.id] = {
      id: content.id,
      kind: content.kind,
      title: content.title,
      description: content.description,
      // Priced from the edition and scaled once, here, so the amount on the
      // tile is the amount that moves.
      effect: (() => {
        const base = priced(content.effect, content.amountFrom, edition)
        return content.unscaled ? base : harshenEffect(base, difficulty, edition)
      })(),
      next,
      layout: spaceLayout,
      tone: content.tone,
      icon: content.icon,
      ...(content.lane ? { lane: content.lane } : {}),
    }
  }

  return {
    spaces,
    startSpaceId: headOf(first).id,
    retirementSpaceId: route.terminal.id,
    width: maxX + 1,
    height: maxY + 1,
  }
}
