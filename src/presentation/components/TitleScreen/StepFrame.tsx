import type { ReactElement, ReactNode } from 'react'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import type { UiIconName } from '../../icons/ui'
import styles from './TitleScreen.module.css'

export interface StepFrameProps {
  /**
   * Where this screen sits in the new-game flow, 1-based, or `null` for a
   * screen that is a door off the title rather than a rung of it (loading a
   * save). A player halfway through a three-step sequence needs to know it is
   * a three-step sequence.
   */
  readonly stepNumber: number | null
  readonly stepCount: number
  readonly heading: string
  /** One line under the heading saying what this screen is asking. */
  readonly lead: string
  readonly onBack: () => void
  /**
   * What Back actually goes back to, spoken aloud. "Back" alone is a button
   * whose destination a screen reader user has to guess at, and this flow has
   * two different destinations depending on where you are in it.
   */
  readonly backLabel: string
  /**
   * The one forward action. Absent on a screen where the choices *are* the
   * forward action (the save slots), which names its own primary instead.
   */
  readonly primary?:
    | {
        readonly label: string
        readonly icon?: UiIconName
        readonly onClick: () => void
      }
    | undefined
  /** Anything that belongs above the forward button — the playtime estimate. */
  readonly aside?: ReactNode
  readonly children: ReactNode
}

/**
 * --- one screen, one decision ----------------------------------------------
 *
 * The chrome every step of the new-game flow wears, so that every step wears
 * exactly the same chrome. Back in the same corner, the progress in the same
 * place, the forward button in the same place at the bottom — which is the
 * whole point of splitting a form into steps. A flow whose Back button moves
 * between screens is a form with extra clicks.
 *
 * Two rules are structural here rather than left to each step to remember:
 *
 * 1. **Back always exists.** It is a required prop, not an optional one, so a
 *    step cannot be written that a player cannot leave.
 * 2. **There is exactly one A button.** `usePrimaryAction` binds Space and
 *    Enter to the forward button and puts focus on it — and because each step
 *    is its own component, mounted alone, the focus lands afresh on every
 *    screen change instead of being left behind on a button that no longer
 *    exists. That is why these are separate components rather than branches
 *    inside one render: the hook's contract is "at most one live at a time",
 *    and mounting is the cheapest way to be certain of it.
 */
export function StepFrame({
  stepNumber,
  stepCount,
  heading,
  lead,
  onBack,
  backLabel,
  primary,
  aside,
  children,
}: StepFrameProps): ReactElement {
  const primaryRef = usePrimaryAction<HTMLButtonElement>(primary !== undefined)

  return (
    <section className={styles.step} aria-label={heading}>
      <div className={styles.stepBar}>
        <ChunkyButton variant="ghost" size="sm" aria-label={backLabel} onClick={onBack}>
          <span aria-hidden="true" className={styles.backArrow}>
            ←
          </span>
          Back
        </ChunkyButton>

        {/* The dots are decoration for the sentence beside them, not a
            second way of saying it — a screen reader gets "Step 2 of 3"
            once, from the text, and never a row of bullets. */}
        {stepNumber === null ? null : (
          <div className={styles.stepProgress}>
            <span className={styles.stepCount}>
              Step {stepNumber} of {stepCount}
            </span>
            <span className={styles.stepDots} aria-hidden="true">
              {Array.from({ length: stepCount }, (_, index) => (
                <span
                  key={index}
                  className={`${styles.stepDot} ${index + 1 === stepNumber ? styles.stepDotOn : ''} ${
                    index + 1 < stepNumber ? styles.stepDotDone : ''
                  }`}
                />
              ))}
            </span>
          </div>
        )}
      </div>

      <header className={styles.stepHead}>
        <h2 className={styles.stepHeading}>{heading}</h2>
        <p className={styles.stepLead}>{lead}</p>
      </header>

      <div className={styles.stepBody}>{children}</div>

      {aside}

      {primary === undefined ? null : (
        <ChunkyButton
          ref={primaryRef}
          variant="primary"
          size="lg"
          fullWidth
          {...(primary.icon === undefined ? {} : { icon: primary.icon })}
          onClick={primary.onClick}
        >
          {primary.label}
        </ChunkyButton>
      )}
    </section>
  )
}
