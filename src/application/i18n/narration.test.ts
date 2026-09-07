import { describe, expect, it } from 'vitest'

import { EN, type NarrationText } from './en'
import { COMPLETE_NARRATION_LOCALES, narrationFor, narrationOverlayFor } from './text'

/**
 * The compile-time check the catalogue's types cannot do.
 *
 * `NarrationOverlay` is `Partial` of the English catalogue, and it has to be:
 * a language being written must stay shippable, reading half in English, or
 * nobody starts one. The cost of that is the cost `ui.test.ts` and
 * `overlays.test.ts` both pay — a key added to English a year from now leaves
 * every finished language quietly one string short, and the build says
 * nothing.
 *
 * So this walks it, for every locale that *claims* to be finished, and it is
 * deliberately noisy: every missing key is collected into one list rather than
 * failing on the first, because the person reading the failure is a translator
 * with a batch of strings to write.
 */

type Group = keyof NarrationText

const GROUPS = Object.keys(EN) as Group[]

/** Every `group.key` the English catalogue defines. The list a locale is held to. */
function everyKey(): readonly string[] {
  return GROUPS.flatMap((group) => Object.keys(EN[group]).map((key) => `${group}.${key}`))
}

describe('the narration catalogue', () => {
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

  for (const locale of COMPLETE_NARRATION_LOCALES) {
    describe(`the ${locale} catalogue`, () => {
      const overlay = narrationOverlayFor(locale)

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
       * A translated string where English has a function type-checks under
       * `Partial` far more often than you would hope, and at runtime the call
       * site does `say.x.y(n)` on a string and throws. The arity check beside
       * it catches the quieter version: a translation that forgot one of its
       * arguments and silently drops a name or an amount out of a sentence.
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
        const merged = narrationFor(locale)
        const unchanged = GROUPS.flatMap((group) =>
          Object.entries(EN[group])
            .filter(([key, value]) => {
              if (typeof value !== 'string') return false
              return (merged[group] as Record<string, unknown>)[key] === value
            })
            .map(([key]) => `${group}.${key}`),
        )
        // Nothing in this catalogue is a key cap or an acronym, so nothing
        // here is legitimately identical to its English.
        expect(unchanged).toEqual([])
      })

      /*
       * Every varying string is a function, and a function is free to ignore
       * the arguments it was handed — which is how a translation quietly drops
       * a player's name or a figure out of a sentence and still passes every
       * other check here. So each one is called with distinctive stand-ins and
       * the result is read back for them.
       *
       * A few arguments legitimately do not appear: an English-only opener
       * (`format.raiseByPeriod`'s adjective), a count a language spells with a
       * counter word rather than a numeral, a plural that collapses. Those are
       * named, one by one, so the exemption cannot quietly grow.
       */
      it('spends the arguments it is given', () => {
        const IGNORED: Readonly<Record<string, readonly number[]>> = {
          // Japanese builds a raise off the period noun (月給), never off the
          // edition's English adjective ("Monthly").
          'format.raiseByPeriod': [0],
          // 「◯回ぶん」 is dropped entirely for a single payday, which is the
          // ordinary case and the one this probe exercises.
          'payday.passedSalaryLog': [1],
          'payday.passedCasualLog': [1],
          'payday.passedUnsteadyLog': [1],
        }
        const problems: string[] = []
        for (const group of GROUPS) {
          for (const [key, value] of Object.entries(EN[group])) {
            if (typeof value !== 'function') continue
            const path = `${group}.${key}`
            const translated = (narrationFor(locale)[group] as Record<string, unknown>)[key]
            if (typeof translated !== 'function') continue
            const probes = probeArguments(value.length, path)
            let out: unknown
            try {
              out = (translated as (...args: unknown[]) => unknown)(...probes.values)
            } catch (error) {
              problems.push(`${path}: threw ${String(error)}`)
              continue
            }
            const rendered = String(out)
            probes.needles.forEach((needle, index) => {
              if (IGNORED[path]?.includes(index)) return
              if (!rendered.includes(needle)) {
                problems.push(`${path}: argument ${index} never reaches the sentence`)
              }
            })
          }
        }
        expect(problems).toEqual([])
      })
    })
  }

  it('falls back to English for a locale with no overlay at all', () => {
    expect(narrationFor('en')).toBe(EN)
    expect(narrationFor('fr').bank.declineLabel).toBe(EN.bank.declineLabel)
  })

  it('leaves English untouched when it merges a locale over it', () => {
    narrationFor('ja')
    expect(EN.roll.breaksEven).toBe('Breaks even')
  })
})

/**
 * Stand-ins distinctive enough to find in a finished sentence.
 *
 * A marker string for every argument, whatever the declared type: a template
 * literal stringifies anything, and a numeric comparison against a marker
 * simply takes its other branch, which is a branch the sentence still has to
 * spend the argument in. Three entries genuinely cannot take a string — the
 * two that join a list, and the ones that switch on a closed union — so those
 * are named rather than guessed at, because a probe of the wrong shape would
 * be testing the probe rather than the translation.
 */
function probeArguments(arity: number, path: string): { values: unknown[]; needles: string[] } {
  if (path === 'insurance.policyLabel' || path === 'insurance.policyInline' || path === 'insurance.coverNote') {
    return { values: ['home'], needles: [] }
  }
  if (path === 'insurance.hazard') return { values: ['fire'], needles: [] }
  if (path === 'turn.welcomeLog') return { values: [['ZQA', 'ZQB']], needles: ['ZQA', 'ZQB'] }
  if (path === 'payday.spinList') return { values: [[41, 52]], needles: ['41', '52'] }

  const values: unknown[] = []
  const needles: string[] = []
  for (let index = 0; index < arity; index += 1) {
    const token = `ZQ${String.fromCharCode(65 + index)}`
    values.push(token)
    needles.push(token)
  }
  return { values, needles }
}
