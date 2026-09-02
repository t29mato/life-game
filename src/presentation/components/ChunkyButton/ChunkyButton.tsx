import { useRef, type ButtonHTMLAttributes, type ReactElement, type Ref } from 'react'
import { useAudio } from '../../hooks/useAudio'
import { UiIcon, type UiIconName } from '../../icons/ui'
import styles from './ChunkyButton.module.css'

export type ChunkyButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ChunkyButtonSize = 'sm' | 'md' | 'lg'

export interface ChunkyButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'size'> {
  readonly variant?: ChunkyButtonVariant
  readonly size?: ChunkyButtonSize
  /** Leading glyph, drawn from the game's own icon set. Purely decorative — hidden from AT. */
  readonly icon?: UiIconName | undefined
  readonly fullWidth?: boolean
  /**
   * The underlying `<button>`, so a caller can name this control as the
   * screen's primary action (`usePrimaryAction`) and have focus and the A
   * button land on it. React 19 passes `ref` as an ordinary prop, so it
   * simply rides along with the rest of the button attributes.
   */
  readonly ref?: Ref<HTMLButtonElement>
}

/**
 * The tactile primitive every other control is built from. Fully rounded,
 * with a darker "lip" underneath via `box-shadow` that collapses on press
 * so the whole button steps down like a real key.
 */
export function ChunkyButton({
  variant = 'primary',
  size = 'md',
  icon,
  fullWidth = false,
  disabled,
  onClick,
  onFocus,
  children,
  type = 'button',
  ...rest
}: ChunkyButtonProps): ReactElement {
  const audio = useAudio()
  const pointerFocusRef = useRef(false)

  return (
    <button
      {...rest}
      type={type}
      disabled={disabled}
      className={[
        styles.button,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={(event) => {
        pointerFocusRef.current = true
        rest.onPointerDown?.(event)
      }}
      onFocus={(event) => {
        if (!pointerFocusRef.current && audio.isSfxEnabled()) {
          audio.playSfx('select')
        }
        pointerFocusRef.current = false
        onFocus?.(event)
      }}
      onClick={(event) => {
        if (disabled) return
        audio.playSfx('confirm')
        onClick?.(event)
      }}
    >
      {icon ? (
        <span className={styles.emoji} aria-hidden="true">
          <UiIcon name={icon} size={18} />
        </span>
      ) : null}
      {children}
    </button>
  )
}
