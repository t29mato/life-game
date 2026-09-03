import { useEffect, useState, type ReactElement } from 'react'
import type { MotionValue } from 'framer-motion'
import { UiIcon } from '../../icons/ui'
import { useUi } from '../../i18n/LocaleProvider'
import { USER_ZOOM_FIT, USER_ZOOM_MAX } from './camera'
import styles from './ZoomControls.module.css'

export interface ZoomControlsProps {
  /**
   * How far the player has zoomed in, `USER_ZOOM_FIT` being the map as the
   * camera itself framed it.
   *
   * A `MotionValue` rather than a plain number on purpose. The board draws
   * several thousand SVG nodes, and the whole camera above these controls is
   * built to move *without* re-rendering any of them — the shot is written
   * straight onto a group's `transform` attribute for exactly that reason.
   * A pinch or a trackpad zoom changes this value on every pointer frame; as
   * an ordinary prop that would re-render the board itself dozens of times a
   * second to update a four-character readout. Subscribed to here instead,
   * only this little panel repaints.
   */
  readonly zoom: MotionValue<number>
  readonly onZoomIn: () => void
  readonly onZoomOut: () => void
  /** Back to the framing the camera chose — which also lets go of any free-look pan. */
  readonly onReset: () => void
  /** Back to the car whose turn it is, keeping whatever zoom the player chose. */
  readonly onRecentre: () => void
  /** Names the car it goes back to, so the key says whose it is rather than "recentre". */
  readonly recentreLabel: string
}

/**
 * The map's own zoom rail: closer, further, and back to the frame the camera
 * picked.
 *
 * Buttons are the baseline rather than the fallback. The board already
 * answers a wheel, a trackpad pinch and two fingers (see `Board.tsx`), but a
 * gesture is invisible — nothing on screen says the map can be zoomed at all
 * until something visibly offers it — and none of those gestures is reachable
 * from a keyboard. This rail is what makes the feature discoverable and
 * operable; the gestures are the shortcut for people who already know.
 *
 * It sits on the board rather than in the header with the other chrome
 * because it acts on the map and nothing else, and because the board is
 * where a player's hand already is when they want a closer look.
 */
export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onReset,
  onRecentre,
  recentreLabel,
}: ZoomControlsProps): ReactElement {
  const t = useUi()
  const [level, setLevel] = useState(() => zoom.get())
  useEffect(() => zoom.on('change', setLevel), [zoom])

  const atFit = level <= USER_ZOOM_FIT
  const atLimit = level >= USER_ZOOM_MAX

  return (
    <div className={styles.rail} role="group" aria-label={t.board.zoomGroup}>
      <button
        type="button"
        className={styles.key}
        aria-label={t.board.zoomIn}
        disabled={atLimit}
        onClick={onZoomIn}
      >
        <UiIcon name="plus" size={16} />
      </button>
      <button
        type="button"
        className={styles.key}
        aria-label={t.board.zoomOut}
        disabled={atFit}
        onClick={onZoomOut}
      >
        <UiIcon name="minus" size={16} />
      </button>
      {/* Never disabled, even at fit: a free-look drag can leave the map off
          its mark without changing the zoom at all, and this is the one
          control that puts it back. */}
      <button
        type="button"
        className={styles.key}
        aria-label={t.board.zoomReset}
        onClick={onReset}
      >
        <UiIcon name="zoom-fit" size={16} />
      </button>
      {/* The way home. A player who pans off to read a tile elsewhere on the
          map had no way back to their own car until they rolled — and their
          car can be off screen entirely by then, which is exactly what the
          playtest reported. Named after the car rather than after the camera
          ("Back to Ada's car", not "Recentre"): the player is not thinking
          about a camera, they are looking for themselves. */}
      <button
        type="button"
        className={styles.key}
        aria-label={recentreLabel}
        onClick={onRecentre}
      >
        <UiIcon name="recentre" size={16} />
      </button>
      {/* Announced when it changes: a player who cannot see the map move
          otherwise has no way to tell a press did anything. The percentage
          is of the camera's own framing, not of anything absolute — 100% is
          "as the game frames it", which is the only figure a player here
          has any use for. */}
      <span className={styles.level} role="status">
        {Math.round(level * 100)}%
      </span>
    </div>
  )
}
