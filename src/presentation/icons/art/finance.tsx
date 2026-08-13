import { type ReactElement } from 'react'

import { Coin, Shield } from '../parts'

/**
 * Finance: the bank, the insurance office, the trading floor, and the three
 * policy badges a player can hold.
 *
 * The `policy:*` badges are drawn to read at a glance shrunk to about 16px on
 * the player panel — each is a single flat glyph dropped onto `Shield`, no
 * fine detail, the same trick a favicon uses. The other three are full
 * scenes, on the same 64×64 grid and flat-shaded light-from-upper-left as
 * every other illustration in the game.
 */

const F = {
  ink: '#2b2118',
  paper: '#fdf6e6',
  paperEdge: '#c3ad86',
  cream: '#fdfaf4',
  gold: '#f3b13c',
  goldDark: '#c9861a',
  green: '#5bc47f',
  red: '#e2523f',
  redDark: '#b23425',
  blue: '#5aa9e6',
  blueDark: '#3a7fbf',
  steel: '#a3b2cc',
  night: '#3a4270',
  nightDark: '#262d55',
  wood: '#c58a52',
  woodDark: '#966435',
} as const

// ---------------------------------------------------------------------------
// Policy badges — one strong silhouette each, so they still read at 16px.
// ---------------------------------------------------------------------------

export function policyAuto(): ReactElement {
  return (
    <Shield tone={F.blue} toneDark={F.blueDark}>
      <g transform="translate(32 33)">
        <rect x="-17" y="-2" width="34" height="10" rx="4" fill={F.cream} />
        <rect x="-8" y="-11" width="18" height="10" rx="3" fill={F.cream} />
        <circle cx="-9" cy="9" r="4.4" fill={F.blueDark} />
        <circle cx="9" cy="9" r="4.4" fill={F.blueDark} />
        <circle cx="-9" cy="9" r="1.9" fill={F.cream} />
        <circle cx="9" cy="9" r="1.9" fill={F.cream} />
      </g>
    </Shield>
  )
}

export function policyHome(): ReactElement {
  return (
    <Shield tone={F.wood} toneDark={F.woodDark}>
      <g transform="translate(32 34)">
        <path d="M-16 2 0-13 16 2V16H-16Z" fill={F.cream} />
        <rect x="-4" y="4" width="8" height="12" fill={F.woodDark} />
      </g>
    </Shield>
  )
}

export function policyLife(): ReactElement {
  return (
    <Shield tone={F.red} toneDark={F.redDark}>
      <path d="M32 45.8C12.5 30.8 19.25 17 32 26.9 44.75 17 51.5 30.8 32 45.8Z" fill={F.cream} />
    </Shield>
  )
}

// ---------------------------------------------------------------------------
// Places — the bank, the insurance office, the trading floor.
// ---------------------------------------------------------------------------

export function bankVisit(): ReactElement {
  return (
    <g>
      <path d="M4 26 32 8 60 26Z" fill={F.gold} />
      <path d="M32 8 60 26H32Z" fill={F.goldDark} />
      <rect x="3" y="24" width="58" height="5" rx="1" fill={F.goldDark} />
      <rect x="8" y="29" width="48" height="27" fill={F.paper} />
      <rect x="32" y="29" width="24" height="27" fill={F.paperEdge} opacity="0.35" />
      <g fill={F.cream}>
        <rect x="12" y="31" width="6" height="25" />
        <rect x="23" y="31" width="6" height="25" />
        <rect x="35" y="31" width="6" height="25" />
        <rect x="46" y="31" width="6" height="25" />
      </g>
      <g fill={F.steel} opacity="0.5">
        <rect x="15.4" y="31" width="2.6" height="25" />
        <rect x="26.4" y="31" width="2.6" height="25" />
        <rect x="38.4" y="31" width="2.6" height="25" />
        <rect x="49.4" y="31" width="2.6" height="25" />
      </g>
      <rect x="2" y="56" width="60" height="4" rx="1" fill={F.wood} />
      <rect x="0" y="60" width="64" height="4" rx="1" fill={F.woodDark} />
      <Coin x={49} y={16} r={6} />
    </g>
  )
}

export function insuranceOffice(): ReactElement {
  return (
    <g>
      <rect x="9" y="14" width="46" height="42" fill={F.steel} />
      <rect x="32" y="14" width="23" height="42" fill="#74839f" />
      <rect x="7" y="11" width="50" height="5" rx="1.5" fill={F.night} />
      <g fill={F.cream}>
        <rect x="14" y="21" width="8" height="8" rx="1" />
        <rect x="42" y="21" width="8" height="8" rx="1" />
        <rect x="14" y="34" width="8" height="8" rx="1" />
        <rect x="42" y="34" width="8" height="8" rx="1" />
      </g>
      <path d="M32 16 39 19V27C39 33 36 37 32 39 28 37 25 33 25 27V19Z" fill={F.gold} />
      <path d="M32 16C35.9 16 39 19 39 19V27C39 33 36 37 32 39Z" fill={F.goldDark} />
      <rect x="25" y="46" width="14" height="10" fill={F.nightDark} />
      <rect x="6" y="56" width="52" height="4" rx="1.5" fill={F.wood} />
      <g transform="translate(48 50) rotate(14)">
        <path d="M0-12A10 8 0 0 1 10-4H-10A10 8 0 0 1 0-12Z" fill={F.red} />
        <rect x="-1.4" y="-4" width="2.8" height="14" rx="1.4" fill={F.night} />
      </g>
    </g>
  )
}

export function tradingFloor(): ReactElement {
  return (
    <g>
      <rect x="3" y="6" width="58" height="34" rx="3" fill={F.nightDark} />
      <rect x="6" y="9" width="52" height="28" rx="2" fill={F.night} />
      <g fill={F.green}>
        <rect x="10" y="26" width="5" height="8" />
        <rect x="19" y="20" width="5" height="14" />
        <rect x="28" y="16" width="5" height="18" />
      </g>
      <g fill={F.red}>
        <rect x="37" y="22" width="5" height="12" />
        <rect x="46" y="28" width="5" height="6" />
      </g>
      <path
        d="M9 20l8-6 6 4 9-10"
        stroke={F.gold}
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <rect x="2" y="42" width="60" height="6" rx="1.5" fill={F.wood} />
      <g transform="translate(32 55)">
        <path d="M-9 0A9 7 0 0 1 9 0Z" fill={F.gold} />
        <rect x="-1.6" y="-9" width="3.2" height="9" fill={F.goldDark} />
        <circle cx="0" cy="1" r="1.6" fill={F.goldDark} />
      </g>
    </g>
  )
}
