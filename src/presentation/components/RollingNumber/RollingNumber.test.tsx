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

  /*
   * B3. Mid-count values — "$49,456", "$85,194" — were reported rendering
   * outside the pill that contains them, because the box resized every time
   * the count gained or lost a digit and the kick was a flat 9px whatever
   * the type size was.
   */
  describe('holding its own frame while the digits turn', () => {
    it('reserves the width of the wider of the two ends, not just the target', () => {
      mockReducedMotion(false)
      const { container, rerender } = render(
        <RollingNumber value={100_000} format={formatMoney} duration={0.05} />,
      )
      rerender(<RollingNumber value={5} format={formatMoney} duration={0.05} />)

      // '$100,000' is eight characters; '$5' is two. A box sized for the
      // target alone would collapse through every value in between.
      const el = container.firstElementChild as HTMLElement
      expect(el.style.minWidth).toBe('8ch')
    })

    it('reserves the target when the count is growing', () => {
      mockReducedMotion(false)
      const { container, rerender } = render(
        <RollingNumber value={1_000} format={formatMoney} duration={0.05} />,
      )
      rerender(<RollingNumber value={85_194} format={formatMoney} duration={0.05} />)

      const el = container.firstElementChild as HTMLElement
      expect(el.style.minWidth).toBe('7ch')
    })

    it('starts out sized for the figure it was given', () => {
      mockReducedMotion(true)
      const { container } = render(<RollingNumber value={10_000} format={formatMoney} />)

      const el = container.firstElementChild as HTMLElement
      expect(el.style.minWidth).toBe('7ch')
    })
  })
})
