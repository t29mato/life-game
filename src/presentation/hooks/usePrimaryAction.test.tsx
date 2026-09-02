import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ReactElement } from 'react'

import { usePrimaryAction } from './usePrimaryAction'

function Harness({
  active = true,
  onPress,
  extras = false,
}: {
  readonly active?: boolean
  readonly onPress: () => void
  readonly extras?: boolean
}): ReactElement {
  const ref = usePrimaryAction<HTMLButtonElement>(active)
  return (
    <div>
      <button ref={ref} type="button" onClick={onPress}>
        Roll
      </button>
      {extras ? (
        <>
          <button type="button">Quit</button>
          <input aria-label="Player name" />
        </>
      ) : null}
    </div>
  )
}

describe('usePrimaryAction', () => {
  it('focuses the primary action as soon as it is live', () => {
    render(<Harness onPress={() => {}} />)

    expect(screen.getByRole('button', { name: 'Roll' })).toHaveFocus()
  })

  it('leaves focus alone while it is not the primary action', () => {
    render(<Harness active={false} onPress={() => {}} />)

    expect(document.body).toHaveFocus()
  })

  /*
   * The two halves of issue #33 — the die that answered a click but not a
   * key, and the key that only worked in the one window where nothing was
   * focused. Both keys, from the window, with focus nowhere in particular.
   */
  it.each([' ', 'Enter'])('presses the primary action on %s from anywhere on the page', (key) => {
    const onPress = vi.fn()
    render(<Harness onPress={onPress} />)
    // Focus dropped back to the page — exactly what happens when a button is
    // disabled mid-roll, or when a modal that had focus unmounts. The key
    // must still reach the primary action.
    screen.getByRole('button', { name: 'Roll' }).blur()
    expect(document.body).toHaveFocus()

    fireEvent.keyDown(window, { key })

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('fires exactly once even though the element itself has focus', () => {
    const onPress = vi.fn()
    render(<Harness onPress={onPress} />)
    expect(screen.getByRole('button', { name: 'Roll' })).toHaveFocus()

    fireEvent.keyDown(window, { key: ' ' })

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('claims the press, so no native button activation can double-fire behind it', () => {
    render(<Harness onPress={() => {}} />)

    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true, bubbles: true })
    window.dispatchEvent(event)

    expect(event.defaultPrevented).toBe(true)
  })

  it('stands down for another control the player deliberately focused', () => {
    const onPress = vi.fn()
    render(<Harness onPress={onPress} extras />)
    screen.getByRole('button', { name: 'Quit' }).focus()

    fireEvent.keyDown(window, { key: 'Enter' })

    expect(onPress).not.toHaveBeenCalled()
  })

  it('never eats a Space meant for a text field', () => {
    const onPress = vi.fn()
    render(<Harness onPress={onPress} extras />)
    screen.getByLabelText('Player name').focus()

    fireEvent.keyDown(window, { key: ' ' })

    expect(onPress).not.toHaveBeenCalled()
  })

  it('ignores a held key, so one press is one action', () => {
    const onPress = vi.fn()
    render(<Harness onPress={onPress} />)

    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: ' ', repeat: true })
    fireEvent.keyDown(window, { key: ' ', repeat: true })

    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('answers no key at all while it is not the primary action', () => {
    const onPress = vi.fn()
    render(<Harness active={false} onPress={onPress} />)

    fireEvent.keyDown(window, { key: ' ' })
    fireEvent.keyDown(window, { key: 'Enter' })

    expect(onPress).not.toHaveBeenCalled()
  })

  it('leaves every other key to whatever else wants it', () => {
    const onPress = vi.fn()
    render(<Harness onPress={onPress} />)

    fireEvent.keyDown(window, { key: 'Escape' })
    fireEvent.keyDown(window, { key: 'ArrowDown' })

    expect(onPress).not.toHaveBeenCalled()
  })
})
