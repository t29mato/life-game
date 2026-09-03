import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import type { EditionId } from '@domain/model/types'
import type { LocaleId } from '@domain/edition/i18n/types'
import { editionFor } from '@domain/edition/registry'
import { editionTextFor, type EditionText } from '@domain/edition/i18n/text'
import { readLocale, writeLocale } from './locale'
import { uiFor, type UiText } from './ui'

/**
 * LIFE JOURNEY — the language the game is currently being read in.
 *
 * One piece of state, and it is genuinely one: everything else — the chrome
 * catalogue, the edition's translated tiles — is derived from it. That is
 * why the whole thing is a single context rather than a `t` prop threaded
 * through forty components, and why nothing below the provider ever has to
 * remember which language it is in.
 *
 * ## Why the default value is a real one
 *
 * `createContext` is given a working English value rather than `undefined`,
 * so a component rendered with no provider around it — which is every unit
 * test in this repo, and a `<TilePopover>` rendered on its own in a story —
 * reads English and works. A hook that throws "must be used within a
 * provider" would have made adding a translated string to a component a
 * breaking change to that component's tests, which is exactly the tax that
 * stops people translating things.
 */
interface LocaleContextValue {
  readonly locale: LocaleId
  readonly setLocale: (locale: LocaleId) => void
  readonly t: UiText
}

const FALLBACK: LocaleContextValue = {
  locale: 'en',
  setLocale: () => {},
  t: uiFor('en'),
}

const LocaleContext = createContext<LocaleContextValue>(FALLBACK)

export interface LocaleProviderProps {
  readonly children: ReactNode
  /** Forces a language, for tests and stories. Otherwise the stored preference. */
  readonly initial?: LocaleId
}

export function LocaleProvider({ children, initial }: LocaleProviderProps): ReactElement {
  const [locale, setLocaleState] = useState<LocaleId>(() => initial ?? readLocale())

  const setLocale = useCallback((next: LocaleId): void => {
    setLocaleState(next)
    writeLocale(next)
  }, [])

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, setLocale, t: uiFor(locale) }),
    [locale, setLocale],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

/** The whole setting: what language, and how to change it. */
export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}

/**
 * The chrome catalogue, in the current language.
 *
 * The hook nearly every component wants. Named `t` at the call site by
 * convention — `const t = useUi()` — so a JSX literal replaced by a lookup
 * stays about as short as it was.
 */
export function useUi(): UiText {
  return useContext(LocaleContext).t
}

/**
 * What one edition's tiles, careers, houses and lanes read as in the current
 * language.
 *
 * Takes the edition id rather than reading it off some ambient game state,
 * because the two screens that need this most are showing an edition that is
 * *not* the one being played: the handbook's country tabs, and the hall of
 * records' finished games. Cheap to call on every render — `editionTextFor`
 * caches per edition and locale.
 */
export function useEditionText(editionId: EditionId | undefined): EditionText {
  const { locale } = useContext(LocaleContext)
  return editionTextFor(editionFor(editionId), locale)
}
