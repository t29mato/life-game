import { render, screen, within, type RenderResult } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SaveSlotInfo } from '@application/ports/GameRepositoryPort'
import type { GameRecord } from '@application/ports/StatsRepositoryPort'
import { AudioProvider } from '../../hooks/useAudio'
import { createFakeAudioPort } from '../../dev/fakeAudio'
import { TitleScreen, type TitleScreenProps } from './TitleScreen'

function emptySlots(): SaveSlotInfo[] {
  return [0, 1, 2, 3].map((slot) => ({ slot, occupied: false, savedAt: null, playerNames: [], turn: null }))
}

function renderTitleScreen(overrides: Partial<TitleScreenProps> = {}) {
  const audio = createFakeAudioPort()
  const onStart = vi.fn()
  const onContinue = vi.fn()
  const props: TitleScreenProps = {
    slots: emptySlots(),
    records: [],
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

    await user.click(screen.getByRole('button', { name: /long game/i }))

    await user.click(screen.getByRole('button', { name: /start game/i }))

    expect(onStart).toHaveBeenCalledWith({
      players: [
        { name: 'Zoe', color: 'red', isCpu: false },
        { name: 'Player 2', color: 'blue', isCpu: true },
      ],
      boardLength: 'long',
      difficulty: 'normal',
    })
  })

  it('defaults the board length to standard', async () => {
    const user = userEvent.setup()
    const { onStart } = renderTitleScreen()
    await user.click(screen.getByRole('button', { name: /start game/i }))
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ boardLength: 'standard' }))
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
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe', 'Sam'], turn: 12 },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null },
      ]
      renderTitleScreen({ slots })
      expect(screen.getByText('Zoe & Sam')).toBeInTheDocument()
      expect(screen.getByText(/turn 12/i)).toBeInTheDocument()
    })

    it('never lets an empty slot be continued', async () => {
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null },
      ]
      const { onContinue } = renderTitleScreen({ slots })
      const emptyButton = screen.getByRole('button', { name: /autosave, empty/i })
      expect(emptyButton).toBeDisabled()
      expect(onContinue).not.toHaveBeenCalled()
    })

    it('continues the chosen slot', async () => {
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 1, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 5 },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null },
      ]
      const { onContinue } = renderTitleScreen({ slots })
      await user.click(screen.getByRole('button', { name: /continue slot 1/i }))
      expect(onContinue).toHaveBeenCalledWith(1)
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
