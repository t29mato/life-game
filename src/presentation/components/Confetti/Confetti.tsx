import { useEffect, useRef, useState, type CSSProperties, type ReactElement } from 'react'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './Confetti.module.css'

export interface ConfettiProps {
  /** Bump this to fire a new burst, e.g. `resultRevealCount`. */
  readonly burstKey: number | string
  readonly pieceCount?: number
  /**
   * `'top'` rains the field down from above the container; `'center'` throws it
   * outward from the middle, the way a popper goes off.
   */
  readonly origin?: 'top' | 'center'
}

const COLORS = [
  'var(--candy-coral)',
  'var(--candy-tangerine)',
  'var(--candy-sun)',
  'var(--candy-mint)',
  'var(--candy-sky)',
  'var(--candy-grape)',
  'var(--candy-bubblegum)',
]

/** Real confetti is cut in a few shapes, not one. */
const SHAPES = ['rect', 'strip', 'disc', 'tri', 'square'] as const
type Shape = (typeof SHAPES)[number]

interface Piece {
  readonly id: number
  readonly shape: Shape
  readonly style: CSSProperties
}

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pick<T>(items: readonly T[], index: number, fallback: T): T {
  return items[index % items.length] ?? fallback
}

function generatePieces(count: number, origin: 'top' | 'center'): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const shape = pick(SHAPES, i, 'rect')
    // Physical paper: a few big flakes, mostly small ones.
    const scale = randomBetween(0.7, 1.45)
    const width = (shape === 'strip' ? randomBetween(3.5, 6) : randomBetween(7, 12)) * scale
    const height = (shape === 'strip' ? randomBetween(14, 26) : randomBetween(7, 13)) * scale
    const fromCentre = origin === 'center'
    // Spread across the field, or clustered at the middle for a popper burst.
    const left = fromCentre ? randomBetween(38, 62) : randomBetween(-4, 104)
    const top = fromCentre ? randomBetween(38, 58) : randomBetween(-14, -2)
    // Sideways travel: symmetric fan from the centre, gentle drift from the top.
    const drift = fromCentre ? randomBetween(-46, 46) : randomBetween(-9, 9)
    const rise = fromCentre ? randomBetween(90, 260) : randomBetween(6, 44)
    const fall = fromCentre ? randomBetween(320, 620) : randomBetween(380, 780)
    return {
      id: i,
      shape,
      style: {
        '--color': pick(COLORS, i * 3 + (i % 2), 'var(--candy-sun)'),
        '--w': `${width}px`,
        '--h': `${height}px`,
        '--left': `${left}%`,
        '--top': `${top}%`,
        '--drift': `${drift}vw`,
        '--rise': `${rise}px`,
        '--fall': `${fall}px`,
        '--duration': `${randomBetween(1.25, 1.85)}s`,
        '--delay': `${randomBetween(0, fromCentre ? 0.14 : 0.32)}s`,
        // Tumbling: each flake spins on its own two axes at its own rate.
        '--spin-x': `${Math.round(randomBetween(360, 1440))}deg`,
        '--spin-y': `${Math.round(randomBetween(-900, 900))}deg`,
        '--tilt': `${Math.round(randomBetween(-40, 40))}deg`,
      } as CSSProperties,
    }
  })
}

/**
 * A burst of real-feeling paper confetti: mixed shapes and sizes, each flake
 * launched on its own arc and tumbling on two axes as it falls. Pure CSS —
 * a no-op when the user prefers reduced motion.
 */
export function Confetti({ burstKey, pieceCount = 78, origin = 'top' }: ConfettiProps): ReactElement | null {
  const reduceMotion = usePrefersReducedMotion()
  const [pieces, setPieces] = useState<Piece[]>([])
  const firstRun = useRef(true)
  const latestOrigin = useRef(origin)
  latestOrigin.current = origin

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    if (reduceMotion) {
      setPieces([])
      return
    }
    setPieces(generatePieces(pieceCount, latestOrigin.current))
    const timeout = setTimeout(() => setPieces([]), 2200)
    return () => clearTimeout(timeout)
    // Deliberately keyed on `burstKey` alone: a new burst should only ever
    // start when the caller explicitly asks for one.
  }, [burstKey])

  if (reduceMotion || pieces.length === 0) return null

  return (
    <div className={styles.field} aria-hidden="true" data-testid="confetti-field">
      {pieces.map((piece) => (
        <span key={piece.id} className={styles.piece} style={piece.style}>
          <i className={`${styles.flake} ${styles[piece.shape]}`} />
        </span>
      ))}
    </div>
  )
}
