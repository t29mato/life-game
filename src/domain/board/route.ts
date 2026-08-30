import type { Difficulty, LaneIdentity, SpaceEffect, SpaceId, SpaceKind, SpaceTone } from '../model/types'
import type { IconName } from '../model/icons'
import type { EconomyAmountKey } from '../edition/types'

/**
 * LIFE JOURNEY — the route contract, and the board author's whole vocabulary.
 *
 * A route is the shape of a life: where the road splits, what the two sides
 * are called, and which tile sits where in between. It is data. `createBoard`
 * is the walker that turns it into a board — it rewrites tiles for the
 * difficulty, lays the whole thing out on a serpentine grid and wires it up,
 * and it does all of that without knowing that any particular country's road
 * is called Main Street.
 *
 * Everything an edition author writes lives in this file: the hardships, the
 * `appearsFrom` gate, and the four helpers that make a lane readable as prose.
 * None of it is new — it is the machinery the USA board was already built out
 * of, which is exactly why it is worth handing over intact. It is a good
 * difficulty API, and it was only ever private by accident.
 */

/**
 * The bad day a space has once the difficulty is turned up.
 *
 * The alternative was an invisible multiplier, and it would have been a lie:
 * the tile would still read "the whole block shows up and someone brings way
 * too much potato salad" while quietly charging for a marquee. A hardship
 * rewrites the tile itself, so a player on Hard reads the sentence that
 * actually explains where their money went.
 */
export interface Hardship {
  /** Lowest difficulty at which this replaces the original. */
  readonly from: Difficulty
  /** Optional new label; the original title stands when this is omitted. */
  readonly title?: string
  readonly description: string
  readonly effect: SpaceEffect
  /**
   * Lets a hardship take a payday off the route entirely.
   *
   * This is the only change on the board with real weight behind it, because a
   * payday is the one space that pays for being *passed* — every other tile
   * has to be landed on, which happens perhaps three times in twenty. A missed
   * payroll therefore costs a whole salary rather than a fraction of one, and
   * that is exactly why the harder settings need a couple of them.
   */
  readonly kind?: SpaceKind
  readonly tone?: SpaceTone
  readonly icon?: IconName
}

/** One tile, as its author writes it. Coordinates and wiring come later. */
export interface SpaceContent {
  readonly id: SpaceId
  readonly kind: SpaceKind
  readonly title: string
  readonly description: string
  readonly effect: SpaceEffect
  readonly tone: SpaceTone
  readonly icon: IconName
  /**
   * Lowest difficulty this space exists on at all. Absent means every
   * difficulty. This is the frequency dial: a Very Hard route genuinely has
   * more places to come unstuck, rather than the same places costing more.
   */
  readonly appearsFrom?: Difficulty
  /** What this space becomes from `harsher.from` upwards. */
  readonly harsher?: Hardship
  /**
   * Holds this space's money at its written figure on every difficulty.
   *
   * Reserved for the one price on the board that is not a misfortune at all:
   * college tuition is an investment the player *chooses*, up front, holding
   * $10,000. Multiplied like an ordinary bill it becomes a six-figure debt
   * taken on turn one at Very Hard's interest rate, which does not make College
   * Lane harder — it deletes it. Left where it is, the lane stays a real choice
   * and the harder settings bite through what that borrowing costs to settle.
   */
  readonly unscaled?: boolean
  /**
   * Takes this space's amount from the edition rather than from the tile.
   *
   * Tuition is the edition's tuition — $40,000 on the USA board, and whatever
   * a Japanese four-year degree costs on that one — and it is priced against
   * the starting cash and the graduate salaries, none of which are written
   * here. Naming the constant keeps the number in one place instead of two.
   */
  readonly amountFrom?: EconomyAmountKey
  /** Set by the walker on the head of a branch, never written by hand. */
  readonly lane?: LaneIdentity
}

/** A space that exists purely as a beat in the story, with nothing to resolve. */
export function flavour(
  id: SpaceId,
  title: string,
  description: string,
  tone: SpaceTone,
  icon: IconName,
  harsher?: Hardship,
): SpaceContent {
  return {
    id,
    kind: 'normal',
    title,
    description,
    effect: { type: 'none' },
    tone,
    icon,
    ...(harsher ? { harsher } : {}),
  }
}

/**
 * A bill that only exists once the difficulty is turned up.
 *
 * Every one of these is a real tile with its own sentence, drawn on the board
 * and read out on the event card like any other. That is the whole point: the
 * setbacks a harder game adds have to be somewhere a player can see them
 * coming, argue with the dice about them, and insure against them.
 */
export function setback(
  appearsFrom: Difficulty,
  id: SpaceId,
  title: string,
  description: string,
  effect: SpaceEffect,
  tone: SpaceTone,
  icon: IconName,
): SpaceContent {
  return { id, kind: 'normal', title, description, effect, tone, icon, appearsFrom }
}

/** A payday tile. There are a lot of these, and they all read the same. */
export function payday(id: SpaceId, description: string, harsher?: Hardship): SpaceContent {
  return {
    id,
    kind: 'payday',
    title: 'Payday',
    description,
    effect: { type: 'payday' },
    tone: 'green',
    icon: 'space:payday',
    ...(harsher ? { harsher } : {}),
  }
}

/**
 * The payday that does not arrive — the shape a `payday` tile takes once the
 * difficulty is turned up. Nothing is collected for passing it any more, and
 * landing on it costs a small sum on top.
 */
export function missedPayday(
  from: Difficulty,
  title: string,
  description: string,
  amount: number,
  reason: string,
): Hardship {
  return {
    from,
    title,
    description,
    kind: 'normal',
    effect: { type: 'payMoney', amount, reason },
    tone: 'orange',
    icon: 'finance:bank-visit',
  }
}

// ---------------------------------------------------------------------------
// The route itself: a trunk of segments, from the start tile to retirement.
// ---------------------------------------------------------------------------

/**
 * A stretch of trunk.
 *
 * The `name` is not shown to players; nobody chooses to walk down Main Street,
 * they simply arrive on it. It exists for the author who has just gated the
 * run's last ungated space behind a difficulty and needs to be told which run,
 * on which board, they emptied.
 */
export interface RouteLane {
  readonly name: string
  readonly spaces: readonly SpaceContent[]
}

/**
 * One of the two roads out of a fork.
 *
 * A branch names itself in the type rather than in a validator, because the
 * fork panel offers two roads by name and a nameless one would offer the first
 * tile instead — "Move-In Day" where it meant "College Lane". That name is
 * also what the author is told about when something goes wrong with the lane,
 * so a branch has one name rather than two. The identity is stamped on
 * whichever space survives the difficulty gating to the head of the lane, so a
 * fork keeps naming the road at every setting.
 */
export interface RouteBranch {
  readonly identity: LaneIdentity
  readonly spaces: readonly SpaceContent[]
}

/** Either kind of lane. Everything downstream of the route treats them alike. */
export type AnyLane = RouteLane | RouteBranch

/** What this lane is called: the road's own name, or a run's internal one. */
export function laneNameOf(lane: AnyLane): string {
  return 'identity' in lane ? lane.identity.name : lane.name
}

/** The identity to stamp on this lane's head, if players ever choose it by name. */
export function identityOf(lane: AnyLane): LaneIdentity | undefined {
  return 'identity' in lane ? lane.identity : undefined
}

/**
 * One step along the trunk.
 *
 * A `run` is a linear stretch. A `fork` is a single trunk tile that splits:
 * landing on it raises the branch decision, both roads run alongside the
 * trunk, and both rejoin at whatever comes next. That is the whole grammar —
 * three acts or five, one fork or four, in any order.
 */
export type RouteSegment =
  | { readonly kind: 'run'; readonly lane: RouteLane }
  | {
      readonly kind: 'fork'
      /** The tile the road splits at. On the opening fork this is the start tile itself. */
      readonly at: SpaceContent
      readonly branches: readonly [RouteBranch, RouteBranch]
    }

/**
 * A country's whole board, as data.
 *
 * There is deliberately no separate `start` field. On the board this game
 * already had, the start tile *is* the opening fork's junction — the choice
 * between a degree and a wage is made standing on "Start of Life" — so a
 * `start` alongside the segments would either duplicate that tile or add a
 * new one, and adding a tile moves every balance number on the board. The
 * start is therefore the first space the route places, and `validateRoute`
 * insists it is a `start` tile and the only one.
 */
export interface RouteDefinition {
  readonly segments: readonly RouteSegment[]
  /** Retirement: the one space with nowhere to go. */
  readonly terminal: SpaceContent
}

/** A linear stretch of trunk. */
export function run(name: string, spaces: readonly SpaceContent[]): RouteSegment {
  return { kind: 'run', lane: { name, spaces } }
}

/** A trunk tile that splits into two named roads, which rejoin after it. */
export function fork(at: SpaceContent, a: RouteBranch, b: RouteBranch): RouteSegment {
  return { kind: 'fork', at, branches: [a, b] }
}

/** Every space a route names, gating aside: junctions, lanes and terminal. */
export function spacesOf(route: RouteDefinition): readonly SpaceContent[] {
  const spaces: SpaceContent[] = []
  for (const segment of route.segments) {
    if (segment.kind === 'run') {
      spaces.push(...segment.lane.spaces)
      continue
    }
    spaces.push(segment.at)
    for (const branch of segment.branches) spaces.push(...branch.spaces)
  }
  spaces.push(route.terminal)
  return spaces
}
