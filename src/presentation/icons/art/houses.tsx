import { type ReactElement } from 'react'

/**
 * The six houses, forming one value ladder: a $60k cabin at one end, a $400k
 * estate at the other. Size, storey count, roof complexity and garden detail
 * all climb together, so the ranking reads before a player looks at a price.
 *
 * All six sit in the same afternoon light, the same ground line (y = 50), and
 * the same architectural family — one neighbourhood at six different budgets —
 * so the set reads as a ladder rather than six unrelated buildings.
 */

const SKY = '#bfe3f7'
const SKY_SOFT = '#d9eefa'
const GROUND = '#8fcf8a'
const GROUND_DARK = '#6cb567'
const PATH = '#e3d2ab'

function Sky(): ReactElement {
  return (
    <g>
      <rect width="64" height="64" rx="10" fill={SKY} />
      <path d="M0 30A32 20 0 0 1 64 30V64H0Z" fill={SKY_SOFT} />
      <path d="M0 46H64V54A10 10 0 0 1 54 64H10A10 10 0 0 1 0 54Z" fill={GROUND} />
      <path d="M0 50H64V54A10 10 0 0 1 54 64H10A10 10 0 0 1 0 54Z" fill={GROUND_DARK} />
      <rect x="1" y="1" width="62" height="62" rx="9" fill="none" stroke="#8fc4de" strokeWidth="2" />
    </g>
  )
}

function Tree({ x, y, r = 6 }: { readonly x: number; readonly y: number; readonly r?: number }): ReactElement {
  return (
    <g>
      <rect x={x - 1.4} y={y - r * 0.4} width="2.8" height={r} fill="#8a5f2c" />
      <circle cx={x} cy={y - r * 0.7} r={r} fill="#5cb45c" />
      <circle cx={x - r * 0.4} cy={y - r} r={r * 0.72} fill="#6cc46a" />
    </g>
  )
}

function Window({ x, y, w = 5, h = 5, lit = true }: { readonly x: number; readonly y: number; readonly w?: number; readonly h?: number; readonly lit?: boolean }): ReactElement {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="1" fill={lit ? '#fff3c4' : '#cfe0f0'} />
      <rect x={x} y={y} width={w} height={h} rx="1" fill="none" stroke="#7a6a45" strokeWidth="0.7" opacity="0.5" />
    </g>
  )
}

export function tinyCabin(): ReactElement {
  return (
    <g>
      <Sky />
      <Tree x={10} y={47} r={5} />
      <rect x="20" y="34" width="24" height="16" fill="#c58a52" />
      <path d="M17 34 32 22 47 34Z" fill="#8a5f2c" />
      <rect x="29" y="40" width="6" height="10" fill="#6f4a26" />
      <Window x={22.5} y={38} w={4} h={4} />
      <rect x="15" y="49" width="34" height="2.4" fill={PATH} />
    </g>
  )
}

export function cozyBungalow(): ReactElement {
  return (
    <g>
      <Sky />
      <Tree x={9} y={46} r={5.6} />
      <Tree x={54} y={45} r={4.6} />
      <rect x="14" y="32" width="36" height="18" fill="#d99c5f" />
      <path d="M10 32 32 18 54 32Z" fill="#9c5c33" />
      <rect x="27" y="39" width="7" height="11" fill="#6f4a26" />
      <Window x={17} y={37} w={5} h={5} />
      <Window x={40} y={37} w={5} h={5} />
      <rect x="8" y="50" width="48" height="2.6" fill={PATH} />
    </g>
  )
}

export function suburbanTownhouse(): ReactElement {
  return (
    <g>
      <Sky />
      <Tree x={8} y={45} r={5} />
      <rect x="12" y="26" width="40" height="24" fill="#e0a26e" />
      <rect x="12" y="26" width="40" height="24" fill="#c4804f" opacity="0.18" />
      <path d="M9 26 32 12 55 26Z" fill="#a5683c" />
      <rect x="18" y="16" width="6" height="10" fill="#8a5f2c" />
      <rect x="27" y="38" width="8" height="12" fill="#6f4a26" />
      <Window x={16} y={31} w={5} h={5} />
      <Window x={41} y={31} w={5} h={5} />
      <Window x={16} y={40} w={5} h={5} lit={false} />
      <Window x={41} y={40} w={5} h={5} lit={false} />
      <rect x="6" y="50" width="52" height="2.6" fill={PATH} />
    </g>
  )
}

export function modernDuplex(): ReactElement {
  return (
    <g>
      <Sky />
      <Tree x={7} y={44} r={4.6} />
      <Tree x={57} y={44} r={4.6} />
      <rect x="10" y="30" width="44" height="20" fill="#8f95a8" />
      <rect x="10" y="18" width="44" height="14" fill="#6f7690" />
      <rect x="9" y="16.4" width="46" height="3" fill="#4c5268" />
      <rect x="27" y="38" width="9" height="12" fill="#2b2f3d" />
      <Window x={14} y={34} w={6} h={5} />
      <Window x={44} y={34} w={6} h={5} />
      <Window x={14} y={22} w={6} h={5} lit={false} />
      <Window x={44} y={22} w={6} h={5} />
      <rect x="4" y="50" width="56" height="2.6" fill={PATH} />
    </g>
  )
}

export function lakesideVilla(): ReactElement {
  return (
    <g>
      <rect width="64" height="64" rx="10" fill={SKY} />
      <path d="M0 30A32 20 0 0 1 64 30V64H0Z" fill={SKY_SOFT} />
      <path d="M0 44H64V64H0Z" fill="#6fb8d8" />
      <path d="M0 44H64V47H0Z" fill="#8fcaea" />
      <rect x="1" y="1" width="62" height="62" rx="9" fill="none" stroke="#8fc4de" strokeWidth="2" />
      <Tree x={6} y={41} r={5} />
      <rect x="8" y="24" width="30" height="20" fill="#eadfc8" />
      <path d="M5 24 23 12 41 24Z" fill="#b23425" />
      <rect x="34" y="30" width="20" height="14" fill="#d9cdb0" />
      <path d="M31 30 44 20 57 30Z" fill="#933" opacity="0.85" />
      <Window x={13} y={29} w={5} h={5} />
      <Window x={24} y={29} w={5} h={5} />
      <Window x={39} y={35} w={5} h={5} />
      <Window x={47} y={35} w={5} h={5} />
      <rect x="18" y="38" width="7" height="6" fill="#6f4a26" />
      <rect x="4" y="41" width="56" height="3" fill="#c9b98b" />
    </g>
  )
}

export function lavishEstate(): ReactElement {
  return (
    <g>
      <Sky />
      <Tree x={6} y={44} r={5.4} />
      <Tree x={58} y={44} r={5.4} />
      <Tree x={13} y={47} r={3.6} />
      <Tree x={51} y={47} r={3.6} />
      <rect x="9" y="28" width="46" height="22" fill="#f3ead9" />
      <path d="M6 28 32 14 58 28Z" fill="#8a5f2c" />
      <rect x="20" y="22" width="24" height="8" fill="#f3ead9" />
      <path d="M18 22 32 13 46 22Z" fill="#6f4a26" />
      <rect x="27" y="38" width="10" height="12" fill="#6f4a26" />
      <rect x="26.4" y="36.4" width="11.2" height="2.2" fill="#4c331a" />
      <Window x={13} y={33} w={5} h={5} />
      <Window x={22} y={33} w={4.4} h={5} />
      <Window x={38} y={33} w={4.4} h={5} />
      <Window x={46} y={33} w={5} h={5} />
      <g stroke="#c9861a" strokeWidth="1.4">
        <path d="M12 50V44M52 50V44" />
      </g>
      <ellipse cx="12" cy="43.4" rx="1.6" ry="1.6" fill="#f3b13c" />
      <ellipse cx="52" cy="43.4" rx="1.6" ry="1.6" fill="#f3b13c" />
      <rect x="3" y="50" width="58" height="2.8" fill="#e3d2ab" />
    </g>
  )
}
