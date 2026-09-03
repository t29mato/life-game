import { describe, expect, it } from 'vitest'

import { COMPLETE_UI_LOCALES, EN, uiFor, uiOverlayFor, type UiText } from './ui'
import { OFFERED_LOCALES } from './locale'

/**
 * The compile-time check the catalogue's types cannot do.
 *
 * `UiOverlay` is `Partial` of the English catalogue, and it has to be: a
 * language being written must stay shippable, reading half in English, or
 * nobody starts one. The cost of that is exactly the cost `overlays.test.ts`
 * pays for the board's tiles — a key added to English a year from now leaves
 * every finished language quietly one string short, and the build says
 * nothing.
 *
 * So this walks it, for every locale that *claims* to be finished, and it is
 * deliberately noisy about it: every missing key is collected into one list
 * rather than failing on the first, because the person reading the failure is
 * a translator with a batch of strings to write, not a debugger with one bug.
 */

type Group = keyof UiText

const GROUPS = Object.keys(EN) as Group[]

/** Every `group.key` the English catalogue defines. The list a locale is held to. */
function everyKey(): readonly string[] {
  return GROUPS.flatMap((group) => Object.keys(EN[group]).map((key) => `${group}.${key}`))
}

describe('the UI catalogue', () => {
  it('is not empty, and every group is a flat object of strings and functions', () => {
    expect(GROUPS.length).toBeGreaterThan(0)
    const problems: string[] = []
    for (const group of GROUPS) {
      for (const [key, value] of Object.entries(EN[group])) {
        const kind = typeof value
        if (kind !== 'string' && kind !== 'function') {
          problems.push(`${group}.${key}: ${kind} — a catalogue holds strings and the functions that build them`)
        }
      }
    }
    expect(problems).toEqual([])
  })

  /*
   * Every language on the switcher is a language a player will read the whole
   * game in, so the two lists have to agree: offering one that is not
   * finished is how a half-translated build ships without anybody deciding to.
   * English is the source and needs no overlay, which is why it is exempt.
   */
  it('offers only languages it has finished', () => {
    for (const locale of OFFERED_LOCALES) {
      if (locale === 'en') continue
      expect(COMPLETE_UI_LOCALES).toContain(locale)
    }
  })

  for (const locale of COMPLETE_UI_LOCALES) {
    describe(`the ${locale} catalogue`, () => {
      const overlay = uiOverlayFor(locale)

      it('exists', () => {
        expect(overlay).toBeDefined()
      })

      it('translates every key English defines, and names no key it does not', () => {
        const expected = everyKey()
        const actual = GROUPS.flatMap((group) =>
          Object.keys(overlay?.[group] ?? {}).map((key) => `${group}.${key}`),
        )
        const problems = [
          ...expected.filter((key) => !actual.includes(key)).map((key) => `not translated: ${key}`),
          ...actual.filter((key) => !expected.includes(key)).map((key) => `does not exist: ${key}`),
        ]
        expect(problems).toEqual([])
      })

      /*
       * A translated string where English has a function is the failure mode
       * this catches, and it is a nasty one: it type-checks under `Partial`
       * nowhere near as often as you would hope, and at runtime the call site
       * does `t.x.y(n)` on a string and throws. The arity check beside it
       * catches the quieter version — a translation that forgot one of its
       * arguments and silently drops a number out of a sentence.
       */
      it('builds each key the same way English does', () => {
        const problems: string[] = []
        for (const group of GROUPS) {
          const translated = overlay?.[group] as Record<string, unknown> | undefined
          if (!translated) continue
          for (const [key, value] of Object.entries(EN[group])) {
            const mine = translated[key]
            if (mine === undefined) continue
            if (typeof mine !== typeof value) {
              problems.push(`${group}.${key}: ${typeof mine}, but English is ${typeof value}`)
              continue
            }
            if (typeof value === 'function' && typeof mine === 'function' && mine.length !== value.length) {
              problems.push(`${group}.${key}: takes ${mine.length} arguments, English takes ${value.length}`)
            }
          }
        }
        expect(problems).toEqual([])
      })

      it('says something different from English — a copied catalogue is an untranslated one', () => {
        const ui = uiFor(locale)
        const unchanged = GROUPS.flatMap((group) =>
          Object.entries(EN[group])
            .filter(([key, value]) => {
              if (typeof value !== 'string') return false
              return (ui[group] as Record<string, unknown>)[key] === value
            })
            .map(([key]) => `${group}.${key}`),
        )
        /*
         * A handful legitimately do not change: `Space` and `Enter` are what
         * is printed on the keys, `CPU` is CPU, and a slash is a slash. The
         * allowance is small and named so that a locale that simply pasted
         * English cannot hide inside it.
         */
        expect(unchanged).toEqual([
          'common.cpu',
          'dice.spaceKey',
          'decision.enterKey',
          'decision.spaceKey',
        ])
      })
    })
  }

  it('falls back to English for a locale with no overlay at all', () => {
    expect(uiFor('en')).toBe(EN)
    expect(uiFor('fr').common.close).toBe(EN.common.close)
  })

  it('leaves English untouched when it merges a locale over it', () => {
    uiFor('ja')
    expect(EN.common.close).toBe('Close')
  })
})
