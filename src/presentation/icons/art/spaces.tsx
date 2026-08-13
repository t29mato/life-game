import { type ReactElement, type ReactNode } from 'react'

import { Coin, Ground, HAIR, Note, SKIN } from '../parts'

/**
 * The sixty-four life events a player can land on.
 *
 * Roughly half of these are things a person *does* — a graduation, a wedding,
 * a first paycheck, a child's school play — and those are drawn with people in
 * them. The rest are things that happen *to* a player's wallet, and those stay
 * objects, so a board of sixty-four tiles keeps a readable rhythm instead of
 * becoming a crowd scene.
 *
 * Everything is built from the small vocabulary below, on the same 64×64 grid
 * as the rest of the art, flat-shaded, lit from the upper left. Money is always
 * the shared `Coin` and `Note` from `../parts` so a payday reads as a payday
 * wherever it appears, and people are always the same proportions as the shared
 * `Figure` — one head to roughly three of body — so the spaces, the careers and
 * the houses look like one set.
 */

// ---------------------------------------------------------------------------
// Palette. Mid-tone and saturated on purpose: every drawing has to survive on
// a pale pastel tile *and* on the dark panel of an event card, so nothing here
// is near-white or near-black except small accents.
// ---------------------------------------------------------------------------

const C = {
  ink: '#2b2118',
  paper: '#fdf6e6',
  paperEdge: '#c3ad86',
  paperShade: '#e7dabb',
  gold: '#f3b13c',
  goldDark: '#c9861a',
  goldLite: '#ffd98a',
  green: '#5bc47f',
  greenDark: '#3f9e60',
  red: '#e8595b',
  redDark: '#bd3a44',
  blue: '#5aa9e6',
  blueDark: '#3a7fbf',
  purple: '#8f7fd6',
  purpleDark: '#6f5fc0',
  pink: '#f2809f',
  pinkDark: '#c95a7d',
  orange: '#f0913c',
  orangeDark: '#c96a24',
  teal: '#3fc0b0',
  tealDark: '#2a9689',
  wood: '#c58a52',
  woodDark: '#966435',
  leaf: '#5cb45c',
  leafDark: '#3d8a45',
  night: '#3a4270',
  nightDark: '#262d55',
  steel: '#a3b2cc',
  steelDark: '#74839f',
  cloud: '#eaf1fb',
  slate: '#5c6784',
  grey: '#cfd6e4',
} as const

// ---------------------------------------------------------------------------
// People. `Head` owns the whole facial vocabulary, `Person` a full body posed
// by moving its hands and feet, `Bust` a head-and-shoulders for group shots.
// ---------------------------------------------------------------------------

type Pt = readonly [number, number]
type HairStyle = 'short' | 'long' | 'bun' | 'none'
type Face = 'smile' | 'flat' | 'sad' | 'shock' | 'joy'

/** Eyes and mouth, drawn at the head's own origin. */
function FaceMarks({ face }: { readonly face: Face }): ReactElement {
  if (face === 'joy') {
    return (
      <g stroke={C.ink} strokeWidth="1.25" strokeLinecap="round" fill="none">
        <path d="M-5 1.2Q-3.4-1.1-1.8 1.2M1.8 1.2Q3.4-1.1 5 1.2" />
        <path d="M-2.8 3.9Q0 6.6 2.8 3.9" />
      </g>
    )
  }
  if (face === 'shock') {
    return (
      <g>
        <circle cx="-3.4" cy="0.4" r="1.45" fill={C.ink} />
        <circle cx="3.4" cy="0.4" r="1.45" fill={C.ink} />
        <ellipse cx="0" cy="5" rx="1.7" ry="2.1" fill={C.ink} />
      </g>
    )
  }
  const mouth =
    face === 'sad' ? 'M-2.6 5.3Q0 2.9 2.6 5.3' : face === 'flat' ? 'M-2.6 4.6h5.2' : 'M-2.6 4.2Q0 6.6 2.6 4.2'
  return (
    <g>
      <circle cx="-3.4" cy="0.6" r="1.15" fill={C.ink} />
      <circle cx="3.4" cy="0.6" r="1.15" fill={C.ink} />
      {face === 'sad' ? (
        <path
          d="M-5.6-2.9 -2.8-1.7M5.6-2.9 2.8-1.7"
          stroke={C.ink}
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
        />
      ) : null}
      <path d={mouth} stroke={C.ink} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** A head at its own origin, sized by `r` (9 is an adult). */
function Head({
  skin = SKIN[0],
  hair = HAIR[0],
  hairStyle = 'short',
  face = 'smile',
  r = 9,
}: {
  readonly skin?: string
  readonly hair?: string
  readonly hairStyle?: HairStyle
  readonly face?: Face
  readonly r?: number
}): ReactElement {
  return (
    <g transform={`scale(${(r / 9).toFixed(3)})`}>
      {hairStyle === 'long' ? <path d="M-12 1c0 8 2 12 2 12h20s2-4 2-12z" fill={hair} /> : null}
      <circle cx="0" cy="0" r="9" fill={skin} />
      <path d="M0-9a9 9 0 0 1 0 18z" fill="rgba(90,50,20,0.09)" />
      {hairStyle === 'short' || hairStyle === 'bun' ? (
        <path d="M-9-1a9 9 0 0 1 18 0c0-3-3-5-9-5s-9 2-9 5z" fill={hair} />
      ) : null}
      {hairStyle === 'long' ? (
        <path d="M-9-1a9 9 0 0 1 18 0c0-4-3-6-9-6s-9 2-9 6z" fill={hair} />
      ) : null}
      {hairStyle === 'bun' ? <circle cx="0" cy="-10.6" r="3.6" fill={hair} /> : null}
      <FaceMarks face={face} />
    </g>
  )
}

interface PersonProps {
  /** Where the feet stand. */
  readonly x?: number
  readonly y?: number
  readonly s?: number
  readonly flip?: boolean
  readonly wear?: string
  readonly wearDark?: string
  readonly pants?: string
  readonly pantsDark?: string
  readonly skin?: string
  readonly hair?: string
  readonly hairStyle?: HairStyle
  readonly face?: Face
  /** Head scale — children get a bigger one. */
  readonly head?: number
  readonly hands?: readonly [Pt, Pt]
  readonly feet?: readonly [Pt, Pt]
  /** Off when a desk, a counter or a gown takes over below the waist. */
  readonly legs?: boolean
  /** Props and headwear, in the figure's own coordinates. */
  readonly children?: ReactNode
}

/**
 * A whole person, standing with feet at (`x`, `y`). Same silhouette and
 * proportions as the shared `Figure`, but limbs are posed by naming where the
 * hands and feet go, which is what lets one body sit at a desk, raise a
 * diploma, cradle a baby, or shake a hand.
 */
function Person({
  x = 32,
  y = 57,
  s = 1,
  flip = false,
  wear = C.blue,
  wearDark = C.blueDark,
  pants = '#3d4763',
  pantsDark = '#2f3852',
  skin = SKIN[0],
  hair = HAIR[0],
  hairStyle = 'short',
  face = 'smile',
  head = 1,
  hands = [
    [-14, -20],
    [14, -20],
  ],
  feet = [
    [-4.5, -3],
    [4.5, -3],
  ],
  legs = true,
  children,
}: PersonProps): ReactElement {
  const [lh, rh] = hands
  const [lf, rf] = feet
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      {legs ? (
        <g strokeWidth="5" strokeLinecap="round" fill="none">
          <path d={`M-4.5-16 ${lf[0]} ${lf[1]}`} stroke={pants} />
          <path d={`M4.5-16 ${rf[0]} ${rf[1]}`} stroke={pantsDark} />
        </g>
      ) : null}
      <path
        d="M0-37.5c6.2 0 10.5 3.4 11.4 8.6l1.6 9.4a4 4 0 0 1-3.9 4.7H-9.1a4 4 0 0 1-3.9-4.7l1.6-9.4C-10.5-34.1-6.2-37.5 0-37.5z"
        fill={wear}
      />
      <path
        d="M0-37.5c6.2 0 10.5 3.4 11.4 8.6l1.6 9.4a4 4 0 0 1-3.9 4.7H0z"
        fill={wearDark}
      />
      <g strokeWidth="5.4" strokeLinecap="round" fill="none">
        <path d={`M-9.6-33 ${lh[0]} ${lh[1]}`} stroke={wear} />
        <path d={`M9.6-33 ${rh[0]} ${rh[1]}`} stroke={wearDark} />
      </g>
      <circle cx={lh[0]} cy={lh[1]} r="3" fill={skin} />
      <circle cx={rh[0]} cy={rh[1]} r="3" fill={skin} />
      <path d="M-3-42.5h6v6h-6z" fill={SKIN[1]} />
      <g transform="translate(0 -46.5)">
        <Head skin={skin} hair={hair} hairStyle={hairStyle} face={face} r={9 * head} />
      </g>
      {children}
    </g>
  )
}

interface BustProps {
  readonly x: number
  readonly y: number
  readonly s?: number
  readonly wear?: string
  readonly wearDark?: string
  readonly skin?: string
  readonly hair?: string
  readonly hairStyle?: HairStyle
  readonly face?: Face
  readonly head?: number
}

/** Head and shoulders, for portraits and crowds where legs would only blur. */
function Bust({
  x,
  y,
  s = 1,
  wear = C.blue,
  wearDark = C.blueDark,
  skin = SKIN[0],
  hair = HAIR[0],
  hairStyle = 'short',
  face = 'smile',
  head = 1,
}: BustProps): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-13 0v-3a13 11 0 0 1 26 0v3z" fill={wear} />
      <path d="M0-14a13 11 0 0 1 13 11v3H0z" fill={wearDark} />
      <path d="M-3-13h6v6h-6z" fill={SKIN[1]} />
      <g transform="translate(0 -18)">
        <Head skin={skin} hair={hair} hairStyle={hairStyle} face={face} r={8 * head} />
      </g>
    </g>
  )
}

/** A swaddled newborn. */
function Baby({
  x,
  y,
  s = 1,
  blanket = C.pink,
}: {
  readonly x: number
  readonly y: number
  readonly s?: number
  readonly blanket?: string
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <path d="M-11 2a11 8 0 0 1 22 0 11 8 0 0 1-22 0z" fill={blanket} />
      <path d="M0-6a11 8 0 0 1 11 8 11 8 0 0 1-11 8z" fill="rgba(0,0,0,0.12)" />
      <circle cx="-3" cy="-4" r="6" fill={SKIN[0]} />
      <path d="M-6-7q3-3 6 0" stroke={HAIR[1]} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path
        d="M-5.6-3.6q1 1 2 0M-1.4-3.6q1 1 2 0"
        stroke={C.ink}
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Objects and marks shared across drawings.
// ---------------------------------------------------------------------------

/** A banknote, placed and scaled — the same note the rest of the game uses. */
function Bill({
  x,
  y,
  k = 1,
  rot = 0,
  tone = C.green,
}: {
  readonly x: number
  readonly y: number
  readonly k?: number
  readonly rot?: number
  readonly tone?: string
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${k}) translate(-32 -34)`}>
      <Note tone={tone} />
    </g>
  )
}

/** A leaning stack of the shared coin. */
function CoinStack({
  x,
  y,
  n = 3,
  r = 7,
}: {
  readonly x: number
  readonly y: number
  readonly n?: number
  readonly r?: number
}): ReactElement {
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <Coin key={i} x={x} y={y - i * r * 0.72} r={r} />
      ))}
    </g>
  )
}

/** A four-point twinkle. Used only where something good just happened. */
function Sparkle({
  x,
  y,
  r,
  fill = C.goldLite,
}: {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly fill?: string
}): ReactElement {
  const w = r * 0.24
  return (
    <path
      d={`M${x} ${y - r}Q${x + w} ${y - w} ${x + r} ${y}Q${x + w} ${y + w} ${x} ${y + r}Q${x - w} ${y + w} ${x - r} ${y}Q${x - w} ${y - w} ${x} ${y - r}Z`}
      fill={fill}
    />
  )
}

function starPath(x: number, y: number, r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 10; i += 1) {
    const rad = i % 2 === 0 ? r : r * 0.46
    const a = (Math.PI / 5) * i - Math.PI / 2
    pts.push(`${(x + Math.cos(a) * rad).toFixed(2)} ${(y + Math.sin(a) * rad).toFixed(2)}`)
  }
  return `M${pts.join('L')}Z`
}

function Star({
  x,
  y,
  r,
  fill = C.gold,
}: {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly fill?: string
}): ReactElement {
  return <path d={starPath(x, y, r)} fill={fill} />
}

function Heart({
  x,
  y,
  r,
  fill = C.pink,
}: {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly fill?: string
}): ReactElement {
  return (
    <path
      d={`M${x} ${y + r * 0.92}C${x - r * 1.3} ${y - r * 0.08} ${x - r * 0.85} ${y - r} ${x} ${y - r * 0.34}C${x + r * 0.85} ${y - r} ${x + r * 1.3} ${y - r * 0.08} ${x} ${y + r * 0.92}Z`}
      fill={fill}
    />
  )
}

function Sun({
  x,
  y,
  r,
  fill = C.gold,
  ray = C.goldLite,
}: {
  readonly x: number
  readonly y: number
  readonly r: number
  readonly fill?: string
  readonly ray?: string
}): ReactElement {
  const spokes = Array.from({ length: 8 }, (_, i) => {
    const a = (Math.PI * 2 * i) / 8 + Math.PI / 8
    return `M${(x + Math.cos(a) * r * 1.2).toFixed(2)} ${(y + Math.sin(a) * r * 1.2).toFixed(2)}L${(x + Math.cos(a) * r * 1.62).toFixed(2)} ${(y + Math.sin(a) * r * 1.62).toFixed(2)}`
  }).join('')
  return (
    <g>
      <path d={spokes} stroke={ray} strokeWidth={r * 0.26} strokeLinecap="round" fill="none" />
      <circle cx={x} cy={y} r={r} fill={fill} />
      <path d={`M${x - r} ${y}a${r} ${r} 0 0 0 ${r * 2} 0z`} fill="rgba(150,80,0,0.18)" />
    </g>
  )
}

/** A sheet of paper or card, with children drawn in its own centred space. */
function Card({
  x,
  y,
  w,
  h,
  rot = 0,
  fill = C.paper,
  edge = C.paperEdge,
  r = 2,
  children,
}: {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly h: number
  readonly rot?: number
  readonly fill?: string
  readonly edge?: string
  readonly r?: number
  readonly children?: ReactNode
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        rx={r}
        fill={fill}
        stroke={edge}
        strokeWidth="1.3"
      />
      {children}
    </g>
  )
}

/** A ruled line of "writing" on a card. */
function Rule({
  x,
  y,
  w,
  fill = C.paperShade,
}: {
  readonly x: number
  readonly y: number
  readonly w: number
  readonly fill?: string
}): ReactElement {
  return <rect x={x} y={y} width={w} height="2.2" rx="1.1" fill={fill} />
}

/** A teardrop — sweat when the drawing is stressful, a tear when it is sad. */
function Drop({
  x,
  y,
  s = 1,
  fill = C.blue,
}: {
  readonly x: number
  readonly y: number
  readonly s?: number
  readonly fill?: string
}): ReactElement {
  return (
    <path
      d={`M${x} ${y}c0 0${-3.4 * s} ${4 * s}${-3.4 * s} ${6.2 * s}a${3.4 * s} ${3.4 * s} 0 0 0${6.8 * s} 0C${x + 3.4 * s} ${y + 4 * s} ${x} ${y} ${x} ${y}z`}
      fill={fill}
    />
  )
}

/** A soft ground plane for scenes that need a floor rather than a shadow. */
function Floor({ y, fill = C.slate }: { readonly y: number; readonly fill?: string }): ReactElement {
  return <rect x="0" y={y} width="64" height={64 - y} fill={fill} opacity="0.22" />
}

/** The recruiting booth shared by the two job fairs. */
function Booth({ tone, toneDark }: { readonly tone: string; readonly toneDark: string }): ReactElement {
  return (
    <g>
      <rect x="7" y="19" width="3" height="26" fill={C.steelDark} />
      <rect x="54" y="19" width="3" height="26" fill={C.steel} />
      <rect x="4" y="5" width="56" height="14" rx="3" fill={tone} />
      <rect x="4" y="15" width="56" height="4" fill={toneDark} />
      <rect x="13" y="8.5" width="26" height="3.4" rx="1.7" fill="rgba(255,255,255,0.78)" />
      <rect x="42" y="8.5" width="9" height="3.4" rx="1.7" fill="rgba(255,255,255,0.45)" />
      <rect x="8" y="42" width="48" height="4" rx="1.6" fill={C.wood} />
      <rect x="11" y="46" width="42" height="12" fill={C.woodDark} />
      <rect x="11" y="46" width="42" height="2.4" fill="rgba(0,0,0,0.16)" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// College lane — the first eight tiles plus the graduate job fair.
// ---------------------------------------------------------------------------

export function moveInDay(): ReactElement {
  return (
    <g>
      <Floor y={54} />
      <rect x="42" y="16" width="20" height="38" rx="2" fill={C.wood} />
      <rect x="52" y="16" width="10" height="38" fill={C.woodDark} />
      <circle cx="46" cy="36" r="2" fill={C.gold} />
      <Person
        x={24}
        y={56}
        s={0.82}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        hands={[
          [-11, -24],
          [11, -24],
        ]}
      />
      <g transform="translate(24 34)">
        <rect x="-13" y="-9" width="26" height="18" rx="1.5" fill="#dcae6d" />
        <rect x="0" y="-9" width="13" height="18" fill="#c4924f" />
        <rect x="-13" y="-2" width="26" height="3" fill="rgba(255,255,255,0.5)" />
        <path d="M-4-9h8v5l-4-2-4 2z" fill="#a87b3f" />
      </g>
      <circle cx="14.3" cy="36.3" r="3" fill={SKIN[0]} />
      <circle cx="33.7" cy="36.3" r="3" fill={SKIN[0]} />
      <g transform="translate(50 48)">
        <rect x="-9" y="-7" width="18" height="13" rx="1.2" fill="#dcae6d" />
        <rect x="0" y="-7" width="9" height="13" fill="#c4924f" />
        <rect x="-9" y="-2" width="18" height="2.4" fill="rgba(255,255,255,0.5)" />
      </g>
    </g>
  )
}

export function tuitionBill(): ReactElement {
  return (
    <g>
      <Card x={28} y={31} w={34} h={42} rot={-5}>
        <rect x="-17" y="-21" width="34" height="9" rx="2" fill={C.red} />
        <path d="M-17-14h34v2H-17z" fill={C.redDark} />
        <Rule x={-12} y={-7} w={24} />
        <Rule x={-12} y={-1} w={19} />
        <Rule x={-12} y={5} w={22} />
        <rect x="-12" y="11" width="24" height="7" rx="2" fill={C.red} />
      </Card>
      <Coin x={48} y={44} r={7} />
      <Coin x={55} y={53} r={5.5} />
      <path
        d="M45 26q9 3 11 10"
        stroke={C.redDark}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M57 40l-3.6-8 8 1.6z" fill={C.redDark} />
    </g>
  )
}

export function lateNightStudy(): ReactElement {
  return (
    <g>
      <path
        d="M52 6a10 10 0 1 0 7 17 8 8 0 0 1-7-17z"
        fill={C.goldLite}
      />
      <Sparkle x={38} y={9} r={3} fill={C.cloud} />
      <Sparkle x={46} y={26} r={2.2} fill={C.cloud} />
      <Person
        x={24}
        y={62}
        s={0.72}
        legs={false}
        wear={C.purple}
        wearDark={C.purpleDark}
        hairStyle="long"
        hair={HAIR[2]}
        face="flat"
        hands={[
          [-13, -17],
          [13, -17],
        ]}
      />
      <rect x="2" y="46" width="60" height="4" rx="1.5" fill={C.wood} />
      <rect x="2" y="50" width="60" height="6" fill={C.woodDark} />
      <g transform="translate(34 44)">
        <path d="M-13 2 0-2v-8l-13 4z" fill={C.paper} />
        <path d="M13 2 0-2v-8l13 4z" fill={C.paperShade} />
        <path d="M-13 2 0-2l13 4-13 2z" fill={C.blueDark} />
      </g>
      <g transform="translate(52 34)">
        <rect x="-1.6" y="0" width="3.2" height="12" fill={C.steelDark} />
        <path d="M-9 0 0-9l9 9z" fill={C.gold} />
        <ellipse cx="0" cy="0" rx="9" ry="2.4" fill={C.goldLite} />
      </g>
      <g transform="translate(11 42)">
        <path d="M-4 0h8l-1 5h-6z" fill={C.cloud} />
        <path d="M0 0h4l-1 5H0z" fill={C.grey} />
        <ellipse cx="0" cy="0" rx="4" ry="1.4" fill="#8a5a3a" />
      </g>
    </g>
  )
}

export function campusJob(): ReactElement {
  return (
    <g>
      <Coin x={49} y={22} r={7} />
      <Sparkle x={58} y={13} r={3.4} />
      <Person
        x={22}
        y={52}
        s={0.62}
        legs={false}
        wear={C.blue}
        wearDark={C.blueDark}
        face="smile"
        hair={HAIR[3]}
        hands={[
          [-12, -20],
          [12, -20],
        ]}
      />
      <g transform="translate(22 39) rotate(-8)">
        <path d="M-10-6h10v13h-10z" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.2" />
        <path d="M0-6h10v13H0z" fill={C.paperShade} stroke={C.paperEdge} strokeWidth="1.2" />
      </g>
      <rect x="2" y="44" width="60" height="4" rx="1.5" fill={C.wood} />
      <rect x="4" y="48" width="56" height="12" fill={C.woodDark} />
      <rect x="4" y="48" width="56" height="2.4" fill="rgba(0,0,0,0.16)" />
      <g transform="translate(45 44)">
        <rect x="-11" y="-5" width="22" height="5" rx="1.2" fill={C.red} />
        <rect x="-9" y="-10" width="19" height="5" rx="1.2" fill={C.teal} />
        <rect x="-10" y="-15" width="20" height="5" rx="1.2" fill={C.purple} />
      </g>
    </g>
  )
}

export function groupProject(): ReactElement {
  return (
    <g>
      <Card x={32} y={22} w={40} h={30} r={2}>
        <rect x="-14" y="-11" width="19" height="3" rx="1.5" fill={C.paperShade} />
        <rect x="-14" y="1" width="5" height="8" fill={C.blue} />
        <rect x="-7" y="-3" width="5" height="12" fill={C.teal} />
        <rect x="0" y="-7" width="5" height="16" fill={C.green} />
        <rect x="8" y="-9" width="6" height="6" rx="1" fill={C.gold} />
      </Card>
      <Person
        x={13}
        y={60}
        s={0.55}
        wear={C.orange}
        wearDark={C.orangeDark}
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[2]}
        hands={[
          [-13, -19],
          [15, -32],
        ]}
      />
      <Person
        x={51}
        y={60}
        s={0.55}
        flip
        wear={C.purple}
        wearDark={C.purpleDark}
        hair={HAIR[3]}
        hands={[
          [-13, -19],
          [14, -24],
        ]}
      />
      <Person
        x={32}
        y={62}
        s={0.5}
        wear={C.teal}
        wearDark={C.tealDark}
        hairStyle="long"
        hair={HAIR[2]}
        skin={SKIN[1]}
        hands={[
          [-12, -20],
          [12, -20],
        ]}
      />
    </g>
  )
}

export function scholarshipWin(): ReactElement {
  return (
    <g>
      <Ground />
      <Sparkle x={8} y={20} r={4} />
      <Sparkle x={56} y={16} r={4.6} />
      <Sparkle x={50} y={40} r={3} />
      <Person
        x={32}
        y={57}
        s={0.8}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        hands={[
          [-13, -35],
          [13, -35],
        ]}
      />
      <Card x={32} y={29} w={34} h={20}>
        <Rule x={-12} y={-6} w={17} />
        <Rule x={-12} y={-1} w={22} />
        <Rule x={-12} y={4} w={14} />
      </Card>
      <path d="M43 34l-3 9 5-2 4 3z" fill={C.redDark} />
      <circle cx="43" cy="33" r="5.4" fill={C.gold} />
      <circle cx="43" cy="33" r="2.6" fill={C.goldLite} />
      <circle cx="21.6" cy="29" r="3" fill={SKIN[0]} />
      <circle cx="42.4" cy="29" r="3" fill={SKIN[0]} />
    </g>
  )
}

export function finalsWeek(): ReactElement {
  return (
    <g>
      <Person
        x={21}
        y={60}
        s={0.72}
        legs={false}
        wear={C.green}
        wearDark={C.greenDark}
        face="flat"
        hair={HAIR[2]}
        skin={SKIN[2]}
        hands={[
          [-14, -17],
          [12, -17],
        ]}
      />
      <Drop x={34} y={12} s={0.85} />
      <path
        d="M9 8q3-4 6 0M4 15q3-4 6 0"
        stroke={C.steelDark}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="0" y="48" width="64" height="4" rx="1.5" fill={C.wood} />
      <rect x="2" y="52" width="60" height="10" fill={C.woodDark} />
      <g transform="translate(46 48)">
        <rect x="-13" y="-6" width="26" height="6" rx="1.4" fill={C.red} />
        <rect x="-11" y="-12" width="23" height="6" rx="1.4" fill={C.blue} />
        <rect x="-12" y="-18" width="24" height="6" rx="1.4" fill={C.gold} />
        <rect x="-10" y="-24" width="21" height="6" rx="1.4" fill={C.teal} />
      </g>
      <Card x={20} y={45} w={22} h={13} rot={-7}>
        <Rule x={-8} y={-4} w={13} />
        <Rule x={-8} y={0} w={10} />
        <path d="M2 1l3 3 6-7" stroke={C.red} strokeWidth="2" strokeLinecap="round" fill="none" />
      </Card>
    </g>
  )
}

export function capAndGown(): ReactElement {
  return (
    <g>
      <Ground />
      <Sparkle x={9} y={24} r={4} />
      <Sparkle x={55} y={19} r={4.4} />
      <Star x={53} y={44} r={4} fill={C.goldLite} />
      <Person
        x={31}
        y={57}
        s={0.82}
        wear="#3f4675"
        wearDark="#2d3358"
        pants="#2d3358"
        pantsDark="#242a49"
        face="joy"
        hair={HAIR[0]}
        hands={[
          [-14, -21],
          [13, -37],
        ]}
      >
        <path d="M-7-30l-1.6 15h4.4L-3-30z" fill={C.gold} />
        <path d="M7-30l1.6 15H4.2L3-30z" fill={C.goldDark} />
        <path d="M-13-53h26v3.5h-26z" fill="#22284a" />
        <path d="M0-59 14-53 0-47-14-53z" fill="#2d3358" />
        <path d="M0-59 14-53 0-47z" fill="#3f4675" />
        <path d="M14-53v8" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        <circle cx="14" cy="-44" r="2.4" fill={C.gold} />
      </Person>
      <g transform="translate(42 26) rotate(24)">
        <rect x="-4" y="-11" width="8" height="22" rx="4" fill={C.paper} />
        <rect x="-4" y="-11" width="3.4" height="22" fill={C.paperShade} />
        <rect x="-5" y="-2.6" width="10" height="4" rx="2" fill={C.red} />
      </g>
    </g>
  )
}

export function gradJobFair(): ReactElement {
  return (
    <g>
      <Booth tone={C.gold} toneDark={C.goldDark} />
      <Person
        x={43}
        y={46}
        s={0.5}
        legs={false}
        flip
        wear={C.blue}
        wearDark={C.blueDark}
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[2]}
        hands={[
          [-13, -19],
          [16, -13],
        ]}
      />
      <Person
        x={23}
        y={58}
        s={0.6}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hands={[
          [-13, -20],
          [17, -30],
        ]}
      >
        <path d="M-11-53h22v3h-22z" fill="#2d3358" />
        <path d="M0-58 12-53 0-48-12-53z" fill="#3f4675" />
        <path d="M12-53v6" stroke={C.gold} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </Person>
      <circle cx="33.5" cy="39.5" r="4.2" fill={SKIN[0]} />
      <circle cx="35.5" cy="40.5" r="3.6" fill={SKIN[1]} />
      <Sparkle x={32} y={28} r={3.2} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Work lane — the shorter, no-degree route.
// ---------------------------------------------------------------------------

export function firstPaycheck(): ReactElement {
  return (
    <g>
      <Ground />
      <Sparkle x={10} y={22} r={4} />
      <Sparkle x={54} y={18} r={4.4} />
      <Person
        x={31}
        y={57}
        s={0.8}
        wear={C.orange}
        wearDark={C.orangeDark}
        face="joy"
        hair={HAIR[3]}
        hands={[
          [-12, -26],
          [12, -26],
        ]}
      />
      <Bill x={31} y={36} k={0.66} rot={-4} />
      <circle cx="21.4" cy="36.2" r="3" fill={SKIN[0]} />
      <circle cx="40.6" cy="36.2" r="3" fill={SKIN[0]} />
      <Coin x={52} y={48} r={6} />
    </g>
  )
}

export function rentDue(): ReactElement {
  return (
    <g>
      <rect x="12" y="8" width="40" height="52" rx="2" fill={C.wood} />
      <rect x="34" y="8" width="18" height="52" fill={C.woodDark} />
      <rect x="17" y="13" width="30" height="18" rx="1.5" fill="rgba(0,0,0,0.12)" />
      <circle cx="45" cy="38" r="2.6" fill={C.gold} />
      <g transform="translate(32 40) rotate(-6)">
        <rect x="-16" y="-11" width="32" height="22" rx="2" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.3" />
        <path d="M-16-11 0 2 16-11z" fill={C.paperShade} />
        <path d="M-16-11h32L0 2z" fill="none" stroke={C.paperEdge} strokeWidth="1.3" />
      </g>
      <g transform="translate(43 26) rotate(-16)">
        <circle cx="0" cy="0" r="10" fill="none" stroke={C.red} strokeWidth="3" />
        <rect x="-1.9" y="-6" width="3.8" height="7.6" rx="1.9" fill={C.red} />
        <circle cx="0" cy="4.4" r="2.1" fill={C.red} />
      </g>
    </g>
  )
}

export function overtimeShift(): ReactElement {
  return (
    <g>
      <g transform="translate(48 17)">
        <circle cx="0" cy="0" r="12" fill={C.cloud} />
        <circle cx="0" cy="0" r="12" fill="none" stroke={C.steelDark} strokeWidth="2.6" />
        <path d="M0-7v7h5" stroke={C.redDark} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </g>
      <Person
        x={22}
        y={62}
        s={0.72}
        legs={false}
        wear={C.blue}
        wearDark={C.blueDark}
        face="flat"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-12, -16],
          [12, -16],
        ]}
      />
      <rect x="0" y="46" width="64" height="4" rx="1.5" fill={C.wood} />
      <rect x="2" y="50" width="60" height="10" fill={C.woodDark} />
      <g transform="translate(24 42)">
        <path d="M-11 4 11 4 8-11h-16z" fill={C.steelDark} />
        <path d="M-9 3 9 3 6.6-9H-6.6z" fill={C.night} />
        <rect x="-13" y="4" width="26" height="3" rx="1.5" fill={C.steel} />
      </g>
      <Drop x={35} y={12} s={0.75} />
    </g>
  )
}

export function newSkills(): ReactElement {
  return (
    <g>
      <Ground />
      <g transform="translate(46 16)">
        <path
          d="M-13-9 -8-4M13-9 8-4M-16 4h6M16 4h-6M0-18v6"
          stroke={C.goldLite}
          strokeWidth="2.6"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="0" cy="1" r="9" fill={C.gold} />
        <path d="M0-8a9 9 0 0 1 0 18z" fill={C.goldDark} />
        <rect x="-4" y="9" width="8" height="5" rx="1.4" fill={C.steelDark} />
        <path d="M-3 0q3 4 6 0" stroke={C.goldLite} strokeWidth="1.8" fill="none" />
      </g>
      <Person
        x={25}
        y={57}
        s={0.78}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[2]}
        skin={SKIN[1]}
        hands={[
          [-12, -24],
          [14, -32],
        ]}
      />
      <g transform="translate(17 38) rotate(-10)">
        <path d="M-9-7h9v14h-9z" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.2" />
        <path d="M0-7h9v14H0z" fill={C.paperShade} stroke={C.paperEdge} strokeWidth="1.2" />
      </g>
    </g>
  )
}

export function steadyHustle(): ReactElement {
  return (
    <g>
      <rect x="0" y="54" width="64" height="6" fill={C.slate} opacity="0.3" />
      <path
        d="M4 57h8M18 57h8M32 57h8"
        stroke={C.paper}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />
      <path
        d="M4 26h9M2 34h7"
        stroke={C.steel}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <Person
        x={32}
        y={55}
        s={0.86}
        wear={C.blue}
        wearDark={C.blueDark}
        face="smile"
        hair={HAIR[0]}
        hands={[
          [-13, -24],
          [14, -20],
        ]}
        feet={[
          [-9, -1],
          [8, -7],
        ]}
      />
      <g transform="translate(44 43)">
        <rect x="-8" y="-6" width="16" height="12" rx="1.8" fill={C.woodDark} />
        <rect x="-8" y="-6" width="16" height="4" fill={C.wood} />
        <rect x="-2.5" y="-9" width="5" height="4" rx="1.6" fill="none" stroke={C.woodDark} strokeWidth="1.6" />
      </g>
      <path d="M50 20l4-9 4 9-3-1v7h-2v-7z" fill={C.green} />
    </g>
  )
}

export function firstJobFair(): ReactElement {
  return (
    <g>
      <Booth tone={C.teal} toneDark={C.tealDark} />
      <Person
        x={44}
        y={46}
        s={0.5}
        legs={false}
        flip
        wear={C.orange}
        wearDark={C.orangeDark}
        hair={HAIR[0]}
        hands={[
          [-14, -18],
          [13, -34],
        ]}
      />
      <Person
        x={22}
        y={58}
        s={0.6}
        wear={C.purple}
        wearDark={C.purpleDark}
        face="smile"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[2]}
        hands={[
          [-13, -20],
          [16, -32],
        ]}
      />
      <Card x={34} y={37} w={14} h={17} rot={12}>
        <Rule x={-4.6} y={-6} w={9} />
        <Rule x={-4.6} y={-2} w={7} />
        <Rule x={-4.6} y={2} w={9} />
      </Card>
      <Sparkle x={33} y={26} r={3} fill={C.cloud} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Main street — everyday life between the first job and the wedding.
// ---------------------------------------------------------------------------

export function apartmentHunt(): ReactElement {
  return (
    <g>
      <Floor y={55} />
      <rect x="26" y="10" width="34" height="45" rx="2" fill={C.steel} />
      <rect x="44" y="10" width="16" height="45" fill={C.steelDark} />
      <rect x="24" y="6" width="38" height="6" rx="2" fill={C.slate} />
      <g fill={C.cloud}>
        <rect x="30" y="16" width="7" height="8" rx="1" />
        <rect x="41" y="16" width="7" height="8" rx="1" />
        <rect x="52" y="16" width="6" height="8" rx="1" />
        <rect x="30" y="29" width="7" height="8" rx="1" />
        <rect x="52" y="29" width="6" height="8" rx="1" />
        <rect x="30" y="42" width="7" height="8" rx="1" />
        <rect x="41" y="42" width="7" height="8" rx="1" />
      </g>
      <rect x="41" y="29" width="7" height="8" rx="1" fill={C.gold} />
      <rect x="52" y="42" width="6" height="8" rx="1" fill={C.gold} />
      <Person
        x={14}
        y={56}
        s={0.62}
        wear={C.pink}
        wearDark={C.pinkDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[2]}
        skin={SKIN[1]}
        hands={[
          [-13, -20],
          [11, -38],
        ]}
      />
      <g transform="translate(21 33)">
        <circle cx="0" cy="0" r="3.4" fill={C.gold} />
        <circle cx="0" cy="0" r="1.3" fill={C.goldDark} />
        <path d="M2.6 2.6 8 8M5 8l2-2M7 10l2-2" stroke={C.gold} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      </g>
    </g>
  )
}

export function groceryRun(): ReactElement {
  return (
    <g>
      <path d="M14 24h36l-3 34H17z" fill="#dcae6d" />
      <path d="M32 24h18l-3 34H32z" fill="#c4924f" />
      <path d="M14 24h36v5H14z" fill="#eec288" />
      <path d="M32 24h18v5H32z" fill="#dcae6d" />
      <circle cx="24" cy="19" r="6.5" fill={C.red} />
      <path d="M24 12.5a6.5 6.5 0 0 1 0 13z" fill={C.redDark} />
      <path d="M24 13q1-5 5-6" stroke={C.leafDark} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M38 22l4-14 4 14z" fill="#e8b24a" />
      <path d="M42 8q-3-4-6-4M42 8q3-5 7-4" stroke={C.leaf} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M50 34h9v20l-4-3-5 3z" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.2" />
      <path d="M52 38h5M52 42h5M52 46h4" stroke={C.red} strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function gymMembership(): ReactElement {
  return (
    <g>
      <Ground />
      <Person
        x={32}
        y={57}
        s={0.82}
        wear={C.red}
        wearDark={C.redDark}
        face="flat"
        hair={HAIR[2]}
        skin={SKIN[2]}
        hands={[
          [-13, -41],
          [13, -41],
        ]}
        feet={[
          [-8, -3],
          [8, -3],
        ]}
      />
      <rect x="18" y="22" width="28" height="4" rx="2" fill={C.steel} />
      <rect x="11" y="14" width="7" height="20" rx="2" fill={C.slate} />
      <rect x="46" y="14" width="7" height="20" rx="2" fill={C.night} />
      <rect x="6" y="18" width="6" height="12" rx="2" fill={C.steelDark} />
      <rect x="52" y="18" width="6" height="12" rx="2" fill={C.steelDark} />
      <Drop x={22} y={12} s={0.6} />
    </g>
  )
}

export function sideHustle(): ReactElement {
  return (
    <g>
      <Person
        x={18}
        y={48}
        s={0.55}
        legs={false}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        hands={[
          [-13, -18],
          [13, -18],
        ]}
      />
      <rect x="2" y="42" width="60" height="4" rx="1.5" fill={C.wood} />
      <rect x="5" y="46" width="54" height="13" fill={C.woodDark} />
      <rect x="5" y="46" width="54" height="2.4" fill="rgba(0,0,0,0.16)" />
      <g>
        <rect x="30" y="26" width="8" height="16" rx="1.6" fill={C.paper} />
        <rect x="34" y="26" width="4" height="16" fill={C.paperShade} />
        <rect x="41" y="31" width="7" height="11" rx="1.6" fill={C.pink} />
        <rect x="44.5" y="31" width="3.5" height="11" fill={C.pinkDark} />
        <rect x="50" y="29" width="7" height="13" rx="1.6" fill={C.purple} />
        <rect x="53.5" y="29" width="3.5" height="13" fill={C.purpleDark} />
        <path d="M34 26q-3-4 0-6 3 3 0 6z" fill={C.gold} />
        <path d="M44.5 31q-2.4-3 0-5 2.4 2.4 0 5z" fill={C.gold} />
        <path d="M53.5 29q-2.4-3 0-5 2.4 2.4 0 5z" fill={C.gold} />
      </g>
      <Coin x={12} y={26} r={6.5} />
      <Sparkle x={22} y={16} r={3.4} />
    </g>
  )
}

export function carTrouble(): ReactElement {
  return (
    <g>
      <Floor y={54} />
      <path
        d="M5 50q-1-13 8-14l6-9h20l6 9q9 1 8 14z"
        fill={C.blue}
      />
      <path d="M32 27h13l6 9q9 1 8 14H32z" fill={C.blueDark} />
      <path d="M22 30h9v6h-13z" fill={C.cloud} />
      <path d="M33 30h8l4 6H33z" fill={C.cloud} opacity="0.7" />
      <circle cx="18" cy="50" r="6.5" fill={C.nightDark} />
      <circle cx="18" cy="50" r="2.6" fill={C.steel} />
      <circle cx="46" cy="50" r="6.5" fill={C.nightDark} />
      <circle cx="46" cy="50" r="2.6" fill={C.steel} />
      <path d="M45 27l16-9 2 4-15 9z" fill={C.blueDark} />
      <g fill={C.grey}>
        <circle cx="46" cy="12" r="6" />
        <circle cx="55" cy="9" r="4.4" />
        <circle cx="38" cy="8" r="4" />
      </g>
      <g transform="translate(14 20)">
        <path d="M0-10 10 8H-10z" fill={C.red} />
        <rect x="-1.7" y="-4.5" width="3.4" height="7.4" rx="1.7" fill={C.paper} />
        <circle cx="0" cy="5.2" r="1.8" fill={C.paper} />
      </g>
    </g>
  )
}

export function payday(): ReactElement {
  return (
    <g>
      <g stroke={C.goldLite} strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.85">
        <path d="M32 4v6M12 12l4 5M52 12l-4 5M4 32h6M54 32h6" />
      </g>
      <Bill x={32} y={24} k={0.8} rot={-6} />
      <path d="M10 30h44a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V32a2 2 0 0 1 2-2z" fill={C.green} />
      <path d="M32 30h22a2 2 0 0 1 2 2v22a2 2 0 0 1-2 2H32z" fill={C.greenDark} />
      <path d="M8 32l24 15 24-15" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" />
      <Coin x={14} y={50} r={6.5} />
      <Coin x={51} y={52} r={5.5} />
    </g>
  )
}

export function weekendTrip(): ReactElement {
  return (
    <g>
      <Sun x={12} y={12} r={7} />
      <rect x="0" y="52" width="64" height="8" fill={C.slate} opacity="0.28" />
      <path d="M4 56h9M20 56h9M36 56h9M52 56h9" stroke={C.paper} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.85" />
      <g transform="translate(30 42)">
        <rect x="-10" y="-22" width="20" height="8" rx="1.6" fill={C.red} />
        <rect x="0" y="-22" width="10" height="8" fill={C.redDark} />
        <path d="M-12-14h24" stroke={C.steelDark} strokeWidth="2" strokeLinecap="round" fill="none" />
      </g>
      <path d="M2 46q-1-11 8-12l6-8h20l7 8q9 1 8 12z" fill={C.teal} />
      <path d="M28 26h10l7 8q9 1 8 12H28z" fill={C.tealDark} />
      <path d="M19 29h8v6H14z" fill={C.cloud} />
      <path d="M30 29h7l4 6h-11z" fill={C.cloud} opacity="0.7" />
      <circle cx="17" cy="46" r="6" fill={C.nightDark} />
      <circle cx="17" cy="46" r="2.4" fill={C.steel} />
      <circle cx="44" cy="46" r="6" fill={C.nightDark} />
      <circle cx="44" cy="46" r="2.4" fill={C.steel} />
      <path d="M56 44h6M58 38h6" stroke={C.steel} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function goodReview(): ReactElement {
  return (
    <g>
      <Ground />
      <Star x={32} y={12} r={8} />
      <Sparkle x={12} y={20} r={3.4} />
      <Sparkle x={54} y={22} r={3} />
      <Person
        x={24}
        y={57}
        s={0.74}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        hands={[
          [-13, -20],
          [13, -20],
        ]}
      >
        <Star x={-4} y={-28} r={4.6} fill={C.gold} />
      </Person>
      <Person
        x={50}
        y={58}
        s={0.56}
        flip
        wear={C.orange}
        wearDark={C.orangeDark}
        skin={SKIN[2]}
        hair={HAIR[3]}
        hands={[
          [-12, -30],
          [-8, -32],
        ]}
      />
      <path d="M40 24l3-4M44 22l1-5" stroke={C.goldDark} strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function luckyFind(): ReactElement {
  return (
    <g>
      <path d="M30 30q-8-9 0-13 8 4 0 13z" fill={C.leaf} />
      <path d="M30 30q9-8 13 0-4 8-13 0z" fill={C.leafDark} />
      <path d="M30 30q8 9 0 13-8-4 0-13z" fill={C.leaf} />
      <path d="M30 30q-9 8-13 0 4-8 13 0z" fill={C.leafDark} />
      <circle cx="30" cy="30" r="3" fill="#2f7a3a" />
      <path d="M30 32q1 12-6 18" stroke={C.leafDark} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Coin x={46} y={46} r={8} />
      <Sparkle x={52} y={26} r={4.4} />
      <Sparkle x={14} y={44} r={3.4} />
    </g>
  )
}

export function streamingBill(): ReactElement {
  return (
    <g>
      <rect x="6" y="10" width="52" height="34" rx="3" fill={C.night} />
      <rect x="9" y="13" width="46" height="28" rx="2" fill={C.nightDark} />
      <path d="M27 20l14 7-14 7z" fill={C.paper} />
      <rect x="27" y="44" width="10" height="7" fill={C.steelDark} />
      <rect x="18" y="51" width="28" height="4" rx="2" fill={C.steel} />
      <Coin x={54} y={50} r={6} />
      <Coin x={44} y={57} r={5} />
      <path d="M56 34q6 5 4 12" stroke={C.redDark} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <path d="M60 48l-4-6 6-1z" fill={C.redDark} />
    </g>
  )
}

export function payRaiseTalk(): ReactElement {
  return (
    <g>
      <path d="M32 8l9 12h-5v12h-8V20h-5z" fill={C.green} />
      <Coin x={13} y={17} r={6} />
      <Sparkle x={53} y={15} r={4} />
      <Person
        x={16}
        y={48}
        s={0.52}
        legs={false}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -18],
          [15, -30],
        ]}
      />
      <Person
        x={48}
        y={48}
        s={0.52}
        legs={false}
        flip
        wear={C.slate}
        wearDark="#454e68"
        hair={HAIR[2]}
        hands={[
          [-13, -18],
          [14, -20],
        ]}
      />
      <rect x="0" y="44" width="64" height="4" rx="1.5" fill={C.wood} />
      <rect x="3" y="48" width="58" height="12" fill={C.woodDark} />
      <rect x="3" y="48" width="58" height="2.4" fill="rgba(0,0,0,0.16)" />
      <Card x={32} y={51} w={16} h={10} rot={-4}>
        <Rule x={-5} y={-3} w={10} />
        <Rule x={-5} y={1} w={7} />
      </Card>
    </g>
  )
}

export function neighborhoodBbq(): ReactElement {
  return (
    <g>
      <g fill={C.grey}>
        <circle cx="40" cy="12" r="5.4" />
        <circle cx="48" cy="9" r="4" />
        <circle cx="33" cy="9" r="3.4" />
      </g>
      <Person
        x={13}
        y={57}
        s={0.6}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hair={HAIR[3]}
        hands={[
          [-12, -20],
          [16, -28],
        ]}
      >
        <path d="M-9-26h18v10h-18z" fill={C.paper} opacity="0.85" />
      </Person>
      <path
        d="M23 36 34 30"
        stroke={C.steelDark}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M24 32h48" fill="none" />
      <path d="M22 34h34a2 2 0 0 1 0 4H22z" fill="none" />
      <path d="M28 32h30v3H28z" fill="none" />
      <path d="M24 34q0 14 16 14t16-14z" fill={C.nightDark} />
      <path d="M40 34q0 14 16 14V34z" fill="#1c2242" />
      <rect x="22" y="30" width="36" height="5" rx="2.5" fill={C.steelDark} />
      <path d="M30 30q2-4 5 0M43 30q2-4 5 0" stroke={C.red} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M30 48l-4 11M50 48l4 11" stroke={C.steelDark} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M22 34h36" stroke={C.steel} strokeWidth="1.6" fill="none" />
    </g>
  )
}

export function ringShopping(): ReactElement {
  return (
    <g>
      <Floor y={56} />
      <rect x="26" y="30" width="34" height="26" rx="2" fill={C.cloud} opacity="0.85" />
      <rect x="26" y="30" width="34" height="26" rx="2" fill="none" stroke={C.steelDark} strokeWidth="2" />
      <rect x="26" y="52" width="34" height="4" fill={C.steelDark} />
      <path d="M43 30v26" stroke={C.steel} strokeWidth="1.6" fill="none" />
      <g transform="translate(43 43)">
        <path d="M-5 6h10l-2-8h-6z" fill={C.pinkDark} />
        <circle cx="0" cy="-2" r="5" fill="none" stroke={C.gold} strokeWidth="2.6" />
        <path d="M0-11l3.4 4H-3.4z" fill={C.cloud} />
        <path d="M0-11l3.4 4L0-3l-3.4-4z" fill={C.paper} />
      </g>
      <Person
        x={14}
        y={57}
        s={0.66}
        wear={C.purple}
        wearDark={C.purpleDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-12, -22],
          [16, -25],
        ]}
      />
      <Heart x={31} y={14} r={5.4} />
      <Heart x={42} y={20} r={3.6} fill={C.pinkDark} />
      <Sparkle x={54} y={24} r={3.4} />
    </g>
  )
}

export function weddingDay(): ReactElement {
  return (
    <g>
      <path
        d="M8 58V34a24 24 0 0 1 48 0v24"
        stroke={C.leafDark}
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <g fill={C.pink}>
        <circle cx="12" cy="26" r="3.6" />
        <circle cx="22" cy="14" r="3.6" />
        <circle cx="42" cy="14" r="3.6" />
        <circle cx="52" cy="26" r="3.6" />
      </g>
      <circle cx="32" cy="10" r="4" fill={C.goldLite} />
      <path d="M18 46h13l4 12H14z" fill={C.paper} />
      <path d="M24.5 46H31l4 12h-6.5z" fill={C.paperShade} />
      <Person
        x={24}
        y={57}
        s={0.6}
        legs={false}
        wear={C.paper}
        wearDark={C.paperShade}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        hands={[
          [-14, -20],
          [15, -25],
        ]}
      />
      <Person
        x={42}
        y={57}
        s={0.6}
        wear="#3b456e"
        wearDark="#2b3355"
        pants="#2b3355"
        pantsDark="#232a49"
        face="joy"
        hair={HAIR[2]}
        skin={SKIN[2]}
        hands={[
          [-15, -25],
          [14, -20],
        ]}
      >
        <path d="M-4-36h8l-3 9h-2z" fill={C.paper} />
        <path d="M-3.4-33.5l3.4 2 3.4-2 1 3-4.4 1.6-4.4-1.6z" fill={C.red} />
      </Person>
      <g transform="translate(15 43)">
        <circle cx="0" cy="0" r="3.4" fill={C.pink} />
        <circle cx="-4" cy="3" r="2.8" fill={C.red} />
        <circle cx="4" cy="3" r="2.8" fill={C.pinkDark} />
        <circle cx="0" cy="5" r="2.6" fill={C.gold} />
      </g>
      <Heart x={32} y={26} r={5} fill={C.red} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Family lane.
// ---------------------------------------------------------------------------

export function nurserySetup(): ReactElement {
  return (
    <g>
      <path d="M18 14q14-10 28 0" stroke={C.wood} strokeWidth="2.6" fill="none" strokeLinecap="round" />
      <path d="M24 12v6M32 9v7M40 12v6" stroke={C.steelDark} strokeWidth="1.4" fill="none" />
      <Star x={24} y={22} r={4.2} fill={C.gold} />
      <Star x={32} y={20} r={4.2} fill={C.pink} />
      <Star x={40} y={22} r={4.2} fill={C.teal} />
      <rect x="12" y="32" width="40" height="20" rx="2" fill={C.wood} />
      <rect x="32" y="32" width="20" height="20" fill={C.woodDark} />
      <g fill="rgba(255,255,255,0.55)">
        <rect x="17" y="34" width="3" height="16" rx="1.5" />
        <rect x="24" y="34" width="3" height="16" rx="1.5" />
        <rect x="31" y="34" width="3" height="16" rx="1.5" />
        <rect x="38" y="34" width="3" height="16" rx="1.5" />
        <rect x="45" y="34" width="3" height="16" rx="1.5" />
      </g>
      <rect x="12" y="44" width="40" height="5" fill={C.pink} />
      <rect x="32" y="44" width="20" height="5" fill={C.pinkDark} />
      <rect x="14" y="52" width="4" height="8" rx="1.6" fill={C.woodDark} />
      <rect x="46" y="52" width="4" height="8" rx="1.6" fill={C.woodDark} />
      <g transform="translate(56 44)">
        <rect x="-4" y="0" width="8" height="14" rx="1.6" fill={C.gold} />
        <rect x="0" y="0" width="4" height="14" fill={C.goldDark} />
        <rect x="-4" y="-4" width="8" height="4" fill={C.steelDark} />
      </g>
    </g>
  )
}

export function newBaby(): ReactElement {
  return (
    <g>
      <Ground />
      <Heart x={12} y={18} r={5} />
      <Heart x={52} y={14} r={6} fill={C.red} />
      <Sparkle x={54} y={34} r={3.4} />
      <Person
        x={30}
        y={57}
        s={0.82}
        wear={C.purple}
        wearDark={C.purpleDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -22],
          [12, -25],
        ]}
      />
      <Baby x={30} y={35} s={0.95} blanket={C.pink} />
    </g>
  )
}

export function familyVacation(): ReactElement {
  return (
    <g>
      <Sun x={54} y={11} r={7} />
      <rect x="0" y="48" width="64" height="16" fill="#f0d9a8" />
      <path d="M0 44h64v5H0z" fill={C.teal} />
      <path d="M0 44q8-3 16 0t16 0 16 0 16 0v3H0z" fill={C.tealDark} />
      <g transform="translate(11 24) rotate(-16)">
        <path d="M-13 0a13 13 0 0 1 26 0z" fill={C.red} />
        <path d="M-6.5 0a13 13 0 0 1 6.5-11v11z" fill={C.paper} />
        <path d="M6.5 0a13 13 0 0 0-6.5-11v11z" fill={C.paper} />
        <rect x="-1.3" y="0" width="2.6" height="30" fill={C.woodDark} />
      </g>
      <Person
        x={26}
        y={54}
        s={0.52}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hair={HAIR[2]}
        hands={[
          [-13, -19],
          [14, -14],
        ]}
      />
      <Person
        x={38}
        y={54}
        s={0.52}
        wear={C.pink}
        wearDark={C.pinkDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-14, -14],
          [13, -19],
        ]}
      />
      <Person
        x={48}
        y={55}
        s={0.36}
        head={1.2}
        wear={C.gold}
        wearDark={C.goldDark}
        face="joy"
        hair={HAIR[3]}
        hands={[
          [-13, -20],
          [13, -20],
        ]}
      />
      <g transform="translate(8 51)">
        <rect x="-6" y="-6" width="12" height="11" rx="1.6" fill={C.woodDark} />
        <rect x="-6" y="-6" width="12" height="3.4" fill={C.wood} />
        <rect x="-2" y="-9" width="4" height="3.4" rx="1.5" fill="none" stroke={C.woodDark} strokeWidth="1.5" />
      </g>
    </g>
  )
}

export function schoolPlay(): ReactElement {
  return (
    <g>
      <path d="M22 4h20l8 18-8 12H22l-8-12z" fill={C.goldLite} opacity="0.5" />
      <rect x="0" y="4" width="64" height="6" fill={C.redDark} />
      <path d="M0 8h14q4 22-2 34H0z" fill={C.red} />
      <path d="M64 8H50q-4 22 2 34h12z" fill={C.red} />
      <path d="M6 8q3 20 0 34M58 8q-3 20 0 34" stroke={C.redDark} strokeWidth="2" fill="none" />
      <rect x="0" y="50" width="64" height="4" fill={C.wood} />
      <rect x="0" y="54" width="64" height="8" fill={C.woodDark} />
      <Person
        x={32}
        y={50}
        s={0.6}
        head={1.2}
        wear={C.purple}
        wearDark={C.purpleDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-14, -40],
          [14, -40],
        ]}
        feet={[
          [-7, -3],
          [7, -3],
        ]}
      />
      <Star x={12} y={20} r={4.4} />
      <Star x={52} y={22} r={4} />
    </g>
  )
}

export function pianoLessons(): ReactElement {
  return (
    <g>
      <Person
        x={32}
        y={44}
        s={0.56}
        head={1.2}
        legs={false}
        wear={C.teal}
        wearDark={C.tealDark}
        face="smile"
        hair={HAIR[3]}
        hands={[
          [-14, -14],
          [14, -14],
        ]}
      />
      <rect x="2" y="38" width="60" height="6" rx="1.6" fill={C.nightDark} />
      <rect x="2" y="44" width="60" height="14" rx="1.6" fill={C.paper} />
      <g stroke={C.steelDark} strokeWidth="1.2" fill="none">
        <path d="M10 44v14M18 44v14M26 44v14M34 44v14M42 44v14M50 44v14M58 44v14" />
      </g>
      <g fill={C.nightDark}>
        <rect x="7.6" y="44" width="4.8" height="8" rx="1" />
        <rect x="15.6" y="44" width="4.8" height="8" rx="1" />
        <rect x="31.6" y="44" width="4.8" height="8" rx="1" />
        <rect x="39.6" y="44" width="4.8" height="8" rx="1" />
        <rect x="47.6" y="44" width="4.8" height="8" rx="1" />
      </g>
      <rect x="2" y="58" width="60" height="4" rx="1.6" fill={C.night} />
      <g fill={C.purple}>
        <circle cx="50" cy="20" r="3.4" />
        <rect x="52" y="8" width="2.4" height="12" />
        <path d="M52 8q6 1 7 5-3-2-7-1z" />
      </g>
      <g fill={C.blue}>
        <circle cx="13" cy="16" r="3" />
        <rect x="14.8" y="6" width="2.2" height="10" />
        <path d="M14.8 6q5 1 6 4-3-2-6-1z" />
      </g>
    </g>
  )
}

export function secondBaby(): ReactElement {
  return (
    <g>
      <Ground />
      <Heart x={10} y={16} r={4.6} />
      <Heart x={54} y={12} r={5.4} fill={C.red} />
      <Person
        x={26}
        y={57}
        s={0.74}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hair={HAIR[2]}
        skin={SKIN[2]}
        hands={[
          [-13, -22],
          [15, -18],
        ]}
      />
      <Baby x={25} y={38} s={0.8} blanket={C.teal} />
      <Person
        x={49}
        y={58}
        s={0.4}
        head={1.2}
        wear={C.gold}
        wearDark={C.goldDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-16, -30],
          [13, -20],
        ]}
      />
    </g>
  )
}

export function soccerSeason(): ReactElement {
  return (
    <g>
      <rect x="0" y="50" width="64" height="14" fill={C.leaf} opacity="0.5" />
      <g transform="translate(46 34)">
        <rect x="-14" y="-14" width="28" height="28" fill="none" stroke={C.cloud} strokeWidth="3" />
        <g stroke={C.cloud} strokeWidth="1.2" opacity="0.85" fill="none">
          <path d="M-7-14v28M0-14v28M7-14v28M-14-7h28M-14 0h28M-14 7h28" />
        </g>
      </g>
      <Person
        x={20}
        y={54}
        s={0.62}
        head={1.15}
        wear={C.red}
        wearDark={C.redDark}
        face="joy"
        hair={HAIR[0]}
        hands={[
          [-15, -22],
          [13, -30],
        ]}
        feet={[
          [-9, -2],
          [11, -12],
        ]}
      />
      <g transform="translate(33 48)">
        <circle cx="0" cy="0" r="7" fill={C.paper} />
        <circle cx="0" cy="0" r="7" fill="none" stroke={C.paperEdge} strokeWidth="1.2" />
        <path d="M0-3.6 3.4-1.2 2.1 2.8h-4.2L-3.4-1.2z" fill={C.nightDark} />
        <path d="M0-7v3.4M4.6-6l-1.2 4.8M-4.6-6l1.2 4.8M5.4 4.4 2.1 2.8M-5.4 4.4 -2.1 2.8" stroke={C.nightDark} strokeWidth="1.3" fill="none" />
      </g>
    </g>
  )
}

export function familyPortrait(): ReactElement {
  return (
    <g>
      <rect x="5" y="9" width="54" height="46" rx="3" fill={C.gold} />
      <rect x="5" y="9" width="54" height="46" rx="3" fill="none" stroke={C.goldDark} strokeWidth="2" />
      <rect x="10" y="14" width="44" height="36" fill={C.paper} />
      <rect x="13" y="17" width="38" height="30" fill={C.cloud} />
      <Bust
        x={23}
        y={47}
        s={0.86}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hair={HAIR[2]}
        skin={SKIN[2]}
      />
      <Bust
        x={42}
        y={47}
        s={0.86}
        wear={C.pink}
        wearDark={C.pinkDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
      />
      <Bust
        x={32}
        y={47}
        s={0.66}
        head={1.2}
        wear={C.gold}
        wearDark={C.goldDark}
        face="joy"
        hair={HAIR[3]}
      />
      <Sparkle x={53} y={15} r={4} fill={C.goldLite} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Fast track — the ambitious lane.
// ---------------------------------------------------------------------------

export function bigPromotion(): ReactElement {
  return (
    <g>
      <rect x="6" y="48" width="17" height="12" fill={C.goldDark} />
      <rect x="6" y="48" width="17" height="3" fill={C.gold} />
      <rect x="23" y="42" width="17" height="18" fill={C.goldDark} />
      <rect x="23" y="42" width="17" height="3" fill={C.gold} />
      <rect x="40" y="36" width="18" height="24" fill={C.goldDark} />
      <rect x="40" y="36" width="18" height="3" fill={C.goldLite} />
      <Person
        x={49}
        y={36}
        s={0.5}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-14, -42],
          [14, -42],
        ]}
      />
      <Star x={18} y={16} r={7} />
      <Sparkle x={34} y={10} r={4.4} />
      <Sparkle x={8} y={30} r={3.4} />
    </g>
  )
}

export function networkingNight(): ReactElement {
  return (
    <g>
      <Ground />
      <Sparkle x={32} y={10} r={4.4} />
      <Coin x={32} y={22} r={5.5} />
      <Person
        x={19}
        y={57}
        s={0.68}
        wear={C.night}
        wearDark={C.nightDark}
        face="joy"
        hair={HAIR[3]}
        hands={[
          [-13, -20],
          [12, -30],
        ]}
      >
        <rect x="-8" y="-28" width="8" height="6" rx="1.2" fill={C.paper} />
      </Person>
      <Person
        x={46}
        y={57}
        s={0.68}
        flip
        wear={C.purple}
        wearDark={C.purpleDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -20],
          [12, -30],
        ]}
      >
        <rect x="-8" y="-28" width="8" height="6" rx="1.2" fill={C.paper} />
      </Person>
      <g transform="translate(27 34)">
        <path d="M-4-5h8l-2 6h-4z" fill={C.gold} />
        <path d="M0-5h4l-2 6h-2z" fill={C.goldDark} />
        <path d="M-0.9 1h1.8v4h-1.8z" fill={C.steel} />
      </g>
      <g transform="translate(38 34)">
        <path d="M-4-5h8l-2 6h-4z" fill={C.gold} />
        <path d="M0-5h4l-2 6h-2z" fill={C.goldDark} />
        <path d="M-0.9 1h1.8v4h-1.8z" fill={C.steel} />
      </g>
    </g>
  )
}

export function clientWin(): ReactElement {
  return (
    <g>
      <Ground />
      <Star x={32} y={11} r={7} />
      <Sparkle x={12} y={19} r={3.6} />
      <Sparkle x={53} y={17} r={3.2} />
      <Person
        x={15}
        y={57}
        s={0.68}
        wear={C.blue}
        wearDark={C.blueDark}
        face="joy"
        hair={HAIR[0]}
        hands={[
          [-13, -20],
          [19, -27],
        ]}
      />
      <Person
        x={49}
        y={57}
        s={0.68}
        flip
        wear={C.orange}
        wearDark={C.orangeDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[2]}
        hands={[
          [-13, -20],
          [19, -27],
        ]}
      />
      <g transform="translate(32 39)">
        <rect x="-6" y="-3.6" width="12" height="7.2" rx="3.6" fill={SKIN[1]} />
        <circle cx="-4" cy="0" r="3.6" fill={SKIN[0]} />
        <circle cx="4" cy="0" r="3.6" fill={SKIN[2]} />
      </g>
      <Card x={32} y={53} w={26} h={12} rot={-3}>
        <Rule x={-9} y={-3.5} w={13} />
        <Rule x={-9} y={0.5} w={9} />
        <circle cx="7" cy="0" r="3.4" fill={C.red} />
      </Card>
    </g>
  )
}

export function conferenceTalk(): ReactElement {
  return (
    <g>
      <rect x="3" y="6" width="40" height="28" rx="2" fill={C.cloud} />
      <rect x="3" y="6" width="40" height="28" rx="2" fill="none" stroke={C.steelDark} strokeWidth="2" />
      <path d="M8 28l9-7 6 4 12-13" stroke={C.gold} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M35 12h5v5" stroke={C.gold} strokeWidth="2.8" strokeLinecap="round" fill="none" />
      <Person
        x={45}
        y={42}
        s={0.5}
        legs={false}
        wear={C.purple}
        wearDark={C.purpleDark}
        face="joy"
        hair={HAIR[2]}
        skin={SKIN[1]}
        hands={[
          [-15, -32],
          [14, -18],
        ]}
      />
      <path d="M36 60 40 36h20l4 24z" fill={C.wood} />
      <path d="M50 36h10l4 24H50z" fill={C.woodDark} />
      <rect x="37" y="33" width="26" height="4" rx="1.6" fill={C.woodDark} />
      <path d="M43 33v-6" stroke={C.steelDark} strokeWidth="1.8" fill="none" />
      <circle cx="43" cy="25" r="2.8" fill={C.slate} />
      <path d="M12 44q3-4 6 0M8 52q3-4 6 0" stroke={C.steel} strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function bonusSeason(): ReactElement {
  return (
    <g>
      <Sparkle x={9} y={16} r={4} />
      <Sparkle x={55} y={14} r={4.6} />
      <Bill x={32} y={30} k={0.92} rot={-9} />
      <Bill x={33} y={37} k={0.92} rot={3} />
      <g>
        <rect x="27" y="20" width="6" height="34" fill={C.red} />
        <rect x="8" y="34" width="48" height="6" fill={C.red} />
        <rect x="27" y="34" width="29" height="6" fill={C.redDark} />
        <path d="M30 34q-9-8-1-11 5 2 1 11z" fill={C.red} />
        <path d="M30 34q9-8 1-11-5 2-1 11z" fill={C.redDark} />
        <circle cx="30" cy="34" r="3" fill={C.red} />
      </g>
      <Coin x={12} y={50} r={7} />
      <Coin x={52} y={52} r={6} />
    </g>
  )
}

export function cornerOffice(): ReactElement {
  return (
    <g>
      <rect x="4" y="5" width="56" height="36" rx="2" fill={C.blue} />
      <path d="M32 5h28v36H32z" fill={C.blueDark} />
      <g fill={C.night}>
        <rect x="8" y="26" width="8" height="15" />
        <rect x="18" y="20" width="7" height="21" />
        <rect x="27" y="29" width="9" height="12" />
        <rect x="38" y="22" width="8" height="19" />
        <rect x="48" y="30" width="8" height="11" />
      </g>
      <g fill={C.gold} opacity="0.9">
        <rect x="20" y="23" width="2.4" height="2.4" />
        <rect x="40" y="25" width="2.4" height="2.4" />
        <rect x="10" y="30" width="2.4" height="2.4" />
      </g>
      <rect x="30" y="5" width="4" height="36" fill={C.steel} />
      <rect x="4" y="21" width="56" height="4" fill={C.steel} />
      <rect x="4" y="5" width="56" height="36" rx="2" fill="none" stroke={C.steelDark} strokeWidth="3" />
      <rect x="2" y="41" width="60" height="4" rx="1.5" fill={C.steelDark} />
      <rect x="6" y="47" width="30" height="4" rx="1.5" fill={C.wood} />
      <rect x="8" y="51" width="4" height="9" fill={C.woodDark} />
      <rect x="30" y="51" width="4" height="9" fill={C.woodDark} />
      <g transform="translate(48 50)">
        <rect x="-8" y="-10" width="16" height="13" rx="4" fill={C.slate} />
        <rect x="-2" y="3" width="4" height="6" fill={C.steelDark} />
        <rect x="-8" y="9" width="16" height="3" rx="1.5" fill={C.steelDark} />
      </g>
      <rect x="10" y="43" width="14" height="4" rx="1.4" fill={C.gold} />
    </g>
  )
}

export function houseHunting(): ReactElement {
  return (
    <g>
      <Floor y={54} />
      <path d="M26 27 44 13 62 27z" fill={C.redDark} />
      <path d="M44 13 62 27H44z" fill="#9c2f38" />
      <rect x="30" y="27" width="28" height="27" fill={C.paperShade} />
      <rect x="44" y="27" width="14" height="27" fill="#cdbe9c" />
      <rect x="40" y="38" width="9" height="16" rx="1" fill={C.wood} />
      <circle cx="47" cy="46" r="1.3" fill={C.gold} />
      <rect x="32" y="32" width="7" height="7" rx="1" fill={C.cloud} />
      <rect x="51" y="32" width="6" height="7" rx="1" fill={C.cloud} />
      <rect x="22" y="34" width="3.4" height="20" fill={C.woodDark} />
      <Card x={20} y={28} w={24} h={14} r={2}>
        <Rule x={-8} y={-4} w={16} fill={C.blueDark} />
        <Rule x={-8} y={0.5} w={11} fill={C.blue} />
      </Card>
      <Person
        x={10}
        y={55}
        s={0.5}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -20],
          [13, -36],
        ]}
      />
      <Sparkle x={16} y={10} r={4} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Risky road — the gamble lane, where half the tiles bite.
// ---------------------------------------------------------------------------

export function startupBet(): ReactElement {
  return (
    <g>
      <g transform="translate(32 28)">
        <path d="M0-25c6 6 8 14 8 21v8H-8v-8c0-7 2-15 8-21z" fill={C.paper} />
        <path d="M0-25c6 6 8 14 8 21v8H0z" fill={C.paperShade} />
        <path d="M-8 0c-5 2-8 6-8 10h8zM8 0c5 2 8 6 8 10H8z" fill={C.red} />
        <circle cx="0" cy="-8" r="4.4" fill={C.blue} />
        <circle cx="0" cy="-8" r="4.4" fill="none" stroke={C.steelDark} strokeWidth="1.4" />
      </g>
      <path d="M26 32h12l-6 14z" fill={C.gold} />
      <path d="M28 34h8l-4 8z" fill={C.red} />
      <CoinStack x={17} y={54} n={2} r={6.5} />
      <CoinStack x={47} y={54} n={3} r={6.5} />
      <Sparkle x={10} y={22} r={3.6} />
      <Sparkle x={54} y={20} r={4} />
    </g>
  )
}

export function stockTip(): ReactElement {
  return (
    <g>
      <rect x="14" y="8" width="36" height="50" rx="5" fill={C.nightDark} />
      <rect x="17" y="14" width="30" height="38" rx="2" fill={C.cloud} />
      <rect x="27" y="10" width="10" height="2.4" rx="1.2" fill={C.steel} />
      <path d="M20 20l7 9 5-4 10 18" stroke={C.red} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M44 45l-2-9 8 3z" fill={C.red} />
      <g fill={C.steel} opacity="0.7">
        <rect x="20" y="46" width="6" height="4" />
        <rect x="28" y="44" width="6" height="6" />
      </g>
      <g transform="translate(48 16)">
        <path d="M-11-9h22a4 4 0 0 1 4 4v8a4 4 0 0 1-4 4h-14l-6 5v-5h-2a4 4 0 0 1-4-4v-8a4 4 0 0 1 4-4z" fill={C.gold} />
        <circle cx="-4" cy="-1" r="1.7" fill={C.goldDark} />
        <circle cx="1" cy="-1" r="1.7" fill={C.goldDark} />
        <circle cx="6" cy="-1" r="1.7" fill={C.goldDark} />
      </g>
    </g>
  )
}

export function pokerNight(): ReactElement {
  return (
    <g>
      <rect x="2" y="18" width="60" height="36" rx="6" fill={C.leafDark} />
      <rect x="5" y="21" width="54" height="30" rx="4" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" />
      <Card x={22} y={32} w={20} h={28} rot={-13}>
        <path d="M0 5C-6 0-4-6 0-3 4-6 6 0 0 5z" fill={C.red} />
        <circle cx="-6" cy="-10" r="1.8" fill={C.red} />
      </Card>
      <Card x={36} y={31} w={20} h={28} rot={9}>
        <path d="M0-6c4 5 5 7 3 9-1 1-2 0-3-1 0 2 1 3 1 3h-2s1-1 1-3c-1 1-2 2-3 1-2-2-1-4 3-9z" fill={C.nightDark} />
        <circle cx="-6" cy="-10" r="1.8" fill={C.nightDark} />
      </Card>
      <g transform="translate(50 46)">
        <ellipse cx="0" cy="0" rx="9" ry="3.4" fill={C.red} />
        <ellipse cx="0" cy="-4" rx="9" ry="3.4" fill={C.blue} />
        <ellipse cx="0" cy="-8" rx="9" ry="3.4" fill={C.paper} />
        <ellipse cx="0" cy="-8" rx="4.4" ry="1.7" fill={C.grey} />
      </g>
      <Coin x={12} y={46} r={6} />
    </g>
  )
}

export function garageSale(): ReactElement {
  return (
    <g>
      <path d="M2 20 32 4l30 16z" fill={C.redDark} />
      <rect x="7" y="20" width="50" height="38" fill={C.paperShade} />
      <rect x="32" y="20" width="25" height="38" fill="#cdbe9c" />
      <rect x="14" y="14" width="36" height="7" rx="1.4" fill={C.steel} />
      <rect x="14" y="28" width="36" height="30" fill={C.nightDark} />
      <g fill={C.steel} opacity="0.5">
        <rect x="14" y="23" width="36" height="2.4" />
        <rect x="14" y="26" width="36" height="2" />
      </g>
      <rect x="17" y="44" width="30" height="3" rx="1.4" fill={C.wood} />
      <rect x="19" y="47" width="3" height="11" fill={C.woodDark} />
      <rect x="42" y="47" width="3" height="11" fill={C.woodDark} />
      <g>
        <path d="M22 44l3-8h5l3 8z" fill={C.gold} />
        <rect x="36" y="36" width="9" height="8" rx="1.2" fill={C.blue} />
        <rect x="40.5" y="36" width="4.5" height="8" fill={C.blueDark} />
      </g>
      <g transform="translate(52 36) rotate(20)">
        <path d="M0-7h11v14H0l-6-7z" fill={C.gold} />
        <circle cx="-2.4" cy="0" r="1.7" fill={C.goldDark} />
        <rect x="2" y="-2.4" width="7" height="2.4" rx="1.2" fill={C.goldDark} />
      </g>
    </g>
  )
}

export function marketCrash(): ReactElement {
  return (
    <g>
      <rect x="4" y="8" width="56" height="42" rx="3" fill={C.nightDark} />
      <rect x="7" y="11" width="50" height="36" rx="2" fill={C.night} />
      <g fill="#5a3350">
        <rect x="12" y="30" width="7" height="17" />
        <rect x="22" y="34" width="7" height="13" />
        <rect x="32" y="38" width="7" height="9" />
        <rect x="42" y="41" width="7" height="6" />
      </g>
      <path d="M11 17l10 10 7-6 12 16" stroke={C.red} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M52 46 38 40l6-8z" fill={C.red} />
      <path d="M40 50l6 10-9-4z" fill={C.redDark} />
      <path d="M18 50l-4 10M30 51l-1 9M50 51l4 9" stroke={C.redDark} strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function lotteryTicket(): ReactElement {
  return (
    <g>
      <g transform="translate(31 34) rotate(-7)">
        <rect x="-25" y="-16" width="50" height="32" rx="3" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.4" />
        <rect x="-25" y="-16" width="50" height="9" rx="3" fill={C.red} />
        <rect x="-25" y="-10" width="50" height="3" fill={C.redDark} />
        <rect x="-21" y="-3" width="12" height="12" rx="1.6" fill={C.grey} />
        <rect x="-6" y="-3" width="12" height="12" rx="1.6" fill={C.grey} />
        <rect x="9" y="-3" width="12" height="12" rx="1.6" fill={C.goldLite} />
        <path d={starPath(15, 3, 5)} fill={C.gold} />
        <path d="M-19-1h8M-4-1h8" stroke={C.steel} strokeWidth="1.4" fill="none" />
      </g>
      <Coin x={48} y={49} r={8} />
      <Sparkle x={12} y={12} r={4.4} />
      <Sparkle x={55} y={18} r={3.6} />
    </g>
  )
}

export function surpriseBonus(): ReactElement {
  return (
    <g>
      <Sparkle x={9} y={14} r={4} />
      <Sparkle x={55} y={12} r={4.4} />
      <path d="M8 30 32 8l24 22z" fill={C.greenDark} />
      <Coin x={32} y={20} r={8} />
      <Coin x={16} y={28} r={6.5} />
      <Coin x={48} y={28} r={6.5} />
      <path d="M10 34h44a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V36a2 2 0 0 1 2-2z" fill={C.green} />
      <path d="M32 34h22a2 2 0 0 1 2 2v20a2 2 0 0 1-2 2H32z" fill={C.greenDark} />
      <path d="M8 36l24 14 24-14" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="2.2" />
      <g fill={C.pink}>
        <rect x="14" y="14" width="4" height="4" rx="1" transform="rotate(20 16 16)" />
        <rect x="46" y="20" width="4" height="4" rx="1" transform="rotate(-25 48 22)" />
      </g>
      <rect x="26" y="6" width="4" height="4" rx="1" fill={C.blue} transform="rotate(30 28 8)" />
    </g>
  )
}

export function biddingWar(): ReactElement {
  return (
    <g>
      <path d="M40 50l-5-5 4-4 5 5z" fill="none" />
      <rect x="30" y="48" width="30" height="7" rx="2" fill={C.woodDark} />
      <rect x="30" y="48" width="30" height="2.6" fill={C.wood} />
      <g transform="translate(45 30) rotate(-32)">
        <rect x="-11" y="-6" width="22" height="12" rx="3" fill={C.wood} />
        <rect x="-11" y="0" width="22" height="6" rx="2" fill={C.woodDark} />
        <rect x="-1.8" y="6" width="3.6" height="16" rx="1.8" fill={C.woodDark} />
      </g>
      <path d="M52 40l5 4M36 40l-5 4" stroke={C.red} strokeWidth="2.6" strokeLinecap="round" fill="none" />
      <Person
        x={15}
        y={58}
        s={0.58}
        wear={C.slate}
        wearDark="#454e68"
        face="flat"
        hair={HAIR[2]}
        skin={SKIN[2]}
        hands={[
          [-13, -20],
          [6, -42],
        ]}
      />
      <g transform="translate(18.5 34)">
        <rect x="-7" y="-12" width="14" height="16" rx="2" fill={C.red} />
        <rect x="0" y="-12" width="7" height="16" fill={C.redDark} />
        <rect x="-4" y="-7" width="8" height="3" rx="1.5" fill={C.paper} />
        <rect x="-1.6" y="4" width="3.2" height="7" fill={C.woodDark} />
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// Safe street — small, calm, reliable gains. Everything here is an object;
// the point of the lane is that nothing dramatic happens.
// ---------------------------------------------------------------------------

export function couponClipping(): ReactElement {
  return (
    <g>
      <rect x="4" y="24" width="44" height="26" rx="3" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.4" />
      <rect
        x="8"
        y="28"
        width="36"
        height="18"
        rx="2"
        fill="none"
        stroke={C.green}
        strokeWidth="1.8"
        strokeDasharray="3 3"
      />
      <circle cx="36" cy="37" r="7.5" fill={C.red} />
      <circle cx="33.6" cy="34.6" r="1.7" fill={C.paper} />
      <circle cx="38.4" cy="39.4" r="1.7" fill={C.paper} />
      <path d="M39.4 33.6 32.6 40.4" stroke={C.paper} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <Rule x={11} y={31} w={14} fill={C.paperShade} />
      <Rule x={11} y={36} w={11} fill={C.paperShade} />
      <g transform="translate(48 17) rotate(35)">
        <path d="M-2-2 -12-16" stroke={C.steel} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <path d="M2-2 12-16" stroke={C.steelDark} strokeWidth="3.4" strokeLinecap="round" fill="none" />
        <circle cx="-4" cy="4" r="4" fill="none" stroke={C.red} strokeWidth="2.6" />
        <circle cx="4" cy="4" r="4" fill="none" stroke={C.redDark} strokeWidth="2.6" />
      </g>
    </g>
  )
}

export function gardenHarvest(): ReactElement {
  return (
    <g>
      <path d="M6 44h52v12H6z" fill="#7a5537" />
      <path d="M6 44h52v4H6z" fill="#8f6743" />
      <path d="M24 44V22" stroke={C.leafDark} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M24 30q-9-2-9-9 9 0 9 9zM24 24q9-2 9-9-9 0-9 9z" fill={C.leaf} />
      <circle cx="17" cy="34" r="5.4" fill={C.red} />
      <circle cx="30" cy="32" r="6" fill={C.red} />
      <circle cx="24" cy="41" r="4.6" fill={C.redDark} />
      <path d="M15 32q2-3 4-2M28 30q2-3 4-2" stroke={C.leafDark} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <g transform="translate(46 46)">
        <path d="M-11-6h22l-3 12h-16z" fill={C.wood} />
        <path d="M0-6h11l-3 12H0z" fill={C.woodDark} />
        <path d="M-11-6h22v3h-22z" fill="#a9793f" />
        <circle cx="-5" cy="-9" r="4" fill={C.red} />
        <circle cx="3" cy="-10" r="4.4" fill={C.orange} />
        <path d="M8-8q4-6 8-5-2 6-8 5z" fill={C.leaf} />
      </g>
    </g>
  )
}

export function budgetWin(): ReactElement {
  return (
    <g>
      <rect x="12" y="8" width="34" height="46" rx="2" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.4" />
      <rect x="12" y="8" width="7" height="46" fill={C.paperShade} />
      <g fill={C.steelDark}>
        <rect x="13" y="13" width="5" height="3" rx="1.5" />
        <rect x="13" y="22" width="5" height="3" rx="1.5" />
        <rect x="13" y="31" width="5" height="3" rx="1.5" />
        <rect x="13" y="40" width="5" height="3" rx="1.5" />
      </g>
      <Rule x={23} y={14} w={18} />
      <Rule x={23} y={21} w={14} />
      <Rule x={23} y={28} w={17} />
      <Rule x={23} y={35} w={12} />
      <path d="M18 33l9 10 20-24" stroke={C.green} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <Coin x={50} y={48} r={9} />
      <Sparkle x={54} y={16} r={4} />
    </g>
  )
}

export function interestPayout(): ReactElement {
  return (
    <g>
      <path d="M8 44 54 16" stroke={C.green} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M58 12l-2 11-8-6z" fill={C.green} />
      <CoinStack x={15} y={54} n={2} r={7} />
      <CoinStack x={32} y={54} n={4} r={7} />
      <CoinStack x={49} y={54} n={6} r={7} />
      <Sparkle x={10} y={16} r={3.6} />
    </g>
  )
}

export function yardSale(): ReactElement {
  return (
    <g>
      <rect x="0" y="46" width="64" height="18" fill={C.leaf} opacity="0.45" />
      <rect x="47" y="24" width="3.4" height="24" fill={C.woodDark} />
      <Card x={48} y={18} w={26} h={16} rot={-5}>
        <Rule x={-9} y={-4.5} w={18} fill={C.blueDark} />
        <Rule x={-9} y={0} w={13} fill={C.blue} />
      </Card>
      <rect x="4" y="38" width="36" height="4" rx="1.5" fill={C.wood} />
      <rect x="7" y="42" width="3" height="12" fill={C.woodDark} />
      <rect x="34" y="42" width="3" height="12" fill={C.woodDark} />
      <g>
        <rect x="7" y="30" width="9" height="8" rx="1.4" fill={C.purple} />
        <rect x="11.5" y="30" width="4.5" height="8" fill={C.purpleDark} />
        <rect x="19" y="32" width="8" height="6" rx="1.2" fill={C.red} />
        <rect x="23" y="32" width="4" height="6" fill={C.redDark} />
        <circle cx="33" cy="34" r="4" fill={C.teal} />
      </g>
      <Person
        x={22}
        y={38}
        s={0.5}
        legs={false}
        wear={C.gold}
        wearDark={C.goldDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -18],
          [13, -18],
        ]}
      />
      <Coin x={50} y={50} r={6.5} />
    </g>
  )
}

export function cashbackBonus(): ReactElement {
  return (
    <g>
      <rect x="6" y="20" width="44" height="28" rx="4" fill={C.blue} />
      <path d="M28 20h22a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H28z" fill={C.blueDark} />
      <rect x="6" y="26" width="48" height="7" fill={C.night} />
      <rect x="11" y="37" width="9" height="7" rx="1.6" fill={C.gold} />
      <path d="M11 40h9M15.5 37v7" stroke={C.goldDark} strokeWidth="1.2" fill="none" />
      <rect x="24" y="38" width="14" height="3" rx="1.5" fill="rgba(255,255,255,0.6)" />
      <Coin x={48} y={48} r={10} />
      <path d="M20 15q14-8 27-1" stroke={C.green} strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M17 9l1 9 8-4z" fill={C.green} />
    </g>
  )
}

export function refundCheck(): ReactElement {
  return (
    <g>
      <rect x="4" y="16" width="56" height="30" rx="3" fill={C.paper} stroke={C.paperEdge} strokeWidth="1.4" />
      <rect x="4" y="16" width="56" height="8" rx="3" fill={C.blue} />
      <rect x="4" y="21" width="56" height="3" fill={C.blueDark} />
      <Rule x={9} y={28} w={22} />
      <rect x="36" y="27" width="20" height="9" rx="2" fill={C.green} />
      <rect x="36" y="27" width="20" height="9" rx="2" fill="none" stroke={C.greenDark} strokeWidth="1.2" />
      <path
        d="M9 41q4-6 8-2t8-2"
        stroke={C.night}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
      />
      <Coin x={48} y={49} r={8} />
      <Sparkle x={12} y={9} r={3.6} />
    </g>
  )
}

export function quietSavings(): ReactElement {
  return (
    <g>
      <path
        d="M14 40a17 13 0 0 1 17-13c5 0 9 2 12 5l6-2-2 7a13 13 0 0 1 1 3l4 2v7l-5 1a17 17 0 0 1-6 5v4h-6v-2a22 22 0 0 1-10 0v2h-6v-5a15 15 0 0 1-5-11z"
        fill={C.pink}
      />
      <path
        d="M31 27c5 0 9 2 12 5l6-2-2 7a13 13 0 0 1 1 3l4 2v7l-5 1a17 17 0 0 1-6 5v4h-6v-2a30 30 0 0 1-4 .3V27z"
        fill={C.pinkDark}
      />
      <ellipse cx="17" cy="38" rx="5" ry="4" fill={C.pinkDark} />
      <circle cx="15.5" cy="37" r="1.2" fill="#8c3a58" />
      <circle cx="26" cy="33" r="1.5" fill={C.ink} />
      <rect x="28" y="24" width="14" height="3.4" rx="1.7" fill="#8c3a58" transform="rotate(-6 35 26)" />
      <Coin x={35} y={13} r={7} />
      <Sparkle x={53} y={20} r={3.4} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Sunset strip and the two ends of the journey.
// ---------------------------------------------------------------------------

export function retirementFund(): ReactElement {
  return (
    <g>
      <ellipse cx="32" cy="46" rx="26" ry="12" fill={C.woodDark} />
      <ellipse cx="32" cy="43" rx="26" ry="11" fill={C.wood} />
      <ellipse cx="32" cy="43" rx="17" ry="6.5" fill="#7a5537" />
      <g stroke={C.woodDark} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M9 44q10 5 22 5t23-5M12 50q9 4 20 4t21-4" />
      </g>
      <ellipse cx="32" cy="30" rx="11" ry="14" fill={C.gold} />
      <path d="M32 16a11 14 0 0 1 0 28z" fill={C.goldDark} />
      <ellipse cx="27.5" cy="24" rx="3.2" ry="4.4" fill={C.goldLite} transform="rotate(-20 27.5 24)" />
      <Sparkle x={12} y={16} r={4.4} />
      <Sparkle x={53} y={14} r={3.6} />
    </g>
  )
}

export function sunsetAhead(): ReactElement {
  return (
    <g>
      <circle cx="32" cy="28" r="16" fill={C.gold} />
      <g fill={C.goldLite} opacity="0.75">
        <rect x="14" y="21" width="36" height="3.4" />
        <rect x="14" y="28" width="36" height="3.4" />
        <rect x="14" y="35" width="36" height="3.4" />
      </g>
      <path d="M0 40h64v4H0z" fill={C.orangeDark} opacity="0.35" />
      <path d="M26 42h12l16 22H10z" fill={C.slate} opacity="0.45" />
      <path d="M31 42h2l4 22h-8z" fill={C.paper} opacity="0.85" />
      <path d="M0 44h64v20H0z" fill={C.night} opacity="0.12" />
      <Person
        x={40}
        y={58}
        s={0.32}
        wear={C.night}
        wearDark={C.nightDark}
        pants={C.nightDark}
        pantsDark="#1e2444"
        skin={SKIN[3]}
        hair={HAIR[2]}
        face="smile"
        hands={[
          [-13, -22],
          [13, -18],
        ]}
        feet={[
          [-8, -2],
          [8, -6],
        ]}
      />
    </g>
  )
}

export function retirement(): ReactElement {
  return (
    <g>
      <Sun x={48} y={16} r={10} />
      <Ground />
      <Person
        x={27}
        y={57}
        s={0.86}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hair="#c9c9d4"
        hands={[
          [-13, -20],
          [14, -38],
        ]}
      />
      <path d="M39 20q4-3 8 0" stroke={C.goldLite} strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <g transform="translate(39 22)">
        <path d="M0-8v-4" stroke={C.gold} strokeWidth="2" fill="none" />
        <circle cx="0" cy="0" r="7.5" fill={C.gold} />
        <circle cx="0" cy="0" r="5" fill={C.goldLite} />
        <path d="M0-3.4V0h2.6" stroke={C.goldDark} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      </g>
      <Sparkle x={12} y={22} r={4} />
      <Sparkle x={58} y={38} r={3.4} />
    </g>
  )
}

export function startOfLife(): ReactElement {
  return (
    <g>
      <Sun x={49} y={15} r={9} />
      <Floor y={55} />
      <path d="M6 55 24 55 20 62H2z" fill={C.paper} opacity="0.5" />
      <g transform="translate(21 40)">
        <rect x="-9" y="-10" width="18" height="20" rx="4" fill={C.red} />
        <rect x="0" y="-10" width="9" height="20" fill={C.redDark} />
        <rect x="-5" y="-2" width="10" height="6" rx="1.6" fill={C.paper} opacity="0.7" />
      </g>
      <Person
        x={27}
        y={57}
        s={0.8}
        wear={C.gold}
        wearDark={C.goldDark}
        face="joy"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -20],
          [13, -40],
        ]}
      />
      <Sparkle x={11} y={18} r={4} />
      <Sparkle x={57} y={34} r={3.4} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Career churn, family costs, and the two upsets that keep last place alive.
// ---------------------------------------------------------------------------

export function careerFairReturn(): ReactElement {
  return (
    <g>
      <Booth tone={C.purple} toneDark={C.purpleDark} />
      <Person
        x={22}
        y={58}
        s={0.6}
        legs={false}
        wear={C.blue}
        wearDark={C.blueDark}
        face="smile"
        hair={HAIR[3]}
        hands={[
          [-13, -20],
          [16, -30],
        ]}
      />
      <Card x={35} y={38} w={14} h={17} rot={-10}>
        <Rule x={-4.6} y={-6} w={9} />
        <Rule x={-4.6} y={-2} w={7} />
        <Rule x={-4.6} y={2} w={9} />
      </Card>
      <g transform="translate(50 18)">
        <path d="M-8 0a8 8 0 1 1 3.2 6.4" stroke={C.gold} strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <path d="M-4.6 3.4-8.6 6.2-9.4 1.8Z" fill={C.gold} />
      </g>
    </g>
  )
}

export function childBenefit(): ReactElement {
  return (
    <g>
      <Heart x={12} y={14} r={4.4} />
      <Heart x={52} y={12} r={4} fill={C.red} />
      <Bust x={20} y={48} s={0.62} head={1.2} wear={C.gold} wearDark={C.goldDark} face="joy" hair={HAIR[3]} />
      <Bust
        x={44}
        y={49}
        s={0.56}
        head={1.2}
        wear={C.teal}
        wearDark={C.tealDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
      />
      <CoinStack x={32} y={58} n={4} r={7} />
      <Sparkle x={9} y={32} r={3.2} />
    </g>
  )
}

export function dividendDay(): ReactElement {
  return (
    <g>
      <rect x="6" y="10" width="34" height="26" rx="3" fill={C.nightDark} />
      <rect x="9" y="13" width="28" height="20" rx="2" fill={C.night} />
      <path d="M12 27l7-8 5 4 8-12" stroke={C.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M32 11l3 6-6 1z" fill={C.green} />
      <Bill x={48} y={40} k={0.72} rot={-6} />
      <CoinStack x={20} y={54} n={3} r={6.5} />
      <CoinStack x={38} y={56} n={2} r={6} />
      <Sparkle x={54} y={16} r={3.6} />
    </g>
  )
}

export function fenderBender(): ReactElement {
  return (
    <g>
      <Floor y={54} />
      <path d="M6 50q-1-13 8-14l6-9h20l6 9q9 1 8 14z" fill={C.orange} />
      <path d="M32 27h13l6 9q9 1 8 14H32z" fill={C.orangeDark} />
      <path d="M22 30h9v6h-13z" fill={C.cloud} />
      <path d="M33 30h8l4 6H33z" fill={C.cloud} opacity="0.7" />
      <circle cx="18" cy="50" r="6.5" fill={C.nightDark} />
      <circle cx="18" cy="50" r="2.6" fill={C.steel} />
      <circle cx="46" cy="50" r="6.5" fill={C.nightDark} />
      <circle cx="46" cy="50" r="2.6" fill={C.steel} />
      <path d="M2 46q4-4 10-2l2 6q-8 3-12-4Z" fill={C.orangeDark} />
      <Star x={9} y={32} r={4} fill={C.goldLite} />
      <Star x={1} y={43} r={2.6} fill={C.goldLite} />
      <path d="M4 28q3 2 2 6" stroke={C.grey} strokeWidth="2.4" strokeLinecap="round" fill="none" opacity="0.8" />
    </g>
  )
}

export function headhunted(): ReactElement {
  return (
    <g>
      <Sparkle x={9} y={14} r={4} />
      <Sparkle x={55} y={16} r={3.6} />
      <Bust x={26} y={46} s={0.82} wear={C.blue} wearDark={C.blueDark} face="joy" hair={HAIR[0]} />
      <g transform="translate(26 30)">
        <circle cx="0" cy="0" r="17" fill="none" stroke={C.gold} strokeWidth="3.2" />
        <path d="M12 12 22 22" stroke={C.gold} strokeWidth="4.6" strokeLinecap="round" />
      </g>
      <g transform="translate(50 46)">
        <rect x="-9" y="-6" width="18" height="13" rx="2" fill={C.night} />
        <rect x="-9" y="-6" width="18" height="13" rx="2" fill="none" stroke={C.nightDark} strokeWidth="1.4" />
        <path d="M-4-6v-3a4 4 0 0 1 8 0v3" fill="none" stroke={C.nightDark} strokeWidth="1.8" />
      </g>
      <Star x={41} y={12} r={4.6} />
    </g>
  )
}

export function homeUpgrade(): ReactElement {
  return (
    <g>
      <Floor y={54} />
      <g transform="translate(14 46)">
        <path d="M-10 4 0-6 10 4V12H-10Z" fill={C.wood} />
        <path d="M0-6 10 4H0Z" fill={C.woodDark} />
        <rect x="-3" y="5" width="6" height="7" fill={C.nightDark} />
      </g>
      <path d="M28 34q6-8 12 0" stroke={C.green} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <path d="M40 30l6 1-3 6z" fill={C.green} />
      <g transform="translate(48 40)">
        <path d="M-17 6 0-12 17 6V24H-17Z" fill={C.gold} />
        <path d="M0-12 17 6H0Z" fill={C.goldDark} />
        <rect x="-5" y="9" width="10" height="15" fill={C.nightDark} />
        <rect x="-13" y="-2" width="6" height="6" fill={C.cloud} />
        <rect x="7" y="-2" width="6" height="6" fill={C.cloud} />
      </g>
      <Sparkle x={9} y={16} r={3.6} />
      <Sparkle x={57} y={14} r={3.2} />
    </g>
  )
}

export function houseFire(): ReactElement {
  return (
    <g>
      <Floor y={54} />
      <rect x="18" y="34" width="28" height="20" fill={C.wood} />
      <path d="M14 34 32 20 50 34Z" fill={C.woodDark} />
      <rect x="28" y="42" width="8" height="12" fill={C.nightDark} />
      <rect x="21" y="38" width="6" height="6" fill={C.cloud} />
      <path d="M32 8q6 6 2 12 6-2 4 6-4 8-10 4 2-6-2-8 4 0 6-4-2-4 0-10Z" fill={C.gold} />
      <path d="M32 8q6 6 2 12 4-1 4 4-2 5-6 4 1-5-2-7 3 0 4-3-1-3-2-10Z" fill={C.red} opacity="0.85" />
      <g fill={C.grey} opacity="0.7">
        <circle cx="40" cy="10" r="4.4" />
        <circle cx="46" cy="6" r="3.2" />
        <circle cx="35" cy="4" r="3" />
      </g>
      <Sparkle x={12} y={20} r={3} fill={C.goldLite} />
    </g>
  )
}

export function layoffNotice(): ReactElement {
  return (
    <g>
      <rect x="0" y="46" width="64" height="4" rx="1.5" fill={C.wood} />
      <rect x="2" y="50" width="60" height="10" fill={C.woodDark} />
      <Person
        x={24}
        y={58}
        s={0.68}
        legs={false}
        wear={C.slate}
        wearDark="#454e68"
        face="flat"
        hair={HAIR[2]}
        skin={SKIN[2]}
        hands={[
          [-9, -14],
          [15, -14],
        ]}
      />
      <g transform="translate(24 34)">
        <rect x="-11" y="-3" width="22" height="16" rx="1.6" fill={C.wood} />
        <rect x="-11" y="-3" width="22" height="4" fill={C.woodDark} />
        <path d="M-6-3q0-5 6-5t6 5" stroke={C.leafDark} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M-2-8q2-4 4 0" fill={C.leaf} />
      </g>
      <Card x={45} y={22} w={18} h={13} rot={14}>
        <Rule x={-6} y={-3} w={11} fill={C.redDark} />
        <Rule x={-6} y={1} w={8} />
      </Card>
      <path d="M2 12q3-4 6 0" stroke={C.steelDark} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </g>
  )
}

export function rivalSwap(): ReactElement {
  return (
    <g>
      <Person
        x={13}
        y={62}
        s={0.5}
        legs={false}
        wear={C.blue}
        wearDark={C.blueDark}
        face="shock"
        hair={HAIR[0]}
        hands={[
          [-13, -18],
          [13, -18],
        ]}
      />
      <Person
        x={51}
        y={62}
        s={0.5}
        legs={false}
        flip
        wear={C.pink}
        wearDark={C.pinkDark}
        face="joy"
        hairStyle="long"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -18],
          [13, -18],
        ]}
      />
      <Coin x={13} y={36} r={5.5} />
      <CoinStack x={51} y={40} n={4} r={6} />
      <g stroke={C.gold} strokeWidth="3.2" strokeLinecap="round" fill="none">
        <path d="M22 18q10-9 20 0" />
        <path d="M42 20q-10 9-20 0" />
      </g>
      <path d="M39 14l6 3-4 5z" fill={C.gold} />
      <path d="M25 24l-6-3 4-5z" fill={C.gold} />
      <Star x={32} y={8} r={4.4} />
    </g>
  )
}

export function schoolFees(): ReactElement {
  return (
    <g>
      <Person
        x={20}
        y={58}
        s={0.6}
        head={1.2}
        wear={C.teal}
        wearDark={C.tealDark}
        face="flat"
        hairStyle="bun"
        hair={HAIR[1]}
        skin={SKIN[1]}
        hands={[
          [-13, -18],
          [13, -18],
        ]}
      >
        <path d="M9-30h9v16H9z" fill={C.orange} />
        <path d="M13.5-30h4.5v16h-4.5z" fill={C.orangeDark} />
      </Person>
      <Card x={44} y={30} w={26} h={32} rot={6}>
        <rect x="-13" y="-16" width="26" height="8" rx="2" fill={C.red} />
        <path d="M-13-8h26v2H-13z" fill={C.redDark} />
        <Rule x={-9} y={0} w={18} />
        <Rule x={-9} y={6} w={14} />
        <rect x="-9" y="10" width="18" height="6" rx="2" fill={C.red} />
      </Card>
      <Coin x={12} y={22} r={5.5} />
    </g>
  )
}

export function stickyFingers(): ReactElement {
  return (
    <g>
      <Ground />
      <g transform="translate(24 46)">
        <path d="M-8 10h16l-2-8H-6z" fill={C.goldDark} />
        <circle cx="0" cy="-2" r="8" fill="none" stroke={C.gold} strokeWidth="3.4" />
        <path d="M-8-2q0-6 8-6t8 6" fill="none" stroke={C.gold} strokeWidth="3.4" strokeLinecap="round" />
      </g>
      <g transform="translate(46 24) rotate(-18)">
        <path d="M0 18C-6 18-10 12-10 6-10-2-6-8 0-8S10-2 10 6C10 12 6 18 0 18Z" fill={SKIN[2]} />
        <path d="M-6-6-2-16M0-8 2-19M6-6 9-15" stroke={SKIN[2]} strokeWidth="5" strokeLinecap="round" />
      </g>
      <path d="M46 6q4-4 3-9M52 8q5-2 6-7" stroke={C.steel} strokeWidth="1.8" strokeLinecap="round" fill="none" opacity="0.8" />
      <Sparkle x={12} y={16} r={3.6} />
      <Star x={54} y={40} r={3.6} fill={C.goldLite} />
    </g>
  )
}
