import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { SettingsSheet } from '../components/SettingsSheet/SettingsSheet'
import { createFakeAudioPort } from '../dev/fakeAudio'
import { AudioProvider } from '../hooks/useAudio'
import { LocaleProvider, useEditionText, useUi } from './LocaleProvider'
import { LOCALE_STORAGE_KEY, detectLocale, readLocale, writeLocale } from './locale'

/**
 * The setting itself: is it reachable, does it take effect, and is it still
 * there tomorrow?
 *
 * The last one is the part worth a test. A preference nobody can find is a
 * preference nobody uses, and a preference the game forgets between sessions
 * is worse than none at all — it asks the same question every time you sit
 * down. The rest of the language work is covered by `ui.test.ts` (nothing
 * missing) and `text.test.ts` (the right entry found); this is the switch.
 */

function TellMe(): React.ReactElement {
  const t = useUi()
  const text = useEditionText('japan')
  return (
    <div>
      <span data-testid="chrome">{t.settings.heading}</span>
      <span data-testid="tile">{text.space('jp-uni-move-in')?.title ?? 'untranslated'}</span>
    </div>
  )
}

describe('the language setting', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('opens in English on a browser that asks for one', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-GB')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-GB'])
    expect(detectLocale()).toBe('en')
  })

  /*
   * Detected rather than defaulted, and only ever into a language the chrome
   * is actually finished in — the guess is not written down, so a device that
   * changes its system language follows it until somebody chooses by hand.
   */
  it('opens in Japanese on a Japanese browser, without being told', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ja-JP', 'en-US'])
    expect(detectLocale()).toBe('ja')
    expect(readLocale()).toBe('ja')
  })

  it('prefers a stored choice over anything the browser has to say', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['ja-JP'])
    writeLocale('en')
    expect(readLocale()).toBe('en')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
  })

  it('ignores a stored value the game does not offer', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US')
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['en-US'])
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'kl')
    expect(readLocale()).toBe('en')
  })

  it('survives storage that throws rather than taking the game down with it', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(() => readLocale()).not.toThrow()
    expect(() => writeLocale('ja')).not.toThrow()
    getItem.mockRestore()
    setItem.mockRestore()
  })

  it('changes the chrome and the board’s own words together, on one press', async () => {
    const user = userEvent.setup()
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <LocaleProvider initial="en">
          <TellMe />
          <SettingsSheet onClose={() => {}} />
        </LocaleProvider>
      </AudioProvider>,
    )

    expect(screen.getByTestId('chrome')).toHaveTextContent('Settings')
    expect(screen.getByTestId('tile')).toHaveTextContent('untranslated')

    await user.click(screen.getByRole('button', { name: '日本語' }))

    // The gear's own heading, and a tile on the Japan board, in the same beat:
    // the chrome catalogue and the edition overlay are both derived from the
    // one piece of state, so neither can be a repaint behind the other.
    expect(screen.getByTestId('chrome')).toHaveTextContent('設定')
    expect(screen.getByTestId('tile')).toHaveTextContent('六畳一間')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('ja')
  })

  it('is reachable from the gear, with every language named in its own words', () => {
    render(
      <AudioProvider audio={createFakeAudioPort()}>
        <LocaleProvider initial="en">
          <SettingsSheet onClose={() => {}} />
        </LocaleProvider>
      </AudioProvider>,
    )
    expect(screen.getByRole('button', { name: 'English' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '日本語' })).toHaveAttribute('aria-pressed', 'false')
  })
})
