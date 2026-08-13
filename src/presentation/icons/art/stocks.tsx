import { type ReactElement, type ReactNode } from 'react'

/**
 * The five companies a player can buy shares in.
 *
 * Each is drawn as a medallion — the same trick a stock certificate or a
 * company seal uses — so the set reads as "five tradeable companies" at a
 * glance, and each medallion carries one bold, instantly-recognisable glyph
 * so a player can find their holding by shape before they read the ticker.
 */

const S = {
  cream: '#fdfaf4',
  ink: '#2b2118',
  gold: '#f3b13c',
  goldDark: '#c9861a',
  green: '#5bc47f',
  greenDark: '#3f9e60',
  red: '#e2523f',
  redDark: '#b23425',
  teal: '#3fc0b0',
  tealDark: '#2a9689',
  night: '#3a4270',
  nightDark: '#262d55',
  purple: '#8f7fd6',
  purpleDark: '#6f5fc0',
  steel: '#a3b2cc',
} as const

/** The shared medallion every stock sits on — a coin, scaled to fill the frame. */
function Seal({
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
      <circle cx="32" cy="34" r="29" fill={toneDark} />
      <circle cx="32" cy="31" r="29" fill={tone} />
      <circle cx="32" cy="31" r="29" fill="none" stroke={toneDark} strokeWidth="2.6" />
      <circle cx="23" cy="20" r="10" fill="rgba(255,255,255,0.16)" />
      {children}
    </g>
  )
}

export function greenEnergy(): ReactElement {
  return (
    <Seal tone={S.green} toneDark={S.greenDark}>
      <g transform="translate(32 34)" fill={S.cream}>
        <rect x="-1.7" y="-3" width="3.4" height="21" rx="1.4" />
        <circle cx="0" cy="-3" r="3" />
        <path d="M0-3 0-22 6-10Z" />
        <path d="M0-3-18 3-7-11Z" />
        <path d="M0-3 16 9 4-9Z" />
      </g>
      <path d="M46 44q-6 4-6 11 7-1 6-11Z" fill={S.cream} opacity="0.85" />
    </Seal>
  )
}

export function noodleChain(): ReactElement {
  return (
    <Seal tone={S.red} toneDark={S.redDark}>
      <g transform="translate(32 36)">
        <path d="M-17 0C-17 9-9 15 0 15S17 9 17 0Z" fill={S.cream} />
        <rect x="-17" y="-1.6" width="34" height="3" fill={S.redDark} />
        <path
          d="M-11-4q3-3 6 0M-2-4q3-3 6 0M7-4q3-3 6 0"
          stroke={S.redDark}
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <path d="M14-8 21-19" stroke={S.cream} strokeWidth="2.4" strokeLinecap="round" />
        <path d="M18-8 25-19" stroke={S.cream} strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <path
        d="M26 14q-3-4 0-8M34 14q-3-4 0-8"
        stroke={S.cream}
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </Seal>
  )
}

export function orbitalFreight(): ReactElement {
  return (
    <Seal tone={S.night} toneDark={S.nightDark}>
      <ellipse
        cx="32"
        cy="31"
        rx="23"
        ry="8"
        fill="none"
        stroke={S.gold}
        strokeWidth="2.2"
        opacity="0.85"
        transform="rotate(-16 32 31)"
      />
      <g transform="translate(32 30)">
        <path d="M0-17C6-17 9-9 9 3 9 10 5 14 0 17-5 14-9 10-9 3-9-9-6-17 0-17Z" fill={S.cream} />
        <path d="M0-17C6-17 9-9 9 3 9 10 5 14 0 17Z" fill={S.steel} />
        <circle cx="0" cy="-1" r="3.2" fill={S.night} />
        <path d="M-9 3-15 12H-6Z" fill={S.red} />
        <path d="M9 3 15 12H6Z" fill={S.red} />
        <path d="M-4 16 0 24 4 16Z" fill={S.gold} />
      </g>
    </Seal>
  )
}

export function robotFarms(): ReactElement {
  return (
    <Seal tone={S.teal} toneDark={S.tealDark}>
      <g transform="translate(24 32)">
        <rect x="-2" y="-16" width="4" height="7" fill={S.cream} />
        <circle cx="0" cy="-18" r="2.6" fill={S.gold} />
        <rect x="-11" y="-9" width="22" height="19" rx="4" fill={S.cream} />
        <circle cx="-5" cy="1" r="2.4" fill={S.tealDark} />
        <circle cx="5" cy="1" r="2.4" fill={S.tealDark} />
        <rect x="-6" y="7" width="12" height="2.6" rx="1.3" fill={S.tealDark} />
      </g>
      <g transform="translate(46 42)">
        <path d="M0 15V-6" stroke={S.goldDark} strokeWidth="2.2" strokeLinecap="round" />
        <path d="M0-6Q-6-3-7 4 0 3 0-6ZM0-6Q6-3 7 4 0 3 0-6ZM0 2Q-6 5-7 12 0 11 0 2ZM0 2Q6 5 7 12 0 11 0 2Z" fill={S.gold} />
      </g>
    </Seal>
  )
}

export function studioPictures(): ReactElement {
  return (
    <Seal tone={S.purple} toneDark={S.purpleDark}>
      <g transform="translate(29 33) rotate(-8)">
        <rect x="-17" y="-4" width="34" height="20" rx="2" fill={S.cream} />
        <path d="M-17-13 17-13 12-4-17-4Z" fill={S.cream} />
        <path d="M-17-13-9-4H-17Z" fill={S.purpleDark} />
        <path d="M-4-13 5-4H-6.5Z" fill={S.purpleDark} />
        <path d="M9-13 17-4H7Z" fill={S.purpleDark} />
      </g>
      <circle cx="49" cy="46" r="7" fill="none" stroke={S.cream} strokeWidth="2.6" />
      <circle cx="49" cy="46" r="2.2" fill={S.cream} />
    </Seal>
  )
}
