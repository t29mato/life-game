// Public surface of the domain layer. Application code should import from
// `@domain` (or `@domain/index`) rather than reaching into subfolders.

export * from './model/types'
export * from './model/constants'

export * from './edition/types'
export * from './edition/registry'
export * from './edition/lookup'
export * from './edition/usa'

export * from './board/movementTypes'
export { createBoard } from './board/createBoard'
export { planMovement, planMovementVia } from './board/movement'

export * from './rules/player'
export * from './rules/scoring'
