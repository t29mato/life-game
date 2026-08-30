import type { ReactElement } from 'react'
import type { DriverFace } from '@domain/model/types'
import styles from './Pawn.module.css'

/**
 * The expression moulded onto a driver peg's head, drawn about the head's own
 * centre and sized by its radius `r` — so the same face fits a board-scale
 * peg and a setup-screen picker chip without either knowing the other's size.
 *
 * `classic` draws nothing at all: the factory look *is* the absence of a
 * face, which keeps every passenger peg (and every pre-design save) exactly
 * as it always was. Everything else is two or three strokes in the same dark
 * ink as the tyres — features printed on the moulding, not stickers over it.
 */
export function FaceFeatures({ face, r }: { face: DriverFace; r: number }): ReactElement | null {
  if (face === 'classic') return null

  const stroke = r * 0.18

  const dotEyes = (
    <>
      <circle className={styles.faceInk} cx={-0.36 * r} cy={-0.1 * r} r={0.15 * r} />
      <circle className={styles.faceInk} cx={0.36 * r} cy={-0.1 * r} r={0.15 * r} />
    </>
  )

  return (
    <g className={styles.face} data-face={face}>
      {face === 'cheerful' ? (
        <>
          {dotEyes}
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${-0.36 * r} ${0.26 * r} Q 0 ${0.62 * r} ${0.36 * r} ${0.26 * r}`}
          />
        </>
      ) : null}

      {face === 'determined' ? (
        <>
          {/* Brows angled in toward the bridge: the whole expression. */}
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${-0.54 * r} ${-0.44 * r} L ${-0.18 * r} ${-0.28 * r}`}
          />
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${0.54 * r} ${-0.44 * r} L ${0.18 * r} ${-0.28 * r}`}
          />
          {dotEyes}
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${-0.24 * r} ${0.38 * r} L ${0.24 * r} ${0.38 * r}`}
          />
        </>
      ) : null}

      {face === 'cool' ? (
        <>
          {/* One visor-style lens band, rather than two tiny rectangles that
              would smear into a blob at board scale. */}
          <rect
            className={styles.faceInk}
            x={-0.62 * r}
            y={-0.3 * r}
            width={1.24 * r}
            height={0.42 * r}
            rx={0.16 * r}
          />
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${-0.2 * r} ${0.4 * r} Q 0 ${0.56 * r} ${0.2 * r} ${0.4 * r}`}
          />
        </>
      ) : null}

      {face === 'surprised' ? (
        <>
          <circle className={styles.faceInk} cx={-0.36 * r} cy={-0.14 * r} r={0.19 * r} />
          <circle className={styles.faceInk} cx={0.36 * r} cy={-0.14 * r} r={0.19 * r} />
          <circle className={styles.faceInk} cx={0} cy={0.38 * r} r={0.17 * r} />
        </>
      ) : null}

      {face === 'sleepy' ? (
        <>
          {/* Lids drawn shut, bowed gently downward — content, not bored. */}
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${-0.52 * r} ${-0.12 * r} Q ${-0.34 * r} ${0.1 * r} ${-0.16 * r} ${-0.12 * r}`}
          />
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${0.16 * r} ${-0.12 * r} Q ${0.34 * r} ${0.1 * r} ${0.52 * r} ${-0.12 * r}`}
          />
          <path
            className={styles.faceStroke}
            strokeWidth={stroke}
            d={`M ${-0.16 * r} ${0.4 * r} Q 0 ${0.52 * r} ${0.16 * r} ${0.4 * r}`}
          />
        </>
      ) : null}
    </g>
  )
}
