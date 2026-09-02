import { type ComponentType, type ReactElement } from 'react'

import { Shaded, Shield } from '../parts'

/**
 * The board's category glyphs — the entire small-size vocabulary.
 *
 * At tile size (~24–32px on screen) a bespoke illustration is a few dozen
 * pixels of mush; a playtest verdict said exactly that. So the board never
 * shows bespoke art. Every subject the domain can name collapses onto one of
 * these seventeen marks (see `../categories.ts`), each designed to a rule:
 *
 *   • **Silhouette first.** Two glyphs must differ in outline, not interior
 *     detail — a coin, an arrow, a triangle, a heart, a pram. Colour is the
 *     second cue, never the only one.
 *   • **One interior mark at most** (the `$`, the `!`, the check), sized to
 *     survive 24px.
 *   • Forms fill the 64×64 frame to its ~6px margin, take the set's standard
 *     down-right rim shade, and use soft corners so they read as printed
 *     board-game symbols rather than UI icons.
 *
 * Colours ride the candy tokens (with their light-scheme values as fallback),
 * so the glyphs warm up with the dark scheme instead of fighting it. There are
 * more categories than candy hues, so hues repeat only across unmistakably
 * different silhouettes.
 */

export type GlyphCategory =
  | 'payday'
  | 'gain'
  | 'expense'
  | 'luck'
  | 'hazard'
  | 'career'
  | 'study'
  | 'grad'
  | 'love'
  | 'child'
  | 'home'
  | 'invest'
  | 'bank'
  | 'insurance'
  | 'life'
  | 'travel'
  | 'retire'

/* ── palette: candy tokens with their daylight values as fallback ────────── */

const SUN = 'var(--candy-sun, #ffc324)'
const SUN_D = 'var(--candy-sun-dark, #cd8d05)'
const MINT = 'var(--candy-mint, #23cf85)'
const MINT_D = 'var(--candy-mint-dark, #0d905b)'
const CORAL = 'var(--candy-coral, #ff5061)'
const CORAL_D = 'var(--candy-coral-dark, #c22a3c)'
const SKY = 'var(--candy-sky, #23b0ff)'
const SKY_D = 'var(--candy-sky-dark, #0a72b8)'
const GRAPE = 'var(--candy-grape, #8f4dff)'
const GRAPE_D = 'var(--candy-grape-dark, #6222c8)'
const TANGERINE = 'var(--candy-tangerine, #ff8c33)'
const TANGERINE_D = 'var(--candy-tangerine-dark, #cb6210)'
const BUBBLEGUM = 'var(--candy-bubblegum, #ff62b0)'
const BUBBLEGUM_D = 'var(--candy-bubblegum-dark, #cd347b)'

/** Leather, paper and ink — the non-candy materials the set already uses. */
const LEATHER = '#c9a06a'
const LEATHER_D = '#8a5f2c'
const PAPER = '#fdfaf4'
const PAPER_D = '#d8d2c4'
const INK = '#2b2338'
const INK_SOFT = '#3b3350'
const STEEL = '#6d7aa8'
const STEEL_D = '#474f73'

/* ── the chunky-silhouette primitive ─────────────────────────────────────── */

/**
 * A silhouette with soft corners and the set's rim shade: the path is drawn
 * twice with a round-joined stroke of its own colour (which fattens and rounds
 * it), the lower copy nudged down-right in the dark tone. Same lighting rule
 * as `Shaded`, tuned for big flat category marks.
 */
function Chunk({
  d,
  fill,
  shade,
  sw = 5,
  dx = 2,
  dy = 2.4,
}: {
  readonly d: string
  readonly fill: string
  readonly shade: string
  readonly sw?: number
  readonly dx?: number
  readonly dy?: number
}): ReactElement {
  return (
    <g strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round">
      <path d={d} fill={shade} stroke={shade} transform={`translate(${dx} ${dy})`} />
      <path d={d} fill={fill} stroke={fill} />
    </g>
  )
}

/* ── the seventeen glyphs ────────────────────────────────────────────────── */

/** Payday: the gold coin, `$` and all. Marks the salary tiles and nothing else. */
function Payday(): ReactElement {
  return (
    <g>
      <Shaded
        d="M32 7a25 25 0 1 1 0 50 25 25 0 1 1 0-50Z"
        fill={SUN}
        shade={SUN_D}
        dx={2}
        dy={2.4}
      />
      <circle cx="24" cy="22" r="6" fill="rgba(255,255,255,0.4)" />
      <g stroke={SUN_D} strokeWidth="4.6" strokeLinecap="round" fill="none">
        <path d="M40 24.5C36.6 20.6 26.6 21 25.4 26 24.2 31 30.4 32 32 32.4 33.6 32.8 39.8 33.8 38.6 38.8 37.4 43.8 27.4 44.2 24 40.3" />
        <path d="M32 16.5V47.5" />
      </g>
    </g>
  )
}

/** Money in: a fat mint arrow, straight up. */
function Gain(): ReactElement {
  return <Chunk d="M32 8 54 31 41.5 31 41.5 54 22.5 54 22.5 31 10 31Z" fill={MINT} shade={MINT_D} />
}

/** Money out: the same arrow upside-down, in coral. */
function Expense(): ReactElement {
  return <Chunk d="M32 56 10 33 22.5 33 22.5 10 41.5 10 41.5 33 54 33Z" fill={CORAL} shade={CORAL_D} />
}

/** A spin, a gamble, a swap of fortunes: the four-leaf clover. */
function Luck(): ReactElement {
  const leaves = (
    <>
      <circle cx="21.5" cy="21.5" r="10.8" />
      <circle cx="42.5" cy="21.5" r="10.8" />
      <circle cx="21.5" cy="42.5" r="10.8" />
      <circle cx="42.5" cy="42.5" r="10.8" />
      <rect x="24" y="24" width="16" height="16" />
    </>
  )
  return (
    <g>
      <g fill={MINT_D} transform="translate(2 2.4)">{leaves}</g>
      <path d="M38 49C41 54 42.6 56.9 47 60" stroke={MINT_D} strokeWidth="5.5" strokeLinecap="round" fill="none" />
      <g fill={MINT}>{leaves}</g>
      <path
        d="M32 23V41M23 32H41"
        stroke={MINT_D}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity="0.4"
      />
    </g>
  )
}

/** A setback — crash, fire, layoff, repair bill. Triangle, exclamation. */
function Hazard(): ReactElement {
  return (
    <g>
      <Chunk d="M32 10 57 51 7 51Z" fill={TANGERINE} shade={TANGERINE_D} sw={7} />
      <rect x="29.3" y="23" width="5.4" height="15" rx="2.7" fill={INK} />
      <circle cx="32" cy="45" r="3.3" fill={INK} />
    </g>
  )
}

/** Jobs, raises, promotions: the leather briefcase. */
function Career(): ReactElement {
  return (
    <g>
      <path
        d="M26 26V21.5a6 6 0 0 1 12 0V26"
        stroke={LEATHER_D}
        strokeWidth="4.6"
        strokeLinecap="round"
        fill="none"
      />
      <Chunk d="M8 27H56V45a7 7 0 0 1-7 7H15a7 7 0 0 1-7-7Z" fill={LEATHER} shade={LEATHER_D} sw={4} />
      <path d="M6 35H58" stroke={LEATHER_D} strokeWidth="2.6" />
      <rect x="26.5" y="31" width="11" height="9" rx="2.5" fill={PAPER} />
      <rect x="30.2" y="34" width="3.6" height="4.4" rx="1.4" fill={LEATHER_D} />
    </g>
  )
}

/** Classes, cramming, new skills: the open textbook. */
function Study(): ReactElement {
  return (
    <g>
      <Chunk
        d="M32 16C25 10.5 14 9.5 6 12.5V47C14 44 25 45 32 50.5 39 45 50 44 58 47V12.5C50 9.5 39 10.5 32 16Z"
        fill={GRAPE}
        shade={GRAPE_D}
        sw={4}
      />
      <path
        d="M32 20.5C26.5 16.5 17.5 15.5 11 17V42.5C17.5 41.5 26.5 42.5 32 46Z"
        fill={PAPER}
      />
      <path
        d="M32 20.5C37.5 16.5 46.5 15.5 53 17V42.5C46.5 41.5 37.5 42.5 32 46Z"
        fill="#e9e3d5"
      />
      <path d="M32 20.5V46" stroke={GRAPE_D} strokeWidth="2.2" />
    </g>
  )
}

/** Graduation day: the mortarboard. Reserved for the milestone. */
function Grad(): ReactElement {
  return (
    <g>
      <path d="M18 27H46V38.5C46 45.5 18 45.5 18 38.5Z" fill={INK} />
      <Chunk d="M32 9 60 22.5 32 36 4 22.5Z" fill={INK_SOFT} shade={INK} sw={4} />
      <circle cx="32" cy="22.5" r="2.6" fill={SUN} />
      <path
        d="M32 22.5C41 24.5 46.5 30 47.5 38"
        stroke={SUN}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="47.5" cy="42" r="4" fill={SUN} />
    </g>
  )
}

/** Rings and wedding bells: the heart. Reserved for the romance beats. */
function Love(): ReactElement {
  return (
    <g>
      <Chunk
        d="M32 54C14 42 7.5 30 11.5 20.5 15 13 26 12.5 32 21 38 12.5 49 13 52.5 20.5 56.5 30 50 42 32 54Z"
        fill={BUBBLEGUM}
        shade={BUBBLEGUM_D}
        sw={4}
      />
      <circle cx="21" cy="24" r="4.5" fill="rgba(255,255,255,0.45)" />
    </g>
  )
}

/** A new arrival: the pram. Reserved for the baby milestones. */
function Child(): ReactElement {
  return (
    <g>
      <path
        d="M52 26C57 20 57.5 15.5 51 12.5"
        stroke={SKY_D}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <Chunk
        d="M10 27C10 14 21 7.5 32 7.5V27H54V32C54 41.5 46.5 48.5 37 48.5H27C17.5 48.5 10 41.5 10 32Z"
        fill={SKY}
        shade={SKY_D}
        sw={4}
      />
      <path d="M32 12.5C24 12.5 16.5 17 15.2 25" stroke="rgba(255,255,255,0.5)" strokeWidth="3.4" strokeLinecap="round" fill="none" />
      <g>
        <circle cx="21" cy="54.5" r="6.5" fill={INK} />
        <circle cx="43" cy="54.5" r="6.5" fill={INK} />
        <circle cx="21" cy="54.5" r="2.2" fill={PAPER} />
        <circle cx="43" cy="54.5" r="2.2" fill={PAPER} />
      </g>
    </g>
  )
}

/** Houses hunted, bought and upgraded. */
function Home(): ReactElement {
  return (
    <g>
      <Chunk d="M14 30H50V53H14Z" fill={PAPER} shade={PAPER_D} sw={4} />
      <Chunk d="M6 31 32 9 58 31Z" fill={CORAL} shade={CORAL_D} sw={4} dx={1.6} dy={2} />
      <rect x="26.5" y="38" width="11" height="17" rx="2.5" fill={STEEL_D} />
      <circle cx="34.5" cy="47" r="1.6" fill={PAPER} />
    </g>
  )
}

/**
 * The bank: pediment, columns, steps.
 *
 * It used to share the rising chart with the stock market, and a playtester
 * landed on a chart tile that opened "The Bank: borrow a loan?" — one picture
 * meaning two things, which is the one thing a board symbol may never do. The
 * chart is the market's now and nothing else's; this is the bank's. The
 * silhouette is deliberately nothing like `Home`'s: a wide stepped block under
 * a shallow pediment, where a house is a narrow box under a steep roof.
 */
function Bank(): ReactElement {
  return (
    <g>
      <Chunk d="M6 27 32 11 58 27Z" fill={STEEL} shade={STEEL_D} sw={4} dx={1.6} dy={2} />
      <Chunk d="M4 47H60V56H4Z" fill={STEEL} shade={STEEL_D} sw={3.5} dx={1.6} dy={2} />
      <g fill={PAPER}>
        <rect x="12" y="29" width="7.5" height="17" rx="1.6" />
        <rect x="24.2" y="29" width="7.5" height="17" rx="1.6" />
        <rect x="36.4" y="29" width="7.5" height="17" rx="1.6" />
        <rect x="48.6" y="29" width="3.4" height="17" rx="1.6" />
      </g>
      <circle cx="32" cy="21" r="3.6" fill={SUN} />
    </g>
  )
}

/** Markets and dividends: bars going the right way. */
function Invest(): ReactElement {
  return (
    <g>
      <Chunk d="M11 37H21V53H11Z" fill={SKY} shade={SKY_D} sw={3.5} />
      <Chunk d="M27 28H37V53H27Z" fill={SKY} shade={SKY_D} sw={3.5} />
      <Chunk d="M43 19H53V53H43Z" fill={SKY} shade={SKY_D} sw={3.5} />
      <path
        d="M11 24 26.5 13.5 37 18.5 51 8.5"
        stroke={MINT}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path d="M55.5 5.5 44.5 7 51.8 15Z" fill={MINT} />
    </g>
  )
}

/** Policies and protection: the shield, checked. */
function Insurance(): ReactElement {
  return (
    <Shield tone={STEEL} toneDark={STEEL_D}>
      <path
        d="M20 32 29 41.5 45 23.5"
        stroke="#ffffff"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Shield>
  )
}

/** Life tiles and the little wins that earn them: the gold star. */
function Life(): ReactElement {
  return (
    <Chunk
      d="M32 9 38.2 25.5 55.8 26.3 42 37.2 46.7 54.2 32 44.5 17.3 54.2 22 37.2 8.2 26.3 25.8 25.5Z"
      fill={SUN}
      shade={SUN_D}
      sw={5}
    />
  )
}

/** Trips and vacations: the paper plane. */
function Travel(): ReactElement {
  return (
    <g>
      <Chunk d="M6 29 58 9 40 55 30.5 37.5Z" fill={SKY} shade={SKY_D} sw={3.5} />
      <path d="M30.5 37.5 58 9 36 32.5Z" fill="rgba(255,255,255,0.45)" />
    </g>
  )
}

/** The sunset lane and the final stop: sun on the horizon. */
function Retire(): ReactElement {
  return (
    <g>
      <g stroke={SUN} strokeWidth="4.2" strokeLinecap="round">
        <path d="M32 17.5V10.5" />
        <path d="M16.6 30.4 11.6 25.4" />
        <path d="M47.4 30.4 52.4 25.4" />
      </g>
      <Shaded d="M14 45.5A18 18 0 0 1 50 45.5Z" fill={SUN} shade={SUN_D} dx={1.8} dy={2} />
      <Chunk d="M8 45.5H56V49.5A4 4 0 0 1 52 53.5H12A4 4 0 0 1 8 49.5Z" fill={STEEL} shade={STEEL_D} sw={3} dx={1.6} dy={2} />
    </g>
  )
}

/** Every category, drawn. This is the board's whole visual vocabulary. */
export const glyphArt: Record<GlyphCategory, ComponentType> = {
  payday: Payday,
  gain: Gain,
  expense: Expense,
  luck: Luck,
  hazard: Hazard,
  career: Career,
  study: Study,
  grad: Grad,
  love: Love,
  child: Child,
  home: Home,
  invest: Invest,
  bank: Bank,
  insurance: Insurance,
  life: Life,
  travel: Travel,
  retire: Retire,
}
