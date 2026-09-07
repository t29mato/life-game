import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * The fitness function that keeps this from regressing.
 *
 * `narration.test.ts` guards the catalogue: every key English defines, every
 * finished language answers. That is exactly half the problem, and it is the
 * half that was never the failure mode. The other half is a developer adding a
 * tile next month and typing the sentence straight into `applyEffect.ts`,
 * where no catalogue covers it, no test names it, and the Japanese build
 * silently grows one more English line. That is precisely how the engine ended
 * up with three hundred and some of them.
 *
 * So this reads the application layer's own source and fails on any English
 * prose it finds outside the catalogue. It is the same trick `architecture.
 * test.ts` uses to keep layers apart, aimed at words instead of imports, and
 * the same trick `overlays.test.ts` uses to catch a tile added and never
 * translated.
 *
 * ## What counts as prose
 *
 * A string literal with two or more Latin words in it, or a single
 * Capitalised word — which is what a label looks like. Deliberately crude,
 * because the failure it exists to catch is crude: somebody wrote a sentence.
 * Three things are exempt by *shape* rather than by name, because naming every
 * one of them would be a list nobody maintains:
 *
 * - **Ids.** `space:payday`, `bank-take-loan`, `player-1`. Never read aloud.
 * - **Developer-facing text.** Anything on a line that throws or logs to the
 *   console: a message for whoever is reading a stack trace, not for a player.
 * - **Comments.** Stripped before the scan. The prose in this codebase is
 *   mostly comments, and comments are for us.
 *
 * Everything else has to be either in the catalogue or in `ALLOWED` below, with
 * a reason. A short allowlist is the point: it is the honest list of what is
 * still English, and it is meant to be read.
 */

const APPLICATION = join(process.cwd(), 'src', 'application')
const CATALOGUE = join(APPLICATION, 'i18n')
const FIXTURES = join(APPLICATION, 'testing')

/**
 * English the engine still writes, and why each one is not a translation bug.
 *
 * Every entry here is a deliberate exemption, not a backlog. A string that
 * *should* be translated belongs in `en.ts` instead — adding it here to quiet
 * the test is the one thing this file exists to prevent.
 */
const ALLOWED: Readonly<Record<string, string>> = {
  // Stored in the hall of records rather than shown from a live catalogue: a
  // record is written once and read back in whatever language the player is
  // in later, so translating it at write time would freeze the wrong one in.
  Nobody: 'a persisted record field, not a rendered sentence',
}

type Finding = { readonly file: string; readonly line: number; readonly text: string }

const collect = (dir: string): string[] => {
  let out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out = out.concat(collect(full))
      continue
    }
    if (/\.tsx?$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

/** Block and line comments, gone. The prose in here is mostly ours to read. */
const withoutComments = (source: string): string =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/[^\n]*/g, '$1')

/**
 * `throw new Error(…)`, gone — however many lines it runs to.
 *
 * A per-line skip was not enough: the engine's longest developer message is a
 * `passedEvents` invariant whose text sits on a line of its own, three lines
 * below the `throw`. Newlines are preserved so the line numbers a failure
 * reports still point at the right place.
 */
function withoutThrows(source: string): string {
  const opener = 'throw new Error('
  let out = ''
  let index = 0
  for (;;) {
    const at = source.indexOf(opener, index)
    if (at === -1) return out + source.slice(index)
    out += source.slice(index, at)
    let depth = 0
    let cursor = at + opener.length - 1
    for (; cursor < source.length; cursor += 1) {
      const char = source[cursor]
      if (char === '(') depth += 1
      else if (char === ')') {
        depth -= 1
        if (depth === 0) break
      }
    }
    const span = source.slice(at, cursor + 1)
    out += span.replace(/[^\n]/g, ' ')
    index = cursor + 1
  }
}

/** Single-quoted, double-quoted and template literals, interpolations included. */
const LITERAL =
  /'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\]|\\.|\$\{(?:[^{}]|\{[^{}]*\})*\})*)`/g

/**
 * An id, an icon key, a composed key — never read aloud.
 *
 * Recognised by shape and in this order: no whitespace, and either a separator
 * or an interpolation in it. The whitespace rule is what keeps this from
 * swallowing sentences — an earlier version keyed only on "starts with an
 * interpolation" and let `${name} rolls the dice and hopes for the best.`
 * straight through, which is exactly the class of string this file exists to
 * catch. The separator rule is what keeps a bare `Payday` on the wrong side of
 * it, since a one-word label is prose and `space:payday` is not.
 */
const isId = (collapsed: string): boolean => {
  if (collapsed.length === 0) return true
  if (/\s/.test(collapsed)) return false
  return /[-_:/.~]/.test(collapsed) && /^[A-Za-z0-9~][A-Za-z0-9~_:/.#$-]*$/.test(collapsed)
}

const isProse = (raw: string): boolean => {
  // An interpolation is a name or a figure, not a word: collapse it so
  // `${a} and ${b}` does not read as three words.
  const collapsed = raw.replace(/\$\{[^}]*\}/g, '~').trim()
  if (isId(collapsed)) return false
  if (collapsed.length < 3) return false
  const words = collapsed.match(/[A-Za-z][A-Za-z'’-]*/g) ?? []
  if (words.length === 0) return false
  if (words.length === 1) return /^[A-Z][a-z]+$/.test(collapsed)
  return true
}

function findingsIn(file: string): Finding[] {
  const found: Finding[] = []
  withoutThrows(withoutComments(readFileSync(file, 'utf8')))
    .split('\n')
    .forEach((line, index) => {
      // A message for whoever is reading a stack trace is not a player-facing
      // sentence, and translating one would make a bug report harder to read.
      if (/console\./.test(line)) return
      // A module specifier, on its own line at the foot of a multi-line import.
      if (/\bfrom\s+['"]/.test(line) || /^\s*(import|export)\s/.test(line)) return
      for (const match of line.matchAll(LITERAL)) {
        const raw = match[1] ?? match[2] ?? match[3] ?? ''
        if (!isProse(raw)) continue
        if (raw in ALLOWED) continue
        found.push({ file: relative(APPLICATION, file), line: index + 1, text: raw })
      }
    })
  return found
}

describe('engine-composed prose', () => {
  /*
   * The whole layer, not just the use cases: a sentence is just as
   * untranslatable when it is typed into a CPU heuristic or a store.
   *
   * Two directories are exempt. `i18n/` is where the sentences live, and
   * `testing/` is scaffolding — a fixture board named "Long Branch" is read by
   * assertions, never by a player, and translating one would only make the
   * test that asserts on it harder to read.
   */
  const files = collect(APPLICATION).filter(
    (file) => !file.startsWith(CATALOGUE) && !file.startsWith(FIXTURES),
  )

  it('has a layer to scan', () => {
    expect(files.length).toBeGreaterThan(10)
  })

  it('lives in the catalogue, never in a use case', () => {
    const problems = files
      .flatMap(findingsIn)
      .map(({ file, line, text }) => `${file}:${line} ${JSON.stringify(text)}`)
    /*
     * If you are reading this because your build just went red: the string
     * named above belongs in `i18n/en.ts` with a Japanese entry beside it in
     * `i18n/ja.ts`. Take its varying parts as arguments — a template literal
     * is English word order, and Japanese does not share it — and call it
     * through `textOf(deps).say`. That is the whole fix, and it takes about a
     * minute; the alternative is a player reading a Japanese card with an
     * English sentence in the middle of it.
     */
    expect(problems).toEqual([])
  })

  it('keeps its allowlist short and explained', () => {
    // A growing allowlist is the failure mode this test cannot see on its own,
    // so the size of it is asserted rather than left to review.
    expect(Object.keys(ALLOWED).length).toBeLessThanOrEqual(4)
    for (const [text, why] of Object.entries(ALLOWED)) {
      expect(why.length, `${text} needs a reason`).toBeGreaterThan(10)
    }
  })
})
