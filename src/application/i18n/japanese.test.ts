import { describe, expect, it } from 'vitest'

import type { GameState, NewGameConfig } from '@domain/model/types'
// `LocaleId` lives with the overlay contract, not in the game model — every
// other importer in the tree reads it from here. This line said `model/types`,
// and two people fixed it independently: the branch's own typecheck was
// failing, and the same line broke again when the language branches met.
import type { LocaleId } from '@domain/edition/i18n/types'
import { editionFor } from '@domain/edition/registry'
import { TRADE_YEAR_STORIES } from '@domain/rules/tradeYear'
import { createGameStore } from '../createGameStore'
import {
  createInMemoryRepository,
  createInMemoryStatsRepository,
  createSeededRandom,
} from '../testing/fakes'
import { gameTextFor } from './text'

/**
 * The end-to-end claim, checked end to end.
 *
 * `narration.test.ts` proves the catalogue is complete and `coverage.test.ts`
 * proves the use cases read from it. Neither proves the *channel* — that a
 * store built with a Japanese locale actually produces Japanese cards and a
 * Japanese log, all the way from `main.tsx`'s supplier down to the sentence a
 * player reads. That is the thing two previous attempts stopped short of
 * building, so it gets its own test rather than being inferred from two
 * others.
 *
 * A whole game is played on a seed, in each language, and every line either
 * side is compared. Whole-game rather than one card because the point is
 * coverage: a tile whose narration somebody forgot to route shows up as one
 * English line in a hundred Japanese ones, which is exactly the half-translated
 * card this work exists to prevent and exactly what a single-card test misses.
 */

const CONFIG: NewGameConfig = {
  players: [
    { name: 'Mato', color: 'red', isCpu: false },
    { name: 'Bo', color: 'blue', isCpu: false },
  ],
}

/** Latin letters in a run of two or more — what an untranslated sentence looks like. */
const ENGLISH_WORDS = /[A-Za-z]{2,}/

/**
 * Names, tickers and the wordmark are Latin in both languages and always will
 * be: a player called Mato is called Mato in Japanese, `LIFE JOURNEY` is a
 * logo, and a ticker is a ticker. Stripped before the scan so they cannot be
 * mistaken for untranslated prose.
 */
/**
 * The one narration this channel cannot reach, named rather than skipped.
 *
 * A year in the trade is told by a vignette the *edition* authored
 * (`TRADE_YEAR_STORIES`), and `EditionTranslation` has no slot for one — it
 * has `spaces`, `careers`, `houses`, `stocks`, `lifeTiles`, `lanes` and
 * `economy`, and no `tradeYearStories`. Adding one is a change to the overlay
 * contract plus forty-eight new vignettes per language, which is its own piece
 * of work rather than part of opening the channel.
 *
 * Membership is tested against the table itself, not against a pattern, so
 * this exemption shrinks on its own the day those stories are translated, and
 * a *different* English narration appearing tomorrow still fails.
 */
const UNTRANSLATED_TRADE_YEAR_STORIES = new Set(Object.values(TRADE_YEAR_STORIES).flat())

function withoutProperNouns(line: string): string {
  return line
    .replace(/Mato|Bo\b/g, '')
    .replace(/LIFE JOURNEY/g, '')
    // A stock ticker: two to five capitals, sometimes inside brackets.
    .replace(/\b[A-Z]{2,5}\b/g, '')
}

function playThrough(locale: LocaleId, seed: number): GameState {
  const store = createGameStore({
    random: createSeededRandom(seed),
    repository: createInMemoryRepository(),
    stats: createInMemoryStatsRepository(),
    text: () => gameTextFor(locale),
  })
  store.dispatch({ type: 'startGame', config: CONFIG })
  for (let guard = 0; guard < 20_000; guard += 1) {
    const state = store.getState()
    switch (state.phase) {
      case 'awaitingSpin':
      case 'awaitingDistanceSpin':
        store.dispatch({ type: 'spin' })
        break
      case 'moving':
      case 'passingEvent':
        store.dispatch({ type: 'settle' })
        break
      case 'awaitingDecision':
        store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
        break
      case 'scoring':
        store.dispatch({ type: 'scoreRoll' })
        break
      case 'resolved':
        store.dispatch({ type: 'endTurn' })
        break
      default:
        return state
    }
  }
  throw new Error('playThrough: the game never finished')
}

/*
 * Four seeds rather than one. A single game reaches maybe a third of the
 * board's tiles, and the tiles it misses are exactly the ones a translation
 * gap hides in.
 */
const SEEDS = [1, 7, 42, 108]

describe('a game played in Japanese', () => {
  for (const seed of SEEDS) {
    it(`writes no English into the log (seed ${seed})`, () => {
      const untranslated = playThrough('ja', seed)
        .log.map((entry) => entry.message)
        .filter((message) => ENGLISH_WORDS.test(withoutProperNouns(message)))
      expect(untranslated).toEqual([])
    })
  }

  it('says something different from the same game in English', () => {
    const english = playThrough('en', 42).log.map((entry) => entry.message)
    const japanese = playThrough('ja', 42).log.map((entry) => entry.message)
    // Same seed, same game: the two logs describe the same events line for
    // line, which is what makes "every line differs" a real claim rather than
    // two unrelated games being compared.
    expect(japanese).toHaveLength(english.length)
    expect(japanese.filter((line, index) => line === english[index])).toEqual([])
  })

  it('leaves the money in the edition’s own currency', () => {
    const japanese = playThrough('ja', 42).log.map((entry) => entry.message)
    const withMoney = japanese.filter((line) => line.includes('$'))
    // The USA board counts in dollars in every language — the language a
    // player reads in must never change what the board counts in.
    expect(withMoney.length).toBeGreaterThan(0)
  })

  it('carries the whole card, not only the narration', () => {
    // A half-translated card is worse than an untranslated one, so the notes
    // and the decision a card carries are held to the same bar as its prose.
    let checkedNotes = 0
    let checkedOptions = 0
    const store = createGameStore({
      random: createSeededRandom(3),
      repository: createInMemoryRepository(),
      stats: createInMemoryStatsRepository(),
      text: () => gameTextFor('ja'),
    })
    store.dispatch({ type: 'startGame', config: CONFIG })
    for (let guard = 0; guard < 20_000; guard += 1) {
      const state = store.getState()
      const event = state.lastEvent ?? state.activePassedEvent
      if (event) {
        for (const note of event.notes) {
          checkedNotes += 1
          expect(withoutProperNouns(note)).not.toMatch(ENGLISH_WORDS)
        }
        if (event.narration && !UNTRANSLATED_TRADE_YEAR_STORIES.has(event.narration)) {
          expect(withoutProperNouns(event.narration)).not.toMatch(ENGLISH_WORDS)
        }
      }
      if (state.pendingDecision) {
        expect(withoutProperNouns(state.pendingDecision.prompt)).not.toMatch(ENGLISH_WORDS)
        for (const option of state.pendingDecision.options) {
          checkedOptions += 1
          expect(withoutProperNouns(option.label)).not.toMatch(ENGLISH_WORDS)
          if (option.description) {
            expect(withoutProperNouns(option.description)).not.toMatch(ENGLISH_WORDS)
          }
        }
      }
      switch (state.phase) {
        case 'awaitingSpin':
        case 'awaitingDistanceSpin':
          store.dispatch({ type: 'spin' })
          break
        case 'moving':
        case 'passingEvent':
          store.dispatch({ type: 'settle' })
          break
        case 'awaitingDecision':
          store.dispatch({ type: 'choose', optionId: state.pendingDecision!.options[0]!.id })
          break
        case 'scoring':
          store.dispatch({ type: 'scoreRoll' })
          break
        case 'resolved':
          store.dispatch({ type: 'endTurn' })
          break
        default:
          guard = 20_000
      }
    }
    expect(checkedNotes).toBeGreaterThan(20)
    expect(checkedOptions).toBeGreaterThan(20)
  })

  it('still writes English when nobody asked for a language', () => {
    // The default has to stay English: a caller that never wires the supplier
    // — a balance harness, an old test — reads what it always read.
    const store = createGameStore({
      random: createSeededRandom(42),
      repository: createInMemoryRepository(),
      stats: createInMemoryStatsRepository(),
    })
    store.dispatch({ type: 'startGame', config: CONFIG })
    expect(store.getState().log[0]!.message).toContain('Welcome to LIFE JOURNEY')
  })
})

/**
 * The store asks its supplier on every single command, and it must go on doing
 * so — the language switcher is a mid-turn setting, so the *next* press has to
 * come back in the language just chosen, not in the one the app booted in.
 *
 * That per-press question is also the thing most tempting to optimise away, so
 * it is pinned here rather than left to be inferred. What the store may cache
 * is the *answer's identity*: `gameTextFor` hands back one catalogue object per
 * locale forever, so "same language as last press" is a pointer comparison, and
 * a real switch fails it. Both halves of that bargain are asserted below,
 * because a cache that never misses and a cache that never hits are the same
 * bug wearing different clothes.
 */
describe('the language a press is answered in', () => {
  it('follows a switch made between two presses, mid-game', () => {
    let locale: LocaleId = 'en'
    const store = createGameStore({
      random: createSeededRandom(42),
      repository: createInMemoryRepository(),
      stats: createInMemoryStatsRepository(),
      text: () => gameTextFor(locale),
    })

    store.dispatch({ type: 'startGame', config: CONFIG })
    const opening = store.getState().log[0]!.message
    expect(opening).toContain('Welcome to LIFE JOURNEY')

    // The switcher is thrown between two presses, exactly as a player throws it.
    locale = 'ja'
    const before = store.getState().log.length
    store.dispatch({ type: 'spin' })
    const written = store.getState().log.slice(before).map((entry) => entry.message)

    expect(written.length).toBeGreaterThan(0)
    // Names stay Latin in both languages; everything else on these lines must
    // have moved, or the switch did not reach the sentence.
    for (const line of written) {
      expect(line.replace(/Mato|Bo\b/g, '')).not.toMatch(ENGLISH_WORDS)
    }

    // And back again, so this is a switch rather than a one-way latch.
    locale = 'en'
    const midpoint = store.getState().log.length
    while (store.getState().log.length === midpoint) {
      const state = store.getState()
      store.dispatch(state.phase === 'moving' || state.phase === 'passingEvent' ? { type: 'settle' } : { type: 'spin' })
    }
    expect(store.getState().log.slice(midpoint).some((entry) => ENGLISH_WORDS.test(entry.message))).toBe(true)
  })

  it('hands back the very same catalogue every time a locale is asked for', () => {
    // This is what makes the store's per-press question cheap: the answer is an
    // identity, so an unchanged language is a pointer comparison rather than a
    // rebuilt catalogue. If this ever stopped holding, the store's cache would
    // miss on every press and quietly cost an object per command instead.
    expect(gameTextFor('ja')).toBe(gameTextFor('ja'))
    expect(gameTextFor('en')).toBe(gameTextFor('en'))
    expect(gameTextFor('ja')).not.toBe(gameTextFor('en'))
    expect(gameTextFor('ja').say).toBe(gameTextFor('ja').say)
  })

  it('hands back the very same board words every time an edition is asked for', () => {
    // The other half: `board(edition)` is asked several times while one card is
    // composed and by every card in a game, always about the same board.
    const text = gameTextFor('ja')
    const usa = editionFor('usa')
    const japan = editionFor('japan')
    expect(text.board(usa)).toBe(text.board(usa))
    // Alternating editions must not confuse the memo into answering with the
    // wrong board's words — the failure a one-slot cache is actually prone to.
    expect(text.board(japan).locale).toBe('ja')
    expect(text.board(usa)).toBe(text.board(usa))
    expect(text.board(japan)).toBe(text.board(japan))
    expect(text.board(usa)).not.toBe(text.board(japan))
  })
})
