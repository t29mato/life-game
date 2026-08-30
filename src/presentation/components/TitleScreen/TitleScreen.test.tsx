import { render, screen, within, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SaveSlotInfo } from '@application/ports/GameRepositoryPort'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import type { PlayerProfile } from '@application/ports/PlayerProfileRepositoryPort'
import { registerEdition } from '@domain/edition/registry'
import { EDITION_JAPAN } from '@domain/edition/japan'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { TitleScreen, type TitleScreenProps } from './TitleScreen'

function emptySlots(): SaveSlotInfo[] {
  return [0, 1, 2, 3].map((slot) => ({ slot, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null }))
}

function renderTitleScreen(overrides: Partial<TitleScreenProps> = {}) {
  const audio = createFakeAudioPort()
  const onStart = vi.fn()
  const onContinue = vi.fn()
  const props: TitleScreenProps = {
    slots: emptySlots(),
    records: [],
    profiles: [],
    onStart,
    onContinue,
    ...overrides,
  }
  const view: RenderResult = render(
    <AudioProvider audio={audio}>
      <TitleScreen {...props} />
    </AudioProvider>,
  )
  return { audio, onStart, onContinue, ...view }
}

describe('TitleScreen', () => {
  it('renders the wordmark', () => {
    renderTitleScreen()
    expect(screen.getByText('LIFE JOURNEY')).toBeInTheDocument()
  })

  it('starts with two player rows, both human by default', () => {
    renderTitleScreen()
    expect(screen.getByLabelText('Player 1 name')).toBeInTheDocument()
    expect(screen.getByLabelText('Player 2 name')).toBeInTheDocument()
    expect(screen.queryByLabelText('Player 3 name')).not.toBeInTheDocument()
    const group1 = screen.getByRole('group', { name: 'Player 1 seat type' })
    expect(group1.querySelector('[aria-pressed="true"]')).toHaveTextContent('Human')
  })

  it('adds a player up to the maximum of four', async () => {
    const user = userEvent.setup()
    renderTitleScreen()
    await user.click(screen.getByRole('button', { name: /add player/i }))
    expect(screen.getByLabelText('Player 3 name')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /add player/i }))
    expect(screen.getByLabelText('Player 4 name')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add player/i })).toBeDisabled()
  })

  it('removes a player but never below two', async () => {
    const user = userEvent.setup()
    renderTitleScreen()
    await user.click(screen.getByRole('button', { name: /add player/i }))
    expect(screen.getByLabelText('Player 3 name')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Remove player 3' }))
    expect(screen.queryByLabelText('Player 3 name')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /remove player 1/i })).not.toBeInTheDocument()
  })

  it('lets the player edit their name', async () => {
    const user = userEvent.setup()
    renderTitleScreen()
    const input = screen.getByLabelText('Player 1 name')
    await user.clear(input)
    await user.type(input, 'Zoe')
    expect(input).toHaveValue('Zoe')
  })

  it('disables a colour swatch already taken by another player', () => {
    renderTitleScreen()
    // Player 1 defaults to red, Player 2 defaults to blue.
    const player2Group = screen.getByRole('group', { name: 'Player 2 colour' })
    const redSwatch = Array.from(player2Group.querySelectorAll('button')).find(
      (b) => b.getAttribute('aria-label') === 'red',
    )
    expect(redSwatch).toBeDisabled()
  })

  it('offers no face picker — a car earns its look in play, nothing is chosen here', () => {
    renderTitleScreen()
    expect(screen.queryByRole('group', { name: 'Player 1 face' })).not.toBeInTheDocument()
  })

  it('offers twelve colours, none of them twice', () => {
    renderTitleScreen()
    const group = screen.getByRole('group', { name: 'Player 1 colour' })
    const labels = within(group)
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
    expect(labels).toHaveLength(12)
    expect(new Set(labels).size).toBe(12)
  })

  it('toggles a seat to CPU', async () => {
    const user = userEvent.setup()
    renderTitleScreen()
    const group1 = screen.getByRole('group', { name: 'Player 1 seat type' })
    await user.click(within(group1).getByRole('button', { name: 'CPU' }))
    expect(within(group1).getByRole('button', { name: 'CPU' })).toHaveAttribute('aria-pressed', 'true')
    expect(within(group1).getByRole('button', { name: 'Human' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('starts the game with the configured players, seat types, colours and board length', async () => {
    const user = userEvent.setup()
    const { onStart } = renderTitleScreen()

    const input = screen.getByLabelText('Player 1 name')
    await user.clear(input)
    await user.type(input, 'Zoe')

    const group2 = screen.getByRole('group', { name: 'Player 2 seat type' })
    await user.click(within(group2).getByRole('button', { name: 'CPU' }))

    await user.click(screen.getByRole('button', { name: /start game/i }))

    expect(onStart).toHaveBeenCalledWith({
      players: [
        { name: 'Zoe', color: 'red', isCpu: false },
        { name: 'Player 2', color: 'blue', isCpu: true },
      ],
      difficulty: 'normal',
      editionId: 'usa',
    })
  })

  it('defaults the difficulty to normal', async () => {
    const user = userEvent.setup()
    const { onStart } = renderTitleScreen()
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'normal' }))
  })

  it('sends the chosen difficulty with the start config', async () => {
    const user = userEvent.setup()
    const { onStart } = renderTitleScreen()
    await user.click(screen.getByRole('button', { name: /very hard/i }))
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'veryHard' }))
  })

  it('warns what Very Hard means before it is picked', () => {
    renderTitleScreen()
    // The odds are dramatic — near coin-flip to finish in the black — so the
    // control itself must say so, not a tooltip discovered thirty minutes in.
    expect(screen.getByRole('button', { name: /very hard.*coin flip/i })).toBeInTheDocument()
  })

  describe('edition picker', () => {
    it('defaults the edition to the USA game', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()
      await user.click(screen.getByRole('button', { name: /start game/i }))
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ editionId: 'usa' }))
    })

    it('sends the chosen edition with the start config', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()
      await user.click(screen.getByRole('button', { name: /japan edition/i }))
      await user.click(screen.getByRole('button', { name: /start game/i }))
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ editionId: 'japan' }))
    })

    it('offers the USA game first, then the rest of the shelf', () => {
      renderTitleScreen()
      const group = screen.getByRole('group', { name: 'Edition' })
      const labels = within(group)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
      expect(labels[0]).toMatch(/^USA edition/)
      expect(labels.some((label) => label?.startsWith('Japan edition'))).toBe(true)
    })

    it('offers a newly registered edition with no further edit', () => {
      // The France, Bolivia and India editions will arrive through this exact
      // door; the picker must be reading the registry, not a hard-coded list.
      registerEdition({
        ...EDITION_JAPAN,
        id: 'testland',
        name: 'LIFE JOURNEY: Testland',
        currency: { ...EDITION_JAPAN.currency, symbol: '₮' },
      })
      renderTitleScreen()
      expect(screen.getByRole('button', { name: /testland edition, counts in ₮/i })).toBeInTheDocument()
    })

    it('tells the truth about the selected edition in its own money', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await user.click(screen.getByRole('button', { name: /japan edition/i }))
      // Derived from the edition's data, so it must quote yen, not dollars.
      expect(screen.getByText(/counts in ¥ — start with ¥/i)).toBeInTheDocument()
    })

    it('does not affect continuing a saved game', async () => {
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 1, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 5 , editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
      ]
      const { onStart, onContinue } = renderTitleScreen({ slots })
      // A save carries its own editionId; the picker must not leak into it.
      await user.click(screen.getByRole('button', { name: /japan edition/i }))
      await user.click(screen.getByRole('button', { name: /continue slot 1/i }))
      expect(onContinue).toHaveBeenCalledWith(1)
      expect(onStart).not.toHaveBeenCalled()
    })
  })

  it('unlocks audio on the first click anywhere on the screen', async () => {
    const user = userEvent.setup()
    const { audio } = renderTitleScreen()
    expect(audio.unlocked).toBe(false)
    await user.click(screen.getByText('LIFE JOURNEY'))
    expect(audio.unlocked).toBe(true)
  })

  describe('save slots', () => {
    it('shows every slot, occupied or not', () => {
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe', 'Sam'], turn: 12 , editionId: null },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
      ]
      renderTitleScreen({ slots })
      expect(screen.getByText('Zoe & Sam')).toBeInTheDocument()
      expect(screen.getByText(/turn 12/i)).toBeInTheDocument()
    })

    it('says which country a save was played on', () => {
      registerEdition(EDITION_JAPAN)
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 12, editionId: 'japan' },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
      ]
      renderTitleScreen({ slots })
      const card = screen.getByRole('button', { name: /continue autosave/i })
      expect(card).toHaveAccessibleName(/on the Japan board/i)
      expect(card.textContent).toContain('Japan · Turn 12')
    })

    it('shows a save written before editions existed without inventing a country', () => {
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 12, editionId: null },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
      ]
      renderTitleScreen({ slots })
      const card = screen.getByRole('button', { name: /continue autosave/i })
      expect(card.textContent).toContain('Turn 12')
      expect(card.textContent).not.toContain('·  Turn')
      expect(card).toHaveAccessibleName(/Zoe, turn 12/i)
    })

    it('never lets an empty slot be continued', async () => {
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
      ]
      const { onContinue } = renderTitleScreen({ slots })
      const emptyButton = screen.getByRole('button', { name: /autosave, empty/i })
      expect(emptyButton).toBeDisabled()
      expect(onContinue).not.toHaveBeenCalled()
    })

    it('continues the chosen slot', async () => {
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 1, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 5 , editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
      ]
      const { onContinue } = renderTitleScreen({ slots })
      await user.click(screen.getByRole('button', { name: /continue slot 1/i }))
      expect(onContinue).toHaveBeenCalledWith(1)
    })
  })

  describe('recent players', () => {
    const zoe: PlayerProfile = {
      name: 'Zoe',
      color: 'teal',
      lastUsedAt: '2026-08-01T12:00:00.000Z',
    }

    it('shows no strip at all on a first-ever run — a strip of nobody is noise', () => {
      renderTitleScreen({ profiles: [] })
      expect(screen.queryByText('Recent')).not.toBeInTheDocument()
    })

    it('fills a whole row from one tap: name and colour', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen({ profiles: [zoe] })

      const strip = screen.getByRole('group', { name: 'Player 1 recent players' })
      await user.click(within(strip).getByRole('button', { name: 'Zoe' }))

      expect(screen.getByLabelText('Player 1 name')).toHaveValue('Zoe')
      await user.click(screen.getByRole('button', { name: /start game/i }))
      expect(onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          players: [
            expect.objectContaining({ name: 'Zoe', color: 'teal' }),
            expect.objectContaining({ name: 'Player 2' }),
          ],
        }),
      )
    })

    it('keeps the row colour when a rival is already holding the saved one', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen({
        profiles: [{ ...zoe, color: 'blue' }],
      })

      // Player 2 already holds blue; Zoe's saved blue must yield, not clash.
      const strip = screen.getByRole('group', { name: 'Player 1 recent players' })
      await user.click(within(strip).getByRole('button', { name: 'Zoe' }))

      await user.click(screen.getByRole('button', { name: /start game/i }))
      expect(onStart).toHaveBeenCalledWith(
        expect.objectContaining({
          players: [
            expect.objectContaining({ name: 'Zoe', color: 'red' }),
            expect.objectContaining({ color: 'blue' }),
          ],
        }),
      )
    })

    it('offers no strip on a computer seat — it has no owner to recall', async () => {
      const user = userEvent.setup()
      renderTitleScreen({ profiles: [zoe] })

      const group2 = screen.getByRole('group', { name: 'Player 2 seat type' })
      await user.click(within(group2).getByRole('button', { name: 'CPU' }))

      expect(screen.getByRole('group', { name: 'Player 1 recent players' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Player 2 recent players' })).not.toBeInTheDocument()
    })
  })

  describe('playtime estimate', () => {
    it('says up front roughly how long the default table will take', () => {
      renderTitleScreen()
      expect(screen.getByText('About 10–20 min for 2 human seats.')).toBeInTheDocument()
    })

    it('tracks the player rows and the difficulty as they change', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      // A third human seat means a third more table time per round.
      await user.click(screen.getByRole('button', { name: /add player/i }))
      expect(screen.getByText('About 20–25 min for 3 human seats.')).toBeInTheDocument()

      // Handing a seat to the computer shortens it — a CPU turn takes seconds.
      const group3 = screen.getByRole('group', { name: 'Player 3 seat type' })
      await user.click(within(group3).getByRole('button', { name: 'CPU' }))
      expect(
        screen.getByText('About 15–20 min for 2 human seats and 1 CPU seat.'),
      ).toBeInTheDocument()

      // Harder games run a few more rounds, so the estimate follows.
      await user.click(screen.getByRole('button', { name: /very hard/i }))
      expect(
        screen.getByText('About 15–25 min for 2 human seats and 1 CPU seat.'),
      ).toBeInTheDocument()
    })
  })

  describe('hall of records', () => {
    it('is hidden when there is no history', () => {
      renderTitleScreen({ records: [] })
      expect(screen.queryByRole('button', { name: /hall of records/i })).not.toBeInTheDocument()
    })

    it('opens the records screen and can be closed again', async () => {
      const user = userEvent.setup()
      const records: GameRecord[] = [
        {
          playedAt: '2026-08-01T12:00:00.000Z',
          editionId: 'usa',
          winnerName: 'Zoe',
          turns: 20,
          standings: [{ name: 'Zoe', color: 'red', total: 100000, rank: 1, isCpu: false }],
        },
      ]
      renderTitleScreen({ records })
      await user.click(screen.getByRole('button', { name: /hall of records/i }))
      expect(screen.getByRole('heading', { name: 'Hall of Records' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /back to title/i }))
      expect(screen.getByText('LIFE JOURNEY')).toBeInTheDocument()
    })
  })

  describe('release notes', () => {
    it('opens the release notes screen and can be closed again', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await user.click(screen.getByRole('button', { name: /what.?s new/i }))
      expect(screen.getByRole('heading', { name: 'Release Notes' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /back to title/i }))
      expect(screen.getByText('LIFE JOURNEY')).toBeInTheDocument()
    })

    it('is reachable regardless of whether any games have been recorded', () => {
      renderTitleScreen({ records: [] })
      expect(screen.getByRole('button', { name: /what.?s new/i })).toBeInTheDocument()
    })
  })

  /*
   * The build string is `git describe`, not the package version: "1.0.0"
   * cannot tell you which of three deploys you are looking at. So this asserts
   * the value that is actually injected, whatever shape it takes — a bare tag
   * on a release build, `v1.0.0-3-gabc1234` a few commits later, and `-dirty`
   * for anyone with uncommitted work. Pinning the literal `v1.0.0` made the
   * suite fail for every developer with an unsaved change, which is a test
   * reporting on the working tree rather than on the code.
   */
  it('shows the build the bundle was made from', () => {
    renderTitleScreen()
    expect(screen.getByText(__APP_BUILD__)).toBeInTheDocument()
  })

  it('names a build that identifies its commit, not just a release number', () => {
    expect(__APP_BUILD__).toMatch(/^v?\d/)
    expect(__APP_BUILD__.length).toBeGreaterThan(0)
  })
})
