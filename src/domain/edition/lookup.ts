import type {
  Career,
  CareerId,
  CareerTier,
  House,
  HouseId,
  LifeTile,
  LifeTileId,
  Player,
  Stock,
  StockId,
} from '../model/types'
import type { CareerFamily } from '../rules/careerFamily'
import { TRADE_YEAR_STORIES, type TradeYearStories } from '../rules/tradeYear'
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
  /** Bottom rungs only, split the way the shelves are. */
  readonly hiring: Readonly<Record<CareerTier, readonly Career[]>>
}

/** Every shelf an edition can hold, worst first. The order is the hierarchy. */
const TIERS: readonly CareerTier[] = ['basic', 'graduate', 'doctorate']

/**
 * The lower of two tiers.
 *
 * What a fair actually deals from. A tile names the best shelf it can reach
 * and a player carries the best shelf they are entitled to, and neither one
 * alone is the answer: a graduate fair hands a school-leaver the basic pool,
 * and a doctor who walks into a school-leaver's fair is still only offered
 * what that fair has on the table.
 */
export function lowerTier(a: CareerTier, b: CareerTier): CareerTier {
  return TIERS.indexOf(a) <= TIERS.indexOf(b) ? a : b
}

/** The best shelf this player's schooling entitles them to. */
export function careerTierOf(player: Player): CareerTier {
  if (player.hasDoctorate) return 'doctorate'
  return player.hasDegree ? 'graduate' : 'basic'
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
  // An edition with no grad school on its board writes no doctoral shelf, and
  // an empty one indexes to an empty everything rather than to a special case.
  const doctorateLadders = laddersIn(edition.careers.doctorate ?? [])
  const ladders = new Map<CareerId, LadderPosition>()
  for (const rungs of [...basicLadders, ...graduateLadders, ...doctorateLadders]) {
    rungs.forEach((career, index) => {
      ladders.set(career.id, { entry: rungs[0]!, rung: index + 1, height: rungs.length, rungs })
    })
  }

  const built: EditionIndex = {
    // Every shelf, so that a career carried in a save still resolves to the
    // job it names. Leaving the doctoral shelf out of this one map would let
    // `findCareer` come back empty for a doctor reloading their own game,
    // which reads downstream as a ladder that lost its rungs.
    careers: new Map(
      [...edition.careers.basic, ...edition.careers.graduate, ...(edition.careers.doctorate ?? [])].map(
        (c) => [c.id, c],
      ),
    ),
    houses: new Map(edition.houses.map((house) => [house.id, house])),
    lifeTiles: new Map(edition.lifeTiles.map((tile) => [tile.id, tile])),
    stocks: new Map(edition.stocks.map((stock) => [stock.id, stock])),
    ladders,
    hiring: {
      basic: basicLadders.map((rungs) => rungs[0]!),
      graduate: graduateLadders.map((rungs) => rungs[0]!),
      doctorate: doctorateLadders.map((rungs) => rungs[0]!),
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
 * Every rung of every ladder on one shelf. This is the pool for *looking
 * things up in*; what a fair is allowed to deal is `hiringPoolFor`.
 *
 * An edition asked for a shelf it has not written falls back to the one below
 * rather than dealing nothing. That is not defensive padding — it is the only
 * honest answer while the doctorate rolls out one country at a time, and it
 * keeps a shared engine from having to know which countries are finished.
 */
export function careerPoolFor(edition: Edition, tier: CareerTier): readonly Career[] {
  if (tier === 'doctorate') return edition.careers.doctorate ?? edition.careers.graduate
  return tier === 'graduate' ? edition.careers.graduate : edition.careers.basic
}

/**
 * What a career fair may actually offer: bottom rungs, and nothing else.
 *
 * Nobody is handed a salon. The board used to deal a Salon Owner to a
 * nineteen-year-old with no job and no explanation, because the pool was a
 * flat list and the fair drew two of it at random. A fair deals the door in,
 * and the rest of the ladder is climbed.
 */
export function hiringPoolFor(edition: Edition, tier: CareerTier): readonly Career[] {
  const hiring = indexOf(edition).hiring
  // Same fallback `careerPoolFor` makes, and for the same reason: an edition
  // with no doctoral shelf hires its doctors off the graduate one.
  if (tier === 'doctorate') return hiring.doctorate.length > 0 ? hiring.doctorate : hiring.graduate
  return tier === 'graduate' ? hiring.graduate : hiring.basic
}

/**
 * The vignette table a `tradeYear` tile should read for this family, in this
 * edition.
 *
 * Same fallback shape as `careerPoolFor`: an edition only writes the
 * families it wants to sound different, and every family it leaves out reads
 * the engine-global `TRADE_YEAR_STORIES` untouched.
 */
export function tradeYearStoriesFor(edition: Edition, family: CareerFamily): TradeYearStories {
  return edition.tradeYearStories?.[family] ?? TRADE_YEAR_STORIES[family]
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
