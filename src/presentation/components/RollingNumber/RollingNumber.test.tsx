import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { formatMoney } from '../../format'
import { RollingNumber } from './RollingNumber'
import styles from './RollingNumber.module.css'

function mockReducedMotion(matches: boolean): void {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: () => {},
    removeEventListener: () => {},
  })
}

describe('RollingNumber', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders the formatted initial value', () => {
    mockReducedMotion(true)
    render(<RollingNumber value={10000} format={formatMoney} />)
    expect(screen.getByText('$10,000')).toBeInTheDocument()
  })

  it('updates instantly to the new formatted value when reduced motion is preferred', () => {
    mockReducedMotion(true)
    const { rerender } = render(<RollingNumber value={10000} format={formatMoney} />)
    rerender(<RollingNumber value={12000} format={formatMoney} />)
    expect(screen.getByText('$12,000')).toBeInTheDocument()
  })

  it('eventually animates to the new value when it increases', async () => {
    mockReducedMotion(false)
    const { rerender } = render(<RollingNumber value={100} duration={0.05} />)
    rerender(<RollingNumber value={200} duration={0.05} />)

    await waitFor(() => expect(screen.getByText('200')).toBeInTheDocument(), { timeout: 2000 })
  })

  it('settles on the exact formatted target once a completed roll finishes, never one dollar short', async () => {
    mockReducedMotion(false)
    const { rerender } = render(<RollingNumber value={0} format={formatMoney} duration={0.05} />)
    rerender(<RollingNumber value={10000} format={formatMoney} duration={0.05} />)

    await waitFor(() => expect(screen.getByText('$10,000')).toBeInTheDocument(), { timeout: 2000 })
    // Give the animation a moment past its declared duration and confirm the
    // settled string is still pinned to the exact target, not a near miss.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(screen.getByText('$10,000')).toBeInTheDocument()
  })

  it('never leaves a stale value on screen when a roll is interrupted by another change', async () => {
    mockReducedMotion(false)
    const { rerender } = render(<RollingNumber value={0} format={formatMoney} duration={0.2} />)
    rerender(<RollingNumber value={10000} format={formatMoney} duration={0.2} />)
    // Interrupt mid-flight with a new target before the first roll settles.
    rerender(<RollingNumber value={7000} format={formatMoney} duration={0.05} />)

    await waitFor(() => expect(screen.getByText('$7,000')).toBeInTheDocument(), { timeout: 2000 })
  })

  it('flashes upward when the value increases', async () => {
    mockReducedMotion(true)
    const { rerender, container } = render(<RollingNumber value={100} />)
    rerender(<RollingNumber value={200} />)

    await waitFor(() => {
      const el = container.querySelector(`.${styles.flashUp}`)
      expect(el).not.toBeNull()
    })
  })

  it('flashes downward when the value decreases', async () => {
    mockReducedMotion(true)
    const { rerender, container } = render(<RollingNumber value={200} />)
    rerender(<RollingNumber value={100} />)

    await waitFor(() => {
      const el = container.querySelector(`.${styles.flashDown}`)
      expect(el).not.toBeNull()
    })
  })
})
