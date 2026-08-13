import { describe, expect, it } from 'vitest'
import type { Board, BoardLength, Difficulty, Space, SpaceEffect, SpaceId } from '../model/types'
import { ALL_ICON_NAMES } from '../model/icons'
import { BOARD_LENGTH_SCALE } from '../model/constants'
import { DIFFICULTIES } from '../rules/difficulty'
import { createBoard } from './createBoard'

const LENGTHS: readonly BoardLength[] = ['short', 'standard', 'long']

/**
 * Difficulty adds and rewrites spaces, which means it can break the board in
 * every way a length can: an orphaned tile, a lane that no longer reads as a
 * lane, a layoff with no way back. So the structural suite runs over the whole
 * grid rather than over lengths alone — nine boards, one set of rules.
 */
const SETTINGS: readonly (readonly [BoardLength, Difficulty])[] = LENGTHS.flatMap((length) =>
  DIFFICULTIES.map((difficulty) => [length, difficulty] as const),
)

function reachableFrom(board: Board, id: SpaceId): Set<SpaceId> {
  const seen = new Set<SpaceId>()
  const stack = [id]
  while (stack.length > 0) {
    const current = stack.pop()!
    if (seen.has(current)) continue
    seen.add(current)
    const space = board.spaces[current]
    if (!space) continue
    for (const next of space.next) {
      if (!seen.has(next)) stack.push(next)
    }
  }
  return seen
}

/** Reverse-graph reachability: can `id` reach the target by following `next`? */
function canReach(board: Board, from: SpaceId, target: SpaceId): boolean {
  return reachableFrom(board, from).has(target)
}

/** Every space that has something pointing at it. */
function inbound(board: Board): Map<SpaceId, SpaceId[]> {
  const map = new Map<SpaceId, SpaceId[]>()
  for (const space of Object.values(board.spaces)) {
    for (const nextId of space.next) {
      map.set(nextId, [...(map.get(nextId) ?? []), space.id])
    }
  }
  return map
}

const effectTypes = (board: Board): Set<SpaceEffect['type']> =>
  new Set(Object.values(board.spaces).map((space) => space.effect.type))

/**
 * The route one player actually walks, always taking branch `pick`. That —
 * not the total tile count — is what decides how long a session runs.
 */
function routeLength(board: Board, pick: 0 | 1): number {
  let cursor = board.spaces[board.startSpaceId] as Space
  const seen = new Set<SpaceId>()
  let travelled = 1
  while (cursor.next.length > 0 && !seen.has(cursor.id)) {
    seen.add(cursor.id)
    const nextId = cursor.next[Math.min(pick, cursor.next.length - 1)] as SpaceId
    cursor = board.spaces[nextId] as Space
    travelled += 1
  }
  return travelled
}

/**
 * The invariants below hold at *every* board length. A rule that only holds on
 * the standard board is not a rule, it is a coincidence — so the whole suite
 * runs three times.
 */
describe.each(SETTINGS)('createBoard(%s, %s)', (length, difficulty) => {
  const board = createBoard(length, difficulty)

  it('has no duplicate ids', () => {
    const ids = Object.values(board.spaces).map((s) => s.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has no duplicate layout coordinates', () => {
    const coords = Object.values(board.spaces).map((s) => `${s.layout.x},${s.layout.y}`)
    expect(new Set(coords).size).toBe(coords.length)
  })

  it('keeps every layout coordinate inside the board bounds', () => {
    for (const space of Object.values(board.spaces)) {
      expect(space.layout.x).toBeGreaterThanOrEqual(0)
      expect(space.layout.x).toBeLessThanOrEqual(board.width)
      expect(space.layout.y).toBeGreaterThanOrEqual(0)
      expect(space.layout.y).toBeLessThanOrEqual(board.height)
    }
  })

  it('points every next id at a real space', () => {
    for (const space of Object.values(board.spaces)) {
      for (const nextId of space.next) {
        expect(board.spaces[nextId], `"${space.id}" points at missing space "${nextId}"`).toBeDefined()
      }
    }
  })

  it('is fully connected: every space is reachable from startSpaceId', () => {
    const reachable = reachableFrom(board, board.startSpaceId)
    for (const id of Object.keys(board.spaces)) {
      expect(reachable.has(id), `"${id}" is not reachable from start`).toBe(true)
    }
  })

  it('leaves no orphan: every space but the start has something pointing at it', () => {
    const arrivals = inbound(board)
    for (const id of Object.keys(board.spaces)) {
      if (id === board.startSpaceId) continue
      expect(arrivals.get(id)?.length ?? 0, `"${id}" is an orphan`).toBeGreaterThan(0)
    }
  })

  it('never points anything back at the start space', () => {
    expect(inbound(board).get(board.startSpaceId)).toBeUndefined()
  })

  it('can reach retirement from every space (no dead ends but retirement)', () => {
    for (const id of Object.keys(board.spaces)) {
      if (id === board.retirementSpaceId) continue
      expect(canReach(board, id, board.retirementSpaceId), `"${id}" cannot reach retirement`).toBe(true)
    }
  })

  it('gives the retirement space an empty next and a retire effect', () => {
    const retirement = board.spaces[board.retirementSpaceId]
    expect(retirement).toBeDefined()
    expect(retirement!.kind).toBe('retirement')
    expect(retirement!.next).toEqual([])
    expect(retirement!.effect).toEqual({ type: 'retire' })
  })

  it('has exactly one terminal space, and it is retirement', () => {
    const terminals = Object.values(board.spaces).filter((s) => s.next.length === 0)
    expect(terminals.map((s) => s.id)).toEqual([board.retirementSpaceId])
  })

  it('has a start space of kind start', () => {
    expect(board.spaces[board.startSpaceId]?.kind).toBe('start')
  })

  it('reaches every milestone stop on the way to retirement', () => {
    const reachable = reachableFrom(board, board.startSpaceId)
    const milestones: readonly SpaceEffect['type'][] = ['graduate', 'chooseCareer', 'getMarried', 'buyHouse', 'retire']
    for (const type of milestones) {
      const found = Object.values(board.spaces).filter((s) => s.effect.type === type)
      expect(found.length, `no "${type}" space on the ${length} board`).toBeGreaterThan(0)
      for (const space of found) {
        expect(reachable.has(space.id), `"${space.id}" is unreachable`).toBe(true)
      }
    }
  })

  it('halts movement at every milestone that has to be resolved on the spot', () => {
    const forcedStops: readonly SpaceEffect['type'][] = ['chooseCareer', 'getMarried', 'buyHouse']
    for (const space of Object.values(board.spaces)) {
      if (forcedStops.includes(space.effect.type)) {
        expect(space.kind, `"${space.id}" should be a stop`).toBe('stop')
      }
    }
  })

  /*
   * Four, since the mid-career fork went in. The board had three decisions of
   * consequence on it and a nine-spin corridor between the first two, which is
   * where attention went. The fourth is the corridor's missing question.
   */
  it('has exactly four forks: start, mid-career, marriage, and home buying', () => {
    const forks = Object.values(board.spaces).filter((s) => s.next.length > 1)
    expect(forks).toHaveLength(4)
    expect(board.spaces[board.startSpaceId]!.next.length).toBe(2)

    const marriage = Object.values(board.spaces).find((s) => s.effect.type === 'getMarried')
    expect(marriage!.next.length).toBe(2)
    const homeBuying = Object.values(board.spaces).find((s) => s.effect.type === 'buyHouse')
    expect(homeBuying!.next.length).toBe(2)

    // The fourth one is the only one that is neither the start nor a milestone,
    // and it lives between the first two: no lane may sit in a corridor.
    const milestones = new Set([board.startSpaceId, marriage!.id, homeBuying!.id])
    const midCareer = forks.filter((fork) => !milestones.has(fork.id))
    expect(midCareer).toHaveLength(1)
    expect(canReach(board, midCareer[0]!.id, marriage!.id)).toBe(true)
  })

  it('reconverges every forks branches to a single space', () => {
    const forks = Object.values(board.spaces).filter((s) => s.next.length > 1)
    for (const fork of forks) {
      const [branchAId, branchBId] = fork.next
      const mergeA = [...reachableFrom(board, branchAId!)]
      const mergeB = new Set(reachableFrom(board, branchBId!))
      const shared = mergeA.filter((id) => mergeB.has(id))
      expect(shared.length, `fork "${fork.id}" branches never reconverge`).toBeGreaterThan(0)
    }
  })

  it('sends both start branches to a stop space offering a career choice', () => {
    for (const branchStartId of board.spaces[board.startSpaceId]!.next) {
      let cursor: SpaceId | undefined = branchStartId
      let guard = 0
      let found = false
      while (cursor && guard < 100) {
        const space: Space | undefined = board.spaces[cursor]
        expect(space).toBeDefined()
        if (space!.kind === 'stop' && space!.effect.type === 'chooseCareer') {
          found = true
          break
        }
        cursor = space!.next[0]
        guard += 1
      }
      expect(found, `branch starting at "${branchStartId}" never reaches a chooseCareer stop`).toBe(true)
    }
  })

  /*
   * Tuition has to buy something. Graduation used to be an ordinary space, so
   * a player could pay $40,000 for College Lane, spin straight past the cap and
   * gown, and arrive at the graduate job fair with no degree — which quietly
   * offers the *basic* careers, making the whole lane strictly worse than
   * going straight to work. Measured over 40 games, players who always chose
   * College Lane graduated only 20% of the time. As an unskippable stop it is
   * 100%, and the same applies to the first baby on Family Lane, without which
   * that lane delivered children 16% of the time and `CHILD_BONUS` was very
   * nearly dead content.
   */
  it('makes the milestones a lane is chosen for unskippable', () => {
    const milestones = Object.values(board.spaces).filter(
      (space) => space.effect.type === 'graduate' || space.effect.type === 'haveChildren',
    )
    expect(milestones.length).toBeGreaterThan(0)

    const graduation = milestones.filter((space) => space.effect.type === 'graduate')
    expect(graduation.length, 'the board must offer a degree somewhere').toBeGreaterThan(0)
    for (const space of graduation) {
      expect(space.kind, `"${space.title}" is what tuition pays for and must not be skippable`).toBe('stop')
    }

    const babies = milestones.filter((space) => space.effect.type === 'haveChildren')
    expect(
      babies.some((space) => space.kind === 'stop'),
      'Family Lane must deliver at least one child that cannot be spun past',
    ).toBe(true)
  })

  it('reaches the degree before the graduate job fair that rewards it', () => {
    const fair = Object.values(board.spaces).find(
      (space) => space.effect.type === 'chooseCareer' && space.effect.pool === 'graduate',
    )
    expect(fair).toBeDefined()

    // Walk back from the fair: a degree must be reachable ahead of it.
    const reaches = (fromId: SpaceId, targetId: SpaceId): boolean => {
      const seen = new Set<SpaceId>()
      const queue: SpaceId[] = [fromId]
      while (queue.length > 0) {
        const id = queue.shift()!
        if (id === targetId) return true
        if (seen.has(id)) continue
        seen.add(id)
        queue.push(...(board.spaces[id]?.next ?? []))
      }
      return false
    }

    const degree = Object.values(board.spaces).find((space) => space.effect.type === 'graduate')!
    expect(reaches(degree.id, fair!.id), 'the degree must come before the fair that rewards it').toBe(true)
  })

  it('gives every space a real title under 18 characters, a description, an icon, and a tone', () => {
    for (const space of Object.values(board.spaces)) {
      expect(space.title.length).toBeGreaterThan(0)
      expect(space.title.length).toBeLessThan(18)
      expect(space.description.length).toBeGreaterThan(10)
      expect(ALL_ICON_NAMES).toContain(space.icon)
      expect(space.tone.length).toBeGreaterThan(0)
    }
  })

  it('never asks for money without saying what it is for', () => {
    for (const space of Object.values(board.spaces)) {
      const effect = space.effect
      if ('reason' in effect) {
        expect(effect.reason.length, `"${space.id}" has an empty reason`).toBeGreaterThan(3)
      }
    }
  })

  it('produces the same board on repeated calls (pure, deterministic)', () => {
    const again = createBoard(length, difficulty)
    expect(again).toEqual(board)
  })
})

describe('createBoard defaults', () => {
  it('builds the standard board when no length is given', () => {
    expect(createBoard()).toEqual(createBoard('standard'))
  })

  it('plays on normal when no difficulty is given', () => {
    for (const length of LENGTHS) {
      expect(createBoard(length)).toEqual(createBoard(length, 'normal'))
    }
  })
})

describe('board lengths', () => {
  const boards = Object.fromEntries(LENGTHS.map((l) => [l, createBoard(l)])) as Record<BoardLength, Board>
  const size = (length: BoardLength): number => Object.keys(boards[length].spaces).length

  it('scales the tile count roughly by BOARD_LENGTH_SCALE', () => {
    const standard = size('standard')
    for (const length of LENGTHS) {
      const ratio = size(length) / standard
      const target = BOARD_LENGTH_SCALE[length]
      expect(Math.abs(ratio - target), `${length} is ${ratio.toFixed(2)}x, wanted ~${target}x`).toBeLessThan(0.1)
    }
  })

  it('scales the route a single player walks by the same ratios', () => {
    const standard = routeLength(boards.standard, 0)
    for (const length of LENGTHS) {
      const ratio = routeLength(boards[length], 0) / standard
      expect(Math.abs(ratio - BOARD_LENGTH_SCALE[length])).toBeLessThan(0.12)
    }
  })

  /*
   * Measured on the road walked rather than on the tiles drawn, and the band is
   * the one this test has always held.
   *
   * The two are the same number only on a board whose forks you can count on
   * one hand. A fork draws two roads and a player walks one, so every fork
   * added widens the gap between "tiles printed" and "tiles a session actually
   * costs" — the fourth fork put twenty-odd tiles on the board that no single
   * player will ever stand on. The thing worth pinning was never the printing
   * bill; it is the length of somebody's evening, which is what `routeLength`
   * measures and what the comment on it has said all along.
   */
  it('keeps the standard board close to a sixty-to-ninety tile session', () => {
    for (const pick of [0, 1] as const) {
      expect(routeLength(boards.standard, pick)).toBeGreaterThanOrEqual(60)
      expect(routeLength(boards.standard, pick)).toBeLessThanOrEqual(90)
    }
  })

  it('builds a strictly longer board for each step up', () => {
    expect(size('short')).toBeLessThan(size('standard'))
    expect(size('standard')).toBeLessThan(size('long'))
  })

  it('keeps the short board a subset of the standard one, and that of the long one', () => {
    const shortIds = new Set(Object.keys(boards.short.spaces))
    const standardIds = new Set(Object.keys(boards.standard.spaces))
    const longIds = new Set(Object.keys(boards.long.spaces))
    for (const id of shortIds) expect(standardIds.has(id), `${id} missing from standard`).toBe(true)
    for (const id of standardIds) expect(longIds.has(id), `${id} missing from long`).toBe(true)
  })

  it('keeps the shared spaces identical apart from where they sit', () => {
    for (const [id, space] of Object.entries(boards.short.spaces)) {
      const onStandard = boards.standard.spaces[id]!
      expect(onStandard.title).toBe(space.title)
      expect(onStandard.effect).toEqual(space.effect)
      expect(onStandard.icon).toBe(space.icon)
    }
  })
})

/**
 * What "harder" actually means on the board, pinned so it cannot quietly become
 * a hidden multiplier later. The player asked for misfortune to *happen more
 * often*, not merely to cost more, so frequency is asserted first and hardest.
 */
describe('difficulty makes the board itself unkinder', () => {
  const boardsFor = (length: BoardLength) =>
    DIFFICULTIES.map((difficulty) => createBoard(length, difficulty))

  /** Spaces that take money off the player, or take their job away. */
  const setbacks = (board: Board): Space[] =>
    Object.values(board.spaces).filter((space) => {
      const type = space.effect.type
      return type === 'payMoney' || type === 'payEach' || type === 'payPerChild' || type === 'loseCareer'
    })

  const billTotal = (board: Board): number =>
    Object.values(board.spaces).reduce(
      (sum, space) => (space.effect.type === 'payMoney' ? sum + space.effect.amount : sum),
      0,
    )

  it.each(LENGTHS)('%s: every step up puts more setbacks on the route', (length) => {
    const counts = boardsFor(length).map((board) => setbacks(board).length)
    expect(counts[1]).toBeGreaterThan(counts[0]!)
    expect(counts[2]).toBeGreaterThan(counts[1]!)
  })

  it.each(LENGTHS)('%s: every step up raises the share of tiles that bite', (length) => {
    const shares = boardsFor(length).map(
      (board) => setbacks(board).length / Object.keys(board.spaces).length,
    )
    expect(shares[1]).toBeGreaterThan(shares[0]!)
    expect(shares[2]).toBeGreaterThan(shares[1]!)
  })

  it.each(LENGTHS)('%s: every step up asks for more money in total', (length) => {
    const totals = boardsFor(length).map(billTotal)
    expect(totals[1]).toBeGreaterThan(totals[0]! * 1.5)
    expect(totals[2]).toBeGreaterThan(totals[1]! * 1.5)
  })

  it.each(LENGTHS)('%s: every step up thins what the board hands out', (length) => {
    const handouts = boardsFor(length).map((board) =>
      Object.values(board.spaces).reduce(
        (sum, space) => (space.effect.type === 'gainMoney' ? sum + space.effect.amount : sum),
        0,
      ),
    )
    expect(handouts[1]).toBeLessThan(handouts[0]!)
    expect(handouts[2]).toBeLessThan(handouts[1]!)
  })

  it.each(LENGTHS)('%s: takes paydays off the route as it climbs', (length) => {
    // Passing a payday pays; every other tile has to be landed on. So a missed
    // payroll is the only single change on the board heavy enough to move a
    // final total, and the harder settings spend a couple of them.
    const paydays = boardsFor(length).map(
      (board) => Object.values(board.spaces).filter((space) => space.kind === 'payday').length,
    )
    expect(paydays[1]).toBeLessThan(paydays[0]!)
    expect(paydays[2]).toBeLessThan(paydays[1]!)
    // Never so many that a career stops being worth having.
    expect(paydays[2]).toBeGreaterThan(paydays[0]! / 2)
  })

  it.each(LENGTHS)('%s: turns a lost payday into a tile that explains itself', (length) => {
    const [normal, , veryHard] = boardsFor(length) as [Board, Board, Board]
    const lost = Object.values(normal.spaces).filter(
      (space) => space.kind === 'payday' && veryHard.spaces[space.id]!.kind !== 'payday',
    )
    expect(lost.length).toBeGreaterThan(0)
    for (const space of lost) {
      const replacement = veryHard.spaces[space.id]!
      expect(replacement.kind).toBe('normal')
      expect(replacement.title).not.toBe('Payday')
      expect(replacement.description).not.toBe(space.description)
      expect(replacement.effect.type).toBe('payMoney')
    }
  })

  it.each(LENGTHS)('%s: never takes a pay rise away — the career stays the player own', (length) => {
    // Salary is what the player picked and grew. A harder board makes living
    // expensive; it does not reach into the payslip and cut the rate.
    const raises = boardsFor(length).map(
      (board) => Object.values(board.spaces).filter((space) => space.effect.type === 'payRaise').length,
    )
    expect(new Set(raises).size).toBe(1)
  })

  it.each(LENGTHS)('%s: keeps every easier board a subset of the harder one', (length) => {
    const [normal, hard, veryHard] = boardsFor(length) as [Board, Board, Board]
    for (const id of Object.keys(normal.spaces)) {
      expect(hard.spaces[id], `${id} vanished on hard`).toBeDefined()
    }
    for (const id of Object.keys(hard.spaces)) {
      expect(veryHard.spaces[id], `${id} vanished on very hard`).toBeDefined()
    }
  })

  it('rewrites a tile rather than charging silently behind its back', () => {
    // Move-In Day is scenery on normal and a deposit on hard. The sentence on
    // the card has to change with the effect, or the tile is lying to the table.
    const easy = createBoard('standard', 'normal').spaces['college-1']!
    const harsh = createBoard('standard', 'hard').spaces['college-1']!
    expect(easy.effect).toEqual({ type: 'none' })
    expect(harsh.effect.type).toBe('payMoney')
    expect(harsh.description).not.toBe(easy.description)
    expect(harsh.description.length).toBeGreaterThan(10)
  })

  it('adds real, readable spaces rather than invisible ones', () => {
    const normalIds = new Set(Object.keys(createBoard('standard', 'normal').spaces))
    const veryHard = createBoard('standard', 'veryHard')
    const added = Object.values(veryHard.spaces).filter((space) => !normalIds.has(space.id))

    expect(added.length).toBeGreaterThan(8)
    for (const space of added) {
      expect(space.title.length).toBeGreaterThan(0)
      expect(space.title.length).toBeLessThan(18)
      expect(space.description.length).toBeGreaterThan(20)
      expect(ALL_ICON_NAMES).toContain(space.icon)
    }
  })

  it('keeps the three lengths in proportion at every difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      const standard = Object.keys(createBoard('standard', difficulty).spaces).length
      for (const length of LENGTHS) {
        const ratio = Object.keys(createBoard(length, difficulty).spaces).length / standard
        expect(
          Math.abs(ratio - BOARD_LENGTH_SCALE[length]),
          `${length} on ${difficulty} is ${ratio.toFixed(2)}x`,
        ).toBeLessThan(0.12)
      }
    }
  })
})

/**
 * Every mechanic the game knows about has to be somewhere a player can land on
 * it, on every board they can choose. A variant that only exists on the long
 * board is a feature most sessions never see.
 */
describe('every mechanic is on the board at every length', () => {
  const REQUIRED: readonly SpaceEffect['type'][] = [
    'gainMoney', 'payMoney', 'payday', 'payRaise', 'gainLifeTiles', 'chooseCareer',
    'graduate', 'getMarried', 'haveChildren', 'buyHouse', 'collectFromEach', 'payEach',
    'spinForMoney', 'retire', 'careerChange', 'loseCareer', 'buyStock', 'stockDividend',
    'buyInsurance', 'bank', 'payPerChild', 'collectPerChild', 'swapMoneyWithLeader',
    'stealLifeTile', 'upgradeHouse',
  ]

  it.each(SETTINGS)('%s / %s covers every SpaceEffect variant', (length, difficulty) => {
    const present = effectTypes(createBoard(length, difficulty))
    for (const type of REQUIRED) {
      expect(present.has(type), `the ${length} board has no "${type}" space`).toBe(true)
    }
  })

  it.each(SETTINGS)('%s / %s carries both hazards, so insurance is worth buying', (length, difficulty) => {
    const hazards = Object.values(createBoard(length, difficulty).spaces)
      .map((s) => (s.effect.type === 'payMoney' ? s.effect.hazard : undefined))
      .filter((h): h is 'fire' | 'accident' => h !== undefined)
    expect(new Set(hazards)).toEqual(new Set(['fire', 'accident']))
  })

  it.each(SETTINGS)('%s / %s offers insurance before the first hazard can bite', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const depth = distanceFromStart(board)
    const firstOffice = Math.min(
      ...Object.values(board.spaces)
        .filter((s) => s.effect.type === 'buyInsurance')
        .map((s) => depth.get(s.id) ?? Infinity),
    )
    const firstHazard = Math.min(
      ...Object.values(board.spaces)
        .filter((s) => s.effect.type === 'payMoney' && s.effect.hazard !== undefined)
        .map((s) => depth.get(s.id) ?? Infinity),
    )
    expect(firstOffice).toBeLessThan(firstHazard)
  })

  /**
   * How often a policy is allowed to be worth nothing.
   *
   * A home policy costs $25,000 and the board used to carry two hazard-tagged
   * bills in total, one of them on a lane half the table never walks. Landed on
   * about once every three games between them, which made insurance a purchase
   * whose payoff most players simply never saw — accounting, not a moment. The
   * standard board carries fifteen of them now, ten or eleven of which sit on
   * the road any one player walks, and `gameBalance` measures what that is
   * worth in play: about two bills bounce off a policy per game.
   *
   * Counted per *road walked* rather than per board, because a hazard on a lane
   * you did not choose has never insured anything.
   */
  it.each(SETTINGS)('%s / %s puts enough hazards on one road to make a policy pay', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    // The short board is the exception, and deliberately: it has room for the
    // milestones and very little else, so its hazards are the two tier-0 ones.
    const wanted = length === 'short' ? 2 : 9

    for (const pick of [0, 1] as const) {
      let cursor = board.spaces[board.startSpaceId]!
      const walked = new Set<SpaceId>([cursor.id])
      while (cursor.next.length > 0 && !walked.has(cursor.next[Math.min(pick, cursor.next.length - 1)]!)) {
        cursor = board.spaces[cursor.next[Math.min(pick, cursor.next.length - 1)]!]!
        walked.add(cursor.id)
      }
      const hazards = [...walked]
        .map((id) => board.spaces[id]!.effect)
        .filter((effect) => effect.type === 'payMoney' && effect.hazard !== undefined)

      expect(hazards.length, `${length}/${difficulty} road ${pick}`).toBeGreaterThanOrEqual(wanted)
      // And both policies have to be worth buying, not just the home one.
      const kinds = new Set(hazards.map((effect) => (effect.type === 'payMoney' ? effect.hazard : undefined)))
      expect(kinds, `${length}/${difficulty} road ${pick}`).toEqual(new Set(['fire', 'accident']))
    }
  })
})

/** Shortest number of spaces from the start, following `next`. */
function distanceFromStart(board: Board): Map<SpaceId, number> {
  const depth = new Map<SpaceId, number>([[board.startSpaceId, 0]])
  const queue: SpaceId[] = [board.startSpaceId]
  while (queue.length > 0) {
    const id = queue.shift()!
    const here = depth.get(id)!
    for (const nextId of board.spaces[id]?.next ?? []) {
      if (depth.has(nextId)) continue
      depth.set(nextId, here + 1)
      queue.push(nextId)
    }
  }
  return depth
}

/**
 * A board decided by turn six is a board nobody watches to the end. The upsets
 * and the biggest money swings all have to live where they can still change the
 * standings — which means the last third of the route, not the first.
 */
describe('the endgame is where the game is decided', () => {
  const LATE: readonly SpaceEffect['type'][] = ['swapMoneyWithLeader', 'stealLifeTile', 'upgradeHouse']

  it.each(SETTINGS)('%s / %s keeps every upset in the last third of the route', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const depth = distanceFromStart(board)
    const deepest = Math.max(...depth.values())

    for (const space of Object.values(board.spaces)) {
      if (!LATE.includes(space.effect.type)) continue
      const progress = (depth.get(space.id) ?? 0) / deepest
      expect(progress, `"${space.id}" fires at ${(progress * 100).toFixed(0)}% of the route`).toBeGreaterThan(0.66)
    }
  })

  it.each(SETTINGS)('%s / %s puts its biggest swings late', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const depth = distanceFromStart(board)
    const deepest = Math.max(...depth.values())

    const swing = (effect: SpaceEffect): number => {
      switch (effect.type) {
        case 'spinForMoney':
          return effect.perPip * 10
        case 'payEach':
        case 'collectFromEach':
          return effect.amount * 3
        default:
          return 0
      }
    }

    const swings = Object.values(board.spaces)
      .map((space) => ({ size: swing(space.effect), progress: (depth.get(space.id) ?? 0) / deepest }))
      .filter((entry) => entry.size > 0)

    const biggest = Math.max(...swings.map((entry) => entry.size))
    for (const entry of swings) {
      if (entry.size < biggest * 0.7) continue
      expect(entry.progress).toBeGreaterThan(0.6)
    }
  })

  it.each(SETTINGS)('%s / %s pays out more often in its second half than its first', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const depth = distanceFromStart(board)
    const deepest = Math.max(...depth.values())
    // Payouts only. A review is deliberately *not* one: it is an investment in
    // every payday after it, so the board puts reviews early and the money late.
    const income = Object.values(board.spaces).filter(
      (s) => s.effect.type === 'payday' || s.effect.type === 'payRaise',
    )
    const late = income.filter((s) => (depth.get(s.id) ?? 0) / deepest > 0.5)
    expect(late.length).toBeGreaterThan(income.length - late.length)
  })

  it('has more paydays and raises than the board it replaces (which had 5 and 3)', () => {
    /*
     * Counted as raise *or* review, because the review tiles are where most of
     * the old raise tiles went. A review is a raise with something above it:
     * a spin under the bar pays the ordinary raise, and a spin over it climbs a
     * rung instead. Counting only `payRaise` would say the board lost income
     * events when what it actually did was make them worth playing for.
     */
    const board = createBoard('standard')
    const spaces = Object.values(board.spaces)
    const raises = spaces.filter((s) => s.effect.type === 'payRaise' || s.effect.type === 'promotion')
    expect(spaces.filter((s) => s.effect.type === 'payday').length).toBeGreaterThan(5)
    expect(raises.length).toBeGreaterThan(3)
  })
})

/**
 * The three cheap content ideas the board was missing, pinned so they cannot
 * quietly wash out of a future edit.
 *
 * None of them cost the engine a line: a bonus is a `payday` tile with a
 * different name on it, an obligation is `payEach` pointed at the people
 * sitting round the table, and an argument is a `LaneIdentity.summary` written
 * by somebody with an opinion. All three are what a country edition is *for*,
 * which is why they are asserted structurally here rather than left to whoever
 * reads the route file next.
 */
describe('the board rewards the career you chose, and makes you talk to people', () => {
  /*
   * A windfall paid in dollars is worth the same to the pet groomer and the
   * surgeon; a windfall paid in *paydays* is worth what the player actually
   * earns, so the career they picked keeps mattering for the rest of the game.
   * The engine has always had the mechanism — nothing says a `payday` tile has
   * to be called Payday — and the board simply never used it.
   */
  it.each(SETTINGS)('%s / %s pays at least one windfall in salary rather than in dollars', (length, difficulty) => {
    const bonuses = Object.values(createBoard(length, difficulty).spaces).filter(
      (space) => space.kind === 'payday' && space.title !== 'Payday',
    )
    expect(bonuses.length, `${length}/${difficulty} has no bonus payday`).toBeGreaterThan(0)
    for (const bonus of bonuses) {
      // It has to read as an event, not as payroll wearing a hat.
      expect(bonus.description.toLowerCase()).not.toContain('direct deposit')
      expect(bonus.effect.type).toBe('payday')
    }
  })

  /*
   * `payEach` and `collectFromEach` are the only two effects that make money
   * physically cross the table, and the board used to spend them almost
   * entirely on Risky Road — everywhere else, a cost was a solitary
   * transaction with the bank while everybody else checked their phone.
   */
  it.each(SETTINGS)('%s / %s spends its social obligations outside Risky Road', (length, difficulty) => {
    const social = Object.values(createBoard(length, difficulty).spaces).filter(
      (space) => space.effect.type === 'payEach' || space.effect.type === 'collectFromEach',
    )
    // The short board has room for the milestones and very little else, so it
    // gets one obligation off Risky Road rather than a spread of them.
    const wanted = length === 'short' ? 3 : 5
    expect(social.length, `${length}/${difficulty}`).toBeGreaterThanOrEqual(wanted)
    expect(
      social.filter((space) => !space.id.startsWith('risky-')).length,
      `${length}/${difficulty} keeps every obligation on Risky Road`,
    ).toBeGreaterThanOrEqual(length === 'short' ? 1 : 3)
  })

  /*
   * A fork nobody argues about is a coin the game asks you to flip. Every
   * summary has to be long enough to make a case and different enough from its
   * opposite number to be disagreed with.
   */
  it.each(SETTINGS)('%s / %s gives every fork two roads worth arguing about', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const forks = Object.values(board.spaces).filter((space) => space.next.length > 1)
    expect(forks.length).toBeGreaterThanOrEqual(4)

    for (const fork of forks) {
      const summaries = fork.next.map((id) => board.spaces[id]?.lane?.summary ?? '')
      expect(new Set(summaries).size, `fork "${fork.id}" argues with itself`).toBe(2)
      for (const summary of summaries) {
        expect(summary.length, `a road out of "${fork.id}" barely says anything`).toBeGreaterThan(60)
      }
    }
  })
})

/**
 * Losing your job is a good swing. Losing it with no way back is not a swing,
 * it is a seat that spends the rest of the game collecting nothing on every
 * payday — and because it depends on which lane and which board length a
 * player happened to take, it only shows up as a statistic.
 *
 * A re-hire only counts if the player cannot spin straight past it, so an
 * ordinary `careerChange` tile is no guarantee at all: movement halts on a
 * `stop`, and nothing else.
 */
describe('nobody can be laid off with no way back', () => {
  const isGuaranteedRehire = (space: Space): boolean =>
    (space.effect.type === 'careerChange' || space.effect.type === 'chooseCareer') && space.kind === 'stop'

  /**
   * Can a player standing on `id` reach retirement without ever being forced
   * to stop somewhere that hires them? The board is acyclic, so memoising on
   * the way back up terminates.
   */
  const buildEscapeCheck = (board: Board) => {
    const memo = new Map<SpaceId, boolean>()
    const escapes = (id: SpaceId): boolean => {
      const cached = memo.get(id)
      if (cached !== undefined) return cached
      const space = board.spaces[id] as Space
      let result: boolean
      if (isGuaranteedRehire(space)) result = false
      else if (space.next.length === 0) result = true
      else result = space.next.some((nextId) => escapes(nextId))
      memo.set(id, result)
      return result
    }
    return escapes
  }

  it.each(SETTINGS)('%s / %s puts a re-hire on every route from a layoff to retirement', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const escapes = buildEscapeCheck(board)

    const layoffs = Object.values(board.spaces).filter((s) => s.effect.type === 'loseCareer')
    expect(layoffs.length, `the ${length} board has no layoff to check`).toBeGreaterThan(0)

    for (const layoff of layoffs) {
      const stranded = layoff.next.filter((nextId) => escapes(nextId))
      expect(
        stranded,
        `from "${layoff.id}" a player can walk to retirement still unemployed, via ${stranded.join(', ')}`,
      ).toEqual([])
    }
  })

  it.each(SETTINGS)('%s / %s starts every career at a stop, so nobody begins unemployed', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const escapes = buildEscapeCheck(board)
    expect(escapes(board.startSpaceId)).toBe(false)
  })

  it.each(SETTINGS)('%s / %s offers a re-hire that a player cannot spin past', (length, difficulty) => {
    const rehires = Object.values(createBoard(length, difficulty).spaces).filter(isGuaranteedRehire)
    expect(rehires.length).toBeGreaterThanOrEqual(2)
  })
})

/**
 * The board is drawn by joining each space to its successors with a straight
 * line, so the *geometry* of the layout is what decides whether the route reads
 * as a path or as a cat's cradle. These are the tests that keep it readable.
 */
describe.each(SETTINGS)('createBoard(%s, %s) layout geometry', (length, difficulty) => {
  const board = createBoard(length, difficulty)

  const edges = (): { from: Space; to: Space; length: number }[] => {
    const list: { from: Space; to: Space; length: number }[] = []
    for (const from of Object.values(board.spaces)) {
      for (const nextId of from.next) {
        const to = board.spaces[nextId]
        if (!to) continue
        list.push({
          from,
          to,
          length: Math.hypot(from.layout.x - to.layout.x, from.layout.y - to.layout.y),
        })
      }
    }
    return list
  }

  /** One row-to-row drop is the longest legitimate connector on the board. */
  const MAX_EDGE = 3.2

  it('never joins two spaces with a line that crosses the board', () => {
    const tooLong = edges()
      .filter((edge) => edge.length > MAX_EDGE)
      .map((edge) => `${edge.from.id} -> ${edge.to.id} (${edge.length.toFixed(2)})`)

    expect(tooLong).toEqual([])
  })

  it('keeps neighbouring spaces close enough to read as a route', () => {
    const lengths = edges().map((edge) => edge.length)
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length

    expect(Math.min(...lengths)).toBeGreaterThan(0)
    expect(mean).toBeLessThan(1.8)
  })

  it('runs each fork as two parallel lanes bracketing the trunk', () => {
    const forks = Object.values(board.spaces).filter((s) => s.next.length > 1)
    expect(forks.length).toBeGreaterThan(0)

    for (const fork of forks) {
      const heads = fork.next.map((id) => board.spaces[id] as Space)
      const rows = heads.map((head) => head.layout.y)

      // One branch above the fork, one below, each exactly one row away.
      expect(Math.min(...rows)).toBe(fork.layout.y - 1)
      expect(Math.max(...rows)).toBe(fork.layout.y + 1)
    }
  })

  it('keeps every branch of a fork on a single row', () => {
    const forks = Object.values(board.spaces).filter((s) => s.next.length > 1)

    for (const fork of forks) {
      for (const headId of fork.next) {
        const rows = new Set<number>()
        let cursor: Space | undefined = board.spaces[headId]
        // Walk the branch until it rejoins the trunk (its successor has
        // more than one predecessor, which is where the two lanes meet).
        let guard = 0
        while (cursor && cursor.next.length === 1 && guard < 40) {
          rows.add(cursor.layout.y)
          const nextId = cursor.next[0] as SpaceId
          const next = board.spaces[nextId] as Space
          if (next.layout.y === fork.layout.y) break
          cursor = next
          guard += 1
        }
        expect(rows.size).toBe(1)
      }
    }
  })

  it('rejoins each fork ahead of both its branches, never back at the fork', () => {
    const forks = Object.values(board.spaces).filter((s) => s.next.length > 1)

    for (const fork of forks) {
      // Find the merge space: walk one branch to the first space back on the
      // trunk row.
      let cursor = board.spaces[fork.next[0] as SpaceId] as Space
      let guard = 0
      while (cursor.layout.y !== fork.layout.y && guard < 40) {
        cursor = board.spaces[cursor.next[0] as SpaceId] as Space
        guard += 1
      }

      const travelled = Math.abs(cursor.layout.x - fork.layout.x)
      expect(travelled).toBeGreaterThan(1)
    }
  })

  it('never lets two branches of the same fork share a row', () => {
    const forks = Object.values(board.spaces).filter((s) => s.next.length > 1)
    for (const fork of forks) {
      const [headA, headB] = fork.next.map((id) => board.spaces[id] as Space)
      expect(headA!.layout.y).not.toBe(headB!.layout.y)
    }
  })
})

describe('a fork names the road, not the first tile on it', () => {
  /*
   * The trap this pins: a lane's first tile is not fixed. Tier thinning
   * legitimately removes it — the college lane opens on `college-1` at
   * standard and on the tuition bill at short — so an identity written onto a
   * particular id would silently stop appearing on the shorter boards, and the
   * fork would go back to offering "Move-In Day" instead of "College Lane".
   */
  it.each(SETTINGS)('%s / %s names every lane a fork can lead into', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    const forks = Object.values(board.spaces).filter((space) => space.next.length > 1)
    expect(forks.length).toBeGreaterThan(0)

    for (const fork of forks) {
      for (const targetId of fork.next) {
        const target = board.spaces[targetId]
        expect(target, `${fork.id} points at a missing space`).toBeDefined()
        expect(target!.lane?.name, `lane head "${targetId}" behind fork "${fork.id}" is unnamed`).toBeTruthy()
        expect(target!.lane?.summary, `lane "${targetId}" has no summary`).toBeTruthy()
      }
    }
  })

  it.each(SETTINGS)('%s / %s gives the two roads out of a fork different names', (length, difficulty) => {
    const board = createBoard(length, difficulty)
    for (const fork of Object.values(board.spaces).filter((s) => s.next.length > 1)) {
      const names = fork.next.map((id) => board.spaces[id]?.lane?.name)
      expect(new Set(names).size, `fork "${fork.id}" offers the same name twice`).toBe(names.length)
    }
  })

  it('never labels a space that does not begin a lane', () => {
    const board = createBoard('standard')
    const laneHeads = new Set(
      Object.values(board.spaces).flatMap((s) => (s.next.length > 1 ? [...s.next] : [])),
    )
    for (const space of Object.values(board.spaces)) {
      if (space.lane) expect(laneHeads.has(space.id), `"${space.id}" is labelled but no fork leads to it`).toBe(true)
    }
  })
})
