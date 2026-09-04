import { describe, expect, it } from 'vitest'

import { RELEASE_NOTES } from './releaseNotes'

/**
 * The rule in `releaseNotes.ts`'s own header, made enforceable.
 *
 * That header has been rewritten twice now, in opposite directions, and both
 * times the prose ended with an instruction to the future — first "do not say
 * wheel", now "do not say die". A comment cannot stop the next contributor
 * writing "press the die" into a bullet, and the last two sweeps are the
 * proof: the whole file drifted, both ways, before anybody noticed.
 *
 * So the rule lives here instead. The randomiser is the wheel and you spin
 * it; a player scanning their own release history must find exactly one name
 * for the object in front of them, front to back.
 *
 * If the object on screen ever changes again, this test changes with it —
 * the point is not the word "wheel", it is that the record only ever uses
 * one word, and that the word is the one on the table.
 */

/** Every string a player can actually read on the release notes screen. */
function everyLine(): readonly { readonly version: string; readonly text: string }[] {
  return RELEASE_NOTES.flatMap((note) =>
    [...note.whatsNew, ...note.changes, ...note.fixes].map((text) => ({ version: note.version, text })),
  )
}

/**
 * The one line allowed to name the old word, because it *is* the line about
 * the naming: the release that put the wheel back has to be able to say what
 * it put the wheel back from. Named in full rather than pattern-matched, so
 * a second die reference cannot quietly move in beside it.
 */
const NAMES_THE_OLD_WORD =
  'One name per thing, and the name is the wheel: the game says wheel and spin everywhere again — the Handbook, the cards, the log, the tooltip on a tile. Earlier in this same release it had been settled the other way, on the die; the thing on the table changed back, so the words followed it rather than the other way round.'

/* `payroll` and `unroll` are ordinary English that happen to contain "roll". */
const DIE_WORDS = /\b(die|dice|rolls?|rolled|rolling)\b/i

describe('the release notes speak of one randomiser, by one name', () => {
  it('never calls the wheel a die, and never calls a spin a roll', () => {
    const offenders = everyLine()
      .filter(({ text }) => text !== NAMES_THE_OLD_WORD)
      .filter(({ text }) => DIE_WORDS.test(text))
      .map(({ version, text }) => `${version}: ${text}`)

    expect(offenders).toEqual([])
  })

  it('still carries the line that explains the rename, so the reversal is on the record', () => {
    const all = everyLine().map(({ text }) => text)
    expect(all).toContain(NAMES_THE_OLD_WORD)
  })

  it('says wheel and spin where it says anything about the randomiser at all', () => {
    const all = everyLine().map(({ text }) => text)
    expect(all.some((text) => /\bwheel\b/i.test(text))).toBe(true)
    expect(all.some((text) => /\bspins?\b/i.test(text))).toBe(true)
  })
})
