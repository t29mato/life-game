import { useState, type ReactElement } from 'react'
import { useAudio } from '../../hooks/useAudio'
import { UiIcon } from '../../icons/ui'
import styles from './AudioToggle.module.css'

/** Independent music/SFX toggles, reflecting the injected `AudioPort`'s state. */
export function AudioToggle(): ReactElement {
  const audio = useAudio()
  const [musicOn, setMusicOn] = useState(() => audio.isMusicEnabled())
  const [sfxOn, setSfxOn] = useState(() => audio.isSfxEnabled())

  return (
    <div className={styles.row} role="group" aria-label="Audio settings">
      <button
        type="button"
        className={`${styles.toggle} ${musicOn ? styles.on : styles.off}`}
        aria-pressed={musicOn}
        onClick={() => {
          const next = !musicOn
          audio.setMusicEnabled(next)
          setMusicOn(next)
        }}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.knob}>
            <UiIcon name={musicOn ? 'music-on' : 'music-off'} size={13} />
          </span>
        </span>
        <span className={styles.label}>
          Music <span className={styles.state}>{musicOn ? 'On' : 'Off'}</span>
        </span>
      </button>
      <button
        type="button"
        className={`${styles.toggle} ${sfxOn ? styles.on : styles.off}`}
        aria-pressed={sfxOn}
        onClick={() => {
          const next = !sfxOn
          audio.setSfxEnabled(next)
          setSfxOn(next)
        }}
      >
        <span className={styles.track} aria-hidden="true">
          <span className={styles.knob}>
            <UiIcon name={sfxOn ? 'sfx-on' : 'sfx-off'} size={13} />
          </span>
        </span>
        <span className={styles.label}>
          SFX <span className={styles.state}>{sfxOn ? 'On' : 'Off'}</span>
        </span>
      </button>
    </div>
  )
}
