import { type ReactElement } from 'react'

import type { ForkPocket, SceneryPiece } from './boardLayout'
import styles from './Board.module.css'

/**
 * The feature inside the courtyard a fork encloses — the one place on the map
 * with room for something bigger than a single building.
 *
 * A pond gets a sandy rim, open water and a glint in its upper left; a grove
 * gets a clearing and a run of canopies along it. Both are laid out from the
 * pocket's own seed, so they never move and never need a random source.
 */
export function Pocket({ pocket }: { readonly pocket: ForkPocket }): ReactElement {
  const { centre, rx, ry, seed } = pocket
  const grow = (factor: number): string =>
    `translate(${centre.x} ${centre.y}) scale(${factor}) translate(${-centre.x} ${-centre.y})`

  /** Trees planted along the pocket, either down its spine or on its banks. */
  const grove = (count: number, size: number, bank: number): ReactElement[] => {
    const trees: ReactElement[] = []
    for (let i = 0; i < count; i += 1) {
      const t = (i + 0.5) / count
      const cx = centre.x + (t - 0.5) * 2 * rx * 0.88
      const cy =
        centre.y +
        (bank === 0
          ? Math.sin((i + seed * 3) * 2.4) * ry * 0.34
          : (i % 2 === 0 ? -1 : 1) * ry * bank)
      const r = ry * size * (0.82 + 0.3 * Math.sin(i * 3.1 + seed * 7))
      trees.push(
        <g key={i}>
          <ellipse
            cx={cx + r * 0.24}
            cy={cy + r * 1.24}
            rx={r * 0.86}
            ry={r * 0.26}
            className={styles.drop}
          />
          <rect x={cx - r * 0.12} y={cy} width={r * 0.24} height={r} className={styles.trunk} />
          <circle cx={cx + r * 0.12} cy={cy - r * 0.2} r={r * 0.86} className={styles.leaf} />
          <circle cx={cx - r * 0.26} cy={cy - r * 0.5} r={r * 0.52} className={styles.leafLit} />
        </g>,
      )
    }
    return trees
  }

  if (pocket.kind === 'pond') {
    return (
      <g>
        <path d={pocket.path} transform={grow(1.04)} className={styles.clearing} />
        <path d={pocket.path} transform={grow(0.82)} className={styles.pondRim} />
        <path d={pocket.path} transform={grow(0.72)} className={styles.pondWater} />
        <path d={pocket.path} transform={grow(0.42)} className={styles.pondLit} />
        <ellipse
          cx={centre.x - rx * 0.3}
          cy={centre.y - ry * 0.1}
          rx={rx * 0.07}
          ry={ry * 0.14}
          className={styles.ripple}
        />
        <ellipse
          cx={centre.x + rx * 0.34}
          cy={centre.y + ry * 0.18}
          rx={rx * 0.05}
          ry={ry * 0.11}
          className={styles.ripple}
        />
        {grove(6, 0.34, 1.02)}
      </g>
    )
  }

  return (
    <g>
      <path d={pocket.path} transform={grow(1.06)} className={styles.clearing} />
      {grove(Math.max(4, Math.round(rx / Math.max(ry * 1.6, 1))), 0.7, 0)}
    </g>
  )
}

/**
 * One piece of the townscape: a tree, a house, an office block, a field, a
 * boulder, a boat.
 *
 * Every one of them is built the same way, which is what makes sixty of them
 * read as one model village rather than a pile of clip art:
 *   • a soft contact shadow on the ground, cast down and to the right;
 *   • a lit face on the upper left of each form and a shaded face opposite it,
 *     the same single light the rest of this project's art is drawn under;
 *   • flat fills, no outlines, and no per-piece filter — sixty filter regions
 *     is what makes a board like this crawl.
 *
 * Purely decorative: the board's `aria-label` and each tile's `<title>` carry
 * the real information.
 */
export function Scenery({
  piece,
  tileSize,
}: {
  readonly piece: SceneryPiece
  readonly tileSize: number
}): ReactElement {
  const s = tileSize * 0.4 * (0.78 + piece.seed * 0.46)
  const at = `translate(${piece.x.toFixed(1)} ${piece.y.toFixed(1)})`

  switch (piece.kind) {
    case 'tree':
      return (
        <g transform={at}>
          <ellipse cx={s * 0.16} cy={s * 0.74} rx={s * 0.62} ry={s * 0.19} className={styles.drop} />
          <rect x={-s * 0.09} y={0} width={s * 0.18} height={s * 0.62} className={styles.trunk} />
          <circle cx={s * 0.08} cy={-s * 0.2} r={s * 0.66} className={styles.leaf} />
          <circle cx={-s * 0.2} cy={-s * 0.42} r={s * 0.42} className={styles.leafLit} />
        </g>
      )

    case 'pine':
      return (
        <g transform={at}>
          <ellipse cx={s * 0.14} cy={s * 0.66} rx={s * 0.5} ry={s * 0.16} className={styles.drop} />
          <rect x={-s * 0.08} y={s * 0.1} width={s * 0.16} height={s * 0.5} className={styles.trunk} />
          <path
            d={`M 0 ${-s * 1.28} L ${s * 0.56} ${s * 0.2} L ${-s * 0.56} ${s * 0.2} Z`}
            className={styles.leaf}
          />
          <path
            d={`M 0 ${-s * 1.28} L 0 ${s * 0.2} L ${-s * 0.56} ${s * 0.2} Z`}
            className={styles.leafLit}
          />
        </g>
      )

    case 'shrub':
      return (
        <g transform={at}>
          <ellipse cx={s * 0.12} cy={s * 0.3} rx={s * 0.46} ry={s * 0.13} className={styles.drop} />
          <circle cx={s * 0.16} cy={0} r={s * 0.33} className={styles.leaf} />
          <circle cx={-s * 0.18} cy={-s * 0.06} r={s * 0.28} className={styles.leafLit} />
        </g>
      )

    case 'house': {
      const w = s * 1.16
      return (
        <g transform={at}>
          <ellipse cx={s * 0.2} cy={s * 0.62} rx={w * 0.68} ry={s * 0.2} className={styles.drop} />
          <rect x={-w / 2} y={-s * 0.1} width={w} height={s * 0.66} className={styles.wall} />
          <rect
            x={w * 0.16}
            y={-s * 0.1}
            width={w * 0.34}
            height={s * 0.66}
            className={styles.wallShade}
          />
          <path
            d={`M ${-w * 0.62} ${-s * 0.08} L 0 ${-s * 0.86} L ${w * 0.62} ${-s * 0.08} Z`}
            className={styles.roof}
          />
          <path
            d={`M 0 ${-s * 0.86} L ${w * 0.62} ${-s * 0.08} L 0 ${-s * 0.08} Z`}
            className={styles.roofShade}
          />
          <rect x={-w * 0.1} y={s * 0.16} width={w * 0.2} height={s * 0.4} className={styles.glass} />
        </g>
      )
    }

    case 'block': {
      const w = s * 1.02
      const h = s * 1.34
      return (
        <g transform={at}>
          <ellipse cx={s * 0.22} cy={s * 0.5} rx={w * 0.72} ry={s * 0.2} className={styles.drop} />
          <path
            d={`M ${-w / 2} ${-h + s * 0.18} L ${-w * 0.28} ${-h} L ${w / 2} ${-h} L ${w * 0.28} ${
              -h + s * 0.18
            } Z`}
            className={styles.bldgTop}
          />
          <rect x={-w / 2} y={-h + s * 0.18} width={w} height={h} className={styles.bldg} />
          <rect
            x={w * 0.14}
            y={-h + s * 0.18}
            width={w * 0.36}
            height={h}
            className={styles.bldgShade}
          />
          <rect x={-w * 0.34} y={-h * 0.78} width={w * 0.18} height={h * 0.16} className={styles.glass} />
          <rect x={-w * 0.06} y={-h * 0.78} width={w * 0.18} height={h * 0.16} className={styles.glass} />
          <rect x={-w * 0.34} y={-h * 0.46} width={w * 0.18} height={h * 0.16} className={styles.glass} />
          <rect x={-w * 0.06} y={-h * 0.46} width={w * 0.18} height={h * 0.16} className={styles.glass} />
        </g>
      )
    }

    case 'tower': {
      const w = s * 0.86
      const h = s * 2.15
      return (
        <g transform={at}>
          <ellipse cx={s * 0.26} cy={s * 0.44} rx={w * 0.8} ry={s * 0.2} className={styles.drop} />
          <path
            d={`M ${-w / 2} ${-h + s * 0.16} L ${-w * 0.3} ${-h} L ${w / 2} ${-h} L ${w * 0.3} ${
              -h + s * 0.16
            } Z`}
            className={styles.bldgTop}
          />
          <rect x={-w / 2} y={-h + s * 0.16} width={w} height={h} className={styles.tower} />
          <rect
            x={w * 0.1}
            y={-h + s * 0.16}
            width={w * 0.4}
            height={h}
            className={styles.towerShade}
          />
          <rect
            x={-w * 0.36}
            y={-h + s * 0.36}
            width={w * 0.2}
            height={h * 0.74}
            className={styles.glass}
          />
          <rect
            x={-w * 0.08}
            y={-h + s * 0.36}
            width={w * 0.12}
            height={h * 0.74}
            className={styles.glass}
          />
        </g>
      )
    }

    case 'works': {
      const w = s * 1.5
      const h = s * 0.86
      return (
        <g transform={at}>
          <ellipse cx={s * 0.24} cy={s * 0.5} rx={w * 0.62} ry={s * 0.2} className={styles.drop} />
          <rect
            x={w * 0.18}
            y={-h * 2.1}
            width={w * 0.16}
            height={h * 2.1}
            className={styles.bldgShade}
          />
          <rect x={-w / 2} y={-h} width={w} height={h + s * 0.3} className={styles.bldg} />
          <rect
            x={w * 0.12}
            y={-h}
            width={w * 0.38}
            height={h + s * 0.3}
            className={styles.bldgShade}
          />
          <path
            d={`M ${-w / 2} ${-h} l ${w * 0.25} ${-s * 0.34} l 0 ${s * 0.34} l ${w * 0.25} ${
              -s * 0.34
            } l 0 ${s * 0.34} Z`}
            className={styles.bldgTop}
          />
          <rect x={-w * 0.4} y={-h * 0.5} width={w * 0.5} height={h * 0.34} className={styles.glass} />
        </g>
      )
    }

    case 'school': {
      const w = s * 1.7
      const h = s * 1.05
      return (
        <g transform={at}>
          <ellipse cx={s * 0.24} cy={s * 0.56} rx={w * 0.62} ry={s * 0.22} className={styles.drop} />
          <rect x={-w * 0.06} y={-h * 2.2} width={s * 0.08} height={h * 1.1} className={styles.trunk} />
          <path
            d={`M ${-w * 0.02} ${-h * 2.2} l ${w * 0.24} ${s * 0.16} l ${-w * 0.24} ${s * 0.16} Z`}
            className={styles.roof}
          />
          <rect x={-w / 2} y={-h} width={w} height={h + s * 0.32} className={styles.wall} />
          <rect
            x={w * 0.16}
            y={-h}
            width={w * 0.34}
            height={h + s * 0.32}
            className={styles.wallShade}
          />
          <path
            d={`M ${-w * 0.56} ${-h} L 0 ${-h * 1.5} L ${w * 0.56} ${-h} Z`}
            className={styles.roof}
          />
          <path d={`M 0 ${-h * 1.5} L ${w * 0.56} ${-h} L 0 ${-h} Z`} className={styles.roofShade} />
          <rect x={-w * 0.38} y={-h * 0.72} width={w * 0.16} height={h * 0.3} className={styles.glass} />
          <rect x={-w * 0.12} y={-h * 0.72} width={w * 0.16} height={h * 0.3} className={styles.glass} />
          <rect x={-w * 0.1} y={-h * 0.18} width={w * 0.2} height={h * 0.5} className={styles.glass} />
        </g>
      )
    }

    case 'field': {
      const w = s * 1.9
      const h = s * 0.9
      return (
        <g transform={at}>
          <path
            d={`M ${-w / 2} 0 L ${-w * 0.36} ${-h / 2} L ${w / 2} ${-h / 2} L ${w * 0.36} 0 Z`}
            className={styles.crop}
          />
          <path
            d={`M ${-w * 0.24} 0 L ${-w * 0.1} ${-h / 2} M ${w * 0.02} 0 L ${w * 0.16} ${
              -h / 2
            } M ${w * 0.28} 0 L ${w * 0.42} ${-h / 2}`}
            className={styles.cropLine}
          />
        </g>
      )
    }

    case 'rock':
      return (
        <g transform={at}>
          <ellipse cx={s * 0.16} cy={s * 0.3} rx={s * 0.66} ry={s * 0.18} className={styles.drop} />
          <path
            d={`M ${-s * 0.6} ${s * 0.22} L ${-s * 0.3} ${-s * 0.5} L ${s * 0.12} ${-s * 0.66} L ${
              s * 0.58
            } ${-s * 0.1} L ${s * 0.42} ${s * 0.22} Z`}
            className={styles.rock}
          />
          <path
            d={`M ${s * 0.12} ${-s * 0.66} L ${s * 0.58} ${-s * 0.1} L ${s * 0.42} ${s * 0.22} L ${
              s * 0.06
            } ${s * 0.22} Z`}
            className={styles.rockShade}
          />
        </g>
      )

    default:
      return (
        <g transform={at}>
          <ellipse cx={0} cy={s * 0.34} rx={s * 0.86} ry={s * 0.14} className={styles.wake} />
          <path
            d={`M ${-s * 0.6} ${s * 0.06} L ${s * 0.62} ${s * 0.06} L ${s * 0.4} ${s * 0.32} L ${
              -s * 0.4
            } ${s * 0.32} Z`}
            className={styles.hull}
          />
          <path
            d={`M ${-s * 0.04} ${-s * 0.7} L ${s * 0.46} ${s * 0.02} L ${-s * 0.04} ${s * 0.02} Z`}
            className={styles.sail}
          />
          <path
            d={`M ${-s * 0.08} ${-s * 0.7} L ${-s * 0.08} ${s * 0.02} L ${-s * 0.44} ${s * 0.02} Z`}
            className={styles.sailLit}
          />
        </g>
      )
  }
}
