import { useRef, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { Board, Decision } from '@domain/model/types'
import { GameIcon } from '../../icons/GameIcon'
import { useAudio } from '../../hooks/useAudio'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { LANE_CHARACTER_LABEL, previewLane, summarizeLane } from './branchPreview'
import styles from './DecisionModal.module.css'

export interface DecisionModalProps {
  readonly decision: Decision
  readonly board: Board
  readonly onChoose: (optionId: string) => void
  /**
   * True while a computer-controlled seat is taking this decision. The card
   * becomes a read-only "thinking" display instead of a prompt: options are
   * not focusable or clickable, the keyboard hint disappears, and the focus
   * trap does not engage so a keyboard user is never stranded inside it.
   */
  readonly isCpu?: boolean
  /**
   * The active player's display name, used to phrase the CPU notice (e.g.
   * "Jordan is choosing…"). Optional — falls back to generic phrasing when
   * omitted, so the card still reads correctly without it.
   */
  readonly cpuPlayerName?: string
}

const KIND_LABEL: Record<Decision['kind'], string> = {
  branch: 'Fork in the road',
  house: 'House hunting',
  stock: 'Trading floor',
  insurance: 'Insurance office',
  bank: 'The bank',
  retire: 'The number',
  valueSpin: 'The die',
}

/**
 * Splits `"$40,000/payday"` into the figure and its unit so the number can be
 * set large and tabular while the unit stays quiet. A plain `"$250,000"`
 * yields no unit.
 */
function splitDetail(detail: string): { readonly figure: string; readonly unit: string | null } {
  const slash = detail.indexOf('/')
  if (slash === -1) return { figure: detail.trim(), unit: null }
  return { figure: detail.slice(0, slash).trim(), unit: detail.slice(slash + 1).trim() }
}

/**
 * The modal shown while `phase === 'awaitingDecision'`. Options are big,
 * pickable cards — arrow-key navigable, Enter/Space (native button
 * behaviour) confirms.
 */
export function DecisionModal({
  decision,
  board,
  onChoose,
  isCpu = false,
  cpuPlayerName,
}: DecisionModalProps): ReactElement {
  const audio = useAudio()
  // No `onEscape`: a pending decision has no valid "cancel" state.
  const containerRef = useModalFocusTrap<HTMLDivElement>()
  const reduceMotion = usePrefersReducedMotion()
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([])
  const cpuName = cpuPlayerName?.trim() || 'The computer'

  const focusOption = (index: number): void => {
    const count = decision.options.length
    const clamped = ((index % count) + count) % count
    buttonRefs.current[clamped]?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const currentIndex = buttonRefs.current.findIndex((el) => el === document.activeElement)
    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      event.preventDefault()
      focusOption(currentIndex === -1 ? 0 : currentIndex + 1)
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      event.preventDefault()
      focusOption(currentIndex === -1 ? 0 : currentIndex - 1)
    }
  }

  const entrance = reduceMotion
    ? { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, scale: 0.86, y: 34 },
        animate: { opacity: 1, scale: 1, y: 0 },
        transition: { type: 'spring' as const, stiffness: 380, damping: 26, mass: 0.9 },
      }

  return (
    <div className={styles.backdrop}>
      <motion.div
        // In CPU mode nothing inside is operable, so the container never
        // receives a ref — the focus trap's effect bails out on a null
        // container and never engages, leaving a keyboard user free to tab
        // past the card instead of being stranded inside it.
        ref={isCpu ? undefined : containerRef}
        className={styles.card}
        role="dialog"
        aria-modal={isCpu ? undefined : true}
        aria-labelledby="decision-prompt"
        onKeyDown={isCpu ? undefined : handleKeyDown}
        initial={entrance.initial}
        animate={entrance.animate}
        transition={entrance.transition}
      >
        <header className={styles.header}>
          <span className={styles.kind}>{KIND_LABEL[decision.kind]}</span>
          <h2 id="decision-prompt" className={styles.prompt}>
            {isCpu ? `${cpuName} is choosing…` : decision.prompt}
          </h2>
          {isCpu ? (
            // role="status" is an implicit polite live region, so its
            // appearance is announced to assistive tech even though focus
            // never moves into the card.
            <p className={styles.cpuStatus} role="status">
              <span className={styles.thinkingDots} aria-hidden="true">
                <span className={styles.dot} />
                <span className={styles.dot} />
                <span className={styles.dot} />
              </span>
              Thinking it over — no input needed.
            </p>
          ) : null}
        </header>

        <div
          className={styles.options}
          role={isCpu ? undefined : 'listbox'}
          aria-label={isCpu ? undefined : decision.prompt}
        >
          {decision.options.map((option, index) => {
            const detail = option.detail ? splitDetail(option.detail) : null
            // Only a `branch` decision's option ids are real space ids — walk
            // the lane so choosing one is never a blind guess.
            const lane = decision.kind === 'branch' ? previewLane(board, option.id) : null
            const laneCharacter = lane ? summarizeLane(lane) : null
            const content = (
              <>
                <span className={styles.optionEmoji} aria-hidden="true">
                  <GameIcon name={option.icon} size={34} />
                </span>
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  <span className={styles.optionDescription}>{option.description}</span>
                  {/* What each face is actually worth, as rows — see
                      `DecisionOption.table`. Only ever present alongside a
                      real breakdown; `description` above stays the plain-
                      language framing and never repeats a row's own words. */}
                  {option.table && option.table.length > 0 ? (
                    <table className={styles.optionTable}>
                      <thead>
                        <tr>
                          <th scope="col">Roll</th>
                          <th scope="col">Outcome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {option.table.map((row) => (
                          <tr key={row.range}>
                            <td>{row.range}</td>
                            <td>{row.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                  {lane && lane.length > 0 ? (
                    <span className={styles.lanePreview}>
                      <span className={styles.laneIcons} aria-hidden="true">
                        {lane.map((space) => (
                          <span
                            key={space.id}
                            className={styles.laneIcon}
                            style={
                              {
                                '--lane-tone-bg': `var(--tone-${space.tone}-bg)`,
                                '--lane-tone-edge': `var(--tone-${space.tone}-edge)`,
                              } as CSSProperties
                            }
                          >
                            <GameIcon name={space.icon} size={16} />
                          </span>
                        ))}
                      </span>
                      {laneCharacter ? (
                        <span className={styles.laneTag}>{LANE_CHARACTER_LABEL[laneCharacter]}</span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
                {detail ? (
                  <span className={styles.optionDetail}>
                    <span className={styles.optionFigure}>{detail.figure}</span>
                    {detail.unit ? <span className={styles.optionUnit}>per {detail.unit}</span> : null}
                  </span>
                ) : !isCpu ? (
                  <span className={styles.optionChevron} aria-hidden="true">
                    ›
                  </span>
                ) : null}
              </>
            )

            if (isCpu) {
              // A plain, non-focusable, non-clickable div — `pointer-events:
              // none` in CSS backs this up so no hover affordance can leak
              // through even from a stray mouse move.
              return (
                <div
                  key={option.id}
                  className={`${styles.option} ${styles.optionCpu}`}
                  style={{ '--stagger': `${index * 55}ms` } as CSSProperties}
                >
                  {content}
                </div>
              )
            }

            return (
              <button
                key={option.id}
                ref={(el) => {
                  buttonRefs.current[index] = el
                }}
                type="button"
                role="option"
                aria-selected="false"
                className={styles.option}
                style={{ '--stagger': `${index * 55}ms` } as CSSProperties}
                onFocus={() => audio.playSfx('select')}
                onClick={() => {
                  audio.playSfx('confirm')
                  onChoose(option.id)
                }}
              >
                {content}
              </button>
            )
          })}
        </div>

        {isCpu ? null : (
          <p className={styles.hint}>
            <kbd className={styles.key}>↑</kbd>
            <kbd className={styles.key}>↓</kbd>
            to browse &middot; <kbd className={styles.key}>Enter</kbd> to choose
          </p>
        )}
      </motion.div>
    </div>
  )
}
