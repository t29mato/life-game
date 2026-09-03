import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  Board as BoardModel,
  Player,
  Space,
  SpaceEffect,
} from '@domain/model/types'
import { createBoard } from '@domain/board/createBoard'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { Board, type BoardProps } from './Board'
import { createProjection, slabMetrics, spaceAccent } from './boardLayout'
import {
  cameraTransform,
  focusShot,
  restShot,
  wideShot,
  FOLLOW_SLACK,
  RESOLVE_ZOOM,
  USER_ZOOM_MAX,
  USER_ZOOM_STEP,
} from './camera'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

function space(overrides: Partial<Space> & { id: string; x: number; y: number }): Space {
  return {
    id: overrides.id,
    kind: overrides.kind ?? 'normal',
    title: overrides.title ?? overrides.id,
    description: overrides.description ?? 'A space.',
    effect: overrides.effect ?? { type: 'none' },
    next: overrides.next ?? [],
    layout: { x: overrides.x, y: overrides.y },
    tone: overrides.tone ?? 'blue',
    icon: overrides.icon ?? 'space:payday',
  }
}

function makeBoard(lastEffect: SpaceEffect = { type: 'none' }): BoardModel {
  const spaces = [
    space({ id: 'start', kind: 'start', x: 100, y: 100, next: ['b'] }),
    space({ id: 'b', x: 220, y: 100, next: ['c'] }),
    space({ id: 'c', title: 'Wedding', x: 340, y: 100, next: [], effect: lastEffect }),
  ]
  const record: Record<string, Space> = {}
  for (const s of spaces) record[s.id] = s
  return { spaces: record, startSpaceId: 'start', retirementSpaceId: 'c', width: 500, height: 400 }
}

/**
 * A two-lane fork: one road up, one down, rejoining past both — the exact
 * shape the opening fork's own roll picks between.
 */
function makeForkBoard(): BoardModel {
  const spaces = [
    space({ id: 'fork', x: 100, y: 200, next: ['up1', 'down1'] }),
    space({ id: 'up1', x: 220, y: 100, next: ['up2'] }),
    space({ id: 'up2', x: 340, y: 100, next: ['join'] }),
    space({ id: 'down1', x: 220, y: 300, next: ['down2'] }),
    space({ id: 'down2', x: 340, y: 300, next: ['join'] }),
    space({ id: 'join', x: 460, y: 200, next: [] }),
  ]
  const record: Record<string, Space> = {}
  for (const s of spaces) record[s.id] = s
  return { spaces: record, startSpaceId: 'fork', retirementSpaceId: 'join', width: 600, height: 400 }
}

function makePlayer(overrides: Partial<Player>): Player {
  return {
    id: 'p1',
    name: 'Alice',
    color: 'blue',
    spaceId: 'start',
    money: 10000,
    loans: 0,
    career: null,
    hasDegree: false,
    hasDoctorate: false,
    isMarried: false,
    children: 0,
    house: null,
    lifeTiles: [],
    stocks: [],
    insurance: [],
    isCpu: false,
    isRetired: false,
    retirementRank: null,
    ...overrides,
  }
}

function renderBoard(props: Partial<BoardProps> = {}) {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <Board
        board={props.board ?? makeBoard()}
        players={props.players ?? [makePlayer({})]}
        currentPlayerIndex={props.currentPlayerIndex ?? 0}
        phase={props.phase ?? 'awaitingSpin'}
        movementPath={props.movementPath ?? []}
        pendingHops={props.pendingHops ?? 0}
        onMovementComplete={props.onMovementComplete ?? (() => {})}
        {...(props.onSpacesLeftChange === undefined
          ? {}
          : { onSpacesLeftChange: props.onSpacesLeftChange })}
        {...(props.introFlythrough === undefined
          ? {}
          : { introFlythrough: props.introFlythrough })}
        {...(props.chosenExitId === undefined ? {} : { chosenExitId: props.chosenExitId })}
      />
    </AudioProvider>,
  )
}

describe('Board', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a tile for every space with its title as a tooltip', () => {
    mockReducedMotion(true)
    renderBoard()

    expect(screen.getByRole('img', { name: 'Game board' })).toBeInTheDocument()
    expect(document.querySelectorAll('title')).toHaveLength(3)
  })

  it('renders one car per player', () => {
    mockReducedMotion(true)
    const { container } = renderBoard({
      players: [makePlayer({ id: 'p1' }), makePlayer({ id: 'p2', color: 'red' })],
    })

    expect(container.querySelectorAll('[data-testid="pawn"]')).toHaveLength(2)
  })

  /**
   * The one callback the whole turn loop hangs off. If it stops firing — or
   * fires twice — the game either freezes or skips a turn, so it is pinned from
   * several directions.
   */
  it('animates the active car through the movement path and calls onMovementComplete', async () => {
    mockReducedMotion(true)
    const onMovementComplete = vi.fn()
    renderBoard({
      players: [makePlayer({ id: 'p1', spaceId: 'start' })],
      phase: 'moving',
      movementPath: ['b', 'c'],
      onMovementComplete,
    })

    await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
  })

  it('calls onMovementComplete exactly once even when the board re-renders mid-move', async () => {
    mockReducedMotion(true)
    const onMovementComplete = vi.fn()
    const props = {
      players: [makePlayer({ id: 'p1', spaceId: 'start' })],
      phase: 'moving' as const,
      movementPath: ['b', 'c'],
      onMovementComplete,
    }
    const { rerender } = renderBoard(props)

    rerender(
      <AudioProvider audio={createFakeAudioPort()}>
        <Board
          board={makeBoard()}
          players={props.players}
          currentPlayerIndex={0}
          phase="moving"
          movementPath={props.movementPath}
          onMovementComplete={onMovementComplete}
        />
      </AudioProvider>,
    )

    await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
    expect(onMovementComplete).toHaveBeenCalledTimes(1)
  })

  /**
   * The opening sweep is a camera move and nothing more. It may never hold the
   * first turn up, and under reduced motion it must not exist at all.
   */
  it('still completes a move while the opening fly-through is running', async () => {
    mockReducedMotion(false)
    const onMovementComplete = vi.fn()
    renderBoard({
      introFlythrough: true,
      players: [makePlayer({ id: 'p1', spaceId: 'start' })],
      phase: 'moving',
      movementPath: ['b', 'c'],
      onMovementComplete,
    })

    await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1), { timeout: 5000 })
  })

  it('completes a move under reduced motion with the fly-through requested', async () => {
    mockReducedMotion(true)
    const onMovementComplete = vi.fn()
    renderBoard({
      introFlythrough: true,
      players: [makePlayer({ id: 'p1', spaceId: 'start' })],
      phase: 'moving',
      movementPath: ['b', 'c'],
      onMovementComplete,
    })

    await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
  })

  describe('the camera', () => {
    const model = makeBoard()
    const projection = createProjection(model)
    // With `FOLLOW_SLACK`, exactly as the board frames it: `start` is a
    // corner tile, and the whole point of the slack is that a car parked on
    // one is still held near the middle of the screen rather than pinned
    // against its edge by a clamp flush to the card (issue #25).
    const resting = cameraTransform(
      projection,
      focusShot(
        projection,
        projection.project(model.spaces['start']?.layout ?? { x: 0, y: 0 }),
        RESOLVE_ZOOM,
        undefined,
        FOLLOW_SLACK,
      ),
    )
    const written = (t: { x: number; y: number; scale: number }): string =>
      `translate(${t.x} ${t.y}) scale(${t.scale})`

    /**
     * Reduced motion removes the travel, never the destination: the camera is
     * already on its mark by the time the first frame is painted rather than
     * easing there over the next half second.
     */
    it('cuts straight to its mark under reduced motion', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ board: model, phase: 'resolved' })

      expect(getByTestId('board-camera')).toHaveAttribute('transform', written(resting))
    })

    it('eases there instead when motion is welcome', () => {
      mockReducedMotion(false)
      const { getByTestId } = renderBoard({ board: model, phase: 'resolved' })

      // The lone default player parks on `start`, lifted onto its tile's own
      // face same as `pointOf` computes for the pawn itself — folded into
      // the wide shot the same way Board.tsx's own mount does.
      const startSpace = model.spaces['start']!
      const startDepth = slabMetrics(projection, spaceAccent(startSpace)).depth
      const playerPoint = projection.lift(projection.project(startSpace.layout), startDepth)

      // Still framing the whole board on the first frame: the move is animated.
      expect(getByTestId('board-camera')).toHaveAttribute(
        'transform',
        written(cameraTransform(projection, wideShot(projection, model, [playerPoint]))),
      )
    })

    /**
     * The reported bug: the board rested on a wide shot of the whole map
     * between spins, which at panel size makes every tile too small to read.
     * `awaitingSpin` is that resting moment, and it now settles zoomed on the
     * active player's own corner of the board instead.
     */
    it('rests zoomed on the active player when a turn ends, not on the whole board', () => {
      mockReducedMotion(true)
      const start = model.spaces['start'] as Space
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })

      expect(getByTestId('board-camera')).toHaveAttribute(
        'transform',
        written(cameraTransform(projection, restShot(model, projection, start))),
      )
    })

    /**
     * Reduced motion strips the travel of a handoff pan, never its
     * destination: the camera must land on the *new* player's own rest shot
     * — not stay on the previous player's, and not fall back to the wide
     * shot the pre-pan camera used to route through.
     */
    it('still lands on the new player’s own rest shot under reduced motion when a different player is handed the table', () => {
      mockReducedMotion(true)
      const b = model.spaces['b'] as Space
      const { getByTestId, rerender } = renderBoard({
        board: model,
        phase: 'awaitingSpin',
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        currentPlayerIndex: 0,
      })

      rerender(
        <AudioProvider audio={createFakeAudioPort()}>
          <Board
            board={model}
            players={[
              makePlayer({ id: 'p1', spaceId: 'start' }),
              makePlayer({ id: 'p2', name: 'Bo', color: 'red', spaceId: 'b' }),
            ]}
            currentPlayerIndex={1}
            phase="awaitingSpin"
            movementPath={[]}
            onMovementComplete={() => {}}
          />
        </AudioProvider>,
      )

      expect(getByTestId('board-camera')).toHaveAttribute(
        'transform',
        written(cameraTransform(projection, restShot(model, projection, b))),
      )
    })

    /**
     * The reported complaint, pinned: between two turns the camera used to
     * fall back to a wide shot of the whole map before finding the next
     * player. A handoff now pans straight from the old player's frame to the
     * new player's rest shot. The old sequence's establishing leg always
     * landed *exactly* on the wide transform, so recording every frame the
     * camera writes and asserting that exact value never appears is what
     * tells the two behaviours apart without racing the animation.
     */
    it('pans a turn handoff straight to the next player, never back through the wide shot', async () => {
      mockReducedMotion(false)
      const start = model.spaces['start'] as Space
      const b = model.spaces['b'] as Space
      const { getByTestId, rerender } = renderBoard({
        board: model,
        phase: 'awaitingSpin',
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        currentPlayerIndex: 0,
      })
      const cam = getByTestId('board-camera')
      // Let the first settle finish on p1's own rest shot before recording.
      await waitFor(
        () =>
          expect(cam).toHaveAttribute(
            'transform',
            written(cameraTransform(projection, restShot(model, projection, start))),
          ),
        { timeout: 4000 },
      )

      const frames: string[] = []
      const write = cam.setAttribute.bind(cam)
      const spy = vi.spyOn(cam, 'setAttribute').mockImplementation((name, value) => {
        if (name === 'transform') frames.push(value)
        write(name, value)
      })

      rerender(
        <AudioProvider audio={createFakeAudioPort()}>
          <Board
            board={model}
            players={[
              makePlayer({ id: 'p1', spaceId: 'start' }),
              makePlayer({ id: 'p2', name: 'Bo', color: 'red', spaceId: 'b' }),
            ]}
            currentPlayerIndex={1}
            phase="awaitingSpin"
            movementPath={[]}
            onMovementComplete={() => {}}
          />
        </AudioProvider>,
      )

      await waitFor(
        () =>
          expect(cam).toHaveAttribute(
            'transform',
            written(cameraTransform(projection, restShot(model, projection, b))),
          ),
        { timeout: 4000 },
      )

      // The exact frame the old establishing leg would have landed on —
      // built with both cars' own drawn points folded in, the way the rest
      // effect hands them to `wideShot`.
      const drawnPoint = (s: Space) =>
        projection.lift(projection.project(s.layout), slabMetrics(projection, spaceAccent(s)).depth)
      expect(frames).not.toContain(
        written(cameraTransform(projection, wideShot(projection, model, [drawnPoint(start), drawnPoint(b)]))),
      )
      spy.mockRestore()
    })

    /**
     * When motion is welcome, a turn handoff pans the camera from the old
     * player to the new one. That pan must never hold up an actual spin: if
     * the player acts before it finishes, movement takes over immediately
     * and still completes, exactly once. This is the same race the opening
     * fly-through already has to survive, exercised on the handoff camera
     * instead.
     */
    it('still completes a move started while the turn-handoff pan is running', async () => {
      mockReducedMotion(false)
      const onMovementComplete = vi.fn()
      const { rerender } = renderBoard({
        board: model,
        phase: 'awaitingSpin',
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        currentPlayerIndex: 0,
        onMovementComplete,
      })

      // A different player is handed the table (starts the handoff pan),
      // and immediately spins before it can finish.
      rerender(
        <AudioProvider audio={createFakeAudioPort()}>
          <Board
            board={model}
            players={[
              makePlayer({ id: 'p1', spaceId: 'start' }),
              makePlayer({ id: 'p2', name: 'Bo', color: 'red', spaceId: 'b' }),
            ]}
            currentPlayerIndex={1}
            phase="moving"
            movementPath={['c']}
            onMovementComplete={onMovementComplete}
          />
        </AudioProvider>,
      )

      await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
    })
  })

  /*
   * A move is walked one leg at a time now — see `nextMovementLeg` — so the
   * board is handed the road as far as the next tile that owes a card, then
   * handed the rest once that card has been read. Two things have to survive
   * being cut in half: the countdown, which counts *spaces* and not hops of
   * the current leg, and the car, which must stay parked where the leg left
   * it for as long as the card is up.
   */
  describe('a move cut short at a tile that owes a card', () => {
    it('counts the spaces still to travel, including the ones held back', async () => {
      mockReducedMotion(true)
      const onSpacesLeftChange = vi.fn()
      renderBoard({
        phase: 'moving',
        players: [makePlayer({ id: 'p1', spaceId: 'b' })],
        movementPath: ['b'],
        pendingHops: 2,
        onSpacesLeftChange,
      })

      // Three spaces owed: this leg's one hop plus the two still held back.
      await waitFor(() => expect(onSpacesLeftChange).toHaveBeenCalledWith(2))
      expect(onSpacesLeftChange.mock.calls.map(([n]) => n)).toEqual([3, 2])
    })

    it('keeps counting down through the pause rather than restarting', async () => {
      mockReducedMotion(true)
      const onSpacesLeftChange = vi.fn()
      const { rerender } = renderBoard({
        phase: 'moving',
        players: [makePlayer({ id: 'p1', spaceId: 'c' })],
        movementPath: ['b'],
        pendingHops: 1,
        onSpacesLeftChange,
      })
      await waitFor(() => expect(onSpacesLeftChange).toHaveBeenCalledWith(1))

      const board = makeBoard()
      const renderWith = (phase: BoardProps['phase'], path: string[], pending: number) =>
        rerender(
          <AudioProvider audio={createFakeAudioPort()}>
            <Board
              board={board}
              players={[makePlayer({ id: 'p1', spaceId: 'c' })]}
              currentPlayerIndex={0}
              phase={phase}
              movementPath={path}
              pendingHops={pending}
              onMovementComplete={() => {}}
              onSpacesLeftChange={onSpacesLeftChange}
            />
          </AudioProvider>,
        )

      // The card goes up: nothing hops, and nothing is re-counted.
      renderWith('passingEvent', [], 1)
      // Dismissed: the last leg runs and the count reaches nought.
      renderWith('moving', ['c'], 0)

      await waitFor(() => expect(onSpacesLeftChange).toHaveBeenCalledWith(0))
      expect(onSpacesLeftChange.mock.calls.map(([n]) => n)).toEqual([2, 1, 1, 0])
    })

    it('leaves the car parked on the tile whose card is up, not on its destination', async () => {
      mockReducedMotion(true)
      const carPosition = (car: Element): { x: number; y: number } => {
        const body = car.querySelector(':scope > g')
        const style = body?.getAttribute('style') ?? ''
        return {
          x: Number(/translateX\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
          y: Number(/translateY\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
        }
      }

      const { container, rerender } = renderBoard({
        phase: 'awaitingSpin',
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        movementPath: [],
      })
      const parked = carPosition(container.querySelector('[data-testid="pawn"]') as Element)

      // The store already knows the destination is 'c' — a move commits
      // atomically — but the car has only hopped as far as 'b', where a card
      // is now up. Its resting spot must not jump on ahead of it.
      rerender(
        <AudioProvider audio={createFakeAudioPort()}>
          <Board
            board={makeBoard()}
            players={[makePlayer({ id: 'p1', spaceId: 'c' })]}
            currentPlayerIndex={0}
            phase="passingEvent"
            movementPath={[]}
            onMovementComplete={() => {}}
          />
        </AudioProvider>,
      )
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 60))
      })

      expect(carPosition(container.querySelector('[data-testid="pawn"]') as Element)).toEqual(parked)
    })
  })

  it('does not animate when movementPath is empty', () => {
    mockReducedMotion(true)
    const onMovementComplete = vi.fn()
    renderBoard({ onMovementComplete })

    expect(onMovementComplete).not.toHaveBeenCalled()
  })

  it('survives a movement path naming a space that is not on the board', async () => {
    mockReducedMotion(true)
    const onMovementComplete = vi.fn()
    renderBoard({ phase: 'moving', movementPath: ['ghost'], onMovementComplete })

    await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
  })

  /**
   * The reported bug: the instant Spin is pressed the car was already sitting
   * on its destination tile, and only afterwards did the hop-by-hop movement
   * play. `spin` (application layer) commits a move atomically — `player.spaceId`
   * already holds the destination the moment `phase` turns `moving` — while
   * `App` withholds `movementPath` from this component until the wheel has
   * visibly stopped spinning, roughly 1.5s later. In that gap the board must
   * not let the mover's own car jump ahead of its still-unanimated move.
   *
   * `Pawn` writes its resting position as a plain inline `transform`, set
   * directly by framer-motion rather than by any layout jsdom would have to
   * perform, so the actual point this component chose can be read straight
   * back off the DOM without a browser — see the same technique pinning the
   * fan-out below.
   */
  it('keeps the moving pawn on its starting tile until movementPath actually animates it', async () => {
    mockReducedMotion(true)
    const carPosition = (car: Element): { x: number; y: number } => {
      const body = car.querySelector(':scope > g')
      const style = body?.getAttribute('style') ?? ''
      return {
        x: Number(/translateX\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
        y: Number(/translateY\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
      }
    }

    const { container, rerender } = renderBoard({
      phase: 'awaitingSpin',
      players: [makePlayer({ id: 'p1', spaceId: 'start' })],
      movementPath: [],
    })
    const before = carPosition(container.querySelector('[data-testid="pawn"]') as Element)

    // The spin has already landed in the store — spaceId reads the
    // destination, 'c' — but the wheel hasn't visibly settled yet, so App is
    // still withholding movementPath and passing an empty array.
    rerender(
      <AudioProvider audio={createFakeAudioPort()}>
        <Board
          board={makeBoard()}
          players={[makePlayer({ id: 'p1', spaceId: 'c' })]}
          currentPlayerIndex={0}
          phase="moving"
          movementPath={[]}
          onMovementComplete={() => {}}
        />
      </AudioProvider>,
    )

    // A buggy settle would be triggered synchronously by the prop change
    // above, but framer-motion only flushes a settled motion value to the
    // DOM on its own animation frame, not inside React's commit — so this
    // gives that frame a chance to land before reading the style back. A
    // correct board never even starts a settle here (its restPosition prop
    // does not change), so this wait costs nothing when the fix holds.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    const during = carPosition(container.querySelector('[data-testid="pawn"]') as Element)
    expect(during).toEqual(before)
  })

  /**
   * The board fills the room it is given rather than fitting itself inside
   * it — the owner's own words were "bigger is more fun," so a cell whose
   * shape does not match the map's own is one the map now crops into
   * instead of leaving bare table around itself for.
   *
   * jsdom performs no layout, so asserting computed pixel sizes here would
   * pass vacuously whatever the CSS said. What is asserted instead is the
   * one thing this component actually controls and the fix depends on: that
   * the drawing is set to cover its box rather than to fit inside it.
   * Whether the CSS then hands it a box worth covering is a question for a
   * browser, not for jsdom.
   */
  describe('filling the space it is given', () => {
    /*
     * A board is a column of rows that gets longer as the route grows (see
     * COLUMN_MAX in createBoard.ts), so nothing below may assume an
     * orientation: today's route comes out landscape, and a handful of tiles
     * added to the trunk turns it portrait without touching this file.
     */

    /**
     * `slice` fills the box by cropping the drawing to cover it; `meet`
     * would scale it down to fit inside instead, the very letterboxing
     * being fixed. Nothing may quietly swap one for the other.
     */
    it('scales the drawing to cover its box rather than fitting inside it', () => {
      mockReducedMotion(true)
      renderBoard({ board: createBoard() })

      expect(screen.getByRole('img', { name: 'Game board' })).toHaveAttribute(
        'preserveAspectRatio',
        expect.stringContaining('slice') as unknown as string,
      )
    })

    it('draws the whole projection, never a trimmed viewBox', () => {
      mockReducedMotion(true)
      const model = createBoard()
      const projection = createProjection(model)
      renderBoard({ board: model })

      expect(screen.getByRole('img', { name: 'Game board' })).toHaveAttribute(
        'viewBox',
        `0 0 ${projection.viewWidth} ${projection.viewHeight}`,
      )
    })
  })

  describe('households on the board', () => {
    /**
     * The drawing is a single image to assistive technology, so who is riding
     * with whom has to be readable in words as well as drawn on the cars.
     */
    it('states each car’s passengers and where it stands', () => {
      mockReducedMotion(true)
      renderBoard({
        players: [
          makePlayer({ id: 'p1', name: 'Alice', isMarried: true, children: 2, spaceId: 'b' }),
          makePlayer({ id: 'p2', name: 'Bo', color: 'red', spaceId: 'c' }),
        ],
      })

      expect(
        screen.getByText('Alice, driving with a partner alongside and 2 children, on b'),
      ).toBeInTheDocument()
      expect(screen.getByText('Bo, driving alone, on Wedding')).toBeInTheDocument()
    })

    it('puts the passengers on the cars themselves too', () => {
      mockReducedMotion(true)
      renderBoard({
        players: [makePlayer({ id: 'p1', name: 'Alice', isMarried: true, children: 1 })],
      })

      expect(
        screen.getByLabelText('Alice, driving with a partner alongside and 1 child'),
      ).toBeInTheDocument()
    })
  })

  describe('fortunes on the board', () => {
    /**
     * A car's bodywork is earned from its player's live net worth, banded
     * against the (default USA) edition's own economy — see `wealthTier.ts`.
     * Recomputed on plain re-render, so a promotion or a bad month changes
     * the car the moment the state does, with no menu in between.
     */
    it('dresses each car for its own net worth: debt battered, a fortune grand', () => {
      mockReducedMotion(true)
      const { container } = renderBoard({
        players: [
          makePlayer({ id: 'p1', name: 'Alice', money: -20_000 }),
          makePlayer({ id: 'p2', name: 'Bo', color: 'red', money: 10_000 }),
          makePlayer({ id: 'p3', name: 'Cass', color: 'green', money: 300_000 }),
        ],
      })

      const tierOf = (name: string): string | null =>
        [...container.querySelectorAll('[data-testid="pawn"]')]
          .find((car) => car.getAttribute('aria-label')?.startsWith(name))
          ?.getAttribute('data-tier') ?? null

      expect(tierOf('Alice')).toBe('1')
      expect(tierOf('Bo')).toBe('2')
      expect(tierOf('Cass')).toBe('4')
    })
  })

  /*
   * The fork roll's answer, on the board itself: the dock naming the chosen
   * road in words was not enough — a player glancing at the map saw two
   * branches and no sign of which one the roll had just picked. Once the die
   * has landed, the chosen road's whole ribbon lights up and the road not
   * taken falls into shade, tiles included, and the light stays on while the
   * distance roll and the drive it buys play out.
   */
  describe('the chosen fork road', () => {
    it('lights the chosen road and shades the road not taken once the fork roll has landed', () => {
      mockReducedMotion(true)
      const model = makeForkBoard()
      const { container } = renderBoard({
        board: model,
        players: [makePlayer({ id: 'p1', spaceId: 'fork' })],
        phase: 'awaitingDistanceSpin',
        chosenExitId: 'up1',
      })

      expect(container.querySelectorAll('[data-testid="road-taken"]')).toHaveLength(1)
      expect(container.querySelectorAll('[data-testid="road-not-taken"]')).toHaveLength(1)
      // Both tiles of the rejected lane dim with their road; the chosen
      // lane's and the junctions' stay bright.
      const dimmed = [...container.querySelectorAll('[data-testid="tile-not-taken"]')].map((shade) =>
        shade.closest('[data-space]')?.getAttribute('data-space'),
      )
      expect(dimmed.sort()).toEqual(['down1', 'down2'])
    })

    it('shows nothing while no fork choice is live', () => {
      mockReducedMotion(true)
      const { container } = renderBoard({
        board: makeForkBoard(),
        players: [makePlayer({ id: 'p1', spaceId: 'fork' })],
        phase: 'awaitingSpin',
      })

      expect(container.querySelector('[data-testid="road-taken"]')).toBeNull()
      expect(container.querySelector('[data-testid="tile-not-taken"]')).toBeNull()
    })

    /**
     * The store clears `chosenExit` the instant the distance roll is
     * pressed, but the light's whole point is to still be on the road while
     * the car drives down it — so it outlives the prop for as long as the
     * move it started is playing out, and goes out when the turn resolves.
     */
    it('keeps the road lit through the drive and puts it out when the turn resolves', () => {
      mockReducedMotion(true)
      const model = makeForkBoard()
      const players = [makePlayer({ id: 'p1', spaceId: 'fork' })]
      const { container, rerender } = renderBoard({
        board: model,
        players,
        phase: 'awaitingDistanceSpin',
        chosenExitId: 'up1',
      })
      const renderWith = (phase: BoardProps['phase'], chosenExitId: string | null) =>
        rerender(
          <AudioProvider audio={createFakeAudioPort()}>
            <Board
              board={model}
              players={players}
              currentPlayerIndex={0}
              phase={phase}
              movementPath={[]}
              onMovementComplete={() => {}}
              chosenExitId={chosenExitId}
            />
          </AudioProvider>,
        )

      // The distance roll is pressed: the prop is gone, the light is not.
      renderWith('moving', null)
      expect(container.querySelectorAll('[data-testid="road-taken"]')).toHaveLength(1)

      // A swept-past card mid-drive changes nothing either.
      renderWith('passingEvent', null)
      expect(container.querySelectorAll('[data-testid="road-taken"]')).toHaveLength(1)

      // The move resolves: the answer has been travelled, the light goes out.
      renderWith('resolved', null)
      expect(container.querySelector('[data-testid="road-taken"]')).toBeNull()
      expect(container.querySelector('[data-testid="tile-not-taken"]')).toBeNull()
    })
  })

  describe('stacking and overtaking', () => {
    /**
     * Several cars can share a space. The active player's car is drawn last so
     * it is never hidden behind a rival's, and so a car crossing an occupied
     * space visibly passes the cars parked on it.
     */
    it('draws the active player’s car over everybody else’s', () => {
      mockReducedMotion(true)
      const { container } = renderBoard({
        currentPlayerIndex: 1,
        players: [
          makePlayer({ id: 'p1', name: 'Alice' }),
          makePlayer({ id: 'p2', name: 'Bo', color: 'red' }),
          makePlayer({ id: 'p3', name: 'Cass', color: 'green' }),
        ],
      })

      const cars = [...container.querySelectorAll('[data-testid="pawn"]')]
      const last = cars[cars.length - 1]

      expect(last).toHaveAttribute('data-active', 'true')
      expect(cars.filter((car) => car.getAttribute('data-active') === 'true')).toHaveLength(1)
    })

    it('draws cars sharing a space back to front, so none is lost behind another', () => {
      mockReducedMotion(true)
      const { container } = renderBoard({
        currentPlayerIndex: 0,
        players: [
          makePlayer({ id: 'p1', name: 'Alice', spaceId: 'b' }),
          makePlayer({ id: 'p2', name: 'Bo', color: 'red', spaceId: 'b' }),
          makePlayer({ id: 'p3', name: 'Cass', color: 'green', spaceId: 'b' }),
          makePlayer({ id: 'p4', name: 'Dee', color: 'yellow', spaceId: 'b' }),
        ],
      })

      const order = [...container.querySelectorAll('[data-testid="pawn"]')].map((car) =>
        car.getAttribute('aria-label')?.split(',')[0],
      )

      // Parked in echelon by player, and the active car laid over the top.
      expect(order).toEqual(['Bo', 'Cass', 'Dee', 'Alice'])
    })

    /**
     * The reported bug, end to end: two players stop on the same space and
     * their cars are supposed to fan apart, but read as one. `Pawn` writes its
     * resting position as an inline `translate…px` — set directly by
     * framer-motion, not by any layout jsdom would have to perform — so the
     * actual number this component chose for each car can be read straight
     * back off the DOM without a browser. What is pinned is that number, never
     * a pixel measurement: two cars parked at the same point would still pass
     * a screenshot-diff taken from directly above them.
     */
    it('never parks two cars sharing a space at the same point, however many other players are elsewhere on the board', () => {
      mockReducedMotion(true)
      // A `translate…` term is dropped from the style entirely when its value
      // is exactly zero, so a missing axis reads as 0 rather than as unknown.
      const carPosition = (car: Element): { x: number; y: number } => {
        const body = car.querySelector(':scope > g')
        const style = body?.getAttribute('style') ?? ''
        return {
          x: Number(/translateX\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
          y: Number(/translateY\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
        }
      }

      // Four players at the table — the game's maximum — but only two of
      // them, the middle pair by seat, actually share a tile. This is exactly
      // the shape of the reported bug: fanning against the whole table of
      // four left this particular pair in two of the four *interior* bays,
      // barely apart, even though only the two of them needed separating.
      const { container } = renderBoard({
        currentPlayerIndex: 0,
        players: [
          makePlayer({ id: 'p1', name: 'Alice', spaceId: 'start' }),
          makePlayer({ id: 'p2', name: 'Bo', color: 'red', spaceId: 'b' }),
          makePlayer({ id: 'p3', name: 'Cass', color: 'green', spaceId: 'b' }),
          makePlayer({ id: 'p4', name: 'Dee', color: 'yellow', spaceId: 'c' }),
        ],
      })

      const cars = [...container.querySelectorAll('[data-testid="pawn"]')]
      const bo = carPosition(cars.find((car) => car.getAttribute('aria-label')?.startsWith('Bo')) as Element)
      const cass = carPosition(
        cars.find((car) => car.getAttribute('aria-label')?.startsWith('Cass')) as Element,
      )

      expect(bo).not.toEqual(cass)
      // Sharing a tile with only one rival, the pair should land in the two
      // most-separated bays the tile has — not two of four cramped middle
      // ones — however many other players are elsewhere on the board.
      const distance = Math.hypot(bo.x - cass.x, bo.y - cass.y)
      expect(distance).toBeGreaterThan(20)
    })
  })

  describe('free look', () => {
    function fakeRect(width: number, height: number): DOMRect {
      return {
        width,
        height,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: width,
        bottom: height,
        toJSON: () => ({}),
      } as DOMRect
    }

    // jsdom does not implement `elementFromPoint` at all — there is no real
    // layout for it to hit-test against — so it has to be defined before it
    // can be mocked, rather than merely stubbed. `document` is shared
    // across every test in this file, so it is torn back down afterwards
    // rather than left to leak a detached tile into whatever test runs next.
    afterEach(() => {
      delete (document as { elementFromPoint?: unknown }).elementFromPoint
    })

    it('opens a tile’s own card on a tap, reading straight off its space definition', () => {
      mockReducedMotion(true)
      const { container } = renderBoard()
      const tile = container.querySelector('[data-space="c"]') as Element
      document.elementFromPoint = vi.fn().mockReturnValue(tile)

      const svg = screen.getByRole('img', { name: 'Game board' })
      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 })
      fireEvent.pointerUp(svg, { pointerId: 1, clientX: 101, clientY: 99 })

      const card = screen.getByRole('dialog', { name: 'Wedding' })
      expect(card).toHaveTextContent('Space')
      expect(card).toHaveTextContent('A space.')
    })

    it('does not open a card when the pointer drags past the tap threshold first', () => {
      mockReducedMotion(true)
      const { container } = renderBoard()
      const tile = container.querySelector('[data-space="c"]') as Element
      document.elementFromPoint = vi.fn().mockReturnValue(tile)

      const svg = screen.getByRole('img', { name: 'Game board' })
      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 100, clientY: 100 })
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 160, clientY: 100 })
      fireEvent.pointerUp(svg, { pointerId: 1, clientX: 160, clientY: 100 })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('pans the camera transform while dragging when nothing else is animating it', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ phase: 'awaitingSpin' })
      const svg = screen.getByRole('img', { name: 'Game board' })
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(fakeRect(800, 600))

      const before = getByTestId('board-camera').getAttribute('transform')
      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 200, clientY: 200 })
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 120, clientY: 160 })

      expect(getByTestId('board-camera').getAttribute('transform')).not.toEqual(before)
    })

    /**
     * The other half of free look, and the half that was missing (issue
     * #25): a player who pans off to read a tile elsewhere had no way back
     * to their own car, because the camera only re-frames when the phase
     * changes — so until they rolled, the board stayed wherever they left
     * it, their car possibly off screen entirely.
     */
    it('goes back to the active car when asked, from wherever a free look left the board', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ phase: 'awaitingSpin' })
      const svg = screen.getByRole('img', { name: 'Game board' })
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(fakeRect(800, 600))

      const parked = getByTestId('board-camera').getAttribute('transform')
      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 200, clientY: 200 })
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 120, clientY: 160 })
      fireEvent.pointerUp(svg, { pointerId: 1, clientX: 120, clientY: 160 })
      expect(getByTestId('board-camera').getAttribute('transform')).not.toEqual(parked)

      // Named after the car, not after the camera — the player is looking
      // for themselves, not for a control.
      fireEvent.click(screen.getByRole('button', { name: "Back to Alice's car" }))

      expect(getByTestId('board-camera').getAttribute('transform')).toEqual(parked)
    })

    /**
     * The risk a suspended-during-`moving` drag exists to head off: the
     * movement effect is `await`ing this exact camera's own animation to
     * finish, leg by leg. Stopping that animation out from under it — same
     * mechanism `cameraControls.current.forEach(stop)` — would leave that
     * `await` on a promise `framer-motion` never resolves, freezing the
     * play loop the same way an interrupted spin once did. This drives an
     * actual move and drags across it rather than asserting on the
     * transform directly, so it would catch exactly that freeze if the
     * suspension above were ever lost.
     */
    it('does not stall a move in progress when the player drags mid-hop', async () => {
      mockReducedMotion(true)
      const onMovementComplete = vi.fn()
      renderBoard({
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        phase: 'moving',
        movementPath: ['b', 'c'],
        onMovementComplete,
      })
      const svg = screen.getByRole('img', { name: 'Game board' })
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue(fakeRect(800, 600))

      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 200, clientY: 200 })
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 120, clientY: 160 })
      fireEvent.pointerUp(svg, { pointerId: 1, clientX: 120, clientY: 160 })

      await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
    })
  })

  /**
   * Zoom is the one part of the camera the player holds, and it is opt-in:
   * everything above still describes the board exactly as it was, because at
   * fit nothing about the framing has changed at all.
   *
   * These read the camera group's own `transform`, the same way the camera
   * tests above do. What they cannot check is pixels — jsdom runs no layout
   * — so the promise that a zoomed board still stays inside its grid cell is
   * checked twice: here in board space (the drawing never shows past the
   * viewBox, however far in the player goes) and in a real browser by
   * `e2e/layout.spec.ts`, which is where the overflow regression this
   * guards against actually shipped.
   */
  describe('zoom', () => {
    const model = makeBoard()
    const projection = createProjection(model)
    const start = model.spaces['start'] as Space
    const written = (t: { x: number; y: number; scale: number }): string =>
      `translate(${t.x} ${t.y}) scale(${t.scale})`
    /** Where the camera parks for a player waiting to spin, at fit. */
    const atFit = written(cameraTransform(projection, restShot(model, projection, start)))

    function readCamera(el: Element): { x: number; y: number; scale: number } {
      const match = /translate\((-?[\d.]+) (-?[\d.]+)\) scale\(([\d.]+)\)/.exec(
        el.getAttribute('transform') ?? '',
      )
      if (!match) throw new Error(`unreadable camera transform: ${el.getAttribute('transform')}`)
      return { x: Number(match[1]), y: Number(match[2]), scale: Number(match[3]) }
    }

    /** The board the drawing actually shows, in viewBox units, from the live transform. */
    function shown(el: Element): { left: number; top: number; right: number; bottom: number } {
      const { x, y, scale } = readCamera(el)
      return {
        left: -x / scale,
        top: -y / scale,
        right: (projection.viewWidth - x) / scale,
        bottom: (projection.viewHeight - y) / scale,
      }
    }

    it('opens at the framing the camera chose, with nothing zoomed', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })

      expect(getByTestId('board-camera')).toHaveAttribute('transform', atFit)
      expect(screen.getByRole('status')).toHaveTextContent('100%')
    })

    it('closes in on the map when the player asks for a closer look', async () => {
      mockReducedMotion(true)
      const user = userEvent.setup()
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const before = readCamera(getByTestId('board-camera'))

      await user.click(screen.getByRole('button', { name: 'Zoom in' }))

      const after = readCamera(getByTestId('board-camera'))
      expect(after.scale).toBeCloseTo(before.scale * USER_ZOOM_STEP, 6)
      expect(screen.getByRole('status')).toHaveTextContent(
        `${Math.round(USER_ZOOM_STEP * 100)}%`,
      )
    })

    it('pulls back out again, and stops at fit rather than a hair inside it', async () => {
      mockReducedMotion(true)
      const user = userEvent.setup()
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })

      await user.click(screen.getByRole('button', { name: 'Zoom in' }))
      await user.click(screen.getByRole('button', { name: 'Zoom out' }))

      expect(screen.getByRole('status')).toHaveTextContent('100%')
      expect(readCamera(getByTestId('board-camera')).scale).toBeCloseTo(
        cameraTransform(projection, restShot(model, projection, start)).scale,
        10,
      )
      // Nothing left to give: a stepped-out zoom that stopped a hair inside
      // fit would leave this key lit and useless.
      expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
    })

    /**
     * The whole promise of the reset key, and of the feature: today's
     * framing is still exactly today's framing, down to the transform
     * string, once the player hands the camera back.
     */
    it('returns to the camera’s own framing exactly, whatever the player did to it', async () => {
      mockReducedMotion(true)
      const user = userEvent.setup()
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      expect(getByTestId('board-camera')).toHaveAttribute('transform', atFit)

      await user.click(screen.getByRole('button', { name: 'Zoom in' }))
      await user.click(screen.getByRole('button', { name: 'Zoom in' }))
      expect(getByTestId('board-camera')).not.toHaveAttribute('transform', atFit)

      await user.click(screen.getByRole('button', { name: 'Reset zoom to fit' }))

      expect(getByTestId('board-camera')).toHaveAttribute('transform', atFit)
    })

    it('lets go of a free-look pan too, which is why reset stays offered at fit', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const svg = screen.getByRole('img', { name: 'Game board' })
      vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        right: 800,
        bottom: 600,
        toJSON: () => ({}),
      } as DOMRect)

      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 200, clientY: 200 })
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 120, clientY: 160 })
      fireEvent.pointerUp(svg, { pointerId: 1, clientX: 120, clientY: 160 })
      expect(getByTestId('board-camera')).not.toHaveAttribute('transform', atFit)

      fireEvent.click(screen.getByRole('button', { name: 'Reset zoom to fit' }))

      expect(getByTestId('board-camera')).toHaveAttribute('transform', atFit)
    })

    /**
     * The containment contract in board space: the drawing may show less of
     * the board the further in a player goes, but never anything that is not
     * board — no blank past an edge, and nothing that could spill out of the
     * frame the `<svg>` clips to.
     */
    it('never shows past the edge of the board, however far in the player zooms', async () => {
      mockReducedMotion(true)
      const user = userEvent.setup()
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const camera = getByTestId('board-camera')

      for (let press = 0; press < 8; press += 1) {
        await user.click(screen.getByRole('button', { name: 'Zoom in' }))
        const view = shown(camera)
        expect(view.left).toBeGreaterThanOrEqual(-1e-6)
        expect(view.top).toBeGreaterThanOrEqual(-1e-6)
        expect(view.right).toBeLessThanOrEqual(projection.viewWidth + 1e-6)
        expect(view.bottom).toBeLessThanOrEqual(projection.viewHeight + 1e-6)
      }

      // The sweep really did reach the far end of the range, or it proved
      // nothing about the limit.
      expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
      expect(screen.getByRole('status')).toHaveTextContent(`${USER_ZOOM_MAX * 100}%`)
    })

    it('zooms on a trackpad pinch — a ctrl-held wheel, the browser’s own zoom gesture', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const svg = screen.getByRole('img', { name: 'Game board' })
      const before = readCamera(getByTestId('board-camera')).scale

      fireEvent.wheel(svg, { deltaY: -300, ctrlKey: true })

      expect(readCamera(getByTestId('board-camera')).scale).toBeGreaterThan(before)
    })

    /**
     * The rule that keeps the wheel off an ordinary scroll: where the page
     * behind the board has somewhere to go, a plain wheel belongs to the
     * page. (Neither of the game's own two locked layouts scrolls at all,
     * which is why a plain wheel is taken there — the case below the guard.)
     */
    it('leaves a plain wheel to the page when the page has somewhere to scroll', () => {
      mockReducedMotion(true)
      Object.defineProperty(document.documentElement, 'scrollHeight', {
        configurable: true,
        value: 4000,
      })
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const svg = screen.getByRole('img', { name: 'Game board' })
      const before = getByTestId('board-camera').getAttribute('transform')

      fireEvent.wheel(svg, { deltaY: -300 })

      expect(getByTestId('board-camera').getAttribute('transform')).toEqual(before)
      expect(screen.getByRole('status')).toHaveTextContent('100%')

      delete (document.documentElement as unknown as { scrollHeight?: unknown }).scrollHeight
    })

    it('zooms on two fingers spreading apart, and pans neither of them', () => {
      mockReducedMotion(true)
      const { getByTestId } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const svg = screen.getByRole('img', { name: 'Game board' })
      const before = readCamera(getByTestId('board-camera')).scale

      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 180, clientY: 200 })
      fireEvent.pointerDown(svg, { pointerId: 2, clientX: 220, clientY: 200 })
      fireEvent.pointerMove(svg, { pointerId: 2, clientX: 300, clientY: 200 })

      // Three times the spread the fingers went down at, so three times in.
      expect(readCamera(getByTestId('board-camera')).scale).toBeCloseTo(before * 3, 5)
    })

    it('does not open a tile’s card when a pinch ends over one', () => {
      mockReducedMotion(true)
      const { container } = renderBoard({ board: model, phase: 'awaitingSpin' })
      const tile = container.querySelector('[data-space="c"]') as Element
      document.elementFromPoint = vi.fn().mockReturnValue(tile)
      const svg = screen.getByRole('img', { name: 'Game board' })

      fireEvent.pointerDown(svg, { pointerId: 1, clientX: 180, clientY: 200 })
      fireEvent.pointerDown(svg, { pointerId: 2, clientX: 220, clientY: 200 })
      fireEvent.pointerUp(svg, { pointerId: 2, clientX: 220, clientY: 200 })
      fireEvent.pointerUp(svg, { pointerId: 1, clientX: 180, clientY: 200 })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      delete (document as { elementFromPoint?: unknown }).elementFromPoint
    })

    /**
     * The same suspension the free-look drag observes, for the same reason:
     * a car is mid-hop and the movement effect owns the camera. The press is
     * not thrown away, though — it is recorded, and the next hop's own shot
     * arrives already zoomed.
     */
    it('records a zoom pressed mid-move without yanking the camera out of the hop', async () => {
      mockReducedMotion(true)
      const user = userEvent.setup()
      const onMovementComplete = vi.fn()
      renderBoard({
        board: model,
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        phase: 'moving',
        movementPath: ['b', 'c'],
        onMovementComplete,
      })

      await user.click(screen.getByRole('button', { name: 'Zoom in' }))

      expect(screen.getByRole('status')).toHaveTextContent(
        `${Math.round(USER_ZOOM_STEP * 100)}%`,
      )
      await waitFor(() => expect(onMovementComplete).toHaveBeenCalledTimes(1))
    })
  })
  /**
   * The road ahead, lit — issue #26. The "3 TO GO" badge said how far; nothing
   * said *where*, so a player could not tell a tile they would stop on from
   * one they were about to drive over until its card appeared.
   */
  describe('the road ahead', () => {
    it('lights every tile of the move, in order, once the roll has settled', () => {
      mockReducedMotion(true)
      renderBoard({
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        phase: 'moving',
        movementPath: ['b', 'c'],
      })

      const lit = screen.getAllByTestId('path-light')
      expect(lit).toHaveLength(2)
      // In order down the road: each tile waits a beat longer than the one
      // before it, which is what makes the run read as a wave rather than as
      // a row switching on at once.
      const delays = lit.map((node) => node.style.animationDelay)
      expect(delays[0]).toBe('0s')
      expect(Number.parseFloat(delays[1] ?? '0')).toBeGreaterThan(0)
    })

    it('marks the tile the car actually stops on apart from the ones it crosses', () => {
      mockReducedMotion(true)
      renderBoard({
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        phase: 'moving',
        movementPath: ['b', 'c'],
      })

      const lit = screen.getAllByTestId('path-light')
      expect(lit[0]).not.toHaveAttribute('data-arrival')
      expect(lit[1]).toHaveAttribute('data-arrival', 'true')
    })

    /**
     * A leg that ends at a swept-past tile has road still owed behind it, so
     * nothing on it is the landing — marking the end of the *leg* would say
     * the opposite of what the lights are for.
     */
    it('marks no landing while hops are still owed past this leg', () => {
      mockReducedMotion(true)
      renderBoard({
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        phase: 'moving',
        movementPath: ['b'],
        pendingHops: 3,
      })

      expect(screen.getByTestId('path-light')).not.toHaveAttribute('data-arrival')
    })

    it('lights nothing while the table is waiting for a roll', () => {
      mockReducedMotion(true)
      renderBoard({ phase: 'awaitingSpin', movementPath: ['b', 'c'] })

      expect(screen.queryAllByTestId('path-light')).toHaveLength(0)
    })
  })

  /**
   * The signs — issue #27. "START" read as "TART" because the red car parked
   * on the first space was drawn over the sign labelling it, and "GRADUATE"
   * bit into the milestone tile it belongs to because the offset was measured
   * off the face rather than off the bezel standing proud of it.
   */
  describe('roadside signs', () => {
    it('draws every sign after the cars, so a car can never cover one', () => {
      mockReducedMotion(true)
      const { container } = renderBoard({
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
      })

      const sign = screen
        .getAllByTestId('tile-caption')
        .find((node) => node.getAttribute('data-caption') === 'START')
      const car = container.querySelector('[data-testid="pawn"]')
      expect(sign).toBeDefined()
      expect(car).not.toBeNull()
      // Document order is paint order in SVG, so this *is* the fix: the sign
      // comes after the car, therefore over it. "START" can no longer be
      // covered down to "TART" by the car parked on it.
      const order = car!.compareDocumentPosition(sign as Node)
      expect(order & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('steps a sign clear of a tile a car is parked on', () => {
      mockReducedMotion(true)
      const signOf = (nodes: HTMLElement[], caption: string): HTMLElement | undefined =>
        nodes.find((node) => node.getAttribute('data-caption') === caption)

      const empty = renderBoard({ players: [makePlayer({ id: 'p1', spaceId: 'c' })] })
      const parked = signOf(empty.getAllByTestId('tile-caption'), 'START')?.getAttribute('transform')
      empty.unmount()

      const occupied = renderBoard({ players: [makePlayer({ id: 'p1', spaceId: 'start' })] })
      const stepped = signOf(occupied.getAllByTestId('tile-caption'), 'START')?.getAttribute('transform')

      expect(stepped).not.toBe(parked)
    })
  })
})
