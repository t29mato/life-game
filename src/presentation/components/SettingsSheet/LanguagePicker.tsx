import { type ReactElement } from 'react'
import type { LocaleId } from '@domain/edition/i18n/types'
import { useLocale, useUi } from '../../i18n/LocaleProvider'
import { LOCALE_ENDONYMS, OFFERED_LOCALES } from '../../i18n/locale'
import styles from './SettingsSheet.module.css'

/**
 * Which language the game is read in — a row of pills, changing the moment
 * one is pressed.
 *
 * Deliberately not behind a confirm, a reload, or a "restart to apply". The
 * whole point of the request this shipped for is that the language is
 * changeable *at any time*, including with a card on screen and a die in the
 * air: the catalogue is derived state, so switching it repaints the game and
 * nothing else happens. A table that starts in English and discovers halfway
 * through that everyone would rather read Japanese should not have to finish
 * the game first.
 *
 * Each language is written in its own words (`LOCALE_ENDONYMS`) and never
 * translated, because someone looking for their own language is scanning for
 * the word *they* would write — "Japanese" is no help to a reader who cannot
 * read the menu it is sitting in.
 */
export function LanguagePicker(): ReactElement {
  const { locale, setLocale } = useLocale()
  const t = useUi()

  return (
    <div className={styles.setting}>
      <span className={styles.settingLabel}>{t.settings.language}</span>
      <div className={styles.languages} role="group" aria-label={t.settings.languageAria}>
        {OFFERED_LOCALES.map((id: LocaleId) => (
          <button
            key={id}
            type="button"
            lang={id}
            className={`${styles.language} ${id === locale ? styles.languageOn : ''}`}
            aria-pressed={id === locale}
            onClick={() => setLocale(id)}
          >
            {LOCALE_ENDONYMS[id]}
          </button>
        ))}
      </div>
    </div>
  )
}
