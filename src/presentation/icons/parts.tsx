import { type ReactElement, type ReactNode } from 'react'

/**
 * The shared vocabulary every illustration is built from.
 *
 * All art is drawn on a 64×64 grid, flat-shaded, with a consistent light from
 * the upper left. Characters are the heart of the set: rather than redrawing a
 * person for each of a hundred subjects, one person is composed here and each
 * illustration dresses it — a hard hat and a rolled blueprint make a
 * construction foreman, a toque and a piping bag make a pastry chef.
 *
 * ── Composition ───────────────────────────────────────────────────────────
 * Subjects that are *about a person* are drawn as a **portrait bust** on a
 * `<Backdrop>`: head and shoulders filling the frame, hands and tools brought
 * up into it. A whole standing body puts the face at four pixels across and
 * the job becomes unreadable; a bust keeps the head, the headwear and the tool
 * large enough to survive the 16px player panel. `<Figure>` is still here for
 * scenes that need a whole body in a landscape.
 *
 * ── Shading ───────────────────────────────────────────────────────────────
 * Two rules, applied everywhere, are what make twelve drawings look like one
 * set:
 *   • Round and small forms — heads, hats, jars, parcels — take a **rim
 *     shade**: the same silhouette nudged down-right behind itself, so a
 *     sliver of the darker tone shows on the shadowed edge. `<Shaded>` does it.
 *   • Large garment forms — a torso, an apron, a coat — take a **half split**:
 *     the right-hand half redrawn in the garment's dark tone.
 * Nothing is outlined. Contrast comes from the fills.
 */

/* ── palette ─────────────────────────────────────────────────────────────── */

/** Skin tones, light to deep. Every character picks a different neighbourhood. */
export const SKIN = ['#ffd9b4', '#f4bd8c', '#e0a26e', '#c4804f', '#9c5c33', '#6f3f22'] as const

/** The shadowed edge of each skin tone, index for index with `SKIN`. */
export const SKIN_SHADE = ['#f0c396', '#e3a670', '#c88a56', '#a5683c', '#7f4826', '#552f18'] as const

/**
 * Hair colours. 0–5 are natural darks through blond, 6–7 grey and silver,
 * 8–9 dyed — a salon owner and a game designer are allowed to have fun.
 */
export const HAIR = [
  '#241d2b',
  '#3d2b1f',
  '#6b4227',
  '#a34a22',
  '#d1702a',
  '#e0b45c',
  '#8a8fa3',
  '#d8dbe6',
  '#e0479a',
  '#37c7bb',
] as const

/** The single dark used for eyes, pupils and any drawn line. */
export const INK = '#2b2338'

/* ── people ──────────────────────────────────────────────────────────────── */

export type HairStyle =
  | 'short'
  | 'crop'
  | 'wave'
  | 'long'
  | 'bun'
  | 'ponytail'
  | 'braids'
  | 'curls'
  | 'buzz'
  | 'none'

export type FacialHair = 'beard' | 'moustache' | 'stubble'

export type Mouth = 'smile' | 'grin' | 'flat' | 'open'

/** Everything that makes one character a different person from the next. */
export type Look = {
  readonly skin: string
  readonly skinShade: string
  readonly hair: string
  readonly hairStyle: HairStyle
  readonly facialHair?: FacialHair | undefined
  readonly mouth?: Mouth | undefined
  /** Brows, when the hair colour would disappear against the skin. */
  readonly brow?: string | undefined
}

type SkinIndex = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Builds a `Look` from a skin index, so the base tone and its shadow can never
 * drift apart.
 */
export function look(
  skin: SkinIndex,
  hair: string,
  hairStyle: HairStyle,
  extra: {
    readonly facialHair?: FacialHair
    readonly mouth?: Mouth
    readonly brow?: string
  } = {},
): Look {
  return { skin: SKIN[skin], skinShade: SKIN_SHADE[skin], hair, hairStyle, ...extra }
}

/* ── shading primitive ───────────────────────────────────────────────────── */

/**
 * A form and its shadowed edge. The shade is the identical silhouette pushed
 * down-right, which guarantees the light always comes from the same corner no
 * matter who drew the path.
 */
export function Shaded({
  d,
  fill,
  shade,
  dx = 1.4,
  dy = 1.6,
}: {
  readonly d: string
  readonly fill: string
  readonly shade: string
  readonly dx?: number
  readonly dy?: number
}): ReactElement {
  return (
    <g>
      <path d={d} fill={shade} transform={`translate(${dx} ${dy})`} />
      <path d={d} fill={fill} />
    </g>
  )
}

/* ── the head ────────────────────────────────────────────────────────────── */

/**
 * Head geometry lives in a local space centred on the face, one unit of which
 * is one unit of a 26-wide head. `<Head>` scales it into place, so hats and
 * glasses drawn in the same local space fit any head size.
 */
const SKULL =
  'M0-13.5C7.4-13.5 13-8.4 13-.8 13 7.6 7.2 13.8 0 13.8S-13 7.6-13-.8C-13-8.4-7.4-13.5 0-13.5Z'

const HAIR_BACK: Partial<Record<HairStyle, string>> = {
  long: 'M-15.4-1C-15.4-12-8-17.2 0-17.2S15.4-12 15.4-1V19.6H-15.4Z',
  braids: 'M-15.4-1C-15.4-12-8-17.2 0-17.2S15.4-12 15.4-1V4H-15.4Z',
  ponytail:
    'M-14.6-2C-14.6-12.6-7.6-17 0-17S14.6-12.6 14.6-2C18.6.6 21 6 19.4 12.4 18.4 16.4 13 16 13.8 11.8 15 5.6 13.6 1.6 9.8-.4Z',
  curls:
    'M0-20.2C10-20.2 17-13.4 17-4.6 17 1 15 4.6 12.4 4.6 12.4-3.4 7-8 0-8S-12.4-3.4-12.4 4.6C-15 4.6-17 1-17-4.6-17-13.4-10-20.2 0-20.2Z',
}

const HAIR_FRONT: Partial<Record<HairStyle, string>> = {
  short:
    'M-13.2-1.6C-13.2-10.4-7.4-15.4 0-15.4S13.2-10.4 13.2-1.6C11.8-7.6 6.8-10.4 0-10.4S-11.8-7.6-13.2-1.6Z',
  crop: 'M-13-2.6C-13-11-7.2-15.2 0-15.2S13-11 13-2.6V-6.4C13-10.4 7.2-12.2 0-12.2S-13-10.4-13-6.4Z',
  buzz: 'M-12.8-4C-12.6-11.2-7-14.8 0-14.8S12.6-11.2 12.8-4C11.4-9 6.6-11.4 0-11.4S-11.4-9-12.8-4Z',
  wave: 'M-13.2-1.4C-13.2-10.4-7.4-15.6 0-15.6S13.2-10.4 13.2-1.4C11.4-6 8-11.8 3.4-9.6-.8-7.6-3.6-11.6-7.8-9.8-10.8-8.6-12.4-5-13.2-1.4Z',
  long: 'M-13.4-1.2C-13.4-10.6-7.4-15.8 0-15.8S13.4-10.6 13.4-1.2C12.6-8 8.4-11.6 2.2-11.6-4.6-11.6-10.4-8.8-13.4-1.2Z',
  bun: 'M-13.2-1.6C-13.2-10.4-7.4-15.4 0-15.4S13.2-10.4 13.2-1.6C11.8-7.6 6.8-10.4 0-10.4S-11.8-7.6-13.2-1.6Z',
  ponytail:
    'M-13.2-1.6C-13.2-10.4-7.4-15.4 0-15.4S13.2-10.4 13.2-1.6C11.8-7.6 6.8-10.6 0-10.6S-11.8-7.6-13.2-1.6Z',
  braids:
    'M-13.2-1.6C-13.2-10.4-7.4-15.4 0-15.4S13.2-10.4 13.2-1.6C11.8-7.6 6.8-10.4 0-10.4S-11.8-7.6-13.2-1.6Z',
  curls:
    'M-13.4-2C-13.4-11-7.4-16 0-16S13.4-11 13.4-2C11.8-7 6.8-9.8 0-9.8S-11.8-7-13.4-2Z',
}

const BEARD =
  'M-12.5-2C-12.5 3-11.8 7.6-10.4 10-8.2 13.8-4.4 16 0 16S8.2 13.8 10.4 10C11.8 7.6 12.5 3 12.5-2 11.6 4.4 8.8 7 6 7 3.6 7 2.6 8.6 0 8.6S-3.6 7-6 7C-8.8 7-11.6 4.4-12.5-2Z'

const MOUSTACHE =
  'M0 4.2C2.6 2.4 6.6 2.2 7.6 5.2 8 6.8 6.6 7.6 5.2 6.9 3.4 6 1.6 6.2 0 6.9-1.6 6.2-3.4 6-5.2 6.9-6.6 7.6-8 6.8-7.6 5.2-6.6 2.2-2.6 2.4 0 4.2Z'

function MouthShape({ kind }: { readonly kind: Mouth }): ReactElement {
  if (kind === 'flat') {
    return <path d="M-2.8 8.6H2.8" stroke={INK} strokeWidth="1.5" strokeLinecap="round" />
  }
  if (kind === 'open') {
    return <ellipse cx="0" cy="8.8" rx="2.6" ry="2.9" fill={INK} />
  }
  if (kind === 'grin') {
    return (
      <g>
        <path d="M-4.8 7.2H4.8C4.8 10.8 2.6 12.8 0 12.8S-4.8 10.8-4.8 7.2Z" fill={INK} />
        <path d="M-4.2 7.2H4.2C4.2 8.2 3.9 8.8 3.6 8.8H-3.6C-3.9 8.8-4.2 8.2-4.2 7.2Z" fill="#fff" />
      </g>
    )
  }
  return (
    <path
      d="M-3.9 7.6C-2.4 10.4 2.4 10.4 3.9 7.6"
      stroke={INK}
      strokeWidth="1.6"
      strokeLinecap="round"
      fill="none"
    />
  )
}

/**
 * A head, drawn in local face space and scaled into position. `r` is half the
 * head's width, so a bust uses 13 and a distant standing figure uses 8.
 */
export function Head({
  look: person,
  cx = 32,
  cy = 23,
  r = 13,
  tilt = 0,
  children,
}: {
  readonly look: Look
  readonly cx?: number
  readonly cy?: number
  readonly r?: number
  /** Degrees of head tilt — a few is enough to break twelve identical poses. */
  readonly tilt?: number
  /** Hats, glasses and masks, drawn in the same local face space. */
  readonly children?: ReactNode
}): ReactElement {
  const back = HAIR_BACK[person.hairStyle]
  const front = HAIR_FRONT[person.hairStyle]
  const brow = person.brow ?? person.hair

  return (
    <g transform={`translate(${cx} ${cy}) rotate(${tilt}) scale(${r / 13})`}>
      {back ? <path d={back} fill={person.hair} /> : null}
      {person.hairStyle === 'braids' ? (
        <g fill={person.hair}>
          <path d="M-15.4 1.6C-12.6 1.6-11.6 3.6-11.6 6.6-11.6 11-12.4 15-14.2 17.6-15.8 19.8-19 18.6-18.4 15.6-17.6 11.4-17.6 5.6-15.4 1.6Z" />
          <path d="M15.4 1.6C12.6 1.6 11.6 3.6 11.6 6.6 11.6 11 12.4 15 14.2 17.6 15.8 19.8 19 18.6 18.4 15.6 17.6 11.4 17.6 5.6 15.4 1.6Z" />
        </g>
      ) : null}
      {/* neck, always in shadow under the chin */}
      <path d="M-5.4 4H5.4V22H-5.4Z" fill={person.skinShade} />
      {/* ears */}
      <circle cx="-13" cy="1.2" r="2.8" fill={person.skin} />
      <circle cx="13" cy="1.2" r="2.8" fill={person.skin} />
      <Shaded d={SKULL} fill={person.skin} shade={person.skinShade} dx={1.3} dy={1.5} />
      {person.facialHair === 'stubble' ? <path d={BEARD} fill={person.hair} opacity="0.3" /> : null}
      {person.facialHair === 'beard' ? <path d={BEARD} fill={person.hair} /> : null}
      {/* brows */}
      <g stroke={brow} strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-8.4-4.6C-7-5.8-4-5.8-2.6-4.6" />
        <path d="M8.4-4.6C7-5.8 4-5.8 2.6-4.6" />
      </g>
      {/* eyes */}
      <g fill={INK}>
        <ellipse cx="-5.2" cy="1" rx="1.8" ry="2.2" />
        <ellipse cx="5.2" cy="1" rx="1.8" ry="2.2" />
      </g>
      <g fill="#ffffff" opacity="0.85">
        <circle cx="-5.8" cy="0.2" r="0.62" />
        <circle cx="4.6" cy="0.2" r="0.62" />
      </g>
      {/* nose */}
      <path
        d="M-0.9 3.6C0.6 5.2 1.6 5.4 2.4 5"
        stroke={person.skinShade}
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      {/* cheeks */}
      <g fill="#ff6f86" opacity="0.2">
        <circle cx="-8.6" cy="5.4" r="2.9" />
        <circle cx="8.6" cy="5.4" r="2.9" />
      </g>
      <MouthShape kind={person.mouth ?? 'smile'} />
      {person.facialHair === 'moustache' ? <path d={MOUSTACHE} fill={person.hair} /> : null}
      {front ? <path d={front} fill={person.hair} /> : null}
      {person.hairStyle === 'bun' ? <circle cx="0" cy="-18.6" r="5.4" fill={person.hair} /> : null}
      {children}
    </g>
  )
}

/* ── the body ────────────────────────────────────────────────────────────── */

/**
 * The shoulders every bust is built on, in three builds. All three land inside
 * the backdrop's rounded corners so no jacket ever pokes out of the card.
 */
export type Build = 'slim' | 'regular' | 'broad'

const TORSO: Record<Build, readonly [string, string]> = {
  slim: ['M14.6 66C14.6 52.4 22 43 32 43S49.4 52.4 49.4 66Z', 'M32 43C42 43 49.4 52.4 49.4 66H32Z'],
  regular: ['M11.6 66C11.6 51 19.8 41.6 32 41.6S52.4 51 52.4 66Z', 'M32 41.6C44.2 41.6 52.4 51 52.4 66H32Z'],
  broad: ['M10.4 66C10.4 49.6 19 39.8 32 39.8S53.6 49.6 53.6 66Z', 'M32 39.8C45 39.8 53.6 49.6 53.6 66H32Z'],
}

/** Where an arm starts, per build. */
export const SHOULDER: Record<Build, readonly [Point, Point]> = {
  slim: [
    { x: 21.6, y: 48.4 },
    { x: 42.4, y: 48.4 },
  ],
  regular: [
    { x: 20, y: 47.4 },
    { x: 44, y: 47.4 },
  ],
  broad: [
    { x: 18.6, y: 46.2 },
    { x: 45.4, y: 46.2 },
  ],
}

export type Collar = 'crew' | 'v' | 'lapel' | 'chef' | 'none'

function CollarShape({
  kind,
  shirt,
  shirtShade,
}: {
  readonly kind: Collar
  readonly shirt: string
  readonly shirtShade: string
}): ReactElement | null {
  if (kind === 'none') return null
  if (kind === 'crew') {
    return <path d="M24.4 43.6C26.4 47.8 37.6 47.8 39.6 43.6 37.4 42.2 26.6 42.2 24.4 43.6Z" fill={shirtShade} />
  }
  if (kind === 'v') {
    return <path d="M25.2 43.2 32 52.6 38.8 43.2C36 42 28 42 25.2 43.2Z" fill={shirtShade} />
  }
  if (kind === 'chef') {
    return (
      <g>
        <path d="M25 43.2 32 50 39 43.2C36.4 42 27.6 42 25 43.2Z" fill={shirtShade} />
        <path d="M32 50 38.6 44.4C43 46.8 45.2 51.4 45.6 56L32 56Z" fill={shirt} />
      </g>
    )
  }
  return (
    <g>
      {/* shirt V under the jacket */}
      <path d="M24.6 43 32 55.6 39.4 43C36.6 41.8 27.4 41.8 24.6 43Z" fill={shirt} />
      <path d="M32 55.6 24.6 43C21.4 44.6 19 47.2 17.4 50.4L22 66H27.6Z" fill={shirtShade} />
      <path d="M32 55.6 39.4 43C42.6 44.6 45 47.2 46.6 50.4L42 66H36.4Z" fill={shirtShade} />
    </g>
  )
}

/**
 * Head and shoulders, filling the frame. This is the standard composition for
 * a person doing a job: the head stays large, and hands and tools are brought
 * up into the lower third rather than the body being shrunk to reach them.
 */
export function Bust({
  look: person,
  wear,
  wearDark,
  collar = 'crew',
  collarShirt = '#ffffff',
  collarShirtShade = '#dfe3ee',
  build = 'regular',
  tilt = 0,
  dy = 0,
  headwear,
  children,
}: {
  readonly look: Look
  readonly wear: string
  readonly wearDark: string
  readonly collar?: Collar
  readonly collarShirt?: string
  readonly collarShirtShade?: string
  readonly build?: Build
  readonly tilt?: number
  /** Sinks the whole person, for scenes with something above their head. */
  readonly dy?: number
  /** Hats, masks and glasses, in the head's local face space. */
  readonly headwear?: ReactNode
  /** Garment detail drawn over the torso — buttons, aprons, lanyards. */
  readonly children?: ReactNode
}): ReactElement {
  const [body, shade] = TORSO[build]

  return (
    <g transform={dy === 0 ? undefined : `translate(0 ${dy})`}>
      <Head look={person} tilt={tilt}>
        {headwear}
      </Head>
      <path d={body} fill={wear} />
      <path d={shade} fill={wearDark} />
      <CollarShape kind={collar} shirt={collarShirt} shirtShade={collarShirtShade} />
      {children}
    </g>
  )
}

export type Point = { readonly x: number; readonly y: number }

/**
 * An arm reaching from a shoulder to wherever the work is. `bend` bows the
 * limb sideways so two arms doing different jobs never read as one shape.
 */
export function Arm({
  from,
  to,
  bend = 0,
  sleeve,
  skin,
  cuff,
  width = 7.4,
  handR = 4,
  hand = true,
}: {
  readonly from: Point
  readonly to: Point
  readonly bend?: number
  readonly sleeve: string
  readonly skin: string
  /** A band where the sleeve ends — a cuff, a glove, a rolled shirt. */
  readonly cuff?: string | undefined
  readonly width?: number
  readonly handR?: number
  readonly hand?: boolean
}): ReactElement {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const len = Math.hypot(dx, dy) || 1
  const cx = (from.x + to.x) / 2 - (dy / len) * bend
  const cy = (from.y + to.y) / 2 + (dx / len) * bend
  const t = 0.78
  const wristX = (1 - t) * (1 - t) * from.x + 2 * (1 - t) * t * cx + t * t * to.x
  const wristY = (1 - t) * (1 - t) * from.y + 2 * (1 - t) * t * cy + t * t * to.y

  return (
    <g>
      <path
        d={`M${from.x} ${from.y}Q${cx} ${cy} ${to.x} ${to.y}`}
        stroke={sleeve}
        strokeWidth={width}
        strokeLinecap="round"
        fill="none"
      />
      {cuff ? <circle cx={wristX} cy={wristY} r={width * 0.56} fill={cuff} /> : null}
      {hand ? <circle cx={to.x} cy={to.y} r={handR} fill={skin} /> : null}
    </g>
  )
}

/* ── the stage ───────────────────────────────────────────────────────────── */

/**
 * The rounded card every career portrait sits on. It is what lets one drawing
 * read on a cream tile and on an indigo night panel: the subject never has to
 * fight the surface behind it, and the rim keeps an edge in both schemes.
 */
export function Backdrop({
  tone,
  rim,
  wash,
  floor,
}: {
  readonly tone: string
  readonly rim: string
  /** A lighter band across the top — daylight, ceiling, open sky. */
  readonly wash?: string | undefined
  /** A darker band along the bottom — floor, counter, sea bed. */
  readonly floor?: string | undefined
}): ReactElement {
  return (
    <g>
      <rect width="64" height="64" rx="10" fill={tone} />
      {wash ? (
        <path d="M0 10A10 10 0 0 1 10 0H54A10 10 0 0 1 64 10V20C50 27 30 28 0 23Z" fill={wash} />
      ) : null}
      {floor ? (
        <path d="M0 47H64V54A10 10 0 0 1 54 64H10A10 10 0 0 1 0 54Z" fill={floor} />
      ) : null}
      <rect x="1" y="1" width="62" height="62" rx="9" fill="none" stroke={rim} strokeWidth="2" />
    </g>
  )
}

/** Ground shadow, so a figure or object in an open scene sits on something. */
export function Ground(): ReactElement {
  return <ellipse cx="32" cy="59" rx="16" ry="3.2" fill="rgba(24,18,48,0.16)" />
}

/* ── headwear ────────────────────────────────────────────────────────────── */

/*
 * Headwear is drawn in the head's local face space, so it can be dropped into
 * `<Head>` as a child at any head size and land in the right place.
 */

/** Builder's hard hat: brim, dome, and the moulded ridge along the crown. */
export function HardHat({
  shell = '#ffc42b',
  shellShade = '#d99504',
}: {
  readonly shell?: string
  readonly shellShade?: string
}): ReactElement {
  return (
    <g>
      <path
        d="M-17.6-8.2C-17.6-9.8-16.4-10.8-14.8-10.8H14.8C16.4-10.8 17.6-9.8 17.6-8.2 17.6-6.8 16.4-6-14.8-6-16.4-6-17.6-6.8-17.6-8.2Z"
        fill={shellShade}
      />
      <path
        d="M-13.6-8.4C-13.6-17.4-7.8-22 0-22S13.6-17.4 13.6-8.4Z"
        fill={shell}
      />
      <path d="M0-22C7.8-22 13.6-17.4 13.6-8.4H7.2C7.2-17.4 4.6-22 0-22Z" fill={shellShade} />
      <path d="M-2-21.8C-.6-21.9.6-21.9 2-21.8V-8.4H-2Z" fill={shellShade} opacity="0.55" />
    </g>
  )
}

/** Chef's toque. Tall, soft, unmistakable at any size. */
export function Toque({
  cloth = '#fdfaf4',
  clothShade = '#dcd5c8',
}: {
  readonly cloth?: string
  readonly clothShade?: string
}): ReactElement {
  return (
    <g>
      <path
        d="M-11.6-24.6C-14.8-24.6-17.2-21.8-17.2-18.4-17.2-15.4-15.4-13-12.8-12.2V-9.6H12.8V-12.2C15.4-13 17.2-15.4 17.2-18.4 17.2-21.8 14.8-24.6 11.6-24.6 10.6-27.8 7.2-30 3.4-29 1.6-31.2-1.6-31.2-3.4-29-7.2-30-10.6-27.8-11.6-24.6Z"
        fill={cloth}
      />
      <path
        d="M3.4-29C7.2-30 10.6-27.8 11.6-24.6 14.8-24.6 17.2-21.8 17.2-18.4 17.2-15.4 15.4-13 12.8-12.2V-9.6H5.4V-12.6C9-14 11.2-17 10.6-21 10-24.8 6.8-27.6 3.4-29Z"
        fill={clothShade}
      />
      <path d="M-13.6-10.4H13.6V-5.6C13.6-4.4 12.6-3.6 11.4-3.6H-11.4C-12.6-3.6-13.6-4.4-13.6-5.6Z" fill={cloth} />
      <path d="M0-10.4H13.6V-5.6C13.6-4.4 12.6-3.6 11.4-3.6H0Z" fill={clothShade} />
    </g>
  )
}

/** Surgical cap plus its tie — the operating-theatre silhouette. */
export function ScrubCap({
  cloth = '#4fbdb2',
  clothShade = '#2c8f87',
}: {
  readonly cloth?: string
  readonly clothShade?: string
}): ReactElement {
  return (
    <g>
      <path
        d="M-14.4-6.4C-15-16.6-8.8-21.6 0-21.6S15-16.6 14.4-6.4C9.4-9.6 5-11-0-11-5-11-9.4-9.6-14.4-6.4Z"
        fill={cloth}
      />
      <path d="M0-21.6C8.8-21.6 15-16.6 14.4-6.4 11.6-8.2 9-9.5 6.2-10.2 7-16.4 4.4-20.2 0-21.6Z" fill={clothShade} />
      <path d="M-15.2-7.6C-9.6-11.2-5.2-12.8 0-12.8S9.6-11.2 15.2-7.6L14.4-4.2C9-7.4 5-8.8 0-8.8S-9-7.4-14.4-4.2Z" fill={clothShade} />
      <path d="M13.4-8.6C17.4-9.4 19.4-7.4 19.6-4.4 19.7-2.6 17.2-2.2 16.8-4 16.4-5.8 15-6.6 12.8-6.2Z" fill={cloth} />
    </g>
  )
}

/** A soft cap with a peak — couriers, food trucks, ball games. */
export function Cap({
  cloth = '#e2523f',
  clothShade = '#b23425',
  peak,
}: {
  readonly cloth?: string
  readonly clothShade?: string
  readonly peak?: string
}): ReactElement {
  return (
    <g>
      <path d="M-13.6-8.4C-13.6-17.6-7.6-22 0-22S13.6-17.6 13.6-8.4Z" fill={cloth} />
      <path d="M0-22C7.6-22 13.6-17.6 13.6-8.4H6.4C6.4-17.6 4.2-22 0-22Z" fill={clothShade} />
      <path
        d="M-13.8-8.6H-2C-2-8.6-6-12.4-13.4-12.2-17.6-12.1-19.6-9.6-19.4-8-19.2-6.8-17.8-6.4-16.4-7-15.4-7.4-14.6-8-13.8-8.6Z"
        fill={peak ?? clothShade}
      />
      <circle cx="0" cy="-21.4" r="1.7" fill={clothShade} />
    </g>
  )
}

/** A cycling / delivery helmet with its vents and strap. */
export function Helmet({
  shell = '#ff5f52',
  shellShade = '#c73a2e',
}: {
  readonly shell?: string
  readonly shellShade?: string
}): ReactElement {
  return (
    <g>
      <path d="M-15-6.6C-15.8-17.6-9-23-0-23S15.8-17.6 15-6.6L11-9.4C6.4-12 3.6-12.8 0-12.8S-6.4-12-11-9.4Z" fill={shell} />
      <path d="M0-23C9-23 15.8-17.6 15-6.6L11-9.4C8.4-11 6.4-11.9 4.4-12.4 5.6-17.4 3.6-21.2 0-23Z" fill={shellShade} />
      <g fill={shellShade} opacity="0.85">
        <path d="M-8.8-19.4C-7-20.6-5-21.4-2.8-21.8L-4.4-14.6C-6.2-14.1-7.8-13.4-9.4-12.4Z" />
        <path d="M2.8-21.8C5-21.4 7-20.6 8.8-19.4L6.4-13C5.2-13.6 4-14.1 2.6-14.4Z" />
      </g>
      <path d="M-14.4-6C-13.4-3-11.4-.6-8.8 1" stroke={shellShade} strokeWidth="1.7" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** Reading, drafting and screen-staring glasses. */
export function Glasses({
  frame = INK,
  lens = 'rgba(255,255,255,0.45)',
}: {
  readonly frame?: string
  readonly lens?: string
}): ReactElement {
  return (
    <g>
      <g fill={lens}>
        <rect x="-10.6" y="-2.6" width="9" height="7.2" rx="3.2" />
        <rect x="1.6" y="-2.6" width="9" height="7.2" rx="3.2" />
      </g>
      <g fill="none" stroke={frame} strokeWidth="1.5">
        <rect x="-10.6" y="-2.6" width="9" height="7.2" rx="3.2" />
        <rect x="1.6" y="-2.6" width="9" height="7.2" rx="3.2" />
        <path d="M-1.6 0.4H1.6" />
        <path d="M-10.6 0.2-13.6-.6" strokeLinecap="round" />
        <path d="M10.6 0.2 13.6-.6" strokeLinecap="round" />
      </g>
    </g>
  )
}

/** A surgical mask, covering everything below the eyes. */
export function FaceMask({
  cloth = '#dff2ef',
  clothShade = '#b6d9d4',
}: {
  readonly cloth?: string
  readonly clothShade?: string
}): ReactElement {
  return (
    <g>
      <path d="M-11.4 2.4C-11.4 2.4-7 4.4 0 4.4S11.4 2.4 11.4 2.4C11.4 9.6 6.6 15 0 15S-11.4 9.6-11.4 2.4Z" fill={cloth} />
      <path d="M0 4.4C7 4.4 11.4 2.4 11.4 2.4 11.4 9.6 6.6 15 0 15Z" fill={clothShade} />
      <g stroke={clothShade} strokeWidth="1.2" strokeLinecap="round">
        <path d="M-9.6 7.4H9.6" />
        <path d="M-8.4 11H8.4" />
      </g>
      <g stroke={clothShade} strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M-11.4 2.8-14.4 1.4" />
        <path d="M11.4 2.8 14.4 1.4" />
      </g>
    </g>
  )
}

/** A dive mask, worn pushed up on the forehead between dives. */
export function DiveMask({
  glass = '#bdeaf7',
  frame = '#1f2f4a',
}: {
  readonly glass?: string
  readonly frame?: string
}): ReactElement {
  return (
    <g>
      <path d="M-13.6-10.4C-13.6-13.6-11.6-15.2-8.6-15.2H8.6C11.6-15.2 13.6-13.6 13.6-10.4 13.6-7.2 11-5.6 7.4-5.6 4.6-5.6 3-6.6 1.6-8.2 0.8-9.1-0.8-9.1-1.6-8.2-3-6.6-4.6-5.6-7.4-5.6-11-5.6-13.6-7.2-13.6-10.4Z" fill={frame} />
      <g fill={glass}>
        <path d="M-11.4-11C-11.4-12.6-10.2-13.2-8.4-13.2H-3C-1.6-13.2-1-12.4-1.4-11-2-8.8-3.6-7.8-6.4-7.8-9.6-7.8-11.4-9-11.4-11Z" />
        <path d="M11.4-11C11.4-12.6 10.2-13.2 8.4-13.2H3C1.6-13.2 1-12.4 1.4-11 2-8.8 3.6-7.8 6.4-7.8 9.6-7.8 11.4-9 11.4-11Z" />
      </g>
      <path d="M-13.6-11.6C-16-12.6-16.6-14.4-15.6-16.4" stroke={frame} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M13.6-11.6C16-12.6 16.6-14.4 15.6-16.4" stroke={frame} strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** A headset with a boom mic — studios, support desks, playtests. */
export function Headset({
  band = '#3b3350',
  bandShade = '#241f33',
  accent = '#59e3d0',
}: {
  readonly band?: string
  readonly bandShade?: string
  readonly accent?: string
}): ReactElement {
  return (
    <g>
      <path
        d="M-15.4-2.4C-15.4-13.6-8.6-19.6 0-19.6S15.4-13.6 15.4-2.4"
        stroke={band}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M0-19.6C8.6-19.6 15.4-13.6 15.4-2.4" stroke={bandShade} strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <g>
        <rect x="-18.4" y="-4.6" width="6.6" height="11" rx="3.3" fill={band} />
        <rect x="11.8" y="-4.6" width="6.6" height="11" rx="3.3" fill={bandShade} />
        <rect x="-17" y="-2.6" width="3.8" height="7" rx="1.9" fill={accent} />
      </g>
      <path d="M-15 5.6C-15 10.4-11 12.6-7.4 12.6" stroke={band} strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="-6.4" cy="12.6" r="2.2" fill={accent} />
    </g>
  )
}

/* ── props ───────────────────────────────────────────────────────────────── */

/** A working apron, tied over whatever the character is wearing. */
export function Apron({
  cloth = '#f0f2f6',
  clothShade = '#d2d7e2',
  strap = '#cbd0dc',
}: {
  readonly cloth?: string
  readonly clothShade?: string
  readonly strap?: string
}): ReactElement {
  return (
    <g>
      <path d="M24.6 44.2 32 47.6 39.4 44.2" stroke={strap} strokeWidth="2.2" fill="none" />
      <path d="M25.2 47.4C28 45.6 36 45.6 38.8 47.4 43 49 45.6 53.4 46 58.6L46.6 66H17.4L18 58.6C18.4 53.4 21 49 25.2 47.4Z" fill={cloth} />
      <path d="M32 46 38.8 47.4C43 49 45.6 53.4 46 58.6L46.6 66H32Z" fill={clothShade} />
    </g>
  )
}

/** A counter, workbench or serving ledge across the front of the frame. */
export function Counter({
  y = 52,
  top = '#e6d5b8',
  front = '#c2a983',
}: {
  readonly y?: number
  readonly top?: string
  readonly front?: string
}): ReactElement {
  return (
    <g>
      <path d={`M0 ${y + 4}H64V54A10 10 0 0 1 54 64H10A10 10 0 0 1 0 54Z`} fill={front} />
      <rect x="0" y={y} width="64" height="4.6" fill={top} />
    </g>
  )
}

/** A clipboard or held sheet of paper. */
export function Clipboard({
  x = 32,
  y = 50,
  board = '#c9a06a',
  sheet = '#fdfcf7',
  rotate = 0,
}: {
  readonly x?: number
  readonly y?: number
  readonly board?: string
  readonly sheet?: string
  readonly rotate?: number
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <rect x="-8" y="-10" width="16" height="20" rx="2" fill={board} />
      <rect x="-6.4" y="-7.4" width="12.8" height="15.6" rx="1.4" fill={sheet} />
      <rect x="-3" y="-12" width="6" height="3.6" rx="1.4" fill={board} />
      <g stroke="#b8bdcc" strokeWidth="1.3" strokeLinecap="round">
        <path d="M-4 -4H4" />
        <path d="M-4 0H4" />
        <path d="M-4 4H1" />
      </g>
    </g>
  )
}

/** A coin, used wherever money is the subject. */
export function Coin({
  x = 32,
  y = 32,
  r = 9,
}: {
  readonly x?: number
  readonly y?: number
  readonly r?: number
}): ReactElement {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="#f3b13c" />
      <circle cx={x} cy={y} r={r} fill="none" stroke="#c9861a" strokeWidth={r * 0.16} />
      <circle cx={x - r * 0.3} cy={y - r * 0.32} r={r * 0.28} fill="#ffd98a" />
    </g>
  )
}

/** A banknote, for wages and bills. */
export function Note({
  x = 32,
  y = 34,
  tone = '#5bc47f',
}: {
  readonly x?: number
  readonly y?: number
  readonly tone?: string
}): ReactElement {
  return (
    <g transform={`translate(${x - 16} ${y - 10})`}>
      <rect width="32" height="20" rx="3" fill={tone} />
      <rect x="2.5" y="2.5" width="27" height="15" rx="2" fill="none" stroke="rgba(255,255,255,.55)" />
      <circle cx="16" cy="10" r="4.2" fill="rgba(255,255,255,.75)" />
    </g>
  )
}

/** The outline of `Shield`, in the full 64×64 canvas — top point down to a rounded base. */
const SHIELD_BODY = 'M32 4 57 14V28C57 47 46 59 32 63 18 59 7 47 7 28V14Z'

/**
 * A badge shield, filling almost the whole canvas. Used for the small badges
 * that have to keep reading once shrunk to about 16px — a single flat glyph
 * dropped in as `children` is the only detail that survives that size, so
 * callers should keep it to one bold shape.
 */
export function Shield({
  tone,
  toneDark,
  children,
}: {
  readonly tone: string
  readonly toneDark: string
  readonly children?: ReactNode
}): ReactElement {
  return (
    <g>
      <Shaded d={SHIELD_BODY} fill={tone} shade={toneDark} dx={1.6} dy={2} />
      <path d="M12 15 32 7V15L15 22Z" fill="rgba(255,255,255,0.26)" />
      {children}
    </g>
  )
}

/* ── whole bodies ────────────────────────────────────────────────────────── */

export type Palette = {
  /** Main garment colour. */
  readonly wear: string
  /** Shadowed side of the garment. */
  readonly wearDark: string
  readonly skin?: string | undefined
  readonly hair?: string | undefined
}

/**
 * A standing figure, for scenes that need a whole body in a landscape rather
 * than a portrait. It shares `<Head>` with `<Bust>`, so a person seen small in
 * a scene is recognisably from the same set as a person seen close up.
 */
export function Figure({
  palette,
  children,
  hairStyle = 'short',
}: {
  readonly palette: Palette
  /** Props and headwear drawn over the body. */
  readonly children?: ReactNode
  readonly hairStyle?: HairStyle
}): ReactElement {
  const skin = palette.skin ?? SKIN[0]
  const hair = palette.hair ?? HAIR[0]
  const person: Look = { skin, skinShade: SKIN_SHADE[1], hair, hairStyle }

  return (
    <g>
      {/* legs */}
      <path d="M25 44h5v13a2.5 2.5 0 0 1-5 0z" fill="#3d4763" />
      <path d="M34 44h5v13a2.5 2.5 0 0 1-5 0z" fill="#2f3852" />
      {/* torso */}
      <path
        d="M32 22c6.2 0 10.5 3.4 11.4 8.6l1.6 9.4a4 4 0 0 1-3.9 4.7H22.9a4 4 0 0 1-3.9-4.7l1.6-9.4C21.5 25.4 25.8 22 32 22z"
        fill={palette.wear}
      />
      <path
        d="M32 22c6.2 0 10.5 3.4 11.4 8.6l1.6 9.4a4 4 0 0 1-3.9 4.7H32z"
        fill={palette.wearDark}
      />
      <Arm
        from={{ x: 23, y: 27 }}
        to={{ x: 17.6, y: 39.6 }}
        bend={-2.6}
        sleeve={palette.wear}
        skin={skin}
        width={5.6}
        handR={3.1}
      />
      <Arm
        from={{ x: 41, y: 27 }}
        to={{ x: 46.4, y: 39.6 }}
        bend={2.6}
        sleeve={palette.wearDark}
        skin={skin}
        width={5.6}
        handR={3.1}
      />
      <Head look={person} cx={32} cy={13} r={9} />
      {children}
    </g>
  )
}
