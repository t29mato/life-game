import { Fragment, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactElement } from 'react'
import type { Career, CareerTier, SpaceTone } from '@domain/model/types'
import type { IconName } from '@domain/model/icons'
import type { CurrencySpec, Edition } from '@domain/edition/types'
import { allEditions, DEFAULT_EDITION_ID } from '@domain/edition/registry'
import { hiringPoolFor, ladderPositionOf } from '@domain/edition/lookup'
import { editionDisplayName, formatSalary } from '../../format'
import { BoardLegendList } from '../BoardLegend/BoardLegend'
import { ChunkyButton } from '../ChunkyButton/ChunkyButton'
import { GameIcon } from '../../icons/GameIcon'
import { CareerPlaque } from '../CareerPlaque/CareerPlaque'
import { CAREER_FAMILY, FAMILY_PALETTE, isCareerIcon } from '../CareerPlaque/families'
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
const TURN_STEPS: readonly { readonly title: string; readonly body: string }[] = [
  {
    /*
     * This step used to read "A fork asks twice: pick the road first, then
     * roll again" — which stopped being true when forks went onto the die.
     * Nobody picks a road any more: the first roll picks it, 1-3 one way and
     * 4-6 the other, and the second roll is the distance. Verified against
     * `resolveForkBranch` and `spin` rather than taken on trust, because a
     * handbook that disagrees with the rules is worse than no handbook.
     */
    title: 'Roll the die',
    body: 'Every turn starts with one roll, 1 to 6. A fork takes two: the first picks the road for you — 1 to 3 one way, 4 to 6 the other — and the second is how far down it you drive.',
  },
  {
    title: 'Drive the road',
    body: 'Paydays and milestones you drive past still pay out — each one deals its own card on the way, before you reach where you stop.',
  },
  {
    title: 'Resolve the landing',
    body: 'The tile you stop on plays out: money moves, a die decides something, or a real decision is put in front of you.',
  },
  {
    title: 'Pass the die',
    body: 'Play moves around the table until every pawn has reached retirement — then the scores settle, houses, stocks and LIFE tiles included.',
  },
]

/**
 * The board's tile kinds, written the way `SpaceKind`'s own contract writes
 * them — passed-or-landed for a payday and a milestone, a forced halt for a
 * stop — because that distinction is the one thing about the board a new
 * player cannot see by looking at it.
 */
const TILE_KINDS: readonly {
  readonly name: string
  readonly rule: string
  readonly icon: IconName
  readonly tone: SpaceTone
}[] = [
  {
    name: 'Payday',
    rule: 'Collects your salary whether you land on it or drive straight past it.',
    icon: 'space:payday',
    tone: 'gold',
  },
  {
    name: 'Milestone',
    rule: 'Fires when passed or landed on, and never cuts a big roll short.',
    icon: 'space:wedding-day',
    tone: 'pink',
  },
  {
    name: 'Ordinary tile',
    rule: 'Only does something when your pawn actually stops on it.',
    icon: 'space:lucky-find',
    tone: 'blue',
  },
  {
    name: 'Stop',
    rule: 'Movement always halts here, steps to spare or not — a decision worth weighing is waiting.',
    icon: 'space:house-hunting',
    tone: 'purple',
  },
  {
    name: 'Retirement',
    rule: 'The end of the road. Reaching it retires your pawn; first in takes the biggest bonus.',
    icon: 'space:retirement',
    tone: 'slate',
  },
]

/**
 * The words this game has coined, defined once each. Difficulty is absent on
 * purpose — the title screen already explains it at the moment of choosing,
 * which is the only moment the explanation is worth anything.
 */
const GLOSSARY: readonly { readonly term: string; readonly meaning: string }[] = [
  {
    term: 'Ladder',
    meaning:
      'A trade written as rungs — apprentice, stylist, salon owner. A fair hires you onto the bottom rung; everything above it is climbed at reviews, and the top rungs need the bigger rolls.',
  },
  {
    term: 'A calling',
    meaning:
      'Work with no ladder above it at all. It never climbs, a layoff can never take it, and every review pays a LIFE tile instead of a title.',
  },
  {
    term: 'LIFE tiles',
    meaning:
      'Keepsakes picked up along the road — a marathon, a novel, a rescue dog. Every one is worth real money at the final scoring.',
  },
  {
    term: 'Paid by the die',
    meaning:
      'Some work has good weeks and bad ones. A trade marked this way pays a rate times your roll at each payday instead of a fixed salary — the quoted wage is what it averages.',
  },
  {
    term: 'A degree',
    meaning:
      'College Lane’s prize: tuition up front, and every job fair after graduation deals from the graduate ladders — a higher floor, in exchange for the bill.',
  },
  {
    term: 'Seniority',
    meaning:
      'A layoff costs one rung, never the whole climb. The next fair re-hires you at the level you had earned, less one — even onto a different trade.',
  },
  {
    term: 'The Number',
    meaning:
      'Hold enough cash at the right tile and you may stop working decades early — rolling for what drawing the fund that soon actually costs.',
  },
]

/**
 * The booklet's table of contents: one entry per section, in page order.
 * The labels are shorter than the section headings on purpose — a tab of a
 * real booklet says "Careers", not "The careers of the world".
 */
const CONTENTS: readonly { readonly id: string; readonly label: string }[] = [
  { id: 'manual-turn', label: 'Turns' },
  { id: 'manual-board', label: 'The board' },
  { id: 'manual-careers', label: 'Careers' },
  { id: 'manual-words', label: 'Glossary' },
]

/**
 * The shelf, in the order the title screen's picker offers it: the classic
 * USA game first, then the rest alphabetically by place name — same sort as
 * `TitleScreen`'s `editionOptions`, so the handbook and the picker never
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
}: {
  readonly career: Career
  readonly rung: number
  readonly height: number
  readonly currency: CurrencySpec
}): ReactElement {
  const family = isCareerIcon(career.icon) ? FAMILY_PALETTE[CAREER_FAMILY[career.icon]] : null
  return (
    <article className={styles.careerCard} aria-label={career.title}>
      <div className={styles.careerTop}>
        {isCareerIcon(career.icon) ? (
          <CareerPlaque icon={career.icon} size={62} />
        ) : (
          <GameIcon name={career.icon} size={48} />
        )}
        <div className={styles.careerHead}>
          <span className={styles.careerTitle}>{career.title}</span>
          <span className={`${styles.careerSalary} tabular-num`}>{formatSalary(career.salary, currency)}</span>
          {family ? (
            <span className={styles.familyTag} style={{ '--tag-ink': family.dark } as CSSProperties}>
              {family.label}
            </span>
          ) : null}
        </div>
      </div>
      <p className={styles.careerBlurb}>{career.description}</p>
      {career.isCalling || height > 1 || career.payPerPip ? (
        <div className={styles.careerTags}>
          {career.isCalling ? (
            <span className={`${styles.tag} ${styles.tagCalling}`}>A calling</span>
          ) : height > 1 ? (
            <span className={styles.tag}>
              Rung {rung} of {height}
            </span>
          ) : null}
          {career.payPerPip ? <span className={styles.tag}>Paid by the die</span> : null}
        </div>
      ) : null}
    </article>
  )
}

/** One ladder, entry rung to top, with the climb written on each step. */
function Ladder({
  rungs,
  currency,
}: {
  readonly rungs: readonly Career[]
  readonly currency: CurrencySpec
}): ReactElement {
  return (
    <div className={styles.ladder}>
      {rungs.map((career, index) => (
        <Fragment key={career.id}>
          {index > 0 ? (
            <span className={styles.climb} aria-hidden="true">
              <span className={styles.climbArrow}>→</span>
              {rungs[index - 1]?.promotionSpin ? (
                <span className={styles.climbNote}>on a {rungs[index - 1]!.promotionSpin}+</span>
              ) : null}
            </span>
          ) : null}
          <CareerCard career={career} rung={index + 1} height={rungs.length} currency={currency} />
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
const POOLS = [
  { tier: 'basic', label: 'Straight from the fair', hint: 'no degree needed' },
  { tier: 'graduate', label: 'The graduate pool', hint: 'degree required' },
  { tier: 'doctorate', label: 'The doctoral pool', hint: 'doctorate required' },
] as const satisfies readonly { readonly tier: CareerTier; readonly label: string; readonly hint: string }[]

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
  const editions = editionShelf()
  // The catalogue shows one country at a time — five full catalogues stacked
  // was the wall of paper this screen used to be. The shelf's first edition
  // (the classic USA game) is the one a first-time reader means by default.
  const [shownEditionId, setShownEditionId] = useState<string>(editions[0]!.id)
  const shownEdition = editions.find((edition) => edition.id === shownEditionId) ?? editions[0]!

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
            Back to title
          </ChunkyButton>
        </div>
        <span className={styles.eyebrow}>Everything in the box, explained</span>
        <h1 className={styles.heading} data-text="The Handbook" tabIndex={-1} ref={headingRef}>
          The Handbook
        </h1>
      </header>

      {/* The booklet's thumb tabs: always in reach, one press from any page.
          Sticky so the reader deep in the catalogue can still get out of it. */}
      <nav className={styles.contents} aria-label="Contents">
        {CONTENTS.map((entry) => (
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
          How a turn works
        </h2>
        <ol className={styles.steps}>
          {TURN_STEPS.map((step, index) => (
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
          Reading the board
        </h2>
        <ul className={styles.tileList}>
          {TILE_KINDS.map((kind) => (
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
            player is dealt once before their first roll, kept here for ever
            so "what does the red-and-white stripe mean?" has an answer
            inside the game rather than only in somebody's memory. */}
        <h3 className={styles.subHeading}>What the marks mean</h3>
        <BoardLegendList />
      </section>

      <section className={styles.section} aria-labelledby="manual-careers">
        <h2 className={styles.sectionHeading} id="manual-careers" tabIndex={-1} ref={registerSection('manual-careers')}>
          The careers of the world
        </h2>
        <p className={styles.sectionLede}>
          Every trade on every board, ladder by ladder, one country at a time. A fair only ever hires
          onto the leftmost rung — the rest is climbed.
        </p>
        <div
          className={styles.editionTabs}
          role="tablist"
          aria-label="Pick a country"
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
                {editionDisplayName(edition)}
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
          aria-label={`${editionDisplayName(shownEdition)} careers`}
        >
          <header className={styles.editionHeader}>
            <h3 className={styles.editionName}>{editionDisplayName(shownEdition)}</h3>
            <span className={styles.editionMeta}>
              counts in {shownEdition.currency.symbol} ·{' '}
              {shownEdition.careers.basic.length +
                shownEdition.careers.graduate.length +
                (shownEdition.careers.doctorate?.length ?? 0)}{' '}
              trades
            </span>
          </header>
          {POOLS.map((pool) => {
            const ladders = laddersFor(shownEdition, pool.tier)
            if (ladders.length === 0) return null
            return (
              <div key={pool.label} className={styles.pool}>
                <div className={styles.poolHeader}>
                  <span className={styles.poolLabel}>{pool.label}</span>
                  <span className={styles.poolHint}>{pool.hint}</span>
                </div>
                {ladders.map((rungs) => (
                  <Ladder key={rungs[0]!.id} rungs={rungs} currency={shownEdition.currency} />
                ))}
              </div>
            )
          })}
        </section>
      </section>

      <section className={styles.section} aria-labelledby="manual-words">
        <h2 className={styles.sectionHeading} id="manual-words" tabIndex={-1} ref={registerSection('manual-words')}>
          Words this game uses
        </h2>
        <dl className={styles.glossary}>
          {GLOSSARY.map((entry) => (
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
