import { createContext, useContext, type ReactElement, type ReactNode } from 'react'
import type { AudioPort } from '@application/ports/AudioPort'

const AudioContext = createContext<AudioPort | null>(null)

/** Makes the injected `AudioPort` available to any descendant via `useAudio`. */
export function AudioProvider({
  audio,
  children,
}: {
  audio: AudioPort
  children: ReactNode
}): ReactElement {
  return <AudioContext.Provider value={audio}>{children}</AudioContext.Provider>
}

/** Reads the `AudioPort` injected by the nearest `AudioProvider`. */
export function useAudio(): AudioPort {
  const audio = useContext(AudioContext)
  if (!audio) throw new Error('useAudio must be used within an AudioProvider')
  return audio
}
