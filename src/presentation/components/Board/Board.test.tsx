import { act, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type {
  BoardLength,
  Board as BoardModel,
  Player,
  Space,
  SpaceEffect,
} from '@domain/model/types'
import { createBoard } from '@domain/board/createBoard'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { Board, type BoardProps } from './Board'
import { createProjection } from './boardLayout'
import { cameraTransform, focusShot, restShot, wideShot, RESOLVE_ZOOM } from './camera'

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
        onMovementComplete={props.onMovementComplete ?? (() => {})}
        {...(props.introFlythrough === undefined
          ? {}
          : { introFlythrough: props.introFlythrough })}
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
    const resting = cameraTransform(
      projection,
      focusShot(projection, projection.project(model.spaces['start']?.layout ?? { x: 0, y: 0 }), RESOLVE_ZOOM),
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

      // Still framing the whole board on the first frame: the move is animated.
      expect(getByTestId('board-camera')).toHaveAttribute(
        'transform',
        written(cameraTransform(projection, wideShot(projection, model))),
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
     * A rest shot alone would just cut a newly active player straight to a
     * close-up of wherever their car already sits, with no sense of where
     * that is on the board as a whole. Reduced motion strips the travel but
     * must not strip that orientation cue, so it still lands on the correct
     * player's own rest shot — not on the previous player's, and not on the
     * wide establishing shot the motion-ful version passes through first.
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
     * When motion is welcome, a turn handoff plays a brief wide establishing
     * shot before zooming in on the new player — see `restSequence`. That
     * must never hold up an actual spin: if the player acts before the
     * establishing shot finishes, movement takes over immediately and still
     * completes, exactly once. This is the same race the opening fly-through
     * already has to survive, exercised on the turn-handoff camera instead.
     */
    it('still completes a move started while the turn-handoff establishing shot is running', async () => {
      mockReducedMotion(false)
      const onMovementComplete = vi.fn()
      const { rerender } = renderBoard({
        board: model,
        phase: 'awaitingSpin',
        players: [makePlayer({ id: 'p1', spaceId: 'start' })],
        currentPlayerIndex: 0,
        onMovementComplete,
      })

      // A different player is handed the table (starts the establishing
      // shot), and immediately spins before it can finish.
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
   * The board must never be bigger than the room it is given.
   *
   * `long` is 23×15 board units, which projects to a viewBox taller than it is
   * wide — so on a wide screen, where the board's grid row has a hard height,
   * a board sized by its width alone runs off the bottom of its cell and
   * `.surface` clips it with nothing to scroll. That is the bug these pin.
   *
   * jsdom performs no layout, so asserting computed pixel heights here would
   * pass vacuously whatever the CSS said. What is asserted instead is the two
   * things this component actually controls and the fix depends on: that the
   * true aspect of the projection is published to the layout, so the cell can
   * cap the board's width by it, and that the drawing is set to scale to fit
   * rather than to crop. Whether the CSS then does the right thing with them
   * is a question for a browser, not for jsdom.
   */
  describe('fitting the space it is given', () => {
    const lengths: readonly BoardLength[] = ['short', 'standard', 'long']

    it.each(lengths)('publishes the true aspect of a %s board to its container', (length) => {
      mockReducedMotion(true)
      const model = createBoard(length)
      const projection = createProjection(model)
      const { container } = renderBoard({ board: model })

      const frame = container.firstElementChild as HTMLElement
      const published = Number(frame.style.getPropertyValue('--board-aspect'))

      expect(published).toBeCloseTo(projection.viewWidth / projection.viewHeight, 6)
      expect(published).toBeGreaterThan(0)
    })

    /**
     * The worst case, and the reason the cap cannot be a fixed landscape ratio:
     * the longest board is taller than it is wide.
     */
    it('reports the long board as taller than it is wide', () => {
      const projection = createProjection(createBoard('long'))

      expect(projection.viewWidth / projection.viewHeight).toBeLessThan(1)
    })

    it('grows taller, never wider, as the route gets longer', () => {
      const aspects = lengths.map((length) => {
        const projection = createProjection(createBoard(length))
        return projection.viewWidth / projection.viewHeight
      })

      for (let i = 1; i < aspects.length; i += 1) {
        expect(aspects[i] as number).toBeLessThan(aspects[i - 1] as number)
      }
    })

    /**
     * `meet` scales the drawing down until it fits and centres the remainder;
     * `slice` would fill the box by cropping, which is the very failure being
     * fixed. Nothing may quietly swap one for the other.
     */
    it('scales the drawing to fit its box rather than cropping it', () => {
      mockReducedMotion(true)
      renderBoard({ board: createBoard('long') })

      expect(screen.getByRole('img', { name: 'Game board' })).toHaveAttribute(
        'preserveAspectRatio',
        expect.stringContaining('meet') as unknown as string,
      )
    })

    it('draws the whole projection, never a trimmed viewBox', () => {
      mockReducedMotion(true)
      const model = createBoard('long')
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
})
