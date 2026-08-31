import { act, render, waitFor } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { Pawn, type PawnHandle, type PawnProps } from './Pawn'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

describe('Pawn', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders a car for the given player colour', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const { getByTestId } = render(
      <AudioProvider audio={audio}>
        <svg>
          <Pawn color="red" restPosition={{ x: 0, y: 0 }} />
        </svg>
      </AudioProvider>,
    )
    expect(getByTestId('pawn')).toHaveAttribute('data-color', 'red')
  })

  it('hops through every point in the path and fires hop sfx once per landing', async () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const ref = createRef<PawnHandle>()
    render(
      <AudioProvider audio={audio}>
        <svg>
          <Pawn ref={ref} color="blue" restPosition={{ x: 0, y: 0 }} />
        </svg>
      </AudioProvider>,
    )

    const path = [
      { x: 10, y: 0 },
      { x: 20, y: 0 },
      { x: 30, y: 5 },
    ]

    await act(async () => {
      await ref.current?.hopThrough(path)
    })

    expect(audio.sfxLog).toEqual(['hop', 'hop', 'hop'])
  })

  it('resolves immediately and plays no sfx for an empty path', async () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const ref = createRef<PawnHandle>()
    render(
      <AudioProvider audio={audio}>
        <svg>
          <Pawn ref={ref} color="green" restPosition={{ x: 0, y: 0 }} />
        </svg>
      </AudioProvider>,
    )

    await act(async () => {
      await ref.current?.hopThrough([])
    })

    expect(audio.sfxLog).toEqual([])
  })

  it('shows an active ring only when isActive is true', () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const { getByTestId } = render(
      <AudioProvider audio={audio}>
        <svg>
          <Pawn color="purple" restPosition={{ x: 0, y: 0 }} isActive />
        </svg>
      </AudioProvider>,
    )
    expect(getByTestId('pawn')).toHaveAttribute('data-active', 'true')
  })

  /**
   * A move takes the same number of hops however long each one lasts, so a
   * player who has asked for less motion still gets every landing, every sound
   * and every state change — only the travel between them is removed.
   */
  it('keeps every landing under reduced motion, and loses only the travel', async () => {
    mockReducedMotion(true)
    const audio = createFakeAudioPort()
    const ref = createRef<PawnHandle>()
    render(
      <AudioProvider audio={audio}>
        <svg>
          <Pawn ref={ref} color="blue" restPosition={{ x: 0, y: 0 }} hopDuration={30} />
        </svg>
      </AudioProvider>,
    )

    const started = Date.now()
    await act(async () => {
      await ref.current?.hopThrough([
        { x: 10, y: 0 },
        { x: 20, y: 0 },
      ])
    })

    // Thirty seconds a hop, honoured, would not have returned by now.
    expect(Date.now() - started).toBeLessThan(2000)
    expect(audio.sfxLog).toEqual(['hop', 'hop'])
  })

  describe('settling into a new bay', () => {
    /**
     * Reads the position framer-motion actually wrote for the car's body. A
     * `translate…` term is dropped entirely from the style when its value is
     * exactly zero, so a missing axis reads as 0 rather than as unknown.
     */
    function position(pawn: HTMLElement): { x: number; y: number } {
      const style = pawn.querySelector(':scope > g')?.getAttribute('style') ?? ''
      return {
        x: Number(/translateX\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
        y: Number(/translateY\(([-\d.]+)px\)/.exec(style)?.[1] ?? '0'),
      }
    }

    /**
     * A parked car used to be deaf to its own `restPosition` after the first
     * paint — only `hopThrough` could ever move it — so when a rival's
     * arrival changed which bay a *stationary* car belonged in, the car
     * itself never followed and could sit exactly on top of the newcomer.
     * This is the regression: no hop, no `ref`, just a prop the board
     * recomputed, and the token still has to end up where it was told.
     */
    it('moves to a newly assigned bay even though it never hopped there', async () => {
      mockReducedMotion(true)
      const { getByTestId, rerender } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 5, y: 8 }} />
          </svg>
        </AudioProvider>,
      )
      expect(position(getByTestId('pawn'))).toEqual({ x: 5, y: 8 })

      rerender(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 40, y: -12 }} />
          </svg>
        </AudioProvider>,
      )

      // The jump itself is immediate under reduced motion, but framer-motion
      // still flushes a settled motion value to the DOM on its own frame
      // rather than inside React's commit, so the assertion polls rather
      // than reading the style back synchronously.
      await waitFor(() => expect(position(getByTestId('pawn'))).toEqual({ x: 40, y: -12 }))
    })

    it('settles silently — a bay reassignment is not a move the player made', async () => {
      mockReducedMotion(true)
      const audio = createFakeAudioPort()
      const { getByTestId, rerender } = render(
        <AudioProvider audio={audio}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 0, y: 5 }} />
          </svg>
        </AudioProvider>,
      )

      rerender(
        <AudioProvider audio={audio}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 40, y: -12 }} />
          </svg>
        </AudioProvider>,
      )

      await waitFor(() => expect(position(getByTestId('pawn'))).toEqual({ x: 40, y: -12 }))
      expect(audio.sfxLog).toEqual([])
    })

    it('does not settle on the first paint — there is nowhere to move from yet', () => {
      mockReducedMotion(true)
      const { getByTestId } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 7, y: 3 }} />
          </svg>
        </AudioProvider>,
      )

      expect(position(getByTestId('pawn'))).toEqual({ x: 7, y: 3 })
    })

    /**
     * `hopThrough` is the one thing a settle must never fight: it is what the
     * store waits on to unblock the next turn, so if a reassigned bay could
     * steal the motion values mid-hop, `onMovementComplete` could resolve
     * against the wrong position or never settle cleanly at all.
     */
    it('never contends with an in-flight hop for the same motion values', async () => {
      mockReducedMotion(false)
      const ref = createRef<PawnHandle>()
      const { getByTestId, rerender } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn ref={ref} color="blue" restPosition={{ x: 0, y: 0 }} hopDuration={0.05} />
          </svg>
        </AudioProvider>,
      )

      const hop = act(async () => {
        await ref.current?.hopThrough([{ x: 100, y: 0 }])
      })

      // A rival's arrival reassigns this car's bay while it is mid-air — the
      // hop in progress must still be the one thing driving its position, and
      // the token must land exactly where the hop sent it once it finishes.
      rerender(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn ref={ref} color="blue" restPosition={{ x: 999, y: 999 }} hopDuration={0.05} />
          </svg>
        </AudioProvider>,
      )

      await hop

      expect(position(getByTestId('pawn'))).toEqual({ x: 100, y: 0 })
    })
  })

  describe('the earned look', () => {
    // Scoped to its own render's container: several tests below park one car
    // per tier side by side, which a document-wide getByTestId would trip on.
    function renderCar(props: Partial<PawnProps> = {}): HTMLElement {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 0, y: 0 }} {...props} />
          </svg>
        </AudioProvider>,
      )
      return container.querySelector('[data-testid="pawn"]') as HTMLElement
    }

    it('defaults to the familiar mid-tier roadster', () => {
      const car = renderCar()
      expect(car).toHaveAttribute('data-tier', '2')
    })

    it('carries the wealth tier as data for the styling to draw off', () => {
      expect(renderCar({ wealthTier: 1 })).toHaveAttribute('data-tier', '1')
      expect(renderCar({ wealthTier: 4 })).toHaveAttribute('data-tier', '4')
    })

    it('draws more bodywork the further the tiers sit apart', () => {
      // Not a pixel test — jsdom cannot render one — but the battered car
      // must carry its damage (dent, scratches, rust) and the grand tourer
      // its extras (two-tone, ornament, trim, hub rings), so each tier ends
      // up with visibly more marks than the plain roadster's zero.
      const plain = renderCar({ wealthTier: 2 }).querySelectorAll('path, circle').length
      const battered = renderCar({ wealthTier: 1 }).querySelectorAll('path, circle').length
      const grand = renderCar({ wealthTier: 4 }).querySelectorAll('path, circle').length
      expect(battered).toBeGreaterThan(plain)
      expect(grand).toBeGreaterThan(plain)
    })
  })

  describe("the driver's gear", () => {
    // Same scoping bargain as the earned look: one car per render, queried
    // through its own container.
    function renderCar(props: Partial<PawnProps> = {}): HTMLElement {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 0, y: 0 }} {...props} />
          </svg>
        </AudioProvider>,
      )
      return container.querySelector('[data-testid="pawn"]') as HTMLElement
    }

    // One trade per family, so every one of the eight accessories renders.
    const wardrobe = [
      ['career:pastry-chef', 'kitchen'],
      ['career:rice-farmer', 'field'],
      ['career:mechanic', 'works'],
      ['career:bank-officer', 'office'],
      ['career:manga-artist', 'studio'],
      ['career:surgeon', 'care'],
      ['career:professor', 'science'],
      ['career:soccer-coach', 'pitch'],
    ] as const

    it.each(wardrobe)('dresses the driver for %s in the %s family', (icon, family) => {
      const car = renderCar({ careerIcon: icon })
      expect(car).toHaveAttribute('data-career-family', family)
      expect(car.querySelectorAll(`[data-gear-family='${family}']`)).toHaveLength(1)
    })

    it('drives bare-headed before the first hire', () => {
      const car = renderCar()
      expect(car).not.toHaveAttribute('data-career-family')
      expect(car.querySelector('[data-gear-family]')).toBeNull()
    })

    it('fails closed on an icon that names no trade', () => {
      const car = renderCar({ careerIcon: 'space:big-promotion' })
      expect(car).not.toHaveAttribute('data-career-family')
      expect(car.querySelector('[data-gear-family]')).toBeNull()
    })

    it('dresses the driver alone, never the household', () => {
      const car = renderCar({ careerIcon: 'career:surgeon', isMarried: true, childCount: 3 })
      expect(car.querySelectorAll('[data-gear-family]')).toHaveLength(1)
    })

    it('keeps career out of the accessible description — that is the passengers’ story', () => {
      const car = renderCar({ careerIcon: 'career:surgeon', name: 'Alice' })
      expect(car).toHaveAttribute('aria-label', 'Alice, driving alone')
    })
  })

  describe("the graduate's cap", () => {
    // Same scoping bargain as the earned look: one car per render, queried
    // through its own container.
    function renderCar(props: Partial<PawnProps> = {}): HTMLElement {
      mockReducedMotion(true)
      const { container } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 0, y: 0 }} {...props} />
          </svg>
        </AudioProvider>,
      )
      return container.querySelector('[data-testid="pawn"]') as HTMLElement
    }

    it('caps the fresh graduate before the first hire', () => {
      const car = renderCar({ hasDegree: true })
      expect(car).toHaveAttribute('data-regalia', 'mortarboard')
      expect(car.querySelectorAll("[data-regalia-kind='mortarboard']")).toHaveLength(1)
    })

    it('drives bare-headed without a degree', () => {
      const car = renderCar()
      expect(car).not.toHaveAttribute('data-regalia')
      expect(car.querySelector('[data-regalia-kind]')).toBeNull()
    })

    it('hands the head to career gear once a hire lands', () => {
      const car = renderCar({ hasDegree: true, careerIcon: 'career:surgeon' })
      expect(car).toHaveAttribute('data-career-family', 'care')
      expect(car).not.toHaveAttribute('data-regalia')
      expect(car.querySelector('[data-regalia-kind]')).toBeNull()
    })

    it('caps the driver alone, never the household', () => {
      const car = renderCar({ hasDegree: true, isMarried: true, childCount: 3 })
      expect(car.querySelectorAll('[data-regalia-kind]')).toHaveLength(1)
    })
  })

  describe('passengers', () => {
    function renderCar(props: { isMarried?: boolean; childCount?: number }): HTMLElement {
      mockReducedMotion(true)
      const { getByTestId } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 0, y: 0 }} name="Alice" {...props} />
          </svg>
        </AudioProvider>,
      )
      return getByTestId('pawn')
    }

    it('exposes an empty car to assistive technology', () => {
      expect(renderCar({})).toHaveAttribute('aria-label', 'Alice, driving alone')
    })

    it('exposes a partner once the player is married', () => {
      expect(renderCar({ isMarried: true })).toHaveAttribute(
        'aria-label',
        'Alice, driving with a partner alongside',
      )
    })

    it('exposes the children riding along', () => {
      expect(renderCar({ isMarried: true, childCount: 2 })).toHaveAttribute(
        'aria-label',
        'Alice, driving with a partner alongside and 2 children',
      )
    })

    it('states the true count even when the back seat is badged', () => {
      expect(renderCar({ childCount: 6 })).toHaveAttribute(
        'aria-label',
        'Alice, driving with 6 children',
      )
    })

    it('carries the household as data for anything drawing off it', () => {
      const car = renderCar({ isMarried: true, childCount: 2 })

      expect(car).toHaveAttribute('data-married', 'true')
      expect(car).toHaveAttribute('data-children', '2')
    })

    it('falls back to the door letter when no name was given', () => {
      mockReducedMotion(true)
      const { getByTestId } = render(
        <AudioProvider audio={createFakeAudioPort()}>
          <svg>
            <Pawn color="blue" restPosition={{ x: 0, y: 0 }} label="Z" />
          </svg>
        </AudioProvider>,
      )

      expect(getByTestId('pawn')).toHaveAttribute('aria-label', 'Z, driving alone')
    })
  })
})
