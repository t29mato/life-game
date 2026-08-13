import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { useModalFocusTrap } from './useModalFocusTrap'

function Dialog({ onEscape }: { onEscape?: () => void }) {
  const ref = useModalFocusTrap<HTMLDivElement>(onEscape)
  return (
    <div ref={ref}>
      <button>First</button>
      <button>Second</button>
    </div>
  )
}

describe('useModalFocusTrap', () => {
  it('focuses the first focusable element on mount', () => {
    render(<Dialog />)
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  it('wraps focus from the last element back to the first on Tab', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    screen.getByRole('button', { name: 'Second' }).focus()

    await user.tab()

    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
  })

  it('wraps focus from the first element back to the last on Shift+Tab', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()

    await user.tab({ shift: true })

    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
  })

  it('calls onEscape when Escape is pressed and a handler is provided', async () => {
    const user = userEvent.setup()
    const onEscape = vi.fn()
    render(<Dialog onEscape={onEscape} />)

    await user.keyboard('{Escape}')

    expect(onEscape).toHaveBeenCalledTimes(1)
  })

  it('does nothing on Escape when no handler is provided', async () => {
    const user = userEvent.setup()
    render(<Dialog />)
    await user.keyboard('{Escape}')
    // No assertion needed beyond "did not throw" — absence of a crash.
    expect(screen.getByRole('button', { name: 'First' })).toBeInTheDocument()
  })
})
