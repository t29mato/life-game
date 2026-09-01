import type { RouteDefinition, RouteSegment, SpaceContent } from '@domain/board/route'
import { EDITION_USA } from '@domain/edition/usa'

/**
 * The USA route as the other four countries still mirror it.
 *
 * Every edition after the first was written as a measured skeleton of the USA
 * board — segment for segment, tile for tile, at its own currency's scale —
 * and four `edition.test.ts` suites hold that promise by comparing against
 * `EDITION_USA.route` directly. That comparison is the right one and it should
 * stay: the whole argument for shipping five countries off one skeleton is
 * that a balance change measured on one board is a balance change on all five.
 *
 * The grad school is the one thing it cannot express yet. It is rolling out a
 * country at a time — USA first, deliberately, so that the board's shape and
 * the fork's own balance are measured once rather than five times — which
 * leaves a window where "mirrors the USA route" has to mean "mirrors the USA
 * route as it was the day before the doctorate landed". This is that route.
 *
 * It is reconstructed rather than copied, and reconstructed *narrowly*: the
 * grad-school fork is folded back into the run behind it, restoring exactly
 * the trunk the four other editions were written against — the probation
 * review as the first tile of Main Street, and no branches hanging off it.
 * Nothing else is touched, so an edition that drifts from the USA board in any
 * other way still fails, loudly, in the suite that has always caught it.
 *
 * The trade year is the second thing, and it is rolling out the same way and
 * for the same reason — see `TRADE_YEAR_TILES` below.
 *
 * **This file is meant to be deleted.** When the last of the four has its own
 * grad school and its own trade year, `USA_SKELETON` is `EDITION_USA.route`
 * again and every import of it should go back to naming the real thing. Until
 * then the folds below are the honest statement of how far behind the other
 * boards are: exactly one fork and three tiles.
 */

/** The junction the doctorate hangs off — a plain trunk tile before it did. */
const GRAD_SCHOOL_JUNCTION = 'main-gifts'

/**
 * The two USA tiles a `tradeYear` took over, as the four other boards still
 * carry them.
 *
 * Same discipline as the grad-school fold: USA first, so the tile's shape and
 * its effect on the board's spread are measured once rather than five times.
 * Only the *mechanical* fields are restored, because those are the only ones
 * the parity suites read — the four editions have always written their own
 * words, and a copy edit that drifted would still fail the test that catches
 * it. Both entries are the tile exactly as it stood the day before the trade
 * year landed: two Fast Track re-draws — one measured at three firings in 360
 * player-lives, one Very Hard's own — and a scenery tile at the end of the
 * sunset strip.
 */
const TRADE_YEAR_TILES: Readonly<Record<string, SpaceContent>> = {
  'fast-headhunted': {
    id: 'fast-headhunted',
    kind: 'normal',
    title: 'Headhunted',
    description: 'A recruiter calls your cell phone during a meeting with two offers and no patience.',
    effect: { type: 'careerChange', reason: 'Headhunted for something new' },
    tone: 'orange',
    icon: 'space:headhunted',
  },
  'fast-restructure': {
    id: 'fast-restructure',
    kind: 'normal',
    title: 'Restructure',
    description: 'The company reorganizes overnight, and your name turns up in a different job entirely.',
    effect: { type: 'careerChange', reason: 'Reorganized into a new role', compulsory: true },
    tone: 'orange',
    icon: 'space:career-fair-return',
    appearsFrom: 'veryHard',
  },
  'sunset-3': {
    id: 'sunset-3',
    kind: 'normal',
    title: 'Sunset Ahead',
    description: 'The finish line is close enough to see the glow.',
    effect: { type: 'none' },
    tone: 'slate',
    icon: 'space:sunset-ahead',
  },
}

/** Puts a tile back the way the other four boards still have it, if it is one. */
function beforeTheTradeYear(space: SpaceContent): SpaceContent {
  return TRADE_YEAR_TILES[space.id] ?? space
}

function foldTradeYearsBack(route: RouteDefinition): RouteDefinition {
  const lane = <T extends { readonly spaces: readonly SpaceContent[] }>(source: T): T => ({
    ...source,
    spaces: source.spaces.map(beforeTheTradeYear),
  })
  return {
    ...route,
    segments: route.segments.map((segment) =>
      segment.kind === 'run'
        ? { ...segment, lane: lane(segment.lane) }
        : {
            ...segment,
            at: beforeTheTradeYear(segment.at),
            branches: [lane(segment.branches[0]), lane(segment.branches[1])] as const,
          },
    ),
    terminal: beforeTheTradeYear(route.terminal),
  }
}

function foldGradSchoolBack(route: RouteDefinition): RouteDefinition {
  const segments: RouteSegment[] = []

  for (let index = 0; index < route.segments.length; index += 1) {
    const segment = route.segments[index]!
    if (!(segment.kind === 'fork' && segment.at.id === GRAD_SCHOOL_JUNCTION)) {
      segments.push(segment)
      continue
    }

    /*
     * The junction survives; its two roads do not, and the trunk it split has
     * to be sewn back together. Making it a fork cut one run of Main Street
     * into two — the review and the audit in front of it, the layoff and the
     * hall of booths behind — and moved the junction tile itself from the end
     * of that run to the middle. Folding it back means joining both halves and
     * putting the junction where it used to be, which is last.
     */
    const before = segments[segments.length - 1]
    const after = route.segments[index + 1]
    if (!before || before.kind !== 'run' || !after || after.kind !== 'run') {
      throw new Error(
        `editionParity: the "${GRAD_SCHOOL_JUNCTION}" fork should sit between two trunk runs to fold back into`,
      )
    }
    const spaces: readonly SpaceContent[] = [...before.lane.spaces, ...after.lane.spaces, segment.at]
    segments[segments.length - 1] = { kind: 'run', lane: { ...before.lane, spaces } }
    index += 1
  }

  return { ...route, segments }
}

export const USA_SKELETON: RouteDefinition = foldTradeYearsBack(foldGradSchoolBack(EDITION_USA.route))
