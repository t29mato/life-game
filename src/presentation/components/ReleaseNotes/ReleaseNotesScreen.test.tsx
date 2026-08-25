import { cleanup, render, screen, within, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { RELEASE_NOTES } from './releaseNotes'
import { ReleaseNotesScreen, type ReleaseNotesScreenProps } from './ReleaseNotesScreen'

function renderReleaseNotes(props: ReleaseNotesScreenProps): RenderResult {
  return render(
    <AudioProvider audio={createFakeAudioPort()}>
      <ReleaseNotesScreen {...props} />
    </AudioProvider>,
  )
}

beforeEach(() => {
  // A previous test's marker, left over from its own screen mounting here.
  history.replaceState(null, '')
})

afterEach(async () => {
  cleanup()
  // `useBackDismiss` defers its pop a tick (see that hook's doc comment); a
  // test that did not explicitly wait for it leaves that `setTimeout(0)`
  // pending. Draining it here, rather than letting it fire during whichever
  // test happens to be running next, keeps a real `history.back()` call
  // from landing on a screen it was never meant for — a stray `popstate`
  // reaching a still-mounted, unrelated screen's own listener is exactly
  // how "back" ended up closing the wrong thing in the first place.
  await new Promise((resolve) => setTimeout(resolve, 0))
})

describe('ReleaseNotesScreen', () => {
  it('shows the heading and every release, newest first', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByRole('heading', { name: 'Release Notes' })).toBeInTheDocument()
    const versions = screen.getAllByText(/^Version /).map((el) => el.textContent)
    expect(versions).toEqual(RELEASE_NOTES.map((note) => `Version ${note.version}`))
  })

  it('shows the current build version, matching package.json via the injected constant', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByText(`Version ${__APP_VERSION__}`)).toBeInTheDocument()
  })

  it('writes for a player, not a developer', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByText(/play against the computer/i)).toBeInTheDocument()
    expect(screen.queryByText(/decideCpuCommand/i)).not.toBeInTheDocument()
  })

  it('groups changes into new, changed and fixed', () => {
    renderReleaseNotes({ onClose: () => {} })
    // Every release repeats these headings, so count rather than expect one:
    // the assertion is that the grouping exists, not that only one release does.
    expect(screen.getAllByText("What's new").length).toBe(
      RELEASE_NOTES.filter((note) => note.whatsNew.length > 0).length,
    )
    expect(screen.getAllByText('Changed').length).toBe(
      RELEASE_NOTES.filter((note) => note.changes.length > 0).length,
    )
    expect(screen.getAllByText('Fixed').length).toBe(
      RELEASE_NOTES.filter((note) => note.fixes.length > 0).length,
    )
  })

  it('leaves out a section a release has nothing to put in', () => {
    // v1.2.1 was a rewrite-only release with nothing new to announce, and an
    // empty "What's new" heading reads as a page that failed to load rather
    // than a release that was entirely rewritten copy.
    renderReleaseNotes({ onClose: () => {} })
    const v121 = screen.getByText('Version v1.2.1').closest('li')
    expect(v121).not.toBeNull()
    expect(within(v121!).queryByText("What's new")).not.toBeInTheDocument()
  })

  it('calls onClose when the back button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderReleaseNotes({ onClose })
    await user.click(screen.getByRole('button', { name: /back to title/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('calls onClose on Escape, keyboard-only', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    renderReleaseNotes({ onClose })
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('focuses the heading on mount so screen readers announce the page', () => {
    renderReleaseNotes({ onClose: () => {} })
    expect(screen.getByRole('heading', { name: 'Release Notes' })).toHaveFocus()
  })

  /**
   * A screen with no history entry of its own let the browser's back
   * button (or an OS back gesture) fall straight through to whatever page
   * came before the game — closing the notes was never the effect, leaving
   * the game entirely was. This is the fix, exercised end to end rather
   * than just at the hook.
   */
  it('closes on the browser back button, not just the in-screen one', () => {
    const onClose = vi.fn()
    renderReleaseNotes({ onClose })

    window.dispatchEvent(new PopStateEvent('popstate'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
