import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react'
import { motion } from 'framer-motion'
import type { Board, Decision } from '@domain/model/types'
import { GameIcon } from '../../icons/GameIcon'
import { CareerPlaque } from '../CareerPlaque/CareerPlaque'
import { isCareerIcon } from '../CareerPlaque/families'
import { RollTable } from '../RollTable/RollTable'
import { useAudio } from '../../hooks/useAudio'
import { useModalFocusTrap } from '../../hooks/useModalFocusTrap'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import { usePrimaryAction } from '../../hooks/usePrimaryAction'
import { useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
import { TEMPO } from '../../tempo'
import { laneCharacterLabel, previewLane, summarizeLane } from './branchPreview'
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

/** Which of the game's seven questions this card is asking. */
function kindLabel(kind: Decision['kind'], t: UiText): string {
  switch (kind) {
    case 'branch':
      return t.decision.kindBranch
    case 'house':
      return t.decision.kindHouse
    case 'stock':
      return t.decision.kindStock
    case 'insurance':
      return t.decision.kindInsurance
    case 'bank':
      return t.decision.kindBank
    case 'retire':
      return t.decision.kindRetire
    case 'valueSpin':
      return t.decision.kindValueSpin
  }
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
  /*
   * The card's A button is whichever option is standing under the cursor —
   * the first one, until the player browses with the arrow keys. Naming the
   * *first* option is enough for that: once focus has moved to a sibling
   * option, `usePrimaryAction` stands down for it and the press activates
   * the option actually selected, which is exactly the behaviour the key
   * hint below promises.
   */
  const primaryRef = usePrimaryAction<HTMLButtonElement>(!isCpu)
  const t = useUi()
  const cpuName = cpuPlayerName?.trim() || t.decision.theComputer

  /*
   * --- the confirm beat ---------------------------------------------------
   *
   * A press used to go straight through to `onChoose`, and the card was gone
   * in the same frame. For an option that *does* something visible — a house
   * bought, a career taken — the next card covers for that. For "Walk on by"
   * at the bank it does not: nothing changes, so the entire feedback for the
   * press was the card disappearing, which is indistinguishable from the card
   * disappearing for any other reason.
   *
   * So the press is now answered before it is obeyed. The chosen option stays
   * lit; everything else on the card dims and stops taking presses; and only
   * then does the answer go to the store, with `ChoiceToast` carrying it a
   * moment further over the board once play has moved on.
   *
   * `TEMPO.choiceConfirmMs` deliberately survives `prefers-reduced-motion`:
   * the dimming is motion and collapses with everything else, but "did that
   * register?" is not a question a motion preference has an opinion about,
   * and a player who has asked for less animation has asked for *less
   * animation*, not for less certainty.
   */
  const [confirmedId, setConfirmedId] = useState<string | null>(null)
  const onChooseRef = useRef(onChoose)
  onChooseRef.current = onChoose

  useEffect(() => {
    if (confirmedId === null) return
    const timer = window.setTimeout(() => onChooseRef.current(confirmedId), TEMPO.choiceConfirmMs)
    return () => window.clearTimeout(timer)
  }, [confirmedId])

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
          <span className={styles.kind}>{kindLabel(decision.kind, t)}</span>
          <h2 id="decision-prompt" className={styles.prompt}>
            {isCpu ? t.decision.isChoosing(cpuName) : decision.prompt}
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
              {t.decision.thinking}
            </p>
          ) : null}
        </header>

        <div
          className={styles.options}
          role={isCpu ? undefined : 'listbox'}
          aria-label={isCpu ? undefined : decision.prompt}
        >
          {decision.options.map((option, index) => {
            // Only a `branch` decision's option ids are real space ids — walk
            // the lane so choosing one is never a blind guess.
            const lane = decision.kind === 'branch' ? previewLane(board, option.id) : null
            const laneCharacter = lane ? summarizeLane(lane) : null
            const content = (
              <>
                {/* A trade gets its full plaque — an option that offers a job
                    should show the job, not a chip the size of a list row.
                    Everything else keeps the quiet circled icon. */}
                {isCareerIcon(option.icon) ? (
                  <span aria-hidden="true">
                    <CareerPlaque icon={option.icon} size={52} />
                  </span>
                ) : (
                  <span className={styles.optionEmoji} aria-hidden="true">
                    <GameIcon name={option.icon} size={34} />
                  </span>
                )}
                <span className={styles.optionBody}>
                  <span className={styles.optionLabel}>{option.label}</span>
                  {/* Empty where the label and the table under it leave the
                      sentence nothing to add — an option labelled "Roll",
                      above a table of what each face deals, does not also
                      need a line reading "Roll to see which one you take." */}
                  {option.description ? (
                    <span className={styles.optionDescription}>{option.description}</span>
                  ) : null}
                  {/* What each face is actually worth, as rows — see
                      `DecisionOption.table`. Only ever present alongside a
                      real breakdown; `description` above stays the plain-
                      language framing and never repeats a row's own words. */}
                  {option.table && option.table.length > 0 ? (
                    <RollTable rows={option.table} compact />
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
                        <span className={styles.laneTag}>{laneCharacterLabel(laneCharacter, t)}</span>
                      ) : null}
                    </span>
                  ) : null}
                </span>
                {/* The figure large and tabular, its unit quiet beneath it —
                    two fields on the option, so the card never has to pick a
                    number back out of a string to know which is which. */}
                {option.detail ? (
                  <span className={styles.optionDetail}>
                    <span className={styles.optionFigure}>{option.detail}</span>
                    {option.detailUnit ? (
                      <span className={styles.optionUnit}>
                        {t.decision.per(t.format.unit(option.detailUnit))}
                      </span>
                    ) : null}
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

            const isConfirmed = confirmedId === option.id
            const isDimmed = confirmedId !== null && !isConfirmed

            return (
              <button
                key={option.id}
                ref={(el) => {
                  buttonRefs.current[index] = el
                  if (index === 0) primaryRef.current = el
                }}
                type="button"
                role="option"
                aria-selected={isConfirmed}
                className={[
                  styles.option,
                  isConfirmed ? styles.optionConfirmed : '',
                  isDimmed ? styles.optionDimmed : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={{ '--stagger': `${index * 55}ms` } as CSSProperties}
                onFocus={() => audio.playSfx('select')}
                // Disabled from the moment any option is confirmed: the beat
                // below is short, but it is long enough for a second press —
                // on this option or another — and a decision answered twice
                // is a bug the store would have every right to throw over.
                disabled={confirmedId !== null}
                onClick={() => {
                  if (confirmedId !== null) return
                  audio.playSfx('confirm')
                  setConfirmedId(option.id)
                }}
              >
                {content}
              </button>
            )
          })}
        </div>

        {isCpu ? null : (
          // Space earns its place beside Enter here because it now *is* the
          // same button everywhere else in the game — the die, Continue, and
          // this card all answer either key. The hint has to say so, or the
          // consistency is real but invisible.
          <p className={styles.hint}>
            <kbd className={styles.key}>↑</kbd>
            <kbd className={styles.key}>↓</kbd>
            {t.decision.browse} &middot; <kbd className={styles.key}>{t.decision.enterKey}</kbd>{' '}
            {t.decision.or} <kbd className={styles.key}>{t.decision.spaceKey}</kbd>{' '}
            {t.decision.choose}
          </p>
        )}
      </motion.div>
    </div>
  )
}
