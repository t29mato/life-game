import { type ReactElement } from 'react'

import {
  Apron,
  Arm,
  Backdrop,
  Bust,
  Cap,
  Clipboard,
  Glasses,
  HardHat,
  Headset,
  look,
} from '../parts'

/**
 * The trades: a portrait bust for every job the ladders deal that the original
 * twelve careers did not cover.
 *
 * When careers became ladders, one drawing per trade stopped being enough —
 * a warehouse picker, a line cook and a site labourer all wore the same
 * borrowed overtime icon, and a career fair card stopped saying what the job
 * was. Every portrait here follows the rules `careers.tsx` set: the same
 * `Bust`, dressed so the trade is readable from the silhouette alone — a
 * whistle and a ball make a coach, a wire caddy of glasses makes a chai
 * wallah. A trade shared by several editions shares one drawing, and rungs of
 * one ladder share their trade's drawing, exactly as the stylist and the
 * salon owner always have.
 */

// ---------------------------------------------------------------------------
// Scene palette. Same warm-band recipe as the original twelve, extended so
// neighbouring trades in a fair never sit on the same colour.
// ---------------------------------------------------------------------------

const SCENE = {
  bakery: { tone: '#ffe3c2', rim: '#e8b878', wash: '#fff1de', floor: '#f3cd94' },
  salon: { tone: '#ffd9e6', rim: '#e888ab', wash: '#ffeaf1', floor: '#f4b0c8' },
  kitchen: { tone: '#ffe0cf', rim: '#e0885e', wash: '#fff0e6', floor: '#f2b491' },
  dusk: { tone: '#ffd2a8', rim: '#d98d4a', wash: '#ffe6c9', floor: '#dd9a63' },
  site: { tone: '#ffe6ad', rim: '#d99a1f', wash: '#fff2cf', floor: '#f0c25e' },
  depot: { tone: '#e4e9f2', rim: '#93a1c0', wash: '#f3f6fb', floor: '#bfc9dd' },
  garage: { tone: '#e0e4e8', rim: '#8a95a5', wash: '#eff2f5', floor: '#aeb9c6' },
  studio: { tone: '#e6dcff', rim: '#9678d9', wash: '#f2ecff', floor: '#c6b2ef' },
  booth: { tone: '#d8cfeb', rim: '#7f6bbd', wash: '#e9e2f7', floor: '#a795d6' },
  radio: { tone: '#ffe0e0', rim: '#d9645f', wash: '#fff0ee', floor: '#f0a29d' },
  field: { tone: '#d9f0c0', rim: '#8fbf5f', wash: '#ecf8dc', floor: '#a8d47e' },
  paddy: { tone: '#cdeccb', rim: '#6fae74', wash: '#e4f6e2', floor: '#8cc98f' },
  altiplano: { tone: '#f2e4c9', rim: '#c2a26a', wash: '#eaf3f8', floor: '#d9bd8a' },
  saltflat: { tone: '#dceef7', rim: '#9fb8c4', wash: '#eef7fc', floor: '#f4fafc' },
  office: { tone: '#e2e8f5', rim: '#8892b5', wash: '#f2f4fa', floor: '#c3cadf' },
  bank: { tone: '#e7e9d8', rim: '#a2a06a', wash: '#f4f5e8', floor: '#c9c79a' },
  ministry: { tone: '#e8e3ff', rim: '#7c68c9', wash: '#f4f0ff', floor: '#c2b3ef' },
  desk: { tone: '#f0e6d2', rim: '#c0a878', wash: '#faf4e6', floor: '#d8bf92' },
  clinic: { tone: '#dff2ef', rim: '#6fb5aa', wash: '#effaf7', floor: '#a8dcd2' },
  lecture: { tone: '#dcead9', rim: '#7fa982', wash: '#ebf4ea', floor: '#b4d1b2' },
  market: { tone: '#ffe8c2', rim: '#e0a13e', wash: '#fff3dc', floor: '#efc06e' },
  street: { tone: '#ffd9c9', rim: '#e89a72', wash: '#ffe9dc', floor: '#f2b78e' },
  pitch: { tone: '#d3eec4', rim: '#7db35c', wash: '#e9f7df', floor: '#96c877' },
  sky: { tone: '#d6e9ff', rim: '#6f9fd8', wash: '#ecf5ff', floor: '#b3cfe8' },
  lab: { tone: '#dbe9e6', rim: '#4c9c8e', wash: '#eef7f5', floor: '#a6d3c9' },
  warehouse: { tone: '#f0e2cc', rim: '#c49a5e', wash: '#f8efe0', floor: '#d4b384' },
} as const

// ---------------------------------------------------------------------------
// Headwear, drawn in the head's local face space like the hats in `parts`.
// ---------------------------------------------------------------------------

/** A tied headband — a kitchen bandana or a hachimaki, by colour. */
function Headband({ cloth, clothShade }: { readonly cloth: string; readonly clothShade: string }): ReactElement {
  return (
    <g>
      <path
        d="M-13.4-9.6C-8-12 8-12 13.4-9.6V-4.4C8-6.8-8-6.8-13.4-4.4Z"
        fill={cloth}
      />
      <path d="M0-10.8C5-10.8 10-10.2 13.4-9.6V-4.4C10-5.8 5-6.4 0-6.4Z" fill={clothShade} />
      <path d="M13-8 18.6-11.2 17.4-6.2 14.6-4.6Z" fill={clothShade} />
    </g>
  )
}

/** A wide-brimmed straw hat for open-air work. */
function StrawHat(): ReactElement {
  return (
    <g>
      <ellipse cx="0.8" cy="-6.2" rx="19.4" ry="4" fill="#d9b25f" />
      <ellipse cx="0" cy="-7" rx="19.4" ry="4" fill="#efcb79" />
      <path d="M-11-7.6C-11-17.4-6-21.4 0-21.4S11-17.4 11-7.6Z" fill="#efcb79" />
      <path d="M0-21.4C6-21.4 11-17.4 11-7.6H5.6C5.6-17 3.4-20.4 0-21.4Z" fill="#d9b25f" />
      <path d="M-10.6-9.8H10.6V-6.8H-10.6Z" fill="#a9743a" />
    </g>
  )
}

/** A conical sedge hat, for the paddies. */
function ConicalHat(): ReactElement {
  return (
    <g>
      <path d="M-18.4-4.6 0-25.6 18.4-4.6C12-7.6 6-8.8 0-8.8S-12-7.6-18.4-4.6Z" fill="#e8cb8a" />
      <path d="M0-25.6 18.4-4.6C12-7.6 6-8.8 0-8.8Z" fill="#cda75e" />
      <path d="M-1.4-25.2C-.5-25.7.5-25.7 1.4-25.2L1 -22.4H-1Z" fill="#a9743a" />
    </g>
  )
}

/** A bowler hat, worn high and proud in the Andes. */
function BowlerHat(): ReactElement {
  return (
    <g>
      <ellipse cx="0.8" cy="-9.2" rx="15.8" ry="3.4" fill="#3a3142" />
      <ellipse cx="0" cy="-10" rx="15.8" ry="3.4" fill="#554a66" />
      <path d="M-10.4-10.4C-10.4-19.8-5.6-23.6 0-23.6S10.4-19.8 10.4-10.4Z" fill="#554a66" />
      <path d="M0-23.6C5.6-23.6 10.4-19.8 10.4-10.4H5.2C5.2-19.4 3.2-22.8 0-23.6Z" fill="#3a3142" />
      <path d="M-10-13H10V-10.4H-10Z" fill="#3a3142" />
    </g>
  )
}

/** A soft cloth head wrap, tied for a day in the wheat. */
function HeadWrap(): ReactElement {
  return (
    <g>
      <path d="M-13.8-4.2C-14.2-15.4-7.6-20.6 0-20.6S14.2-15.4 13.8-4.2C9-7.4 4.6-8.8 0-8.8S-9-7.4-13.8-4.2Z" fill="#e88f3c" />
      <path d="M0-20.6C7.6-20.6 14.2-15.4 13.8-4.2 11-6 8.4-7.3 5.8-8 6.8-14.6 4.4-18.8 0-20.6Z" fill="#c66a1f" />
      <path d="M-12.6-12.8C-7-15.6 7-15.6 12.6-12.8" stroke="#c66a1f" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M12.8-6.8 17.6-9.8 16.4-4.2 13.6-3Z" fill="#c66a1f" />
    </g>
  )
}

/** A knitted beanie, for the cold ends of a warehouse shift. */
function Beanie(): ReactElement {
  return (
    <g>
      <path d="M-12.8-5.6C-12.8-16.4-7-20.8 0-20.8S12.8-16.4 12.8-5.6Z" fill="#4f7fb5" />
      <path d="M0-20.8C7-20.8 12.8-16.4 12.8-5.6H6.4C6.4-16 4-19.8 0-20.8Z" fill="#38618f" />
      <path d="M-13.2-9.2H13.2V-4.4H-13.2Z" fill="#38618f" />
      <circle cx="0" cy="-21.2" r="2.2" fill="#38618f" />
    </g>
  )
}

/** Big closed studio headphones — no boom mic, unlike `Headset`. */
function Headphones(): ReactElement {
  return (
    <g>
      <path
        d="M-15.2-2.4C-15.2-13.6-8.6-19.6 0-19.6S15.2-13.6 15.2-2.4"
        stroke="#3b3350"
        strokeWidth="3.2"
        strokeLinecap="round"
        fill="none"
      />
      <path d="M0-19.6C8.6-19.6 15.2-13.6 15.2-2.4" stroke="#241f33" strokeWidth="3.2" strokeLinecap="round" fill="none" />
      <rect x="-18.6" y="-5" width="7" height="11.6" rx="3.5" fill="#3b3350" />
      <rect x="11.6" y="-5" width="7" height="11.6" rx="3.5" fill="#241f33" />
      <rect x="-17" y="-2.8" width="3.8" height="7.2" rx="1.9" fill="#f0a24b" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Garments drawn over the torso.
// ---------------------------------------------------------------------------

/** A high-visibility vest over whatever is underneath. */
function HiVisVest(): ReactElement {
  return (
    <g>
      <path d="M18 66C18 53 24 45.6 32 45.6S46 53 46 66Z" fill="#ffb43c" />
      <path d="M32 45.6C40 45.6 46 53 46 66H32Z" fill="#e0922a" />
      <path d="M22.6 51.2C28 48.4 36 48.4 41.4 51.2V55.4C36 52.6 28 52.6 22.6 55.4Z" fill="#d8dde6" />
      <path d="M25 43.8 32 50.4 39 43.8" stroke="#e0922a" strokeWidth="2.4" fill="none" />
    </g>
  )
}

/** Bib overalls with shoulder straps — the workshop uniform. */
function Overalls({ cloth, clothShade }: { readonly cloth: string; readonly clothShade: string }): ReactElement {
  return (
    <g>
      <path d="M20 66V56C20 50 25 46.6 32 46.6S44 50 44 56V66Z" fill={cloth} />
      <path d="M32 46.6C39 46.6 44 50 44 56V66H32Z" fill={clothShade} />
      <path d="M23.4 43.6 26.6 48.8V54H22.4V47.2Z" fill={cloth} />
      <path d="M40.6 43.6 37.4 48.8V54H41.6V47.2Z" fill={clothShade} />
      <rect x="27.6" y="52.4" width="8.8" height="7" rx="1.4" fill={clothShade} opacity="0.55" />
    </g>
  )
}

/** A lanyard with a name badge, the office uniform under any collar. */
function Lanyard(): ReactElement {
  return (
    <g>
      <path d="M26 43 30.4 55M38 43 33.6 55" stroke="#e2523f" strokeWidth="1.8" fill="none" />
      <rect x="28.4" y="54" width="7.2" height="9" rx="1.2" fill="#fdfcf7" />
      <rect x="29.8" y="56" width="4.4" height="2.6" rx="1" fill="#8ab4dd" />
      <path d="M30 60.4H34M30 62.2H33" stroke="#b8bdcc" strokeWidth="0.9" strokeLinecap="round" />
    </g>
  )
}

// ---------------------------------------------------------------------------
// Hand props. Each is one bold shape a trade can be named by at card size.
// ---------------------------------------------------------------------------

/** A folded towel over the shoulder — the apprentice's first uniform. */
function ShoulderTowel({ cloth = '#fdfaf4', clothShade = '#dcd5c8' }: {
  readonly cloth?: string
  readonly clothShade?: string
}): ReactElement {
  return (
    <g>
      <path d="M20 44.6C24 42.4 28 42 30.4 43.4L28 60H21.4C19.4 54.4 18.8 48.6 20 44.6Z" fill={cloth} />
      <path d="M25.4 42.6C27.4 42.4 29.2 42.6 30.4 43.4L28 60H25Z" fill={clothShade} />
      <path d="M21 49.6C23.6 48.8 26.4 48.8 28.8 49.6M20.6 54.2C23.4 53.4 26.2 53.4 28.4 54.2" stroke={clothShade} strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** A trigger spray bottle, held up mid-mist. */
function SprayBottle(): ReactElement {
  return (
    <g>
      <rect x="47" y="45" width="8.6" height="12.6" rx="2.4" fill="#8fd0e8" />
      <path d="M47 45H55.6V49.4H47Z" fill="#5aa9c9" />
      <rect x="49" y="40.4" width="4.6" height="5" rx="1.2" fill="#f0f2f6" />
      <path d="M49 41.4H45.6V43.6H49Z" fill="#d2d7e2" />
      <g fill="#fff" opacity="0.85">
        <circle cx="43" cy="40.6" r="1.1" />
        <circle cx="40.6" cy="43" r="0.9" />
        <circle cx="43.4" cy="44.6" r="0.8" />
      </g>
    </g>
  )
}

/** A fresh baguette, held up like a trophy. */
function Baguette(): ReactElement {
  return (
    <g transform="translate(50 46) rotate(-32)">
      <rect x="-4" y="-14" width="8.4" height="28" rx="4.2" fill="#e8b45f" />
      <path d="M0.2-14C2.6-14 4.4-12 4.4-9.8V9.8C4.4 12 2.6 14 0.2 14Z" fill="#c98d33" />
      <g stroke="#a9743a" strokeWidth="1.3" strokeLinecap="round">
        <path d="M-2.4-8.4 2.4-9.8" />
        <path d="M-2.4-2 2.4-3.4" />
        <path d="M-2.4 4.4 2.4 3" />
        <path d="M-2.4 10.6 2.4 9.2" />
      </g>
    </g>
  )
}

/** A wooden rice tub with its paddle standing in the rice. */
function RiceTub(): ReactElement {
  return (
    <g>
      <path d="M40 48H60L58.2 59.4C58 60.6 57 61.4 55.8 61.4H44.2C43 61.4 42 60.6 41.8 59.4Z" fill="#c9a06a" />
      <path d="M50 48H60L58.2 59.4C58 60.6 57 61.4 55.8 61.4H50Z" fill="#a97a42" />
      <ellipse cx="50" cy="48.2" rx="9.4" ry="2.6" fill="#fdfaf4" />
      <path d="M43.2 47.4C45.4 46.2 47.6 45.6 50 45.6S54.6 46.2 56.8 47.4" stroke="#e4ddd0" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      <g transform="translate(44 40) rotate(-18)">
        <rect x="-1.2" y="-6" width="2.4" height="10" rx="1.2" fill="#e3c493" />
        <ellipse cx="0" cy="6.6" rx="3.2" ry="4" fill="#e3c493" />
      </g>
    </g>
  )
}

/** A round steel pan of simmering milk, ladle in. */
function MilkPan(): ReactElement {
  return (
    <g>
      <path d="M40.6 49H59.4V56C59.4 58.4 57.6 60 55.2 60H44.8C42.4 60 40.6 58.4 40.6 56Z" fill="#aeb9c6" />
      <path d="M50 49H59.4V56C59.4 58.4 57.6 60 55.2 60H50Z" fill="#8a95a5" />
      <ellipse cx="50" cy="49.2" rx="9.4" ry="2.4" fill="#fdf6e8" />
      <path d="M36 50.4H41.2V52.6H36Z" fill="#8a95a5" />
      <g transform="translate(56 42) rotate(24)">
        <rect x="-1" y="-5.6" width="2" height="9" rx="1" fill="#6b7686" />
        <circle cx="0" cy="4.6" r="2.8" fill="#8a95a5" />
      </g>
      <path d="M46 44c-1.2-1.8-1.2-3.6 0-5M51 44c-1 -2.2-.8-4 .4-5.4" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" fill="none" />
    </g>
  )
}

/** A skillet mid-flip, with the flame that decides the week. */
function Skillet(): ReactElement {
  return (
    <g>
      <g transform="translate(48 52) rotate(-10)">
        <ellipse cx="0" cy="0" rx="10" ry="3.6" fill="#3f4650" />
        <ellipse cx="0" cy="-1" rx="10" ry="3.4" fill="#5c6570" />
        <ellipse cx="0" cy="-1" rx="7.6" ry="2.4" fill="#2f353d" />
        <rect x="9" y="-2.2" width="9" height="2.6" rx="1.3" fill="#3f4650" />
      </g>
      <path d="M44 46C43 43.6 44 41.8 45.8 40.6 45.6 42.6 46.4 43.6 47.6 44.4 49.4 43.2 49.8 41.4 49.2 39.2 52 40.6 53 43.4 51.8 46Z" fill="#f0913c" />
      <path d="M46.4 46C46 44.8 46.4 43.8 47.4 43 47.4 44 48.2 44.8 48.8 45.2 49.4 44.6 49.6 43.8 49.4 43 50.4 43.8 50.6 45 50.2 46Z" fill="#ffd166" />
    </g>
  )
}

/** A deep noodle bowl, chopsticks lifting a bite clear of the broth. */
function NoodleBowl(): ReactElement {
  return (
    <g>
      <path d="M39.6 50H60.4C60.2 55.6 56 59.6 50 59.6S39.8 55.6 39.6 50Z" fill="#e2523f" />
      <path d="M50 50H60.4C60.2 55.6 56 59.6 50 59.6Z" fill="#b23425" />
      <path d="M40.4 52.4H59.6" stroke="#fdfaf4" strokeWidth="1.6" />
      <ellipse cx="50" cy="50" rx="10.4" ry="2.6" fill="#f7e0a8" />
      <g stroke="#e8b45f" strokeWidth="1.4" strokeLinecap="round" fill="none">
        <path d="M46 49.6C46.4 46.4 47.4 43.8 49.4 41.6" />
        <path d="M49 49.8C49.4 46.8 50.2 44.4 52 42.2" />
        <path d="M52 49.8C52.6 47.2 53.4 45.2 55 43.4" />
      </g>
      <path d="M48.4 41.8 57.4 34.2M51.4 42.6 60 35.8" stroke="#8a5c2e" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M43 46c-1.2-1.8-1.2-3.4 0-4.8" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity="0.8" fill="none" />
    </g>
  )
}

/** Three anticucho skewers, fanned over the grill smoke. */
function Skewers(): ReactElement {
  return (
    <g>
      <g transform="translate(49 48)">
        <g transform="rotate(-24)">
          <path d="M0 4V-16" stroke="#c9a06a" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-2.4" y="-15" width="4.8" height="4.4" rx="1.6" fill="#a05238" />
          <rect x="-2.4" y="-9.6" width="4.8" height="4.4" rx="1.6" fill="#7c3c28" />
        </g>
        <g>
          <path d="M0 5V-17" stroke="#c9a06a" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-2.4" y="-16" width="4.8" height="4.4" rx="1.6" fill="#7c3c28" />
          <rect x="-2.4" y="-10.6" width="4.8" height="4.4" rx="1.6" fill="#a05238" />
        </g>
        <g transform="rotate(24)">
          <path d="M0 4V-16" stroke="#c9a06a" strokeWidth="1.6" strokeLinecap="round" />
          <rect x="-2.4" y="-15" width="4.8" height="4.4" rx="1.6" fill="#a05238" />
          <rect x="-2.4" y="-9.6" width="4.8" height="4.4" rx="1.6" fill="#7c3c28" />
        </g>
      </g>
      <path d="M58 38c-1.4-2-1.4-4 0-5.6" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" fill="none" />
    </g>
  )
}

/** A shovel over the shoulder, blade up. */
function Shovel(): ReactElement {
  return (
    <g transform="translate(50 46) rotate(30)">
      <rect x="-1.4" y="-8" width="2.8" height="22" rx="1.4" fill="#c9a06a" />
      <path d="M-4.6-8C-4.6-13-2.6-16 0-16S4.6-13 4.6-8C4.6-6.6 3.6-5.6 2.2-5.6H-2.2C-3.6-5.6-4.6-6.6-4.6-8Z" fill="#8a95a5" />
      <path d="M0-16C2.6-16 4.6-13 4.6-8 4.6-6.6 3.6-5.6 2.2-5.6H0Z" fill="#6b7686" />
      <path d="M-2.6 13.6H2.6V16.4H-2.6Z" fill="#a97a42" />
    </g>
  )
}

/** The dispatch board: a grid of van magnets, each a name. */
function DispatchBoard(): ReactElement {
  return (
    <g>
      <rect x="42" y="40" width="18" height="20" rx="2" fill="#fdfcf7" />
      <rect x="42" y="40" width="18" height="20" rx="2" fill="none" stroke="#8a95a5" strokeWidth="1.4" />
      <g fill="#5aa9e6">
        <rect x="45" y="43.6" width="5" height="3.4" rx="1" />
        <rect x="52.4" y="43.6" width="5" height="3.4" rx="1" />
        <rect x="45" y="49" width="5" height="3.4" rx="1" />
      </g>
      <g fill="#e2523f">
        <rect x="52.4" y="49" width="5" height="3.4" rx="1" />
        <rect x="45" y="54.4" width="5" height="3.4" rx="1" />
      </g>
    </g>
  )
}

/** A wrench, at whatever size and angle the job calls for. */
function Wrench({ x, y, rotate, scale = 1 }: {
  readonly x: number
  readonly y: number
  readonly rotate: number
  readonly scale?: number
}): ReactElement {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`}>
      <rect x="-1.8" y="-7" width="3.6" height="16" rx="1.8" fill="#8a95a5" />
      <path d="M-4.6-7.2A4.8 4.8 0 1 1 4.6-7.2L2.4-7.2V-10H-2.4V-7.2Z" fill="#8a95a5" />
      <path d="M0-12A4.8 4.8 0 0 1 4.6-7.2H2.4V-10H0Z" fill="#6b7686" />
      <path d="M-3.4 9A3.4 3.4 0 1 0 3.4 9L1.8 9V6.6H-1.8V9Z" fill="#6b7686" />
    </g>
  )
}

/** An oil rag hanging from the pocket. */
function OilRag(): ReactElement {
  return (
    <g>
      <path d="M24 52C26.6 50.8 29.4 51 31 52.4L29.4 61.4C27 61.8 24.8 61.2 23.4 60Z" fill="#e2523f" />
      <path d="M27.8 51.4C29 51.4 30.2 51.8 31 52.4L29.4 61.4C28.4 61.6 27.4 61.6 26.4 61.4Z" fill="#b23425" />
      <circle cx="26.6" cy="55.6" r="1.2" fill="#3f4650" opacity="0.55" />
      <circle cx="28.6" cy="58.4" r="0.9" fill="#3f4650" opacity="0.55" />
    </g>
  )
}

/** A ring of workshop keys, held up by the owner. */
function KeyRing(): ReactElement {
  return (
    <g transform="translate(51 44)">
      <circle cx="0" cy="0" r="4" fill="none" stroke="#c9861a" strokeWidth="1.8" />
      <g transform="rotate(30)">
        <rect x="-1.1" y="3" width="2.2" height="9" rx="1.1" fill="#f3b13c" />
        <path d="M-1.1 9.6H-3.2V11.4H-1.1ZM-1.1 6.6H-2.6V8.2H-1.1Z" fill="#f3b13c" />
      </g>
      <g transform="rotate(-26)">
        <rect x="-1.1" y="3" width="2.2" height="8" rx="1.1" fill="#d8dbe6" />
        <path d="M1.1 8.6H3V10.2H1.1Z" fill="#d8dbe6" />
      </g>
    </g>
  )
}

/** A guitar held across the body, neck up and out of frame. */
function Guitar(): ReactElement {
  return (
    <g>
      <path d="M20 43 44 58" stroke="#a97a42" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M18.4 40.4 23.4 43.6" stroke="#7c5628" strokeWidth="4.6" strokeLinecap="round" />
      <g transform="translate(46 57) rotate(32)">
        <path d="M-9.4 0C-9.4-4.6-6.2-7.4-2.6-6.6-1.4-6.4-.4-6.4.8-6.6 5-7.6 9.4-4.4 9.4 0.4 9.4 5.2 5.2 8.4 0 8.4S-9.4 5.2-9.4 0Z" fill="#e0885e" />
        <path d="M0-6.9C4.6-7.4 9.4-4.4 9.4 0.4 9.4 5.2 5.2 8.4 0 8.4Z" fill="#b8623c" />
        <circle cx="-0.6" cy="0.6" r="2.9" fill="#3f2b1a" />
      </g>
      <path d="M23 44.4 42.4 56.4M23.8 43 43.2 55" stroke="#f5e8cf" strokeWidth="0.8" />
    </g>
  )
}

/** A trumpet raised toward the top corner, bell flared. */
function Trumpet(): ReactElement {
  return (
    <g transform="translate(48 44) rotate(-26)">
      <rect x="-10" y="-1.6" width="16" height="3.2" rx="1.6" fill="#f3b13c" />
      <path d="M5 -4C10 -5.6 13.6 -4.6 15.6 -1.4 16.4 0 16.4 0 15.6 1.4 13.6 4.6 10 5.6 5 4Z" fill="#f3b13c" />
      <path d="M5-4C10-5.6 13.6-4.6 15.6-1.4 16.4 0 16.4 0 15.6 1.4L5 0Z" fill="#c9861a" />
      <g fill="#c9861a">
        <rect x="-6.2" y="-5.4" width="2" height="4" rx="1" />
        <rect x="-2.6" y="-5.4" width="2" height="4" rx="1" />
        <rect x="1" y="-5.4" width="2" height="4" rx="1" />
      </g>
      <rect x="-13.4" y="-1.1" width="4" height="2.2" rx="1.1" fill="#c9861a" />
    </g>
  )
}

/** The mixing desk, faders mid-ride, along the bottom of the frame. */
function MixingDesk(): ReactElement {
  return (
    <g>
      <path d="M0 50H64V54A10 10 0 0 1 54 64H10A10 10 0 0 1 0 54Z" fill="#3b3350" />
      <rect x="0" y="48.6" width="64" height="3.6" fill="#554a66" />
      <g stroke="#8a80a5" strokeWidth="1.3">
        <path d="M8 55V62M16 55V62M24 55V62M40 55V62M48 55V62M56 55V62" />
      </g>
      <g fill="#59e3d0">
        <rect x="6" y="56.4" width="4" height="2.2" rx="1" />
        <rect x="22" y="59" width="4" height="2.2" rx="1" />
        <rect x="46" y="57.6" width="4" height="2.2" rx="1" />
      </g>
      <g fill="#e0479a">
        <rect x="14" y="58" width="4" height="2.2" rx="1" />
        <rect x="38" y="56" width="4" height="2.2" rx="1" />
        <rect x="54" y="59.4" width="4" height="2.2" rx="1" />
      </g>
    </g>
  )
}

/** A takeaway coffee in one spot and the morning's scripts in another. */
function CoffeeAndScripts(): ReactElement {
  return (
    <g>
      <path d="M44 44.6H53L52 54.4C51.9 55.4 51 56.2 50 56.2H47C46 56.2 45.1 55.4 45 54.4Z" fill="#fdfaf4" />
      <path d="M48.5 44.6H53L52 54.4C51.9 55.4 51 56.2 50 56.2H48.5Z" fill="#dcd5c8" />
      <rect x="43.2" y="43" width="10.6" height="2.6" rx="1.3" fill="#c96a24" />
      <path d="M47 41c-1-1.4-1-2.8 0-4" stroke="#fff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" fill="none" />
      <g transform="translate(21 52) rotate(-6)">
        <rect x="-7" y="-5" width="14" height="10" rx="1.2" fill="#fdfcf7" />
        <rect x="-7.6" y="-3.4" width="14" height="10" rx="1.2" fill="#f0ead8" transform="rotate(-5)" />
        <path d="M-4 0H4M-4 2.6H2" stroke="#b8bdcc" strokeWidth="1.1" strokeLinecap="round" />
      </g>
    </g>
  )
}

/** The big round studio microphone on its boom arm. */
function StudioMic(): ReactElement {
  return (
    <g>
      <path d="M60 34 50 43" stroke="#3b3350" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="48" cy="45.6" r="6.2" fill="#3b3350" />
      <circle cx="48" cy="45.6" r="6.2" fill="none" stroke="#241f33" strokeWidth="1.4" />
      <g stroke="#8a80a5" strokeWidth="1" opacity="0.9">
        <path d="M43.4 43.4H52.6M43 45.6H53M43.4 47.8H52.6" />
      </g>
      <circle cx="46" cy="43.6" r="1.6" fill="#fff" opacity="0.35" />
    </g>
  )
}

/** A broadcast mast, waves ringing out — the whole station in one prop. */
function TransmitterMast(): ReactElement {
  return (
    <g>
      <path d="M49 60 53 38 57 60Z" fill="#8a95a5" />
      <path d="M53 38 57 60H53Z" fill="#6b7686" />
      <path d="M50.4 52.6H55.6M49.6 56.6H56.4" stroke="#6b7686" strokeWidth="1.2" />
      <circle cx="53" cy="36.4" r="1.8" fill="#e2523f" />
      <g stroke="#e2523f" strokeWidth="1.6" strokeLinecap="round" fill="none">
        <path d="M47.6 32.8C46.4 34.8 46.4 38 47.6 40" />
        <path d="M58.4 32.8C59.6 34.8 59.6 38 58.4 40" />
      </g>
    </g>
  )
}

/** A camera held up to the eye, strap slung. */
function CameraUp(): ReactElement {
  return (
    <g>
      <path d="M22 46C28 49 38 49 44 46" stroke="#7c5628" strokeWidth="2" fill="none" />
      <g transform="translate(44 40)">
        <rect x="-8.4" y="-5.6" width="16.8" height="11.6" rx="2.4" fill="#3f4650" />
        <rect x="-8.4" y="-5.6" width="16.8" height="3.4" rx="1.7" fill="#5c6570" />
        <circle cx="1.6" cy="0.8" r="4.6" fill="#2f353d" />
        <circle cx="1.6" cy="0.8" r="3" fill="#8fd0e8" />
        <circle cx="0.4" cy="-0.4" r="1" fill="#fff" opacity="0.8" />
        <rect x="-6.6" y="-8" width="5" height="3" rx="1" fill="#3f4650" />
        <circle cx="-5.4" cy="0.8" r="1.3" fill="#e2523f" />
      </g>
    </g>
  )
}

/** One very large door key — the agent's whole trade in a hand. */
function DoorKey(): ReactElement {
  return (
    <g transform="translate(50 46) rotate(38)">
      <circle cx="0" cy="-6.6" r="4.4" fill="none" stroke="#f3b13c" strokeWidth="2.6" />
      <rect x="-1.4" y="-3" width="2.8" height="14" rx="1.4" fill="#f3b13c" />
      <path d="M1.4 6H5.4V8.4H1.4ZM1.4 9.6H4V11.8H1.4Z" fill="#f3b13c" />
      <path d="M0-11A4.4 4.4 0 0 1 4.4-6.6L1.4-6.6A1.4 1.4 0 0 0 0-8Z" fill="#c9861a" />
    </g>
  )
}

/** A yard sign with a little house on it, freshly planted. */
function YardSign(): ReactElement {
  return (
    <g>
      <rect x="45" y="38" width="15" height="11" rx="1.6" fill="#fdfcf7" />
      <rect x="45" y="38" width="15" height="11" rx="1.6" fill="none" stroke="#a97a42" strokeWidth="1.3" />
      <path d="M48.4 43.6 52.5 40 56.6 43.6V46.6H48.4Z" fill="#e2523f" />
      <path d="M52.5 40 56.6 43.6V46.6H52.5Z" fill="#b23425" />
      <rect x="51.4" y="49" width="2.2" height="10" fill="#a97a42" />
    </g>
  )
}

/** A parcel on the arm and the scanner that knows where it goes. */
function ParcelAndScanner(): ReactElement {
  return (
    <g>
      <rect x="38" y="43" width="15" height="13" rx="1.4" fill="#d8a85e" />
      <rect x="38" y="43" width="15" height="13" rx="1.4" fill="none" stroke="#a97a34" strokeWidth="1.3" />
      <path d="M45.5 43V56M38 49.5H53" stroke="#a97a34" strokeWidth="1.4" />
      <g transform="translate(24 50) rotate(-14)">
        <rect x="-3" y="-6" width="6" height="11" rx="1.8" fill="#3f4650" />
        <rect x="-2" y="-4.8" width="4" height="3.4" rx="0.8" fill="#8fd0e8" />
        <path d="M-1.4 1.4H1.4" stroke="#8a95a5" strokeWidth="1" strokeLinecap="round" />
        <path d="M0-8.4C1.4-8 2.2-7 2.4-6" stroke="#e2523f" strokeWidth="1.3" strokeLinecap="round" fill="none" />
      </g>
    </g>
  )
}

/** The coach's whistle on its lanyard. */
function Whistle(): ReactElement {
  return (
    <g>
      <path d="M26 43C28.4 46.4 33 48.4 36.6 48" stroke="#3f4650" strokeWidth="1.6" fill="none" />
      <g transform="translate(38 49) rotate(14)">
        <rect x="-4.6" y="-3" width="9.2" height="5.4" rx="2.4" fill="#e2523f" />
        <circle cx="1" cy="3.2" r="3.4" fill="#e2523f" />
        <circle cx="1" cy="3.2" r="3.4" fill="none" stroke="#b23425" strokeWidth="1.1" />
        <circle cx="2" cy="-0.6" r="1" fill="#b23425" />
      </g>
      <path d="M46 44.8c1.8-.6 3.6-.6 5.2 0M47 41.6c1.4-.4 2.6-.4 3.8 0" stroke="#3f4650" strokeWidth="1.2" strokeLinecap="round" opacity="0.5" />
    </g>
  )
}

/** A ball tucked under the coach's arm: football, baseball or cricket. */
function CoachBall({ kind }: { readonly kind: 'soccer' | 'baseball' | 'cricket' }): ReactElement {
  if (kind === 'soccer') {
    return (
      <g>
        <circle cx="51" cy="53" r="7.6" fill="#fdfcf7" />
        <circle cx="51" cy="53" r="7.6" fill="none" stroke="#d2d7e2" strokeWidth="1.2" />
        <path d="M51 49.4 54.4 51.8 53.1 55.6H48.9L47.6 51.8Z" fill="#3f4650" />
        <g stroke="#3f4650" strokeWidth="1.2" fill="none">
          <path d="M51 49.4V45.8M54.4 51.8 57.8 50.6M53.1 55.6 55.2 58.6M48.9 55.6 46.8 58.6M47.6 51.8 44.2 50.6" />
        </g>
      </g>
    )
  }
  if (kind === 'baseball') {
    return (
      <g>
        <circle cx="51" cy="53" r="7" fill="#fdfcf7" />
        <circle cx="51" cy="53" r="7" fill="none" stroke="#d2d7e2" strokeWidth="1.2" />
        <path d="M46.4 48.4C48.4 51.2 48.4 54.8 46.4 57.6M55.6 48.4C53.6 51.2 53.6 54.8 55.6 57.6" stroke="#e2523f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <g stroke="#e2523f" strokeWidth="1" strokeLinecap="round">
          <path d="M46.6 50.6 48.2 51.2M46.6 55.4 48.2 54.8M55.4 50.6 53.8 51.2M55.4 55.4 53.8 54.8" />
        </g>
      </g>
    )
  }
  return (
    <g>
      <circle cx="51" cy="53" r="7" fill="#c73a2e" />
      <circle cx="51" cy="53" r="7" fill="none" stroke="#9c271e" strokeWidth="1.2" />
      <path d="M48.6 46.6C50.2 50.6 50.2 55.4 48.6 59.4M53.4 46.6C51.8 50.6 51.8 55.4 53.4 59.4" stroke="#f5e8cf" strokeWidth="1.2" fill="none" />
    </g>
  )
}

/** A crate of the tomatoes the whole market queues for. */
function VegCrate(): ReactElement {
  return (
    <g>
      <g fill="#e0574a">
        <circle cx="45" cy="48" r="3.4" />
        <circle cx="51.6" cy="47.2" r="3.6" />
        <circle cx="57" cy="48.6" r="3.1" />
        <circle cx="48.4" cy="45" r="3" />
      </g>
      <path d="M48.4 41.4c.6-1 1.6-1.4 2.6-1.2" stroke="#5cb45c" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M40.6 48H61.4L59.8 58.6C59.6 59.8 58.6 60.6 57.4 60.6H44.6C43.4 60.6 42.4 59.8 42.2 58.6Z" fill="#c9a06a" />
      <path d="M51 48H61.4L59.8 58.6C59.6 59.8 58.6 60.6 57.4 60.6H51Z" fill="#a97a42" />
      <path d="M41.6 51.4H60.4M42.2 55.2H59.8" stroke="#8a5c2e" strokeWidth="1.1" />
    </g>
  )
}

/** A bundle of rice seedlings, roots wrapped, ready to plant. */
function RiceSeedlings(): ReactElement {
  return (
    <g transform="translate(50 50)">
      <g stroke="#5cb45c" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-3 2C-5 -3 -6 -8 -5 -13" />
        <path d="M0 2C0 -4 0 -9 1 -14" />
        <path d="M3 2C5 -3 5.6 -8 4.6 -13" />
        <path d="M-1.6 2C-3 -2 -3.4 -6 -2.8 -10" />
        <path d="M1.6 2C3 -2 3.4 -6 2.8 -10" />
      </g>
      <path d="M-5 1.4C-2 -0.2 2 -0.2 5 1.4L4 8.4C1.4 7.4 -1.4 7.4 -4 8.4Z" fill="#e8cb8a" />
      <path d="M0 0.4C1.8 0.4 3.6 0.7 5 1.4L4 8.4C2.6 7.9 1.3 7.6 0 7.6Z" fill="#cda75e" />
      <path d="M-4.6 4.6C-1.6 3.6 1.6 3.6 4.6 4.6" stroke="#a9743a" strokeWidth="1.1" fill="none" />
    </g>
  )
}

/** A sheaf of wheat, tied at the waist. */
function WheatSheaf(): ReactElement {
  return (
    <g transform="translate(50 48)">
      <g stroke="#e8b45f" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <path d="M-4 10C-5.6 2 -6.4 -5 -5.6 -12" />
        <path d="M0 10C0 2 0 -6 0.6 -13" />
        <path d="M4 10C5.6 2 6.2 -5 5.4 -12" />
      </g>
      <g fill="#f3cd94">
        <ellipse cx="-5.8" cy="-13.4" rx="2.2" ry="4.6" transform="rotate(8 -5.8 -13.4)" />
        <ellipse cx="0.6" cy="-14.6" rx="2.2" ry="4.6" />
        <ellipse cx="5.6" cy="-13.4" rx="2.2" ry="4.6" transform="rotate(-8 5.6 -13.4)" />
      </g>
      <g stroke="#c98d33" strokeWidth="0.9">
        <path d="M-7.6-15.6-4-11.2M-6.8-16.4-4.8-10.4M2.4-17.4 -1.2-11.8M-1.2-17.4 2.4-11.8M7.4-15.6 3.8-11.2M6.6-16.4 4.6-10.4" />
      </g>
      <path d="M-6 2.6C-2 1 2 1 6 2.6L5.4 6.4C1.8 5 -1.8 5 -5.4 6.4Z" fill="#a97a42" />
    </g>
  )
}

/** Quinoa in seed, the red-gold heads heavy against the sky. */
function QuinoaStalks(): ReactElement {
  return (
    <g transform="translate(51 50)">
      <g stroke="#5cb45c" strokeWidth="1.7" strokeLinecap="round" fill="none">
        <path d="M-4 10C-5 3 -5.4 -3 -4.6 -9" />
        <path d="M1 10C1 3 1 -4 1.4 -10" />
        <path d="M6 10C6.8 4 7 -2 6.4 -7" />
      </g>
      <g fill="#e0574a">
        <ellipse cx="-4.8" cy="-11.6" rx="3" ry="5.2" />
        <ellipse cx="1.4" cy="-13" rx="3.2" ry="5.6" />
        <ellipse cx="6.6" cy="-9.6" rx="2.7" ry="4.8" />
      </g>
      <g fill="#f0913c">
        <ellipse cx="-5.4" cy="-13.6" rx="1.7" ry="2.8" />
        <ellipse cx="0.6" cy="-15.4" rx="1.8" ry="3" />
        <ellipse cx="6" cy="-11.6" rx="1.5" ry="2.6" />
      </g>
    </g>
  )
}

/** A small articulated robot arm, gripper open, on the bench. */
function RobotArm(): ReactElement {
  return (
    <g>
      <rect x="42" y="56" width="16" height="4.6" rx="2" fill="#8a95a5" />
      <path d="M49 57 45 47" stroke="#5c6570" strokeWidth="3.4" strokeLinecap="round" />
      <path d="M45 47 52 40" stroke="#8a95a5" strokeWidth="3.1" strokeLinecap="round" />
      <circle cx="45" cy="47" r="2.6" fill="#f0913c" />
      <circle cx="49" cy="57" r="2.8" fill="#3f4650" />
      <g stroke="#3f4650" strokeWidth="2.2" strokeLinecap="round" fill="none">
        <path d="M52 40C54 38.8 55.6 38.8 57 40" />
        <path d="M52 40C52.6 42.2 54 43.4 56 43.6" />
      </g>
      <circle cx="52" cy="40" r="1.8" fill="#59e3d0" />
    </g>
  )
}

/** A model wing section, held up for one more look at the rib. */
function ModelWing(): ReactElement {
  return (
    <g transform="translate(49 47) rotate(-18)">
      <path d="M-11 0C-6-4.6 4-5.4 11-2.2 12.4-1.6 12.4 0 11 0.8 4 3.4-6 3 -11 0Z" fill="#d8dbe6" />
      <path d="M-11 0C-6-4.6 4-5.4 11-2.2L0-1Z" fill="#aab2c4" />
      <g stroke="#8892b5" strokeWidth="1" opacity="0.9">
        <path d="M-6-1.6V1.2M-1-2.4V2M4-2.6V1.8M8.4-2.2V1.2" />
      </g>
      <path d="M-3 -2.8 1 -6.8C2.2 -7.8 3.8 -7 3.4 -5.6L2.4 -2.9" fill="#e2523f" />
    </g>
  )
}

/** A rocket climbing out of the corner of the scene. */
function RocketLaunch(): ReactElement {
  return (
    <g transform="translate(53 40) rotate(14)">
      <path d="M0-14C3.4-10 4.6-4 4.6 2H-4.6C-4.6-4-3.4-10 0-14Z" fill="#e8ecf4" />
      <path d="M0-14C3.4-10 4.6-4 4.6 2H0Z" fill="#c3cadf" />
      <circle cx="0" cy="-4" r="2.3" fill="#8fd0e8" />
      <path d="M-4.6-1-8 5H-4.6ZM4.6-1 8 5H4.6Z" fill="#e2523f" />
      <path d="M-2.6 2H2.6L1.8 5H-1.8Z" fill="#c3cadf" />
      <path d="M0 5.6C1.6 8 1.6 10.6 0 13 -1.6 10.6-1.6 8 0 5.6Z" fill="#f0913c" />
      <path d="M0 5.6C0.9 7 1.1 8.6 0.7 10.2 0 9 -0.4 7.4 0 5.6Z" fill="#ffd166" />
    </g>
  )
}

/** A card with the line going, on balance, up. */
function ChartCard(): ReactElement {
  return (
    <g>
      <rect x="41" y="40" width="19" height="16" rx="2" fill="#fdfcf7" />
      <rect x="41" y="40" width="19" height="16" rx="2" fill="none" stroke="#8892b5" strokeWidth="1.3" />
      <path d="M44 51.6 48.4 47.8 51.4 50 57 43.6" stroke="#5bc47f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M57 43.6H53.6M57 43.6V47" stroke="#5bc47f" strokeWidth="2" strokeLinecap="round" fill="none" />
    </g>
  )
}

/** A desk globe: three continents' worth of postings. */
function DeskGlobe(): ReactElement {
  return (
    <g>
      <circle cx="49" cy="47" r="8.4" fill="#8fd0e8" />
      <path d="M49 38.6A8.4 8.4 0 0 1 49 55.4Z" fill="#5aa9c9" opacity="0.45" />
      <g fill="#5cb45c">
        <path d="M44 42.6C46 41.4 48.4 41.6 49.6 43 48.6 45 46.4 45.8 44.2 45.2 43.6 44.4 43.6 43.4 44 42.6Z" />
        <path d="M50.6 47.4C53 46.6 55.4 47.4 56.2 49.2 55 51.4 52.4 52.2 50.2 51.2 49.6 50 49.8 48.4 50.6 47.4Z" />
        <path d="M45 49.4C46.6 49 48 49.8 48.2 51.2 47 52.6 45 52.6 43.8 51.4 43.9 50.6 44.4 49.8 45 49.4Z" />
      </g>
      <path d="M49 55.6V58.4" stroke="#a97a42" strokeWidth="1.8" />
      <path d="M44.6 59.4H53.4" stroke="#a97a42" strokeWidth="2.2" strokeLinecap="round" />
    </g>
  )
}

/** A savings passbook and the rubber stamp that makes it official. */
function PassbookAndStamp(): ReactElement {
  return (
    <g>
      <g transform="translate(48 47) rotate(-8)">
        <rect x="-8" y="-6" width="16" height="12" rx="1.6" fill="#4f7fb5" />
        <rect x="-8" y="-6" width="16" height="12" rx="1.6" fill="none" stroke="#38618f" strokeWidth="1.2" />
        <path d="M-8 -1.4H8" stroke="#38618f" strokeWidth="1.2" />
        <rect x="-4.6" y="-4.4" width="9.2" height="1.8" rx="0.9" fill="#dce8f4" />
      </g>
      <g transform="translate(58 56)">
        <rect x="-3.4" y="-1.4" width="6.8" height="3.4" rx="1" fill="#a05238" />
        <path d="M-1.4-1.4C-1.4-4-1-5.6 0-5.6S1.4-4 1.4-1.4Z" fill="#c9861a" />
      </g>
    </g>
  )
}

/** A sheet with the bell curve, and the pencil that drew it. */
function BellCurveSheet(): ReactElement {
  return (
    <g>
      <g transform="translate(49 47) rotate(4)">
        <rect x="-9" y="-7" width="18" height="14" rx="1.6" fill="#fdfcf7" />
        <rect x="-9" y="-7" width="18" height="14" rx="1.6" fill="none" stroke="#b8bdcc" strokeWidth="1.2" />
        <path d="M-6.6 4.6C-3.6 4.6 -3 -4 0 -4S3.6 4.6 6.6 4.6" stroke="#7c68c9" strokeWidth="1.7" fill="none" strokeLinecap="round" />
        <path d="M-7 4.8H7" stroke="#b8bdcc" strokeWidth="1" />
        <path d="M0 -4V4.6" stroke="#b8bdcc" strokeWidth="0.9" strokeDasharray="1.6 1.4" />
      </g>
      <g transform="translate(59 40) rotate(40)">
        <rect x="-1.1" y="-4.6" width="2.2" height="9" rx="0.6" fill="#f3b13c" />
        <path d="M-1.1 4.4 0 7 1.1 4.4Z" fill="#e3c493" />
        <path d="M-0.4 6 0 7 0.4 6Z" fill="#2b2338" />
      </g>
    </g>
  )
}

/** A thick file of state papers, tied the way only ministries still tie them. */
function DocumentBundle(): ReactElement {
  return (
    <g transform="translate(48 50) rotate(-6)">
      <rect x="-9" y="-3.4" width="18" height="4" rx="1" fill="#f0ead8" />
      <rect x="-9" y="0.2" width="18" height="4" rx="1" fill="#e6ddc4" />
      <rect x="-9" y="3.8" width="18" height="4" rx="1" fill="#f0ead8" />
      <rect x="-9.6" y="-7.4" width="19.2" height="4.6" rx="1.2" fill="#c9a06a" />
      <rect x="-9.6" y="7.4" width="19.2" height="3" rx="1.2" fill="#c9a06a" />
      <path d="M0-8V10.6M-6 -5.2H6" stroke="#a05238" strokeWidth="1.5" />
      <path d="M0-8C1.8-9.4 3.6-9.4 4.6-8.2 3.4-7 1.8-7 0-8ZM0-8C-1.8-9.4-3.6-9.4-4.6-8.2-3.4-7-1.8-7 0-8Z" fill="#a05238" />
    </g>
  )
}

/** The typewriter, mid-page, along the bottom of the frame. */
function Typewriter(): ReactElement {
  return (
    <g>
      <rect x="38" y="49" width="22" height="9.6" rx="2.4" fill="#4c9c8e" />
      <path d="M49 49H60V56.2C60 57.6 59 58.6 57.6 58.6H49Z" fill="#37776c" />
      <rect x="41" y="43" width="16" height="7" rx="1.4" fill="#fdfcf7" />
      <path d="M43.4 45.4H54.6M43.4 47.4H51" stroke="#b8bdcc" strokeWidth="1" strokeLinecap="round" />
      <rect x="40" y="49.8" width="18" height="2.4" rx="1.2" fill="#2b5a52" />
      <g fill="#dff2ef">
        <circle cx="42.6" cy="55" r="1.1" />
        <circle cx="46" cy="55" r="1.1" />
        <circle cx="49.4" cy="55" r="1.1" />
        <circle cx="52.8" cy="55" r="1.1" />
        <circle cx="56.2" cy="55" r="1.1" />
      </g>
    </g>
  )
}

/** A nib pen, an ink bottle and a page ruled into panels. */
function MangaTools(): ReactElement {
  return (
    <g>
      <g transform="translate(46 47) rotate(6)">
        <rect x="-8" y="-8" width="16" height="16" rx="1.4" fill="#fdfcf7" />
        <rect x="-8" y="-8" width="16" height="16" rx="1.4" fill="none" stroke="#b8bdcc" strokeWidth="1.2" />
        <path d="M-8 -1H1V-8M1 -1H8M-1 -1V8" stroke="#3f4650" strokeWidth="1.1" fill="none" />
        <path d="M-6.4-4.8C-5-6.2-3.4-6.2-2.2-5" stroke="#3f4650" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      </g>
      <g transform="translate(58 42) rotate(48)">
        <rect x="-1" y="-5.4" width="2" height="8.4" rx="1" fill="#3b3350" />
        <path d="M-1 3 0 6.4 1 3Z" fill="#8a95a5" />
      </g>
      <g transform="translate(59 56)">
        <path d="M-3 -1H3V2.4C3 3.6 2 4.4 0.8 4.4H-0.8C-2 4.4-3 3.6-3 2.4Z" fill="#2b2338" />
        <rect x="-2" y="-3.2" width="4" height="2.4" rx="0.8" fill="#8a95a5" />
      </g>
    </g>
  )
}

/** The reporter's flip notebook, half the story already in it. */
function PressNotebook(): ReactElement {
  return (
    <g>
      <g transform="translate(47 48) rotate(-8)">
        <rect x="-6.4" y="-8.4" width="12.8" height="16.8" rx="1.6" fill="#fdfcf7" />
        <rect x="-6.4" y="-8.4" width="12.8" height="16.8" rx="1.6" fill="none" stroke="#b8bdcc" strokeWidth="1.2" />
        <rect x="-6.8" y="-9.6" width="13.6" height="3" rx="1.4" fill="#e2523f" />
        <path d="M-4 -3.4H4M-4 -0.6H4M-4 2.2H1.4" stroke="#b8bdcc" strokeWidth="1.1" strokeLinecap="round" />
      </g>
      <g transform="translate(57.6 42) rotate(36)">
        <rect x="-1" y="-4.6" width="2" height="8.6" rx="1" fill="#4f7fb5" />
        <path d="M-1 4 0 6.2 1 4Z" fill="#38618f" />
      </g>
    </g>
  )
}

/** A small patient, mid-checkup, entirely unbothered. */
function VetPuppy(): ReactElement {
  return (
    <g>
      <ellipse cx="49" cy="54" rx="10.4" ry="7.6" fill="#e8c48f" />
      <circle cx="41" cy="48" r="5.6" fill="#e8c48f" />
      <path d="M36.8 44.4C35.4 41.8 36.8 39.8 38.8 40.2 39.6 42.2 39.8 44 39.2 45.8Z" fill="#c69a5e" />
      <path d="M44 44.6C45.6 42 44.4 39.8 42.2 40.2 41.2 42.2 41 44 41.6 46Z" fill="#c69a5e" />
      <circle cx="39.4" cy="48.4" r="1.1" fill="#2b2118" />
      <circle cx="42.8" cy="48.8" r="1.1" fill="#2b2118" />
      <ellipse cx="41" cy="51" rx="1.4" ry="1.1" fill="#2b2118" />
      <path d="M53 47.4C55.4 45.8 57.6 46.2 58.6 48" stroke="#c69a5e" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      <rect x="44" y="52.6" width="9.4" height="3.4" rx="1.7" fill="#dff2ef" />
    </g>
  )
}

/** An open book, held up mid-argument. */
function OpenBook(): ReactElement {
  return (
    <g transform="translate(48 49) rotate(-5)">
      <path d="M0-6C-3.4-8.4-7.4-8.8-10.6-7.4V6.2C-7.4 4.8-3.4 5.2 0 7.6 3.4 5.2 7.4 4.8 10.6 6.2V-7.4C7.4-8.8 3.4-8.4 0-6Z" fill="#a05238" />
      <path d="M0-4.6C-2.8-6.6-6.2-7-8.8-5.8V4.6C-6.2 3.6-2.8 4 0 5.8 2.8 4 6.2 3.6 8.8 4.6V-5.8C6.2-7 2.8-6.6 0-4.6Z" fill="#fdfcf7" />
      <path d="M0-4.6V5.8" stroke="#dcd5c8" strokeWidth="1" />
      <g stroke="#b8bdcc" strokeWidth="0.9" strokeLinecap="round">
        <path d="M-6.8-3.2C-5-3.8-3.2-3.8-1.6-3M-6.8-0.6C-5-1.2-3.2-1.2-1.6-0.4M-6.8 2C-5 1.4-3.2 1.4-1.6 2.2" />
        <path d="M1.6-3C3.2-3.8 5-3.8 6.8-3.2M1.6-0.4C3.2-1.2 5-1.2 6.8-0.6M1.6 2.2C3.2 1.4 5 1.4 6.8 2" />
      </g>
    </g>
  )
}

/** A brass hand scale, weighing out the morning's sale. */
function HandScale(): ReactElement {
  return (
    <g transform="translate(49 42)">
      <path d="M0-2V-5" stroke="#c9861a" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-8 6 0-2 8 6" stroke="#c9861a" strokeWidth="1.4" fill="none" />
      <circle cx="0" cy="-2" r="1.6" fill="#f3b13c" />
      <path d="M-11.4 7.4C-11.4 10.4-9.4 12.4-6.4 12.4H-6C-4.2 12.4-3.2 11-3.6 9.4L-4.6 6H-11Z" fill="#f3b13c" transform="translate(0 0)" />
      <path d="M-12 6.6H-3.4C-3 6.6-2.8 7-3 7.4L-3.6 8.6H-11.8L-12.4 7.4C-12.6 7-12.4 6.6-12 6.6Z" fill="#c9861a" />
      <path d="M4.6 6H11L12.4 7.4C12.6 7 12.4 6.6 12 6.6H3.4C3 6.6 2.8 7 3 7.4L3.6 8.6H11.8Z" fill="#c9861a" />
      <path d="M3.6 8.6C3.6 11.2 5.6 13 8.2 13S12.4 11.2 12 8.6Z" fill="#f3b13c" />
      <circle cx="-7.4" cy="4.4" r="2.6" fill="#f0913c" />
      <circle cx="-9.8" cy="5.2" r="2.2" fill="#e0574a" />
      <rect x="6" y="5" width="4.4" height="3.6" rx="0.8" fill="#8a95a5" />
    </g>
  )
}

/** A pocket calculator and the stacked stock it prices. */
function BoxStackAndCalculator(): ReactElement {
  return (
    <g>
      <g>
        <rect x="40" y="50" width="11" height="9" rx="1.2" fill="#d8a85e" />
        <rect x="49" y="52" width="10" height="7" rx="1.2" fill="#c9a06a" />
        <rect x="44" y="42.6" width="10.4" height="8.4" rx="1.2" fill="#e2b878" />
        <path d="M49.2 42.6V51M44 46.8H54.4" stroke="#a97a34" strokeWidth="1.2" />
        <path d="M40 54.4H51M49 55.6H59" stroke="#a97a34" strokeWidth="1" opacity="0.7" />
      </g>
      <g transform="translate(24 52) rotate(-10)">
        <rect x="-3.6" y="-5.6" width="7.2" height="11.2" rx="1.4" fill="#3f4650" />
        <rect x="-2.4" y="-4.4" width="4.8" height="2.6" rx="0.6" fill="#9fe8d8" />
        <g fill="#8a95a5">
          <circle cx="-1.6" cy="0.4" r="0.8" />
          <circle cx="1.6" cy="0.4" r="0.8" />
          <circle cx="-1.6" cy="3" r="0.8" />
          <circle cx="1.6" cy="3" r="0.8" />
        </g>
      </g>
    </g>
  )
}

/** A seedling in one hand, the field book in the other. */
function SproutAndNotebook(): ReactElement {
  return (
    <g>
      <g transform="translate(50 44)">
        <path d="M0 8V0" stroke="#5cb45c" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M0 1C-0.6-2.6-3-4.8-6.2-4.6-5.8-1.2-3.4 0.8 0 1Z" fill="#5cb45c" />
        <path d="M0 1C0.6-2.6 3-4.8 6.2-4.6 5.8-1.2 3.4 0.8 0 1Z" fill="#3f9e60" />
      </g>
      <g transform="translate(23 52) rotate(8)">
        <rect x="-5.4" y="-7" width="10.8" height="14" rx="1.4" fill="#c69a5e" />
        <rect x="-4" y="-5.4" width="8" height="10.8" rx="1" fill="#fdfcf7" />
        <path d="M-2 -2.6H2.4M-2 0H2.4M-2 2.6H0.6" stroke="#b8bdcc" strokeWidth="0.9" strokeLinecap="round" />
      </g>
    </g>
  )
}

/** A geologist's pick and the core sample it earned. */
function PickAndCore(): ReactElement {
  return (
    <g>
      <g transform="translate(50 46) rotate(30)">
        <rect x="-1.4" y="-3" width="2.8" height="16" rx="1.4" fill="#c9a06a" />
        <path d="M-9-3.4C-5.6-6.4-1.4-7.6 3-6.8L8.6-4.6C9.6-4.2 9.6-3 8.6-2.6L3-1.4C-0.6-2.8-4.6-3-9-3.4Z" fill="#8a95a5" />
        <path d="M3-6.8 8.6-4.6C9.6-4.2 9.6-3 8.6-2.6L3-1.4Z" fill="#6b7686" />
      </g>
      <g transform="translate(25 54) rotate(-78)">
        <rect x="-2.6" y="-7" width="5.2" height="14" rx="2.6" fill="#d8dbe6" />
        <path d="M-2.6 -3H2.6M-2.6 1H2.6M-2.6 4.6H2.6" stroke="#aab2c4" strokeWidth="1.1" />
      </g>
    </g>
  )
}

/** The wire caddy of chai glasses, carried at a run without a drop. */
function ChaiCaddy(): ReactElement {
  return (
    <g transform="translate(49 48)">
      <path d="M0-12V-4" stroke="#6b7686" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M-8 2C-8-2-4.6-4 0-4S8-2 8 2" stroke="#6b7686" strokeWidth="1.5" fill="none" />
      <path d="M-9.4 2H9.4V4.6C9.4 5.8 8.4 6.6 7.2 6.6H-7.2C-8.4 6.6-9.4 5.8-9.4 4.6Z" fill="#8a95a5" />
      <path d="M0 2H9.4V4.6C9.4 5.8 8.4 6.6 7.2 6.6H0Z" fill="#6b7686" />
      <g>
        <path d="M-7.4-3.4H-3.4L-4 2H-6.8Z" fill="#e8a24b" />
        <path d="M-2-3.4H2L1.4 2H-1.4Z" fill="#e8a24b" />
        <path d="M3.4-3.4H7.4L6.8 2H4Z" fill="#e8a24b" />
        <path d="M-7.4-3.4H-3.4L-3.5-2.4H-7.3ZM-2-3.4H2L1.9-2.4H-1.9ZM3.4-3.4H7.4L7.3-2.4H3.5Z" fill="#f7e0a8" />
      </g>
      <path d="M-5 -6c-.8-1.2-.8-2.4 0-3.4M0 -6c-.8-1.2-.8-2.4 0-3.4M5 -6c-.8-1.2-.8-2.4 0-3.4" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" opacity="0.75" fill="none" />
    </g>
  )
}

/** The roadmap board, sticky notes at every altitude. */
function StickyBoard(): ReactElement {
  return (
    <g>
      <rect x="42" y="39" width="18" height="21" rx="2" fill="#fdfcf7" />
      <rect x="42" y="39" width="18" height="21" rx="2" fill="none" stroke="#b8bdcc" strokeWidth="1.3" />
      <path d="M48 39V60M54 39V60" stroke="#e4e0d2" strokeWidth="1" />
      <g>
        <rect x="43.6" y="42" width="3.4" height="3.4" fill="#ffd166" />
        <rect x="43.6" y="47" width="3.4" height="3.4" fill="#8fd0e8" />
        <rect x="49" y="44" width="3.4" height="3.4" fill="#f6a8c0" />
        <rect x="49" y="52.4" width="3.4" height="3.4" fill="#ffd166" />
        <rect x="55" y="46.4" width="3.4" height="3.4" fill="#9fe8b8" />
      </g>
    </g>
  )
}

// ---------------------------------------------------------------------------
// The food and craft trades
// ---------------------------------------------------------------------------

export function salonApprentice(): ReactElement {
  const scene = SCENE.salon
  const person = look(2, '#241d2b', 'ponytail', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#b48fd9" wearDark="#8f66bd" collar="v" build="slim" tilt={-3}>
        <Apron cloth="#fdfaf4" clothShade="#e4ddd0" strap="#e4ddd0" />
      </Bust>
      <ShoulderTowel />
      <Arm from={{ x: 42.4, y: 48.4 }} to={{ x: 49, y: 46 }} bend={-2} sleeve="#b48fd9" skin={person.skin} width={6} handR={3.2} />
      <SprayBottle />
    </g>
  )
}

export function apprenticeBaker(): ReactElement {
  const scene = SCENE.bakery
  const person = look(0, '#a34a22', 'crop', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#f0f2f6"
        wearDark="#d2d7e2"
        collar="chef"
        build="regular"
        tilt={4}
        headwear={<Headband cloth="#5aa9e6" clothShade="#3a7fbf" />}
      />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 50, y: 51 }} bend={2} sleeve="#f0f2f6" skin={person.skin} width={6.4} handR={3.4} />
      <Baguette />
    </g>
  )
}

export function riceApprentice(): ReactElement {
  const scene = SCENE.kitchen
  const person = look(1, '#241d2b', 'buzz', { mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#3d4763"
        wearDark="#2b3149"
        collar="v"
        build="slim"
        tilt={-2}
        headwear={<Headband cloth="#fdfaf4" clothShade="#dcd5c8" />}
      />
      <RiceTub />
    </g>
  )
}

export function sweetMaker(): ReactElement {
  const scene = SCENE.kitchen
  const person = look(3, '#241d2b', 'crop', { facialHair: 'moustache', mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#fdfaf4" wearDark="#e0d8c8" collar="crew" build="broad" tilt={3} />
      <MilkPan />
    </g>
  )
}

export function lineCook(): ReactElement {
  const scene = SCENE.kitchen
  const person = look(4, '#241d2b', 'buzz', { mouth: 'open' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#fdfaf4"
        wearDark="#e0d8c8"
        collar="chef"
        build="regular"
        tilt={-4}
        headwear={<Headband cloth="#e2523f" clothShade="#b23425" />}
      />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 52, y: 53 }} bend={3} sleeve="#fdfaf4" skin={person.skin} width={6.4} handR={3.4} />
      <Skillet />
    </g>
  )
}

export function noodleCook(): ReactElement {
  const scene = SCENE.dusk
  const person = look(2, '#3d2b1f', 'crop', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#2f3852"
        wearDark="#20263b"
        collar="v"
        build="regular"
        tilt={3}
        headwear={<Headband cloth="#fdfaf4" clothShade="#dcd5c8" />}
      />
      <NoodleBowl />
    </g>
  )
}

export function grillCook(): ReactElement {
  const scene = SCENE.dusk
  const person = look(4, '#241d2b', 'short', { facialHair: 'stubble', mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#e2523f" wearDark="#b23425" collar="crew" build="broad" tilt={-3}>
        <Apron cloth="#3f4650" clothShade="#2f353d" strap="#2f353d" />
      </Bust>
      <Skewers />
    </g>
  )
}

// ---------------------------------------------------------------------------
// The site, the depot and the workshop
// ---------------------------------------------------------------------------

export function siteLabourer(): ReactElement {
  const scene = SCENE.site
  const person = look(3, '#241d2b', 'buzz', { mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#f0913c"
        wearDark="#c96a24"
        collar="crew"
        build="broad"
        tilt={2}
        headwear={<HardHat />}
      />
      <Shovel />
    </g>
  )
}

export function dispatcher(): ReactElement {
  const scene = SCENE.depot
  const person = look(1, '#8a8fa3', 'bun', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#4f7fb5"
        wearDark="#38618f"
        collar="crew"
        build="regular"
        tilt={-3}
        headwear={<Headset />}
      />
      <DispatchBoard />
    </g>
  )
}

export function logisticsLead(): ReactElement {
  const scene = SCENE.depot
  const person = look(5, '#241d2b', 'crop', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#5c6784" wearDark="#3f4864" collar="crew" build="broad" tilt={3}>
        <HiVisVest />
      </Bust>
      <Clipboard x={50} y={51} rotate={8} />
    </g>
  )
}

export function apprenticeMechanic(): ReactElement {
  const scene = SCENE.garage
  const person = look(0, '#d1702a', 'short', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#8fd0e8" wearDark="#5aa9c9" collar="crew" build="slim" tilt={4}>
        <Overalls cloth="#4f7fb5" clothShade="#38618f" />
      </Bust>
      <Arm from={{ x: 42.4, y: 48.4 }} to={{ x: 50, y: 47 }} bend={-2} sleeve="#8fd0e8" skin={person.skin} width={5.8} handR={3.1} />
      <Wrench x={52} y={44} rotate={34} scale={0.8} />
    </g>
  )
}

export function mechanic(): ReactElement {
  const scene = SCENE.garage
  const person = look(2, '#241d2b', 'short', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#e2523f"
        wearDark="#b23425"
        collar="crew"
        build="regular"
        tilt={-4}
        headwear={<Cap cloth="#38618f" clothShade="#2b4a6b" />}
      >
        <Overalls cloth="#5c6570" clothShade="#3f4650" />
      </Bust>
      <Wrench x={51} y={47} rotate={-28} scale={1.15} />
    </g>
  )
}

export function workshopOwner(): ReactElement {
  const scene = SCENE.garage
  const person = look(1, '#8a8fa3', 'crop', { facialHair: 'moustache', mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#d8dbe6" wearDark="#aab2c4" collar="crew" build="broad" tilt={2}>
        <Overalls cloth="#a05238" clothShade="#7c3c28" />
      </Bust>
      <OilRag />
      <KeyRing />
    </g>
  )
}

export function warehousePicker(): ReactElement {
  const scene = SCENE.warehouse
  const person = look(1, '#3d2b1f', 'short', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#5aa9e6"
        wearDark="#3a7fbf"
        collar="crew"
        build="regular"
        tilt={4}
        headwear={<Beanie />}
      />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 42, y: 55 }} bend={4} sleeve="#5aa9e6" skin={person.skin} width={6.2} handR={3.3} />
      <ParcelAndScanner />
    </g>
  )
}

// ---------------------------------------------------------------------------
// The stage, the booth and the airwaves
// ---------------------------------------------------------------------------

export function sessionMusician(): ReactElement {
  const scene = SCENE.studio
  const person = look(3, '#241d2b', 'curls', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#f3b13c" wearDark="#c9861a" collar="crew" build="slim" tilt={-4} />
      <Guitar />
    </g>
  )
}

export function brassMusician(): ReactElement {
  const scene = SCENE.street
  const person = look(4, '#241d2b', 'short', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#c73a2e" wearDark="#9c271e" collar="crew" collarShirt="#f3b13c" collarShirtShade="#c9861a" build="regular" tilt={3}>
        <g fill="#f3b13c">
          <rect x="19.8" y="45.4" width="7" height="3" rx="1.5" />
          <rect x="37.2" y="45.4" width="7" height="3" rx="1.5" />
        </g>
      </Bust>
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 47, y: 45 }} bend={-2} sleeve="#c73a2e" skin={person.skin} width={6.2} handR={3.3} />
      <Trumpet />
    </g>
  )
}

export function recordProducer(): ReactElement {
  const scene = SCENE.booth
  const person = look(5, '#241d2b', 'none', { facialHair: 'beard', mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#3b3350"
        wearDark="#241f33"
        collar="crew"
        build="regular"
        tilt={-2}
        headwear={<Headphones />}
      />
      <MixingDesk />
    </g>
  )
}

export function radioRunner(): ReactElement {
  const scene = SCENE.radio
  const person = look(0, '#3d2b1f', 'ponytail', { mouth: 'open' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#5bc47f" wearDark="#3f9e60" collar="crew" build="slim" tilt={5} />
      <Arm from={{ x: 42.4, y: 48.4 }} to={{ x: 48, y: 53 }} bend={2} sleeve="#5bc47f" skin={person.skin} width={5.8} handR={3.1} />
      <CoffeeAndScripts />
    </g>
  )
}

export function radioHost(): ReactElement {
  const scene = SCENE.radio
  const person = look(2, '#241d2b', 'wave', { mouth: 'open' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#7c68c9"
        wearDark="#5a4a9e"
        collar="crew"
        build="regular"
        tilt={-4}
        headwear={<Headphones />}
      />
      <StudioMic />
    </g>
  )
}

export function stationOwner(): ReactElement {
  const scene = SCENE.radio
  const person = look(1, '#d8dbe6', 'bun', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <TransmitterMast />
      <Bust look={person} wear="#2f3852" wearDark="#20263b" collar="lapel" build="regular" tilt={3} />
    </g>
  )
}

// ---------------------------------------------------------------------------
// The camera and the property office
// ---------------------------------------------------------------------------

export function photographer(): ReactElement {
  const scene = SCENE.street
  const person = look(3, '#241d2b', 'bun', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#5c6784" wearDark="#3f4864" collar="v" build="slim" tilt={6} />
      <Arm from={{ x: 42.4, y: 48.4 }} to={{ x: 46, y: 44 }} bend={-3} sleeve="#5c6784" skin={person.skin} width={5.8} handR={3.1} />
      <CameraUp />
    </g>
  )
}

export function estateAgent(): ReactElement {
  const scene = SCENE.street
  const person = look(0, '#e0b45c', 'long', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#3fa6ac" wearDark="#2c8f87" collar="lapel" build="regular" tilt={-3} />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 49, y: 50 }} bend={2} sleeve="#3fa6ac" skin={person.skin} width={6} handR={3.2} />
      <DoorKey />
    </g>
  )
}

export function agencyOwner(): ReactElement {
  const scene = SCENE.street
  const person = look(2, '#241d2b', 'wave', { mouth: 'grin', brow: '#241d2b' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#2f3852" wearDark="#20263b" collar="lapel" build="broad" tilt={2} />
      <YardSign />
    </g>
  )
}

// ---------------------------------------------------------------------------
// The touchline and the land
// ---------------------------------------------------------------------------

export function soccerCoach(): ReactElement {
  const scene = SCENE.pitch
  const person = look(2, '#241d2b', 'buzz', { facialHair: 'stubble', mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#3f9e60"
        wearDark="#2e7a49"
        collar="v"
        build="regular"
        tilt={-3}
        headwear={<Cap cloth="#e2523f" clothShade="#b23425" />}
      />
      <Whistle />
      <CoachBall kind="soccer" />
    </g>
  )
}

export function baseballCoach(): ReactElement {
  const scene = SCENE.pitch
  const person = look(1, '#241d2b', 'none', { facialHair: 'moustache', mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#4f7fb5"
        wearDark="#38618f"
        collar="crew"
        build="broad"
        tilt={3}
        headwear={<Cap cloth="#38618f" clothShade="#2b4a6b" peak="#2b4a6b" />}
      />
      <Whistle />
      <CoachBall kind="baseball" />
    </g>
  )
}

export function cricketCoach(): ReactElement {
  const scene = SCENE.pitch
  const person = look(4, '#241d2b', 'crop', { facialHair: 'stubble', mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#fdfaf4"
        wearDark="#e0d8c8"
        collar="v"
        collarShirt="#3fa6ac"
        collarShirtShade="#2c8f87"
        build="regular"
        tilt={-2}
        headwear={<Cap cloth="#3fa6ac" clothShade="#2c8f87" />}
      />
      <Whistle />
      <CoachBall kind="cricket" />
    </g>
  )
}

export function marketGardener(): ReactElement {
  const scene = SCENE.field
  const person = look(0, '#a34a22', 'braids', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#a97a42"
        wearDark="#8a5c2e"
        collar="crew"
        build="regular"
        tilt={4}
        headwear={<StrawHat />}
      />
      <VegCrate />
    </g>
  )
}

export function riceFarmer(): ReactElement {
  const scene = SCENE.paddy
  const person = look(2, '#241d2b', 'none', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#3d4763"
        wearDark="#2b3149"
        collar="crew"
        build="regular"
        tilt={-3}
        headwear={<ConicalHat />}
      />
      <RiceSeedlings />
    </g>
  )
}

export function wheatFarmer(): ReactElement {
  const scene = SCENE.market
  const person = look(4, '#241d2b', 'none', { facialHair: 'moustache', mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#fdfaf4"
        wearDark="#e0d8c8"
        collar="v"
        build="broad"
        tilt={2}
        headwear={<HeadWrap />}
      />
      <WheatSheaf />
    </g>
  )
}

export function quinoaFarmer(): ReactElement {
  const scene = SCENE.altiplano
  const person = look(3, '#241d2b', 'braids', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#e0574a"
        wearDark="#b23425"
        collar="crew"
        build="regular"
        tilt={3}
        headwear={<BowlerHat />}
      >
        {/* the woven stripes of an aguayo, worn over the shoulders */}
        <g opacity="0.9">
          <path d="M14.4 57.6C22 50.4 42 50.4 49.6 57.6" stroke="#f3b13c" strokeWidth="2.6" fill="none" />
          <path d="M13.6 61C21.6 53.6 42.4 53.6 50.4 61" stroke="#3fa6ac" strokeWidth="2.6" fill="none" />
        </g>
      </Bust>
      <QuinoaStalks />
    </g>
  )
}

// ---------------------------------------------------------------------------
// The engineers and the professions
// ---------------------------------------------------------------------------

export function roboticsEngineer(): ReactElement {
  const scene = SCENE.lab
  const person = look(0, '#37c7bb', 'crop', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#5f8fd6"
        wearDark="#3a6ab0"
        collar="crew"
        build="slim"
        tilt={-4}
        headwear={<Glasses />}
      />
      <RobotArm />
    </g>
  )
}

export function aerospaceEngineer(): ReactElement {
  const scene = SCENE.sky
  const person = look(1, '#3d2b1f', 'bun', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#5c6784"
        wearDark="#3f4864"
        collar="crew"
        build="regular"
        tilt={3}
        headwear={<Glasses />}
      />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 47, y: 49 }} bend={-2} sleeve="#5c6784" skin={person.skin} width={6} handR={3.2} />
      <ModelWing />
    </g>
  )
}

export function rocketEngineer(): ReactElement {
  const scene = SCENE.sky
  const person = look(3, '#241d2b', 'bun', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <RocketLaunch />
      <Bust
        look={person}
        wear="#e8ecf4"
        wearDark="#c3cadf"
        collar="lapel"
        collarShirt="#3fa6ac"
        collarShirtShade="#2c8f87"
        build="slim"
        tilt={-3}
      />
      <Clipboard x={22} y={54} rotate={-8} />
    </g>
  )
}

export function investmentAnalyst(): ReactElement {
  const scene = SCENE.office
  const person = look(2, '#241d2b', 'short', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#2f3852" wearDark="#20263b" collar="lapel" build="regular" tilt={-3} />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 45, y: 54 }} bend={3} sleeve="#2f3852" skin={person.skin} width={6} handR={3.2} />
      <ChartCard />
    </g>
  )
}

export function tradingGeneralist(): ReactElement {
  const scene = SCENE.office
  const person = look(1, '#241d2b', 'wave', { mouth: 'grin', brow: '#241d2b' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#5a4a3a" wearDark="#3e3226" collar="lapel" build="broad" tilt={3} />
      <DeskGlobe />
    </g>
  )
}

export function bankOfficer(): ReactElement {
  const scene = SCENE.bank
  const person = look(4, '#241d2b', 'bun', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#4c9c8e" wearDark="#37776c" collar="lapel" build="regular" tilt={-2} />
      <PassbookAndStamp />
    </g>
  )
}

export function actuary(): ReactElement {
  const scene = SCENE.office
  const person = look(0, '#8a8fa3', 'crop', { mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#8f7fd6"
        wearDark="#6f5fc0"
        collar="v"
        build="slim"
        tilt={4}
        headwear={<Glasses />}
      />
      <BellCurveSheet />
    </g>
  )
}

export function ministryOfficial(): ReactElement {
  const scene = SCENE.ministry
  const person = look(2, '#241d2b', 'short', { mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#3f4864" wearDark="#2b3149" collar="lapel" build="regular" tilt={-2} />
      <DocumentBundle />
    </g>
  )
}

export function writer(): ReactElement {
  const scene = SCENE.desk
  const person = look(1, '#a34a22', 'curls', { mouth: 'flat' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#a05238" wearDark="#7c3c28" collar="v" build="slim" tilt={5} />
      <Typewriter />
    </g>
  )
}

export function mangaArtist(): ReactElement {
  const scene = SCENE.desk
  const person = look(0, '#241d2b', 'long', { mouth: 'open' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#5aa9e6" wearDark="#3a7fbf" collar="crew" build="slim" tilt={-5} />
      <MangaTools />
    </g>
  )
}

export function journalist(): ReactElement {
  const scene = SCENE.altiplano
  const person = look(3, '#241d2b', 'short', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#c2a983" wearDark="#a3855e" collar="crew" collarShirt="#e2523f" collarShirtShade="#b23425" build="regular" tilt={4} />
      <PressNotebook />
    </g>
  )
}

export function veterinarian(): ReactElement {
  const scene = SCENE.clinic
  const person = look(2, '#241d2b', 'ponytail', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#4fbdb2" wearDark="#2c8f87" collar="v" build="regular" tilt={-4} />
      <VetPuppy />
    </g>
  )
}

export function professor(): ReactElement {
  const scene = SCENE.lecture
  const person = look(5, '#8a8fa3', 'none', { facialHair: 'beard', mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#7c5628"
        wearDark="#5a3f1e"
        collar="lapel"
        collarShirt="#f5e8cf"
        collarShirtShade="#e0d0ab"
        build="regular"
        tilt={2}
        headwear={<Glasses />}
      />
      <Arm from={{ x: 44, y: 47.4 }} to={{ x: 46, y: 52 }} bend={3} sleeve="#7c5628" skin={person.skin} width={6.2} handR={3.3} />
      <OpenBook />
    </g>
  )
}

// ---------------------------------------------------------------------------
// The market and the road
// ---------------------------------------------------------------------------

export function marketVendor(): ReactElement {
  const scene = SCENE.market
  const person = look(3, '#241d2b', 'braids', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#3fa6ac"
        wearDark="#2c8f87"
        collar="crew"
        build="regular"
        tilt={-3}
        headwear={<BowlerHat />}
      >
        <Apron cloth="#f7e0a8" clothShade="#e0c078" strap="#e0c078" />
      </Bust>
      <HandScale />
    </g>
  )
}

export function minibusOwner(): ReactElement {
  const scene = SCENE.street
  const person = look(4, '#241d2b', 'crop', { facialHair: 'moustache', mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      {/* the newest bus on the line, parked where its owner can see it */}
      <g>
        <rect x="6" y="34" width="20" height="11" rx="2.6" fill="#5bc47f" />
        <path d="M6 39.4H26V42.4C26 43.8 25 44.8 23.6 44.8H8.4C7 44.8 6 43.8 6 42.4Z" fill="#3f9e60" />
        <g fill="#bfeaf0">
          <rect x="8" y="35.6" width="4.4" height="3.4" rx="1" />
          <rect x="13.8" y="35.6" width="4.4" height="3.4" rx="1" />
          <rect x="19.6" y="35.6" width="4.4" height="3.4" rx="1" />
        </g>
        <circle cx="11" cy="45.4" r="2.2" fill="#2f353d" />
        <circle cx="21.4" cy="45.4" r="2.2" fill="#2f353d" />
      </g>
      <Bust
        look={person}
        wear="#f3b13c"
        wearDark="#c9861a"
        collar="crew"
        build="broad"
        tilt={3}
        headwear={<Cap cloth="#3f4650" clothShade="#2f353d" />}
      />
      <KeyRing />
    </g>
  )
}

export function importTrader(): ReactElement {
  const scene = SCENE.market
  const person = look(1, '#241d2b', 'bun', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#7c68c9" wearDark="#5a4a9e" collar="crew" build="regular" tilt={-4} />
      <BoxStackAndCalculator />
    </g>
  )
}

export function agronomist(): ReactElement {
  const scene = SCENE.field
  const person = look(0, '#e0b45c', 'ponytail', { mouth: 'smile' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#5cb45c"
        wearDark="#3f9e60"
        collar="crew"
        build="slim"
        tilt={3}
        headwear={<Cap cloth="#c2a983" clothShade="#a3855e" />}
      />
      <SproutAndNotebook />
    </g>
  )
}

export function geologist(): ReactElement {
  const scene = SCENE.saltflat
  const person = look(2, '#3d2b1f', 'ponytail', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust
        look={person}
        wear="#f0913c"
        wearDark="#c96a24"
        collar="crew"
        build="regular"
        tilt={-3}
        headwear={<HardHat shell="#e8ecf4" shellShade="#b9c3cf" />}
      />
      <PickAndCore />
    </g>
  )
}

export function chaiWallah(): ReactElement {
  const scene = SCENE.street
  const person = look(4, '#241d2b', 'short', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#5aa9e6" wearDark="#3a7fbf" collar="v" build="slim" tilt={4} />
      <Arm from={{ x: 42.4, y: 48.4 }} to={{ x: 46, y: 52 }} bend={2} sleeve="#5aa9e6" skin={person.skin} width={5.8} handR={3.1} />
      <ChaiCaddy />
    </g>
  )
}

export function productManager(): ReactElement {
  const scene = SCENE.office
  const person = look(0, '#3d2b1f', 'wave', { mouth: 'grin' })
  return (
    <g>
      <Backdrop {...scene} />
      <Bust look={person} wear="#3fc0b0" wearDark="#2a9689" collar="v" build="slim" tilt={-4}>
        <Lanyard />
      </Bust>
      <StickyBoard />
    </g>
  )
}
