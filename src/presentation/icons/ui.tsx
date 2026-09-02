import { type ReactElement } from 'react'

/**
 * Chrome-level marks: dice, save, exit, and the like. These are not the
 * game's illustrated character/scene art (see `GameIcon`) — they are small,
 * single-colour glyphs for buttons and toggles, drawn on a 24×24 grid so they
 * stay crisp at the ~18–20px a button actually renders them at.
 *
 * `currentColor` throughout, so each glyph inherits whatever ink colour its
 * button already uses instead of carrying its own palette.
 */

export type UiIconName =
  | 'dice'
  | 'plus'
  | 'minus'
  | 'zoom-fit'
  | 'rocket'
  | 'folder'
  | 'wallet'
  | 'replay'
  | 'save'
  | 'exit'
  | 'music-on'
  | 'music-off'
  | 'sfx-on'
  | 'sfx-off'
  | 'medal-gold'
  | 'medal-silver'
  | 'medal-bronze'
  | 'ribbon'
  | 'book'

export interface UiIconProps {
  readonly name: UiIconName
  readonly size?: number
  readonly className?: string | undefined
}

function Glyph({ name }: { readonly name: UiIconName }): ReactElement {
  switch (name) {
    case 'dice':
      return (
        <g>
          <rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="8.4" cy="8.4" r="1.6" fill="currentColor" />
          <circle cx="15.6" cy="8.4" r="1.6" fill="currentColor" />
          <circle cx="8.4" cy="15.6" r="1.6" fill="currentColor" />
          <circle cx="15.6" cy="15.6" r="1.6" fill="currentColor" />
          <circle cx="12" cy="12" r="1.6" fill="currentColor" />
        </g>
      )
    case 'plus':
      return (
        <path
          d="M12 4V20M4 12H20"
          stroke="currentColor"
          strokeWidth="2.6"
          strokeLinecap="round"
        />
      )
    case 'minus':
      return (
        <path d="M4 12H20" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      )
    /* Back to fit: four corner brackets closing on the whole map again — the
       same bracket language the board itself uses to mark the space a car is
       standing on, so "frame the lot" reads the same in both places. */
    case 'zoom-fit':
      return (
        <path
          d="M4 9V5.6C4 4.7 4.7 4 5.6 4H9M15 4h3.4c.9 0 1.6.7 1.6 1.6V9M20 15v3.4c0 .9-.7 1.6-1.6 1.6H15M9 20H5.6C4.7 20 4 19.3 4 18.4V15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )
    case 'rocket':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round">
          <path d="M12 3c3 2 4.4 5.6 4 10l-4 4-4-4c-.4-4.4 1-8 4-10Z" />
          <circle cx="12" cy="10.4" r="1.7" fill="currentColor" stroke="none" />
          <path d="M8.4 15 5.6 17.8M15.6 15l2.8 2.8" />
          <path d="M9.4 19.4c0-1.6.6-2.6 1.6-3M14.6 19.4c0-1.6-.6-2.6-1.6-3" />
        </g>
      )
    case 'folder':
      return (
        <path
          d="M3.4 6.6c0-.9.7-1.6 1.6-1.6h4.2l1.8 2h7.6c.9 0 1.6.7 1.6 1.6v9c0 1-.7 1.7-1.6 1.7H5c-.9 0-1.6-.7-1.6-1.7Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinejoin="round"
        />
      )
    case 'wallet':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round">
          <path d="M4 7.6c0-1 .8-1.8 1.8-1.8h11.4c1 0 1.8.8 1.8 1.8v9.4c0 1-.8 1.8-1.8 1.8H5.8c-1 0-1.8-.8-1.8-1.8Z" />
          <path d="M4 10.4h14.6a1.4 1.4 0 0 1 1.4 1.4v2.4a1.4 1.4 0 0 1-1.4 1.4H16a1.9 1.9 0 0 1 0-3.8h2.6" strokeLinecap="round" />
          <circle cx="16" cy="12.6" r="0.9" fill="currentColor" stroke="none" />
        </g>
      )
    case 'replay':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M4.4 12a7.6 7.6 0 1 1 2.3 5.5" />
          <path d="M3.6 16.4 4.3 11.7 9 12.6" />
        </g>
      )
    case 'save':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M4.6 4.6h11l3.8 3.8v11H4.6Z" />
          <path d="M7.4 4.6v5.4h7V4.6" />
          <rect x="7.6" y="13.4" width="8.8" height="5.6" />
        </g>
      )
    case 'exit':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.6 4.4H6a1.6 1.6 0 0 0-1.6 1.6v12a1.6 1.6 0 0 0 1.6 1.6h4.6" />
          <path d="M14.6 8.4 18.6 12l-4 3.6" />
          <path d="M18.2 12H9.8" />
        </g>
      )
    case 'music-on':
      return (
        <g fill="currentColor">
          <path d="M9 5.4v9.4a3 3 0 1 1-1.4-2.5V8L17 6v7.8a3 3 0 1 1-1.4-2.5V6.8Z" />
        </g>
      )
    case 'music-off':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M9 14.8V5.4l8-2v9.4" fill="none" />
          <circle cx="6.6" cy="16.4" r="2.4" fill="none" />
          <circle cx="14.6" cy="14.4" r="2.4" fill="none" />
          <path d="M4 4 20 20" />
        </g>
      )
    case 'sfx-on':
      return (
        <g fill="currentColor">
          <path d="M4 9.6h3.2L11 6.2v11.6l-3.8-3.4H4Z" />
          <path d="M14.6 8.4a5 5 0 0 1 0 7.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M17 6a8.4 8.4 0 0 1 0 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )
    case 'sfx-off':
      return (
        <g fill="currentColor">
          <path d="M4 9.6h3.2L11 6.2v11.6l-3.8-3.4H4Z" />
          <path
            d="M14.6 9.4l4.4 4.4M19 9.4l-4.4 4.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      )
    case 'ribbon':
      return (
        <g>
          <circle cx="12" cy="9.2" r="5" fill="#e0479a" />
          <circle cx="12" cy="9.2" r="5" fill="none" stroke="#b32f76" strokeWidth="1.3" />
          <path d="M8.6 13 6.4 20.4 12 17.6l5.6 2.8L15.4 13Z" fill="#b32f76" />
          <path d="M9.6 9.6 11 11.2 14.6 7.4" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      )
    case 'book':
      return (
        <g fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" strokeLinecap="round">
          <path d="M12 6.2C10.2 4.8 7.4 4.4 4.2 4.8v13.4c3.2-.4 6-.0 7.8 1.4 1.8-1.4 4.6-1.8 7.8-1.4V4.8c-3.2-.4-6 0-7.8 1.4Z" />
          <path d="M12 6.2v13.4" />
        </g>
      )
    case 'medal-gold':
    case 'medal-silver':
    case 'medal-bronze': {
      const tone = name === 'medal-gold' ? '#f3b13c' : name === 'medal-silver' ? '#b9c3cf' : '#c58a52'
      const dark = name === 'medal-gold' ? '#c9861a' : name === 'medal-silver' ? '#8992a0' : '#8a5f2c'
      return (
        <g>
          <path d="M8.4 3.4 5 10.4l3 1.4 3-6.4Z" fill={dark} />
          <path d="M15.6 3.4 19 10.4l-3 1.4-3-6.4Z" fill={dark} />
          <circle cx="12" cy="14" r="6.6" fill={tone} />
          <circle cx="12" cy="14" r="6.6" fill="none" stroke={dark} strokeWidth="1.4" />
          <circle cx="12" cy="14" r="3.4" fill="none" stroke={dark} strokeWidth="1.2" opacity="0.7" />
        </g>
      )
    }
    default:
      return <g />
  }
}

/** Renders a chrome-level UI glyph. Always decorative — pair with visible text. */
export function UiIcon({ name, size = 20, className }: UiIconProps): ReactElement {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <Glyph name={name} />
    </svg>
  )
}
