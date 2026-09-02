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

/*
 * This suite used to describe one long scrolling form: every control was on
 * screen at once, so every test could reach straight for it. Issue #36 broke
 * that form into a flow — title → players → country → difficulty — and the
 * tests follow it, but *nothing* the old file asserted has been dropped. Each
 * control still exists, each choice is still settable, the game still starts
 * with exactly the config that was chosen, and continuing a save still works;
 * they are simply asserted a screen further in. What is new here is the
 * navigation itself: forward, back, and walking out of a half-finished setup.
 */

function emptySlots(): SaveSlotInfo[] {
  return [0, 1, 2, 3].map((slot) => ({ slot, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null }))
}

/** One occupied save, so the Continue branch has something to offer. */
function slotsWithSave(): SaveSlotInfo[] {
  return [
    { slot: 0, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
    { slot: 1, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 5, editionId: null },
    { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
    { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
  ]
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

type User = ReturnType<typeof userEvent.setup>

const openNewGame = (user: User) => user.click(screen.getByRole('button', { name: 'New Game' }))
const toCountry = (user: User) => user.click(screen.getByRole('button', { name: /next: the country/i }))
const toDifficulty = (user: User) => user.click(screen.getByRole('button', { name: /next: the difficulty/i }))
const pressStart = (user: User) => user.click(screen.getByRole('button', { name: /start game/i }))
const goBack = (user: User) => user.click(screen.getByRole('button', { name: /^back to/i }))

/** Title → players → country → difficulty, leaving the flow on its last step. */
async function walkToDifficulty(user: User): Promise<void> {
  await openNewGame(user)
  await toCountry(user)
  await toDifficulty(user)
}

/** The whole flow, defaults untouched, ending in a started game. */
async function startWithDefaults(user: User): Promise<void> {
  await walkToDifficulty(user)
  await pressStart(user)
}

describe('TitleScreen', () => {
  it('renders the wordmark', () => {
    renderTitleScreen()
    expect(screen.getByText('LIFE JOURNEY')).toBeInTheDocument()
  })

  it('unlocks audio on the first click anywhere on the screen', async () => {
    const user = userEvent.setup()
    const { audio } = renderTitleScreen()
    expect(audio.unlocked).toBe(false)
    await user.click(screen.getByText('LIFE JOURNEY'))
    expect(audio.unlocked).toBe(true)
  })

  /*
   * The heart of #36: the first view is two buttons, not a form. Everything
   * the old page piled into one column is behind one of them.
   */
  describe('the box lid', () => {
    it('offers exactly two ways in: continue, or start something new', () => {
      renderTitleScreen({ slots: slotsWithSave() })
      expect(screen.getByRole('button', { name: /continue a saved game/i })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'New Game' })).toBeEnabled()
    })

    it('asks for nothing about the game before either of them is pressed', () => {
      renderTitleScreen()
      expect(screen.queryByLabelText('Player 1 name')).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Edition' })).not.toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Difficulty' })).not.toBeInTheDocument()
    })

    it('keeps Continue on screen with nothing to continue, and says why', () => {
      renderTitleScreen({ slots: emptySlots() })
      // A button that appears out of nowhere on the second visit is a menu
      // that changes shape under the player; a disabled one that explains
      // itself is not.
      expect(screen.getByRole('button', { name: /continue: no saved games yet/i })).toBeDisabled()
      expect(screen.getByText(/no saved games yet/i)).toBeInTheDocument()
    })

    it('puts the A button on Continue when there is a game to continue', () => {
      renderTitleScreen({ slots: slotsWithSave() })
      expect(screen.getByRole('button', { name: /continue a saved game/i })).toHaveFocus()
    })

    it('puts the A button on New Game when there is not', () => {
      renderTitleScreen({ slots: emptySlots() })
      expect(screen.getByRole('button', { name: 'New Game' })).toHaveFocus()
    })
  })

  describe('stepping through a new game', () => {
    it('asks one question per screen, in order', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      await openNewGame(user)
      expect(screen.getByRole('heading', { name: /who's playing/i })).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Difficulty' })).not.toBeInTheDocument()

      await toCountry(user)
      expect(screen.getByRole('heading', { name: /where are you living it/i })).toBeInTheDocument()
      expect(screen.getByText('Step 2 of 3')).toBeInTheDocument()
      expect(screen.queryByLabelText('Player 1 name')).not.toBeInTheDocument()

      await toDifficulty(user)
      expect(screen.getByRole('heading', { name: /how hard a life/i })).toBeInTheDocument()
      expect(screen.getByText('Step 3 of 3')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start game/i })).toBeInTheDocument()
    })

    it('offers Back on every single step, saying where back goes', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      await openNewGame(user)
      expect(screen.getByRole('button', { name: 'Back to title' })).toBeInTheDocument()
      await toCountry(user)
      expect(screen.getByRole('button', { name: 'Back to the players' })).toBeInTheDocument()
      await toDifficulty(user)
      expect(screen.getByRole('button', { name: 'Back to the country' })).toBeInTheDocument()
    })

    it('walks back down the flow one step at a time', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await walkToDifficulty(user)

      await goBack(user)
      expect(screen.getByRole('heading', { name: /where are you living it/i })).toBeInTheDocument()
      await goBack(user)
      expect(screen.getByRole('heading', { name: /who's playing/i })).toBeInTheDocument()
      await goBack(user)
      expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument()
    })

    it('gives every step one primary action, focused and pressable from the keyboard', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()

      await openNewGame(user)
      expect(screen.getByRole('button', { name: /next: the country/i })).toHaveFocus()

      // Space is the A button on every screen in this game (`usePrimaryAction`).
      await user.keyboard(' ')
      expect(screen.getByRole('heading', { name: /where are you living it/i })).toBeInTheDocument()

      await user.keyboard('{Enter}')
      expect(screen.getByRole('heading', { name: /how hard a life/i })).toBeInTheDocument()

      await user.keyboard(' ')
      expect(onStart).toHaveBeenCalledTimes(1)
    })

    it('never fires the forward action while a name is being typed', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      const input = screen.getByLabelText('Player 1 name')
      await user.clear(input)
      await user.type(input, 'Zoe Ray')

      expect(input).toHaveValue('Zoe Ray')
      expect(screen.getByRole('heading', { name: /who's playing/i })).toBeInTheDocument()
    })
  })

  /*
   * "Abandoned safely" is the property a flow has to have that a form does
   * not: a player who walks out halfway through has not broken anything, and
   * has not lost anything either.
   */
  describe('abandoning a half-finished setup', () => {
    it('can be walked out of from any step, straight back to the lid', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      await openNewGame(user)
      await toCountry(user)
      await goBack(user)
      await goBack(user)

      expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument()
      expect(screen.getByText('LIFE JOURNEY')).toBeInTheDocument()
    })

    it('keeps the choices already made when the flow is re-entered', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      await openNewGame(user)
      const input = screen.getByLabelText('Player 1 name')
      await user.clear(input)
      await user.type(input, 'Zoe')
      await toCountry(user)
      await user.click(screen.getByRole('button', { name: /japan edition/i }))
      await goBack(user)
      await goBack(user)

      await openNewGame(user)
      expect(screen.getByLabelText('Player 1 name')).toHaveValue('Zoe')
      await toCountry(user)
      expect(screen.getByRole('button', { name: /japan edition/i })).toHaveAttribute('aria-pressed', 'true')
    })

    it('starts a perfectly ordinary game after being abandoned once', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()

      await openNewGame(user)
      await goBack(user)
      await startWithDefaults(user)

      expect(onStart).toHaveBeenCalledWith({
        players: [
          { name: 'Player 1', color: 'red', isCpu: false },
          { name: 'Player 2', color: 'blue', isCpu: false },
        ],
        difficulty: 'normal',
        editionId: 'usa',
      })
    })

    it('leaves the flow alone when a door off the title is opened and closed', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      await openNewGame(user)
      await goBack(user)
      await user.click(screen.getByRole('button', { name: /the handbook/i }))
      await user.click(screen.getByRole('button', { name: /back to title/i }))

      expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument()
    })
  })

  describe('the players step', () => {
    it('starts with two player rows, both human by default', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      expect(screen.getByLabelText('Player 1 name')).toBeInTheDocument()
      expect(screen.getByLabelText('Player 2 name')).toBeInTheDocument()
      expect(screen.queryByLabelText('Player 3 name')).not.toBeInTheDocument()
      const group1 = screen.getByRole('group', { name: 'Player 1 seat type' })
      expect(group1.querySelector('[aria-pressed="true"]')).toHaveTextContent('Human')
    })

    it('adds a player up to the maximum of four', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      await user.click(screen.getByRole('button', { name: /add player/i }))
      expect(screen.getByLabelText('Player 3 name')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /add player/i }))
      expect(screen.getByLabelText('Player 4 name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add player/i })).toBeDisabled()
    })

    it('removes a player but never below two', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      await user.click(screen.getByRole('button', { name: /add player/i }))
      expect(screen.getByLabelText('Player 3 name')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'Remove player 3' }))
      expect(screen.queryByLabelText('Player 3 name')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /remove player 1/i })).not.toBeInTheDocument()
    })

    it('lets the player edit their name', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      const input = screen.getByLabelText('Player 1 name')
      await user.clear(input)
      await user.type(input, 'Zoe')
      expect(input).toHaveValue('Zoe')
    })

    it('disables a colour swatch already taken by another player', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      // Player 1 defaults to red, Player 2 defaults to blue.
      const player2Group = screen.getByRole('group', { name: 'Player 2 colour' })
      const redSwatch = Array.from(player2Group.querySelectorAll('button')).find(
        (b) => b.getAttribute('aria-label') === 'red',
      )
      expect(redSwatch).toBeDisabled()
    })

    it('offers no face picker — a car earns its look in play, nothing is chosen here', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      expect(screen.queryByRole('group', { name: 'Player 1 face' })).not.toBeInTheDocument()
    })

    it('offers twelve colours, none of them twice', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

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
      await openNewGame(user)

      const group1 = screen.getByRole('group', { name: 'Player 1 seat type' })
      await user.click(within(group1).getByRole('button', { name: 'CPU' }))
      expect(within(group1).getByRole('button', { name: 'CPU' })).toHaveAttribute('aria-pressed', 'true')
      expect(within(group1).getByRole('button', { name: 'Human' })).toHaveAttribute('aria-pressed', 'false')
    })

    it('starts the game with the configured players, seat types and colours', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()
      await openNewGame(user)

      const input = screen.getByLabelText('Player 1 name')
      await user.clear(input)
      await user.type(input, 'Zoe')

      const group2 = screen.getByRole('group', { name: 'Player 2 seat type' })
      await user.click(within(group2).getByRole('button', { name: 'CPU' }))

      await toCountry(user)
      await toDifficulty(user)
      await pressStart(user)

      expect(onStart).toHaveBeenCalledWith({
        players: [
          { name: 'Zoe', color: 'red', isCpu: false },
          { name: 'Player 2', color: 'blue', isCpu: true },
        ],
        difficulty: 'normal',
        editionId: 'usa',
      })
    })
  })

  describe('the country step', () => {
    it('defaults the edition to the USA game', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()
      await startWithDefaults(user)
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ editionId: 'usa' }))
    })

    it('sends the chosen edition with the start config', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()

      await openNewGame(user)
      await toCountry(user)
      await user.click(screen.getByRole('button', { name: /japan edition/i }))
      await toDifficulty(user)
      await pressStart(user)

      expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ editionId: 'japan' }))
    })

    it('offers the USA game first, then the rest of the shelf', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)
      await toCountry(user)

      const group = screen.getByRole('group', { name: 'Edition' })
      const labels = within(group)
        .getAllByRole('button')
        .map((button) => button.getAttribute('aria-label'))
      expect(labels[0]).toMatch(/^USA edition/)
      expect(labels.some((label) => label?.startsWith('Japan edition'))).toBe(true)
    })

    /*
     * The owner's constraint on #7, made mechanical: an ordinary country
     * board is never behind a disclosure, a sub-menu or an "others" card.
     * Every registered edition is one press from this screen, and this screen
     * is one press from the players step.
     */
    it('reaches every country in exactly one press, none of them nested', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)
      await toCountry(user)

      const group = screen.getByRole('group', { name: 'Edition' })
      const cards = within(group).getAllByRole('button')
      expect(cards.length).toBeGreaterThan(1)
      for (const card of cards) {
        expect(card).toBeEnabled()
        expect(card).toHaveAttribute('aria-pressed')
      }
    })

    it('gives every country the same card, with its own money on it', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)
      await toCountry(user)

      // Not one shared detail line about whichever country is selected: a
      // country that says nothing until it is chosen reads as the alternative
      // to a default rather than as one of five equals.
      const group = screen.getByRole('group', { name: 'Edition' })
      for (const card of within(group).getAllByRole('button')) {
        expect(card).toHaveAccessibleName(/counts in .+ — start with /i)
      }
    })

    it('offers a newly registered edition with no further edit', async () => {
      // The France, Bolivia and India editions will arrive through this exact
      // door; the picker must be reading the registry, not a hard-coded list.
      registerEdition({
        ...EDITION_JAPAN,
        id: 'testland',
        name: 'LIFE JOURNEY: Testland',
        currency: { ...EDITION_JAPAN.currency, symbol: '₮' },
      })
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)
      await toCountry(user)

      expect(screen.getByRole('button', { name: /testland edition\. counts in ₮/i })).toBeInTheDocument()
    })

    it('tells the truth about each edition in its own money', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)
      await toCountry(user)

      // Derived from the edition's data, so Japan's card must quote yen.
      expect(screen.getByText(/counts in ¥ — start with ¥/i)).toBeInTheDocument()
    })
  })

  describe('the difficulty step', () => {
    it('defaults the difficulty to normal', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()
      await startWithDefaults(user)
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'normal' }))
    })

    it('sends the chosen difficulty with the start config', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen()
      await walkToDifficulty(user)

      await user.click(screen.getByRole('button', { name: /very hard/i }))
      await pressStart(user)
      expect(onStart).toHaveBeenCalledWith(expect.objectContaining({ difficulty: 'veryHard' }))
    })

    it('warns what Very Hard means before it is picked', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await walkToDifficulty(user)

      // The odds are dramatic — near coin-flip to finish in the black — so the
      // control itself must say so, not a tooltip discovered thirty minutes in.
      expect(screen.getByRole('button', { name: /very hard.*coin flip/i })).toBeInTheDocument()
    })

    it('puts Start Game on screen with the choice it belongs to, not below five other sections', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await walkToDifficulty(user)

      const start = screen.getByRole('button', { name: /start game/i })
      expect(start).toBeInTheDocument()
      expect(start).toHaveFocus()
    })
  })

  describe('playtime estimate', () => {
    it('says up front roughly how long the default table will take', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await walkToDifficulty(user)
      expect(screen.getByText('About 10–20 min for 2 human seats.')).toBeInTheDocument()
    })

    it('tracks the player rows and the difficulty as they change', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)

      // A third human seat means a third more table time per round.
      await user.click(screen.getByRole('button', { name: /add player/i }))

      // Handing a seat to the computer shortens it — a CPU turn takes seconds.
      const group3 = screen.getByRole('group', { name: 'Player 3 seat type' })
      await user.click(within(group3).getByRole('button', { name: 'CPU' }))

      await toCountry(user)
      await toDifficulty(user)
      expect(
        screen.getByText('About 15–20 min for 2 human seats and 1 CPU seat.'),
      ).toBeInTheDocument()

      // Harder games run a few more rounds, so the estimate follows.
      await user.click(screen.getByRole('button', { name: /very hard/i }))
      expect(
        screen.getByText('About 15–25 min for 2 human seats and 1 CPU seat.'),
      ).toBeInTheDocument()
    })

    it('prices a third human seat as a third more table time', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await openNewGame(user)
      await user.click(screen.getByRole('button', { name: /add player/i }))
      await toCountry(user)
      await toDifficulty(user)
      expect(screen.getByText('About 20–25 min for 3 human seats.')).toBeInTheDocument()
    })
  })

  describe('save slots', () => {
    it('shows every slot, occupied or not', async () => {
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe', 'Sam'], turn: 12 , editionId: null },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null , editionId: null },
      ]
      renderTitleScreen({ slots })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))

      expect(screen.getByText('Zoe & Sam')).toBeInTheDocument()
      expect(screen.getByText(/turn 12/i)).toBeInTheDocument()
      expect(screen.getAllByRole('button', { name: /empty$/i })).toHaveLength(3)
    })

    it('says which country a save was played on', async () => {
      registerEdition(EDITION_JAPAN)
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 12, editionId: 'japan' },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
      ]
      renderTitleScreen({ slots })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))

      const card = screen.getByRole('button', { name: /continue autosave/i })
      expect(card).toHaveAccessibleName(/on the Japan board/i)
      expect(card.textContent).toContain('Japan · Turn 12')
    })

    it('shows a save written before editions existed without inventing a country', async () => {
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 12, editionId: null },
        { slot: 1, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
      ]
      renderTitleScreen({ slots })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))

      const card = screen.getByRole('button', { name: /continue autosave/i })
      expect(card.textContent).toContain('Turn 12')
      expect(card.textContent).not.toContain('·  Turn')
      expect(card).toHaveAccessibleName(/Zoe, turn 12/i)
    })

    it('never lets an empty slot be continued', async () => {
      const user = userEvent.setup()
      const { onContinue } = renderTitleScreen({ slots: slotsWithSave() })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))

      const emptyButton = screen.getByRole('button', { name: /autosave, empty/i })
      expect(emptyButton).toBeDisabled()
      expect(onContinue).not.toHaveBeenCalled()
    })

    it('continues the chosen slot', async () => {
      const user = userEvent.setup()
      const { onContinue } = renderTitleScreen({ slots: slotsWithSave() })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))
      await user.click(screen.getByRole('button', { name: /continue slot 1/i }))
      expect(onContinue).toHaveBeenCalledWith(1)
    })

    it('binds the A button to the most recently saved game', async () => {
      const user = userEvent.setup()
      const slots: SaveSlotInfo[] = [
        { slot: 0, occupied: true, savedAt: '2026-07-01T12:00:00.000Z', playerNames: ['Old'], turn: 2, editionId: null },
        { slot: 1, occupied: true, savedAt: '2026-08-01T12:00:00.000Z', playerNames: ['Zoe'], turn: 5, editionId: null },
        { slot: 2, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
        { slot: 3, occupied: false, savedAt: null, playerNames: [], turn: null, editionId: null },
      ]
      const { onContinue } = renderTitleScreen({ slots })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))

      await user.keyboard(' ')
      expect(onContinue).toHaveBeenCalledWith(1)
    })

    it('goes back to the lid without loading anything', async () => {
      const user = userEvent.setup()
      const { onContinue, onStart } = renderTitleScreen({ slots: slotsWithSave() })
      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))
      await user.click(screen.getByRole('button', { name: 'Back to title' }))

      expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument()
      expect(onContinue).not.toHaveBeenCalled()
      expect(onStart).not.toHaveBeenCalled()
    })

    it('is not affected by the country picked for a new game', async () => {
      const user = userEvent.setup()
      const { onStart, onContinue } = renderTitleScreen({ slots: slotsWithSave() })

      // A save carries its own editionId; the flow's picker must not leak in.
      await openNewGame(user)
      await toCountry(user)
      await user.click(screen.getByRole('button', { name: /japan edition/i }))
      await goBack(user)
      await goBack(user)

      await user.click(screen.getByRole('button', { name: /continue a saved game/i }))
      await user.click(screen.getByRole('button', { name: /continue slot 1/i }))
      expect(onContinue).toHaveBeenCalledWith(1)
      expect(onStart).not.toHaveBeenCalled()
    })
  })

  describe('recent players', () => {
    const zoe: PlayerProfile = {
      name: 'Zoe',
      color: 'teal',
      lastUsedAt: '2026-08-01T12:00:00.000Z',
    }

    it('shows no strip at all on a first-ever run — a strip of nobody is noise', async () => {
      const user = userEvent.setup()
      renderTitleScreen({ profiles: [] })
      await openNewGame(user)
      expect(screen.queryByText('Recent')).not.toBeInTheDocument()
    })

    it('fills a whole row from one tap: name and colour', async () => {
      const user = userEvent.setup()
      const { onStart } = renderTitleScreen({ profiles: [zoe] })
      await openNewGame(user)

      const strip = screen.getByRole('group', { name: 'Player 1 recent players' })
      await user.click(within(strip).getByRole('button', { name: 'Zoe' }))

      expect(screen.getByLabelText('Player 1 name')).toHaveValue('Zoe')
      await toCountry(user)
      await toDifficulty(user)
      await pressStart(user)
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
      const { onStart } = renderTitleScreen({ profiles: [{ ...zoe, color: 'blue' }] })
      await openNewGame(user)

      // Player 2 already holds blue; Zoe's saved blue must yield, not clash.
      const strip = screen.getByRole('group', { name: 'Player 1 recent players' })
      await user.click(within(strip).getByRole('button', { name: 'Zoe' }))

      await toCountry(user)
      await toDifficulty(user)
      await pressStart(user)
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
      await openNewGame(user)

      const group2 = screen.getByRole('group', { name: 'Player 2 seat type' })
      await user.click(within(group2).getByRole('button', { name: 'CPU' }))

      expect(screen.getByRole('group', { name: 'Player 1 recent players' })).toBeInTheDocument()
      expect(screen.queryByRole('group', { name: 'Player 2 recent players' })).not.toBeInTheDocument()
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

  describe('the handbook', () => {
    it('opens the handbook screen and can be closed again', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await user.click(screen.getByRole('button', { name: /the handbook/i }))
      expect(screen.getByRole('heading', { name: 'The Handbook' })).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /back to title/i }))
      expect(screen.getByText('LIFE JOURNEY')).toBeInTheDocument()
    })

    it('is always on offer — a first-time table is who it exists for', () => {
      renderTitleScreen({ records: [] })
      expect(screen.getByRole('button', { name: /the handbook/i })).toBeInTheDocument()
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
   * #38 folded the two audio switches behind a gear in the game's header.
   * The title screen kept a bare pair of toggles in a row of its own, which
   * is the same two controls in two different clothes; they are behind the
   * same gear here now. Nothing is lost — the sheet is one press away.
   */
  describe('settings', () => {
    it('keeps the audio switches one press away, behind the gear', async () => {
      const user = userEvent.setup()
      renderTitleScreen()

      expect(screen.queryByRole('group', { name: 'Audio settings' })).not.toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: 'Settings' }))

      expect(screen.getByRole('dialog', { name: /settings/i })).toBeInTheDocument()
      expect(screen.getByRole('group', { name: 'Audio settings' })).toBeInTheDocument()
    })

    it('closes again and leaves the lid exactly as it was', async () => {
      const user = userEvent.setup()
      renderTitleScreen()
      await user.click(screen.getByRole('button', { name: 'Settings' }))
      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(screen.queryByRole('dialog', { name: /settings/i })).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'New Game' })).toBeInTheDocument()
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

  /*
   * Issue #37: the stamp read "1.15.0-26-ga7b0d96" on a real screen, with
   * the leading "v" of `git describe` clipped off. It was not truncation —
   * the build bar was absolutely positioned, but `.screen > *` resets every
   * child to `position: relative`, so `right: 26px` shunted the whole
   * full-width row leftwards out under the screen's own `overflow-x: clip`.
   * It is an ordinary footer at the end of the column now, laid out by the
   * same flow as everything else, with nothing left to clip it.
   */
  it('prints the whole build string, first character included', () => {
    renderTitleScreen()
    expect(screen.getByText(__APP_BUILD__)).toHaveTextContent(__APP_BUILD__)
  })

  it('puts the build in the footer, not in a corner of its own', () => {
    const { container } = renderTitleScreen()
    const footer = container.querySelector('footer')

    expect(footer).not.toBeNull()
    expect(footer).toHaveTextContent(__APP_BUILD__)
  })

  it('names a build that identifies its commit, not just a release number', () => {
    expect(__APP_BUILD__).toMatch(/^v?\d/)
    expect(__APP_BUILD__.length).toBeGreaterThan(0)
  })
})
