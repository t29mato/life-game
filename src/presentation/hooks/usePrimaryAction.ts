import { useEffect, useRef, type RefObject } from 'react'

/**
 * Controls that own Space and Enter themselves, and must keep them: typing a
 * space into a name field is not a request to roll the die.
 */
const TYPING_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

/**
 * Anything a person can deliberately put focus on. If one of these is focused
 * and it is *not* the primary action, the press belongs to it — a player who
 * tabbed to Quit and pressed Enter meant Quit.
 */
const INTERACTIVE_TAGS = new Set(['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT', 'A'])

function isTypingTarget(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  return TYPING_TAGS.has(element.tagName) || element.isContentEditable
}

function isInteractive(element: Element | null): boolean {
  if (!(element instanceof HTMLElement)) return false
  if (element.isContentEditable) return true
  if (INTERACTIVE_TAGS.has(element.tagName)) return true
  const tabIndex = element.getAttribute('tabindex')
  return tabIndex !== null && tabIndex !== '-1'
}

/**
 * The A button.
 *
 * A console has exactly one "yes" button, and whatever screen is in front of
 * the player, pressing it does the obvious thing. This game had two half
 * answers instead: a window-level Space listener that stood down the moment
 * *any* control had focus, and each modal's focus trap, which put focus on
 * whichever element happened to come first in its DOM. Between them, Space
 * rolled the board die only in the narrow window where nothing at all was
 * focused, and the die inside a modal answered a click but not a key — the
 * exact complaint in issue #33.
 *
 * So the two halves are made one thing. A screen names its primary action —
 * the die, Continue, the first choice on a card — and this hook:
 *
 *  - puts focus on it when it becomes available, so the keyboard is already
 *    pointed at the obvious thing and the focus ring says where it is;
 *  - answers **both** Space and Enter from anywhere on the page, so the key
 *    reaches it even when focus has been lost (a button disabled mid-roll
 *    drops focus to `<body>`, which is precisely how the board die ended up
 *    unpressable) or landed on some inert region;
 *  - stands down for a control the player actually chose — a text field, or
 *    another button they tabbed to — so it can never eat a keystroke somebody
 *    meant for something else.
 *
 * Both keys are handled here rather than left to the browser's own button
 * activation, deliberately: `preventDefault()` on the keydown suppresses that
 * native activation, so there is exactly one press whether or not the element
 * itself had focus, and one code path to reason about instead of two.
 *
 * `active` is what makes this safe to use in several places at once — at most
 * one primary action should be live at a time, and every caller here computes
 * that from the phase it is rendered in.
 */
export function usePrimaryAction<T extends HTMLElement>(active: boolean): RefObject<T | null> {
  const ref = useRef<T | null>(null)

  // Focus follows availability. Never *steals* focus: if something is already
  // focused — a modal's own close button, a name field being typed into — it
  // stays focused, and the key handler below still routes the press here.
  useEffect(() => {
    if (!active) return
    const element = ref.current
    if (!element) return
    const focused = document.activeElement
    if (focused !== null && focused !== document.body && focused !== document.documentElement) return
    element.focus()
  }, [active])

  useEffect(() => {
    if (!active) return

    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== ' ' && event.key !== 'Enter') return
      // A held key must not fire the action over and over; and something
      // upstream (a focus trap answering Escape, say) that already claimed
      // this press keeps it.
      if (event.repeat || event.defaultPrevented) return

      const element = ref.current
      if (!element) return

      const focused = document.activeElement
      if (focused !== element) {
        if (isTypingTarget(focused)) return
        if (isInteractive(focused)) return
      }

      event.preventDefault()
      element.click()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [active])

  return ref
}
