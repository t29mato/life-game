import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { motionValue } from 'framer-motion'
import { describe, expect, it, vi } from 'vitest'
import { ZoomControls } from './ZoomControls'
import { USER_ZOOM_FIT, USER_ZOOM_MAX } from './camera'

function renderControls(zoom = USER_ZOOM_FIT) {
  const value = motionValue(zoom)
  const onZoomIn = vi.fn()
  const onZoomOut = vi.fn()
  const onReset = vi.fn()
  const onRecentre = vi.fn()
  render(
    <ZoomControls
      zoom={value}
      onZoomIn={onZoomIn}
      onZoomOut={onZoomOut}
      onReset={onReset}
      onRecentre={onRecentre}
      recentreLabel="Back to Ada's car"
    />,
  )
  return { value, onZoomIn, onZoomOut, onReset, onRecentre }
}

describe('ZoomControls', () => {
  it('offers closer, further, back-to-fit and back-to-my-car, each by name', () => {
    renderControls()

    const rail = screen.getByRole('group', { name: 'Map zoom' })
    expect(rail).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset zoom to fit' })).toBeInTheDocument()
    // Named after the car rather than after the camera: a player who has
    // panned away is looking for themselves, not for a control.
    expect(screen.getByRole('button', { name: "Back to Ada's car" })).toBeInTheDocument()
  })

  /**
   * The reported way to get lost (issue #25): pan across the map to read a
   * tile, and there was nothing that took you back to your own car — the
   * camera only re-frames when the phase changes, and reset-to-fit goes back
   * to the last shot the *camera* took, dropping the player's zoom on the way.
   */
  it('asks to be taken back to the active car, whatever the zoom is', async () => {
    const user = userEvent.setup()
    const { onRecentre } = renderControls(USER_ZOOM_MAX)

    const key = screen.getByRole('button', { name: "Back to Ada's car" })
    expect(key).toBeEnabled()
    await user.click(key)

    expect(onRecentre).toHaveBeenCalledTimes(1)
  })

  it('reports the level as a percentage of the framing the camera itself chose', () => {
    renderControls(1.5)

    expect(screen.getByRole('status')).toHaveTextContent('150%')
  })

  /**
   * The reason the level is a `MotionValue` at all: a pinch changes it on
   * every pointer frame, and the board around these controls is thousands of
   * SVG nodes that must not re-render for it. So the readout has to follow a
   * value that changes underneath it, with no new props and no re-render of
   * anything above.
   */
  it('follows the zoom as it changes without being handed a new prop', () => {
    const { value } = renderControls()
    expect(screen.getByRole('status')).toHaveTextContent('100%')

    act(() => value.set(2.4))

    expect(screen.getByRole('status')).toHaveTextContent('240%')
  })

  it('asks for a step in, out, or all the way back when its keys are pressed', async () => {
    const user = userEvent.setup()
    const { onZoomIn, onZoomOut, onReset } = renderControls(2)

    await user.click(screen.getByRole('button', { name: 'Zoom in' }))
    await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    await user.click(screen.getByRole('button', { name: 'Reset zoom to fit' }))

    expect(onZoomIn).toHaveBeenCalledTimes(1)
    expect(onZoomOut).toHaveBeenCalledTimes(1)
    expect(onReset).toHaveBeenCalledTimes(1)
  })

  /**
   * At fit there is nothing left to pull back to, and the map is already at
   * the framing the camera picked — a lit zoom-out key there would promise
   * something no press could deliver.
   */
  it('stops offering to pull back once the map is at fit', () => {
    renderControls(USER_ZOOM_FIT)

    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeEnabled()
  })

  it('stops offering to close in once the map is as close as it goes', () => {
    renderControls(USER_ZOOM_MAX)

    expect(screen.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeEnabled()
  })

  /**
   * Reset is the exception to that symmetry, deliberately: a free-look drag
   * can leave the map off its mark at a zoom of exactly fit, and this is the
   * only control that puts it back.
   */
  it('keeps offering a reset even at fit, because a pan is not a zoom', () => {
    renderControls(USER_ZOOM_FIT)

    expect(screen.getByRole('button', { name: 'Reset zoom to fit' })).toBeEnabled()
  })

  it('is reachable and operable from the keyboard alone', async () => {
    const user = userEvent.setup()
    const { onZoomIn } = renderControls()

    await user.tab()
    expect(screen.getByRole('button', { name: 'Zoom in' })).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(onZoomIn).toHaveBeenCalledTimes(1)
  })
})
