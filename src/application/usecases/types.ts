import type { RandomPort } from '../ports/RandomPort'

/** Every use case that touches randomness takes exactly this. */
export interface UseCaseDeps {
  readonly random: RandomPort
}
