import { Fragment, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react'
import type { Career, CareerTier, SpaceTone } from '@domain/model/types'
import type { IconName } from '@domain/model/icons'
import type { CurrencySpec, Edition } from '@domain/edition/types'
import { allEditions, DEFAULT_EDITION_ID } from '@domain/edition/registry'
import { hiringPoolFor, ladderPositionOf } from '@domain/edition/lookup'
import { editionDisplayName, formatSalary } from '../../format'
import { useLocale, useUi } from '../../i18n/LocaleProvider'
import type { UiText } from '../../i18n/en'
import { editionTextFor, type EditionText } from '@domain/edition/i18n/text'
import { BoardLegendList } from '../BoardLegend/BoardLegend'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { GameIcon } from '../../icons/GameIcon'
import { CareerPlaque } from '../CareerPlaque/CareerPlaque'
import { CAREER_FAMILY, FAMILY_PALETTE, familyLabel, isCareerIcon } from '../CareerPlaque/families'
import { useBackDismiss } from '../../hooks/useBackDismiss'
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion'
import styles from './ManualScreen.module.css'

export interface ManualScreenProps {
  readonly onClose: () => void
}

/**
 * The booklet's own summary of a turn. Deliberately four steps and no more:
 * the game teaches its details tile by tile, and a manual that re-explains
 * every one of them is a manual nobody reads past.
 */
function turnSteps(t: UiText): readonly { readonly title: string; readonly body: string }[] {
  return [
    /*
     * Step one used to read "A fork asks twice: pick the road first, then
     * spin again" — which stopped being true when forks went onto the wheel.
     * Nobody picks a road any more: the first spin picks it, 1-3 one way and
     * 4-6 the other, and the second spin is the distance. Verified against
     * `resolveForkBranch` and `spin` rather than taken on trust, because a
     * handbook that disagrees with the rules is worse than no handbook.
     */
    { title: t.manual.step1Title, body: t.manual.step1Body },
    { title: t.manual.step2Title, body: t.manual.step2Body },
    { title: t.manual.step3Title, body: t.manual.step3Body },
    { title: t.manual.step4Title, body: t.manual.step4Body },
  ]
}

/**
 * The board's tile kinds, written the way `SpaceKind`'s own contract writes
 * them — passed-or-landed for a payday and a milestone, a forced halt for a
 * stop — because that distinction is the one thing about the board a new
 * player cannot see by looking at it.
 */
function tileKinds(t: UiText): readonly {
  readonly name: string
  readonly rule: string
  readonly icon: IconName
  readonly tone: SpaceTone
}[] {
  return [
    { name: t.manual.kindPaydayName, rule: t.manual.kindPaydayRule, icon: 'space:payday', tone: 'gold' },
    {
      name: t.manual.kindMilestoneName,
      rule: t.manual.kindMilestoneRule,
      icon: 'space:wedding-day',
      tone: 'pink',
    },
    {
      name: t.manual.kindOrdinaryName,
      rule: t.manual.kindOrdinaryRule,
      icon: 'space:lucky-find',
      tone: 'blue',
    },
    {
      name: t.manual.kindStopName,
      rule: t.manual.kindStopRule,
      icon: 'space:house-hunting',
      tone: 'purple',
    },
    {
      name: t.manual.kindRetirementName,
      rule: t.manual.kindRetirementRule,
      icon: 'space:retirement',
      tone: 'slate',
    },
  ]
}

/**
 * The words this game has coined, defined once each. Difficulty is absent on
 * purpose — the title screen already explains it at the moment of choosing,
 * which is the only moment the explanation is worth anything.
 */
function glossary(t: UiText): readonly { readonly term: string; readonly meaning: string }[] {
  return [
    { term: t.manual.glossaryLadderTerm, meaning: t.manual.glossaryLadderMeaning },
    { term: t.manual.glossaryCallingTerm, meaning: t.manual.glossaryCallingMeaning },
    { term: t.manual.glossaryTilesTerm, meaning: t.manual.glossaryTilesMeaning },
    { term: t.manual.glossaryPerPipTerm, meaning: t.manual.glossaryPerPipMeaning },
    { term: t.manual.glossaryDegreeTerm, meaning: t.manual.glossaryDegreeMeaning },
    { term: t.manual.glossarySeniorityTerm, meaning: t.manual.glossarySeniorityMeaning },
    { term: t.manual.glossaryNumberTerm, meaning: t.manual.glossaryNumberMeaning },
  ]
}

/**
 * The booklet's table of contents: one entry per section, in page order.
 * The labels are shorter than the section headings on purpose — a tab of a
 * real booklet says "Careers", not "The careers of the world".
 */
function contents(t: UiText): readonly { readonly id: string; readonly label: string }[] {
  return [
    { id: 'manual-turn', label: t.manual.contentsTurns },
    { id: 'manual-board', label: t.manual.contentsBoard },
    { id: 'manual-careers', label: t.manual.contentsCareers },
    { id: 'manual-words', label: t.manual.contentsGlossary },
  ]
}

/**
 * The shelf, in the order the title screen's picker offers it: the classic
 * USA game first, then the rest alphabetically by place name — same sort as
 * `TitleScreen`'s `countryOptions`, so the handbook and the picker never
 * disagree about the order the countries come in.
 */
function editionShelf(): readonly Edition[] {
  return [...allEditions()].sort((a, b) => {
    if (a.id === DEFAULT_EDITION_ID) return b.id === DEFAULT_EDITION_ID ? 0 : -1
    if (b.id === DEFAULT_EDITION_ID) return 1
    return editionDisplayName(a).localeCompare(editionDisplayName(b))
  })
}

/**
 * Every ladder a fair can start somebody on, entry rung first. Built from
 * the hiring pool plus the chain each entry heads, so the grouping can never
 * disagree with what `promotesTo` actually says.
 */
function laddersFor(edition: Edition, tier: CareerTier): readonly (readonly Career[])[] {
  /*
   * The manual lists what a country actually holds, not what a hiring hall
   * would fall back to. `hiringPoolFor` answers a doctoral question with the
   * graduate shelf on an edition that has not written one — right for a fair,
   * which has to deal *something* to a doctor — and here it would print every
   * graduate ladder a second time under a heading the country cannot honour.
   */
  if (tier === 'doctorate' && !edition.careers.doctorate?.length) return []
  return hiringPoolFor(edition, tier).map((entry) => ladderPositionOf(entry.id, edition)?.rungs ?? [entry])
}

/**
 * One trade as the catalogue shows it: the plaque, the name, the money, and
 * the two or three facts a player actually weighs a job by. The rung is told
 * by position — the card sits on its ladder — so the tag only repeats it
 * where a ladder has been wrapped onto a second line and position stops
 * carrying it.
 */
function CareerCard({
  career,
  rung,
  height,
  currency,
  t,
  text,
}: {
  readonly career: Career
  readonly rung: number
  readonly height: number
  readonly currency: CurrencySpec
  readonly t: UiText
  readonly text: EditionText
}): ReactElement {
  const family = isCareerIcon(career.icon) ? CAREER_FAMILY[career.icon] : null
  const palette = family ? FAMILY_PALETTE[family] : null
  const title = text.career(career.id)?.title ?? career.title
  const description = text.career(career.id)?.description ?? career.description
  return (
    <article className={styles.careerCard} aria-label={title}>
      <div className={styles.careerTop}>
        {isCareerIcon(career.icon) ? (
          <CareerPlaque icon={career.icon} size={62} />
        ) : (
          <GameIcon name={career.icon} size={48} />
        )}
        <div className={styles.careerHead}>
          <span className={styles.careerTitle}>{title}</span>
          <span className={`${styles.careerSalary} tabular-num`}>
            {formatSalary(career.salary, currency, t)}
          </span>
          {family && palette ? (
            <span className={styles.familyTag} style={{ '--tag-ink': palette.dark } as CSSProperties}>
              {familyLabel(family, t)}
            </span>
          ) : null}
        </div>
      </div>
      <p className={styles.careerBlurb}>{description}</p>
      {career.isCalling || height > 1 || career.payPerPip ? (
        <div className={styles.careerTags}>
          {career.isCalling ? (
            <span className={`${styles.tag} ${styles.tagCalling}`}>{t.manual.tagCalling}</span>
          ) : height > 1 ? (
            <span className={styles.tag}>{t.manual.tagRung(rung, height)}</span>
          ) : null}
          {career.payPerPip ? <span className={styles.tag}>{t.manual.tagPaidByWheel}</span> : null}
        </div>
      ) : null}
    </article>
  )
}

/** One ladder, entry rung to top, with the climb written on each step. */
function Ladder({
  rungs,
  currency,
  t,
  text,
}: {
  readonly rungs: readonly Career[]
  readonly currency: CurrencySpec
  readonly t: UiText
  readonly text: EditionText
}): ReactElement {
  return (
    <div className={styles.ladder}>
      {rungs.map((career, index) => (
        <Fragment key={career.id}>
          {index > 0 ? (
            <span className={styles.climb} aria-hidden="true">
              <span className={styles.climbArrow}>→</span>
              {rungs[index - 1]?.promotionSpin ? (
                <span className={styles.climbNote}>
                  {t.manual.climbOn(rungs[index - 1]!.promotionSpin!)}
                </span>
              ) : null}
            </span>
          ) : null}
          <CareerCard
            career={career}
            rung={index + 1}
            height={rungs.length}
            currency={currency}
            t={t}
            text={text}
          />
        </Fragment>
      ))}
    </div>
  )
}

/**
 * The shelves, in the order the schooling ladder climbs them.
 *
 * The doctoral one draws nothing at all for an edition that has not written
 * it — `laddersFor` comes back empty and the whole block is skipped — so a
 * country with no grad school on its board simply shows two pools, exactly as
 * this screen always did.
 */
function pools(
  t: UiText,
): readonly { readonly tier: CareerTier; readonly label: string; readonly hint: string }[] {
  return [
    { tier: 'basic', label: t.manual.poolBasicLabel, hint: t.manual.poolBasicHint },
    { tier: 'graduate', label: t.manual.poolGraduateLabel, hint: t.manual.poolGraduateHint },
    { tier: 'doctorate', label: t.manual.poolDoctorateLabel, hint: t.manual.poolDoctorateHint },
  ]
}

/**
 * `phase === 'setup'`, opened from the title screen: the game's own
 * instruction booklet. Its anchor is the career catalogue — every trade in
 * every country, on its family plaque, laid out ladder by ladder, one
 * country's page open at a time — framed by the three short things a booklet
 * owes a first-time player: how a turn works, how to read the board, and
 * what the game's own words mean. A sticky contents bar and the country
 * tabs are what make it a booklet rather than a flyer: you turn to the page
 * you want instead of scrolling past every page before it.
 */
export function ManualScreen({ onClose }: ManualScreenProps): ReactElement {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const sectionRefs = useRef<Record<string, HTMLHeadingElement | null>>({})
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const reduceMotion = usePrefersReducedMotion()
  const { locale } = useLocale()
  const t = useUi()
  const editions = editionShelf()
  // The catalogue shows one country at a time — five full catalogues stacked
  // was the wall of paper this screen used to be. The shelf's first edition
  // (the classic USA game) is the one a first-time reader means by default.
  const [shownEditionId, setShownEditionId] = useState<string>(editions[0]!.id)
  const shownEdition = editions.find((edition) => edition.id === shownEditionId) ?? editions[0]!
  /* The open page's own catalogue. Resolved from the *shown* edition rather
     than from the game being played: the handbook's whole shape is one
     country at a time, and a tab is a different country. */
  const shownText = editionTextFor(shownEdition, locale)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  // Same reasoning as ReleaseNotesScreen: a full screen with no history entry
  // of its own would let a back gesture fall straight out of the game.
  useBackDismiss(onClose)

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === 'Escape') onClose()
  }

  /**
   * A contents button, not an anchor link: a hash navigation would push a
   * history entry of its own on top of the one `useBackDismiss` owns, and a
   * back gesture would then spend itself un-jumping instead of closing the
   * screen. Scrolling by hand keeps history exactly as the hook left it, and
   * moving focus to the heading keeps a keyboard reader's place honest.
   */
  const jumpTo = (id: string): void => {
    const heading = sectionRefs.current[id]
    if (!heading) return
    heading.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' })
    heading.focus({ preventScroll: true })
  }

  const registerSection =
    (id: string) =>
    (el: HTMLHeadingElement | null): void => {
      sectionRefs.current[id] = el
    }

  // The tablist keyboard contract: arrows walk the shelf, Home/End jump to
  // its ends, and the tab that gains focus is the tab that shows — there is
  // no separate "activate" step to explain.
  const handleTabKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    const count = editions.length
    const current = editions.findIndex((edition) => edition.id === shownEdition.id)
    let next: number
    if (event.key === 'ArrowRight') next = (current + 1) % count
    else if (event.key === 'ArrowLeft') next = (current - 1 + count) % count
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = count - 1
    else return
    event.preventDefault()
    setShownEditionId(editions[next]!.id)
    tabRefs.current[next]?.focus()
  }

  return (
    <div className={styles.screen} onKeyDown={handleKeyDown}>
      <header className={styles.masthead}>
        <div className={styles.backRow}>
          <ChunkyButton variant="ghost" size="sm" icon="exit" onClick={onClose}>
            {t.common.backToTitle}
          </ChunkyButton>
        </div>
        <span className={styles.eyebrow}>{t.manual.eyebrow}</span>
        <h1 className={styles.heading} data-text={t.manual.heading} tabIndex={-1} ref={headingRef}>
          {t.manual.heading}
        </h1>
      </header>

      {/* The booklet's thumb tabs: always in reach, one press from any page.
          Sticky so the reader deep in the catalogue can still get out of it. */}
      <nav className={styles.contents} aria-label={t.manual.contentsAria}>
        {contents(t).map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={styles.contentsButton}
            onClick={() => jumpTo(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      <section className={styles.section} aria-labelledby="manual-turn">
        <h2 className={styles.sectionHeading} id="manual-turn" tabIndex={-1} ref={registerSection('manual-turn')}>
          {t.manual.turnHeading}
        </h2>
        <ol className={styles.steps}>
          {turnSteps(t).map((step, index) => (
            <li key={step.title} className={styles.step}>
              <span className={styles.stepNumber} aria-hidden="true">
                {index + 1}
              </span>
              <div className={styles.stepBody}>
                <span className={styles.stepTitle}>{step.title}</span>
                <p className={styles.stepText}>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="manual-board">
        <h2 className={styles.sectionHeading} id="manual-board" tabIndex={-1} ref={registerSection('manual-board')}>
          {t.manual.boardHeading}
        </h2>
        <ul className={styles.tileList}>
          {tileKinds(t).map((kind) => (
            <li key={kind.name} className={styles.tileRow}>
              <span
                className={styles.tileSwatch}
                aria-hidden="true"
                style={
                  {
                    '--swatch-bg': `var(--tone-${kind.tone}-bg)`,
                    '--swatch-edge': `var(--tone-${kind.tone}-edge)`,
                    '--swatch-ink': `var(--tone-${kind.tone}-ink)`,
                  } as CSSProperties
                }
              >
                <GameIcon name={kind.icon} size={22} />
              </span>
              <div className={styles.tileBody}>
                <span className={styles.tileName}>{kind.name}</span>
                <p className={styles.tileRule}>{kind.rule}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* The key to the marks themselves — the same card a first-time
            player is dealt once before their first spin, kept here for ever
            so "what does the red-and-white stripe mean?" has an answer
            inside the game rather than only in somebody's memory. */}
        <h3 className={styles.subHeading}>{t.manual.marksHeading}</h3>
        <BoardLegendList />
      </section>

      <section className={styles.section} aria-labelledby="manual-careers">
        <h2 className={styles.sectionHeading} id="manual-careers" tabIndex={-1} ref={registerSection('manual-careers')}>
          {t.manual.careersHeading}
        </h2>
        <p className={styles.sectionLede}>{t.manual.careersLede}</p>
        <div
          className={styles.editionTabs}
          role="tablist"
          aria-label={t.manual.pickCountry}
          onKeyDown={handleTabKeyDown}
        >
          {editions.map((edition, index) => {
            const selected = edition.id === shownEdition.id
            return (
              <button
                key={edition.id}
                id={`manual-edition-tab-${edition.id}`}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={`manual-edition-panel-${edition.id}`}
                tabIndex={selected ? 0 : -1}
                className={selected ? `${styles.editionTab} ${styles.editionTabActive}` : styles.editionTab}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                onClick={() => setShownEditionId(edition.id)}
              >
                {editionDisplayName(edition, t)}
              </button>
            )
          })}
        </div>
        <section
          key={shownEdition.id}
          id={`manual-edition-panel-${shownEdition.id}`}
          role="tabpanel"
          tabIndex={0}
          className={styles.edition}
          aria-label={t.manual.editionCareers(editionDisplayName(shownEdition, t))}
        >
          <header className={styles.editionHeader}>
            <h3 className={styles.editionName}>{editionDisplayName(shownEdition, t)}</h3>
            <span className={styles.editionMeta}>
              {t.manual.editionMeta(
                shownEdition.currency.symbol,
                shownEdition.careers.basic.length +
                  shownEdition.careers.graduate.length +
                  (shownEdition.careers.doctorate?.length ?? 0),
              )}
            </span>
          </header>
          {pools(t).map((pool) => {
            const ladders = laddersFor(shownEdition, pool.tier)
            if (ladders.length === 0) return null
            return (
              <div key={pool.label} className={styles.pool}>
                <div className={styles.poolHeader}>
                  <span className={styles.poolLabel}>{pool.label}</span>
                  <span className={styles.poolHint}>{pool.hint}</span>
                </div>
                {ladders.map((rungs) => (
                  <Ladder
                    key={rungs[0]!.id}
                    rungs={rungs}
                    currency={shownEdition.currency}
                    t={t}
                    text={shownText}
                  />
                ))}
              </div>
            )
          })}
        </section>
      </section>

      <section className={styles.section} aria-labelledby="manual-words">
        <h2 className={styles.sectionHeading} id="manual-words" tabIndex={-1} ref={registerSection('manual-words')}>
          {t.manual.wordsHeading}
        </h2>
        <dl className={styles.glossary}>
          {glossary(t).map((entry) => (
            <div key={entry.term} className={styles.glossaryRow}>
              <dt className={styles.glossaryTerm}>{entry.term}</dt>
              <dd className={styles.glossaryMeaning}>{entry.meaning}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  )
}
