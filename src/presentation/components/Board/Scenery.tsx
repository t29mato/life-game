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

    case 'mansard': {
      // A Haussmann block: a cream body, a steep dark mansard roof with
      // dormers, and tall windows in rows — Paris's ordinary street, not a
      // monument.
      const w = s * 1.24
      const h = s * 0.92
      return (
        <g transform={at}>
          <ellipse cx={s * 0.2} cy={s * 0.5} rx={w * 0.66} ry={s * 0.2} className={styles.drop} />
          <rect x={-w / 2} y={-h * 0.55} width={w} height={h * 0.9} className={styles.wall} />
          <rect
            x={w * 0.14}
            y={-h * 0.55}
            width={w * 0.36}
            height={h * 0.9}
            className={styles.wallShade}
          />
          <path
            d={`M ${-w * 0.56} ${-h * 0.55} L ${-w * 0.36} ${-h * 1.05} L ${w * 0.36} ${-h * 1.05} L ${
              w * 0.56
            } ${-h * 0.55} Z`}
            className={styles.roof}
          />
          <path
            d={`M ${w * 0.08} ${-h * 1.05} L ${w * 0.36} ${-h * 1.05} L ${w * 0.56} ${-h * 0.55} L ${
              w * 0.18
            } ${-h * 0.55} Z`}
            className={styles.roofShade}
          />
          <rect x={-w * 0.3} y={-h * 0.94} width={w * 0.12} height={h * 0.2} className={styles.wall} />
          <rect x={w * 0.04} y={-h * 0.94} width={w * 0.12} height={h * 0.2} className={styles.wall} />
          <rect x={-w * 0.36} y={-h * 0.32} width={w * 0.14} height={h * 0.44} className={styles.glass} />
          <rect x={-w * 0.07} y={-h * 0.32} width={w * 0.14} height={h * 0.44} className={styles.glass} />
          <rect x={w * 0.22} y={-h * 0.32} width={w * 0.14} height={h * 0.44} className={styles.glass} />
        </g>
      )
    }

    case 'rowhouse': {
      // A terrace of flat-fronted brick rowhouses, each one a step off its
      // neighbour's cornice line — the residential street of a capital that
      // builds low.
      const w = s * 1.5
      const third = w / 3
      const rises = [0.72, 0.92, 0.8]
      return (
        <g transform={at}>
          <ellipse cx={s * 0.2} cy={s * 0.46} rx={w * 0.62} ry={s * 0.18} className={styles.drop} />
          {rises.map((rise, index) => {
            const x0 = -w / 2 + third * index
            const h = s * rise
            return (
              <g key={index}>
                <rect x={x0} y={-h} width={third} height={h + s * 0.22} className={styles.roof} />
                <rect
                  x={x0 + third * 0.6}
                  y={-h}
                  width={third * 0.4}
                  height={h + s * 0.22}
                  className={styles.roofShade}
                />
                <rect x={x0} y={-h - s * 0.09} width={third} height={s * 0.09} className={styles.wall} />
                <rect
                  x={x0 + third * 0.2}
                  y={-h * 0.58}
                  width={third * 0.28}
                  height={h * 0.34}
                  className={styles.glass}
                />
              </g>
            )
          })}
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

    /*
     * The guaranteed pieces of a capital's skyline — see `capitalSkylineFor`
     * in `boardLayout.ts`. Built from the same flat, faceted vocabulary as
     * everything else here (a lit face, a shaded one, one drop shadow), just
     * at a height nothing else on the map reaches, so each reads as *behind*
     * the board rather than a tile that grew too big. Every one is an
     * original silhouette in this game's own style — a shape that evokes the
     * real skyline, never a reproduction of any real building.
     */
    case 'landmark-usa-capitol': {
      // A domed legislature closing a long green mall: two low wings, a
      // columned centre with a pediment, a drum, and a ribbed marble dome.
      const w = s * 2.6
      const h = s * 0.9
      return (
        <g transform={`${at} scale(2.2)`}>
          <ellipse cx={s * 0.14} cy={s * 0.18} rx={w * 0.58} ry={s * 0.2} className={styles.drop} />
          <rect x={-w / 2} y={-h * 0.78} width={w * 0.36} height={h * 0.78} className={styles.landmark} />
          <rect x={-w * 0.24} y={-h * 0.78} width={w * 0.1} height={h * 0.78} className={styles.landmarkShade} />
          <rect x={w * 0.14} y={-h * 0.78} width={w * 0.36} height={h * 0.78} className={styles.landmark} />
          <rect x={w * 0.32} y={-h * 0.78} width={w * 0.18} height={h * 0.78} className={styles.landmarkShade} />
          <rect x={-w * 0.17} y={-h} width={w * 0.34} height={h} className={styles.landmark} />
          <rect x={w * 0.07} y={-h} width={w * 0.1} height={h} className={styles.landmarkShade} />
          {[-0.11, -0.05, 0.01].map((dx) => (
            <rect
              key={dx}
              x={w * dx}
              y={-h * 0.8}
              width={w * 0.02}
              height={h * 0.6}
              className={styles.landmarkShade}
            />
          ))}
          <path d={`M ${-w * 0.15} ${-h} L 0 ${-h * 1.2} L ${w * 0.15} ${-h} Z`} className={styles.landmark} />
          <path d={`M 0 ${-h * 1.2} L ${w * 0.15} ${-h} L ${w * 0.02} ${-h} Z`} className={styles.landmarkShade} />
          <rect x={-s * 0.4} y={-s * 1.5} width={s * 0.8} height={s * 0.42} className={styles.landmark} />
          <rect x={s * 0.14} y={-s * 1.5} width={s * 0.26} height={s * 0.42} className={styles.landmarkShade} />
          {[-0.3, -0.16, -0.02].map((dx) => (
            <rect
              key={dx}
              x={s * dx}
              y={-s * 1.46}
              width={s * 0.05}
              height={s * 0.34}
              className={styles.landmarkShade}
            />
          ))}
          <path
            d={`M ${-s * 0.44} ${-s * 1.5} A ${s * 0.44} ${s * 0.58} 0 0 1 ${s * 0.44} ${-s * 1.5} Z`}
            className={styles.landmark}
          />
          <path
            d={`M 0 ${-s * 2.08} A ${s * 0.44} ${s * 0.58} 0 0 1 ${s * 0.44} ${-s * 1.5} L 0 ${-s * 1.5} Z`}
            className={styles.landmarkShade}
          />
          <rect x={-s * 0.05} y={-s * 2.2} width={s * 0.1} height={s * 0.14} className={styles.landmark} />
          <path
            d={`M 0 ${-s * 2.38} L ${s * 0.06} ${-s * 2.2} L ${-s * 0.06} ${-s * 2.2} Z`}
            className={styles.landmarkAccent}
          />
        </g>
      )
    }

    case 'landmark-usa-obelisk': {
      // A bare marble shaft with a pyramidion — the monument the whole city
      // measures its horizon against.
      const h = s * 3.4
      return (
        <g transform={`${at} scale(2.2)`}>
          <ellipse cx={s * 0.1} cy={s * 0.14} rx={s * 0.5} ry={s * 0.16} className={styles.drop} />
          <path
            d={`M ${-s * 0.22} 0 L ${-s * 0.13} ${-h} L ${s * 0.13} ${-h} L ${s * 0.22} 0 Z`}
            className={styles.landmark}
          />
          <path
            d={`M ${s * 0.02} 0 L ${s * 0.06} ${-h} L ${s * 0.13} ${-h} L ${s * 0.22} 0 Z`}
            className={styles.landmarkShade}
          />
          <path d={`M ${-s * 0.13} ${-h} L 0 ${-h - s * 0.34} L ${s * 0.13} ${-h} Z`} className={styles.landmark} />
          <path
            d={`M 0 ${-h - s * 0.34} L ${s * 0.13} ${-h} L ${s * 0.02} ${-h} Z`}
            className={styles.landmarkShade}
          />
        </g>
      )
    }

    case 'landmark-japan-tower': {
      // A broadcast lattice tower painted for air safety: a straight
      // vermillion taper carrying a main deck, a top deck, and a mast — the
      // pin every map of this capital is stuck through.
      const h = s * 4.6
      const base = s * 1.2
      return (
        <g transform={`${at} scale(1.6)`}>
          <ellipse cx={s * 0.12} cy={s * 0.14} rx={base * 0.64} ry={s * 0.18} className={styles.drop} />
          <path
            d={`M ${-base / 2} 0 L ${-s * 0.26} ${-h * 0.44} L ${-s * 0.1} ${-h * 0.9} L ${s * 0.1} ${-h * 0.9} L ${s * 0.26} ${-h * 0.44} L ${base / 2} 0 Z`}
            className={styles.landmark}
          />
          <path
            d={`M 0 0 L ${s * 0.26} ${-h * 0.44} L ${s * 0.1} ${-h * 0.9} L 0 ${-h * 0.9} Z`}
            className={styles.landmarkShade}
          />
          <path
            d={`M ${-base * 0.42} ${-s * 0.02} L ${s * 0.26} ${-h * 0.44} M ${base * 0.42} ${-s * 0.02} L ${-s * 0.26} ${-h * 0.44} M ${-s * 0.26} ${-h * 0.44} L ${s * 0.12} ${-h * 0.86} M ${s * 0.26} ${-h * 0.44} L ${-s * 0.12} ${-h * 0.86}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={s * 0.03}
            fill="none"
          />
          <rect x={-s * 0.34} y={-h * 0.5} width={s * 0.68} height={h * 0.06} className={styles.landmarkAccent} />
          <rect x={-s * 0.16} y={-h * 0.9} width={s * 0.32} height={h * 0.05} className={styles.landmarkAccent} />
          <rect x={-s * 0.03} y={-h * 1.04} width={s * 0.06} height={h * 0.14} className={styles.landmark} />
        </g>
      )
    }

    case 'landmark-japan-fuji': {
      // Fuji on the horizon, snow-capped — the silhouette this capital's own
      // skyline is always drawn against on a clear winter day.
      const w = s * 2.4
      const h = s * 2.2
      return (
        <g transform={`${at} scale(2.6)`}>
          <ellipse cx={s * 0.2} cy={s * 0.16} rx={w * 0.62} ry={s * 0.22} className={styles.drop} />
          <path d={`M ${-w / 2} 0 L 0 ${-h} L ${w / 2} 0 Z`} className={styles.landmarkAlt} />
          <path d={`M 0 ${-h} L ${w / 2} 0 L ${w * 0.06} 0 Z`} className={styles.landmarkAltShade} />
          <path
            d={`M ${-s * 0.24} ${-h * 0.78} L 0 ${-h} L ${s * 0.26} ${-h * 0.76} L ${s * 0.1} ${-h * 0.68} L ${-s * 0.08} ${-h * 0.7} Z`}
            fill="#f6faff"
          />
          <path
            d={`M 0 ${-h} L ${s * 0.26} ${-h * 0.76} L ${s * 0.1} ${-h * 0.68} Z`}
            fill="#cfe0ee"
          />
        </g>
      )
    }

    case 'landmark-japan-pagoda': {
      // A temple pagoda among the rooftops: three tiers of flaring slate
      // roofs on a vermillion frame, and a finial spire.
      const w = s * 1.6
      const h = s * 2.3
      const tiers = [
        { base: 0, half: 0.34, roof: 0.5 },
        { base: -h * 0.34, half: 0.28, roof: 0.42 },
        { base: -h * 0.68, half: 0.22, roof: 0.34 },
      ]
      return (
        <g transform={`${at} scale(1.7)`}>
          <ellipse cx={s * 0.14} cy={s * 0.16} rx={w * 0.56} ry={s * 0.18} className={styles.drop} />
          {tiers.map((tier, index) => (
            <g key={index}>
              <rect
                x={-w * tier.half}
                y={tier.base - h * 0.26}
                width={w * tier.half * 2}
                height={h * 0.26}
                className={styles.landmark}
              />
              <rect
                x={w * tier.half * 0.3}
                y={tier.base - h * 0.26}
                width={w * tier.half * 0.7}
                height={h * 0.26}
                className={styles.landmarkShade}
              />
              <path
                d={`M ${-w * tier.roof} ${tier.base - h * 0.26} L 0 ${tier.base - h * 0.4} L ${
                  w * tier.roof
                } ${tier.base - h * 0.26} Z`}
                className={styles.landmarkAlt}
              />
              <path
                d={`M 0 ${tier.base - h * 0.4} L ${w * tier.roof} ${tier.base - h * 0.26} L ${
                  w * tier.roof * 0.1
                } ${tier.base - h * 0.26} Z`}
                className={styles.landmarkAltShade}
              />
            </g>
          ))}
          <rect x={-s * 0.03} y={-h * 1.2} width={s * 0.06} height={h * 0.12} className={styles.landmarkAccent} />
          <path
            d={`M 0 ${-h * 1.28} L ${s * 0.06} ${-h * 1.2} L ${-s * 0.06} ${-h * 1.2} Z`}
            className={styles.landmarkAccent}
          />
        </g>
      )
    }

    case 'landmark-france-eiffel': {
      // The Eiffel Tower: four stacked, tapering iron segments and a spire.
      const h = s * 5.2
      const base = s * 1.3
      return (
        <g transform={`${at} scale(1.5)`}>
          <ellipse cx={s * 0.14} cy={s * 0.14} rx={base * 0.66} ry={s * 0.2} className={styles.drop} />
          <path
            d={`M ${-base / 2} 0 L ${-s * 0.22} ${-h * 0.42} L ${-s * 0.22} ${-h * 0.78} L ${-s * 0.06} ${-h} L ${s * 0.06} ${-h} L ${s * 0.22} ${-h * 0.78} L ${s * 0.22} ${-h * 0.42} L ${base / 2} 0 Z`}
            className={styles.landmark}
          />
          <path
            d={`M 0 0 L ${s * 0.22} ${-h * 0.42} L ${s * 0.22} ${-h * 0.78} L ${s * 0.06} ${-h} L 0 ${-h} Z`}
            className={styles.landmarkShade}
          />
          <path
            d={`M ${-base * 0.42} ${-s * 0.02} L ${s * 0.22} ${-h * 0.42} M ${base * 0.42} ${-s * 0.02} L ${-s * 0.22} ${-h * 0.42} M ${-s * 0.22} ${-h * 0.42} L ${s * 0.22} ${-h * 0.78} M ${s * 0.22} ${-h * 0.42} L ${-s * 0.22} ${-h * 0.78}`}
            stroke="rgba(255,255,255,0.3)"
            strokeWidth={s * 0.03}
            fill="none"
          />
          <rect x={-s * 0.03} y={-h * 1.06} width={s * 0.06} height={h * 0.06} className={styles.landmarkAccent} />
        </g>
      )
    }

    case 'landmark-france-arch': {
      // A triumphal arch closing a long avenue: two limestone piers, one
      // barrel vault, and an attic storey above the cornice.
      const w = s * 1.8
      const h = s * 1.9
      return (
        <g transform={`${at} scale(1.9)`}>
          <ellipse cx={s * 0.12} cy={s * 0.16} rx={w * 0.6} ry={s * 0.2} className={styles.drop} />
          <rect x={-w / 2} y={-h * 0.82} width={w} height={h * 0.82} className={styles.landmarkAlt} />
          <rect x={0} y={-h * 0.82} width={w / 2} height={h * 0.82} className={styles.landmarkAltShade} />
          <rect x={-w * 0.46} y={-h} width={w * 0.92} height={h * 0.16} className={styles.landmarkAlt} />
          <rect x={0} y={-h} width={w * 0.46} height={h * 0.16} className={styles.landmarkAltShade} />
          <path
            d={`M ${-w * 0.2} 0 L ${-w * 0.2} ${-h * 0.44} A ${w * 0.2} ${w * 0.2} 0 0 1 ${w * 0.2} ${-h * 0.44} L ${w * 0.2} 0 Z`}
            fill="rgba(26, 22, 14, 0.38)"
          />
          <rect x={-w * 0.42} y={-h * 0.78} width={w * 0.84} height={h * 0.04} fill="rgba(255,255,255,0.35)" />
        </g>
      )
    }

    case 'landmark-india-gate': {
      // India Gate: a sandstone triumphal arch.
      const w = s * 1.9
      const h = s * 2.0
      return (
        <g transform={`${at} scale(1.7)`}>
          <ellipse cx={s * 0.14} cy={s * 0.16} rx={w * 0.6} ry={s * 0.2} className={styles.drop} />
          <rect x={-w / 2} y={-h} width={w} height={h} className={styles.landmark} />
          <rect x={0} y={-h} width={w / 2} height={h} className={styles.landmarkShade} />
          <rect x={-w / 2} y={-h * 1.12} width={w} height={h * 0.12} className={styles.landmark} />
          <rect x={0} y={-h * 1.12} width={w / 2} height={h * 0.12} className={styles.landmarkShade} />
          <path
            d={`M ${-w * 0.22} 0 L ${-w * 0.22} ${-h * 0.62} A ${w * 0.22} ${w * 0.22} 0 0 1 ${w * 0.22} ${-h * 0.62} L ${w * 0.22} 0 Z`}
            fill="var(--sea-deep, #1a86bd)"
            opacity={0.35}
          />
        </g>
      )
    }

    case 'landmark-india-dome': {
      // The secretariat of a garden capital: a long colonnaded sandstone
      // front under one broad dome, a chhatri at each end of the roofline.
      const w = s * 2.5
      const h = s * 1.0
      return (
        <g transform={`${at} scale(2.0)`}>
          <ellipse cx={s * 0.14} cy={s * 0.18} rx={w * 0.56} ry={s * 0.2} className={styles.drop} />
          <rect x={-w / 2} y={-h * 0.6} width={w} height={h * 0.6} className={styles.landmark} />
          <rect x={w * 0.1} y={-h * 0.6} width={w * 0.4} height={h * 0.6} className={styles.landmarkShade} />
          {[-0.38, -0.26, -0.14, -0.02].map((dx) => (
            <rect
              key={dx}
              x={w * dx}
              y={-h * 0.52}
              width={w * 0.02}
              height={h * 0.42}
              className={styles.landmarkShade}
            />
          ))}
          {[-1, 1].map((side) => (
            <g key={side} transform={`translate(${side * w * 0.4} 0)`}>
              <rect x={-s * 0.1} y={-h * 0.86} width={s * 0.2} height={h * 0.26} className={styles.landmark} />
              <rect x={0} y={-h * 0.86} width={s * 0.1} height={h * 0.26} className={styles.landmarkShade} />
              <path
                d={`M ${-s * 0.12} ${-h * 0.86} A ${s * 0.12} ${s * 0.12} 0 0 1 ${s * 0.12} ${-h * 0.86} Z`}
                className={styles.landmarkAlt}
              />
            </g>
          ))}
          <rect x={-s * 0.42} y={-h * 0.88} width={s * 0.84} height={h * 0.28} className={styles.landmark} />
          <rect x={s * 0.14} y={-h * 0.88} width={s * 0.28} height={h * 0.28} className={styles.landmarkShade} />
          <path
            d={`M ${-s * 0.5} ${-h * 0.88} A ${s * 0.5} ${s * 0.6} 0 0 1 ${s * 0.5} ${-h * 0.88} Z`}
            className={styles.landmarkAlt}
          />
          <path
            d={`M 0 ${-h * 0.88 - s * 0.6} A ${s * 0.5} ${s * 0.6} 0 0 1 ${s * 0.5} ${-h * 0.88} L 0 ${-h * 0.88} Z`}
            className={styles.landmarkAltShade}
          />
          <path
            d={`M 0 ${-h * 0.88 - s * 0.78} L ${s * 0.06} ${-h * 0.88 - s * 0.58} L ${-s * 0.06} ${-h * 0.88 - s * 0.58} Z`}
            className={styles.landmarkAccent}
          />
        </g>
      )
    }

    case 'landmark-bolivia-peak': {
      // The snowbound massif standing over the city bowl: twin glaciated
      // summits on bare rock, far higher than any hill the ridges draw.
      const w = s * 2.7
      const h = s * 2.0
      return (
        <g transform={`${at} scale(2.6)`}>
          <ellipse cx={s * 0.2} cy={s * 0.16} rx={w * 0.6} ry={s * 0.22} className={styles.drop} />
          <path
            d={`M ${-w / 2} 0 L ${-w * 0.16} ${-h} L ${w * 0.04} ${-h * 0.72} L ${w * 0.26} ${-h * 0.9} L ${w / 2} 0 Z`}
            className={styles.landmark}
          />
          <path
            d={`M ${w * 0.26} ${-h * 0.9} L ${w / 2} 0 L ${w * 0.1} 0 L ${w * 0.04} ${-h * 0.72} Z`}
            className={styles.landmarkShade}
          />
          <path
            d={`M ${-w * 0.34} ${-h * 0.5} L ${-w * 0.16} ${-h} L ${-w * 0.0} ${-h * 0.6} L ${-w * 0.04} ${-h * 0.46} L ${-w * 0.14} ${-h * 0.52} L ${-w * 0.24} ${-h * 0.44} Z`}
            fill="#f6faff"
          />
          <path
            d={`M ${w * 0.08} ${-h * 0.5} L ${w * 0.26} ${-h * 0.9} L ${w * 0.42} ${-h * 0.46} L ${w * 0.32} ${-h * 0.4} L ${w * 0.2} ${-h * 0.46} Z`}
            fill="#f6faff"
          />
          <path
            d={`M ${w * 0.26} ${-h * 0.9} L ${w * 0.42} ${-h * 0.46} L ${w * 0.32} ${-h * 0.4} Z`}
            fill="#cfe0ee"
          />
        </g>
      )
    }

    case 'landmark-bolivia-cablecar': {
      // The city's own transit strung across its canyon: two pylons, one
      // cable, and a pair of gondola cabins riding the line.
      const w = s * 2.2
      const from = { x: -w / 2 - s * 0.3, y: -s * 0.98 }
      const to = { x: w / 2 + s * 0.3, y: -s * 1.38 }
      return (
        <g transform={`${at} scale(1.8)`}>
          <ellipse cx={-w / 2 + s * 0.1} cy={s * 0.1} rx={s * 0.34} ry={s * 0.12} className={styles.drop} />
          <ellipse cx={w / 2 + s * 0.1} cy={s * 0.1} rx={s * 0.34} ry={s * 0.12} className={styles.drop} />
          <rect x={-w / 2 - s * 0.05} y={-s * 1.02} width={s * 0.1} height={s * 1.02} className={styles.landmarkShade} />
          <rect x={-w / 2 - s * 0.22} y={-s * 1.06} width={s * 0.44} height={s * 0.08} className={styles.landmarkShade} />
          <rect x={w / 2 - s * 0.05} y={-s * 1.42} width={s * 0.1} height={s * 1.42} className={styles.landmarkShade} />
          <rect x={w / 2 - s * 0.22} y={-s * 1.46} width={s * 0.44} height={s * 0.08} className={styles.landmarkShade} />
          <path
            d={`M ${from.x} ${from.y} L ${to.x} ${to.y}`}
            stroke="rgba(40, 30, 16, 0.55)"
            strokeWidth={s * 0.045}
            fill="none"
          />
          {[0.32, 0.68].map((t) => {
            const cx = from.x + (to.x - from.x) * t
            const cy = from.y + (to.y - from.y) * t
            return (
              <g key={t}>
                <rect x={cx - s * 0.025} y={cy} width={s * 0.05} height={s * 0.16} className={styles.landmarkAccentShade} />
                <rect
                  x={cx - s * 0.24}
                  y={cy + s * 0.16}
                  width={s * 0.48}
                  height={s * 0.36}
                  rx={s * 0.1}
                  className={styles.landmarkAccent}
                />
                <rect
                  x={cx - s * 0.16}
                  y={cy + s * 0.24}
                  width={s * 0.32}
                  height={s * 0.14}
                  rx={s * 0.05}
                  fill="rgba(255, 255, 255, 0.65)"
                />
              </g>
            )
          })}
        </g>
      )
    }

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
