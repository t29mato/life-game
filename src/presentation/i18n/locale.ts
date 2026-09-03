import type { LocaleId } from '@domain/edition/i18n/types'

/**
 * LIFE JOURNEY — which language the game is being read in.
 *
 * The board's *content* has been translatable since the overlays landed
 * (`domain/edition/i18n`). What was missing was somebody to ask. This is that:
 * one setting, per device, changeable at any moment including mid-turn, and
 * remembered.
 *
 * Per device rather than per save, for the same reason the handoff preference
 * is: it describes who is sitting in front of the screen, not which game they
 * happen to have loaded. Two people can pass one phone back and forth through
 * a saved game and neither of them changes language when the save does.
 */

/** The languages the switcher actually offers, in the order it offers them. */
export const OFFERED_LOCALES: readonly LocaleId[] = ['en', 'ja']

/**
 * What each language calls itself.
 *
 * Endonyms, never translated: a player looking for their own language is
 * scanning for the word *they* would write, and "Japanese" is no help to
 * somebody who cannot read the menu it is sitting in. This is the one list in
 * the game that reads the same in every locale.
 */
export const LOCALE_ENDONYMS: Readonly<Record<LocaleId, string>> = {
  en: 'English',
  ja: '日本語',
  fr: 'Français',
}

export const LOCALE_STORAGE_KEY = 'life-journey:locale'

function isOffered(value: string | null): value is LocaleId {
  return value !== null && (OFFERED_LOCALES as readonly string[]).includes(value)
}

/**
 * The language to open in when nobody has chosen one yet.
 *
 * Guessed from the browser, and only ever guessed *into* a language the game
 * actually ships chrome for — an unrecognised `navigator.language` gets
 * English, which is where the game has always opened. The guess is not
 * written down: it is re-made every session, so a device whose system language
 * changes follows it, and the moment a player picks a language by hand that
 * choice is stored and the guessing stops for good.
 */
export function detectLocale(): LocaleId {
  try {
    const tags = [navigator.language, ...(navigator.languages ?? [])]
    for (const tag of tags) {
      const base = tag?.toLowerCase().split('-')[0]
      if (isOffered(base ?? null)) return base as LocaleId
    }
  } catch {
    // Some embeddings hand back no `navigator` worth reading. English, then.
  }
  return 'en'
}

/**
 * Read once, lazily, and defensively — `localStorage` throws outright in a
 * Safari private window and in any embedding that blocks storage, and a
 * preference about *what language to read in* is not worth taking the game
 * down over.
 */
export function readLocale(): LocaleId {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    if (isOffered(stored)) return stored
  } catch {
    // Fall through to the guess.
  }
  return detectLocale()
}

export function writeLocale(locale: LocaleId): void {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  } catch {
    // A preference that cannot be remembered still has to work for the rest of
    // this session, so the state that called this stands regardless.
  }
}
