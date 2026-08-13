import type {
  Career,
  CareerId,
  House,
  HouseId,
  LifeTile,
  LifeTileId,
  Player,
  Stock,
  StockId,
} from '../model/types'
import type { Edition } from './types'
import { EDITION_USA } from './usa'

/**
 * Id lookups across an edition's catalogues.
 *
 * A decision option travels to the UI as a bare id and comes back the same
 * way, so something has to turn `'career-surgeon'` back into a career. That
 * used to be a module-level index per catalogue, which quietly assumed there
 * was only one catalogue of each kind in the world.
 *
 * Every lookup takes the edition it should search, defaulting to the USA one
 * so a caller with no game in hand — a panel rendering a lone player, a test
 * naming a career directly — still resolves the ids it always did.
 *
 * The indexes are built once per edition and cached against the edition object
 * itself, so a lookup stays a hash probe no matter how many editions ship.
 */

/**
 * Where one rung sits on its ladder, worked out from the chain.
 *
 * Nothing in the catalogue records a rung number: the shape of a ladder is
 * whatever `promotesTo` says it is, and a second copy of that fact written on
 * each entry is a second copy that goes stale. So it is derived once per
 * edition, alongside the id indexes, and cached against the same object.
 */
export interface LadderPosition {
  /** The rung a career fair hires onto — the one nothing points at. */
  readonly entry: Career
  /** 1 at the bottom of the ladder. */
  readonly rung: number
  /** How many rungs the whole ladder has. 1 for a calling, or a job for life. */
  readonly height: number
  /** Every rung, bottom first. */
  readonly rungs: readonly Career[]
}

interface EditionIndex {
  readonly careers: ReadonlyMap<CareerId, Career>
  readonly houses: ReadonlyMap<HouseId, House>
  readonly lifeTiles: ReadonlyMap<LifeTileId, LifeTile>
  readonly stocks: ReadonlyMap<StockId, Stock>
  readonly ladders: ReadonlyMap<CareerId, LadderPosition>
  /** Bottom rungs only, split the way the two pools are. */
  readonly hiring: { readonly basic: readonly Career[]; readonly graduate: readonly Career[] }
}

/**
 * Walks every `promotesTo` chain in a pool into ladders.
 *
 * A rung is a bottom rung when nothing in the pool points at it, so a pool of
 * jobs with no chains at all is a pool of one-rung ladders — which is exactly
 * what an edition that has not written any ought to get. A chain that loops
 * would walk forever, so the walk stops the moment it revisits a rung; the
 * catalogue tests are what say a loop is a mistake.
 */
function laddersIn(pool: readonly Career[]): readonly (readonly Career[])[] {
  const byId = new Map(pool.map((career) => [career.id, career]))
  const pointedAt = new Set(pool.map((career) => career.promotesTo).filter((id): id is CareerId => !!id))

  return pool
    .filter((career) => !pointedAt.has(career.id))
    .map((entry) => {
      const rungs: Career[] = [entry]
      const seen = new Set<CareerId>([entry.id])
      let above = entry.promotesTo
      while (above && !seen.has(above)) {
        const next = byId.get(above)
        if (!next) break
        rungs.push(next)
        seen.add(next.id)
        above = next.promotesTo
      }
      return rungs
    })
}

const INDEXES = new WeakMap<Edition, EditionIndex>()

function indexOf(edition: Edition): EditionIndex {
  const cached = INDEXES.get(edition)
  if (cached) return cached

  const basicLadders = laddersIn(edition.careers.basic)
  const graduateLadders = laddersIn(edition.careers.graduate)
  const ladders = new Map<CareerId, LadderPosition>()
  for (const rungs of [...basicLadders, ...graduateLadders]) {
    rungs.forEach((career, index) => {
      ladders.set(career.id, { entry: rungs[0]!, rung: index + 1, height: rungs.length, rungs })
    })
  }

  const built: EditionIndex = {
    careers: new Map([...edition.careers.basic, ...edition.careers.graduate].map((c) => [c.id, c])),
    houses: new Map(edition.houses.map((house) => [house.id, house])),
    lifeTiles: new Map(edition.lifeTiles.map((tile) => [tile.id, tile])),
    stocks: new Map(edition.stocks.map((stock) => [stock.id, stock])),
    ladders,
    hiring: {
      basic: basicLadders.map((rungs) => rungs[0]!),
      graduate: graduateLadders.map((rungs) => rungs[0]!),
    },
  }
  INDEXES.set(edition, built)
  return built
}

export function findCareer(id: CareerId, edition: Edition = EDITION_USA): Career | undefined {
  return indexOf(edition).careers.get(id)
}

export function findHouse(id: HouseId, edition: Edition = EDITION_USA): House | undefined {
  return indexOf(edition).houses.get(id)
}

export function findLifeTile(id: LifeTileId, edition: Edition = EDITION_USA): LifeTile | undefined {
  return indexOf(edition).lifeTiles.get(id)
}

export function findStock(id: StockId, edition: Edition = EDITION_USA): Stock | undefined {
  return indexOf(edition).stocks.get(id)
}

/**
 * Every rung of every ladder a player is entitled to. A degree unlocks the
 * better pool. This is the pool for *looking things up in*; what a fair is
 * allowed to deal is `hiringPoolFor`.
 */
export function careerPoolFor(edition: Edition, hasDegree: boolean): readonly Career[] {
  return hasDegree ? edition.careers.graduate : edition.careers.basic
}

/**
 * What a career fair may actually offer: bottom rungs, and nothing else.
 *
 * Nobody is handed a salon. The board used to deal a Salon Owner to a
 * nineteen-year-old with no job and no explanation, because the pool was a
 * flat list and the fair drew two of it at random. A fair deals the door in,
 * and the rest of the ladder is climbed.
 */
export function hiringPoolFor(edition: Edition, hasDegree: boolean): readonly Career[] {
  const { basic, graduate } = indexOf(edition).hiring
  return hasDegree ? graduate : basic
}

/** Where `id` sits on its ladder, or undefined if the edition has never heard of it. */
export function ladderPositionOf(id: CareerId, edition: Edition = EDITION_USA): LadderPosition | undefined {
  return indexOf(edition).ladders.get(id)
}

/**
 * The rung above `career`, or undefined at the top of a ladder.
 *
 * Read from the chain rather than from the index so a career carried in a save
 * — whose `salary` has been raised out of all recognition since it was dealt —
 * still promotes to the right job.
 */
export function nextRungOf(career: Career, edition: Edition = EDITION_USA): Career | undefined {
  return career.promotesTo ? findCareer(career.promotesTo, edition) : undefined
}

/**
 * How far up a ladder this player has climbed, whether or not they are on one.
 *
 * While they are employed it is simply the rung they hold. While they are not,
 * it is what a layoff left them — one rung below where they were, never less
 * than the bottom — because losing a job and losing twenty years of it are
 * different sizes of misfortune, and the board should be able to tell them
 * apart. A player who has never worked, or a save written before ladders
 * existed, reads as the bottom rung, which is where a first job fair hires.
 */
export function seniorityOf(player: Player, edition: Edition = EDITION_USA): number {
  if (player.career) return ladderPositionOf(player.career.id, edition)?.rung ?? 1
  return Math.max(1, player.carriedSeniority ?? 1)
}

/**
 * The rung of `entry`'s ladder a mover with `seniority` years behind them
 * joins at, capped by how tall that ladder actually is.
 *
 * This is what stops a career change being a demotion. A stylist who walks
 * into a bakery does not start again peeling almonds — the trade is new, the
 * seniority is not — and a ladder with only two rungs takes them at its top.
 */
export function rungFor(entry: Career, seniority: number, edition: Edition = EDITION_USA): Career {
  const ladder = ladderPositionOf(entry.id, edition)
  if (!ladder) return entry
  const index = Math.min(Math.max(1, seniority), ladder.height) - 1
  return ladder.rungs[index] ?? entry
}
