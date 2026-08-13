import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

/**
 * Architecture fitness functions.
 *
 * Clean architecture only stays clean if something enforces it. These tests read
 * the source tree and fail the build the moment a dependency points the wrong
 * way — which is cheaper than discovering it during a refactor two months from
 * now.
 */

const SRC = new URL('..', import.meta.url).pathname

type Layer = 'domain' | 'application' | 'infrastructure' | 'presentation'

/** Which layers each layer is permitted to import from. */
const ALLOWED: Record<Layer, readonly Layer[]> = {
  domain: ['domain'],
  application: ['domain', 'application'],
  infrastructure: ['domain', 'application', 'infrastructure'],
  presentation: ['domain', 'application', 'presentation'],
}

/** Globals that would tie a pure layer to a browser or to real time. */
const IMPURE_GLOBALS = [
  'window',
  'document',
  'localStorage',
  'sessionStorage',
  'navigator',
  'Math.random',
  'Date.now',
  'new Date',
  'setTimeout',
  'AudioContext',
] as const

const collectFiles = (dir: string): string[] => {
  let out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      out = out.concat(collectFiles(full))
      continue
    }
    if (/\.tsx?$/.test(entry)) out.push(full)
  }
  return out
}

const sourceFilesIn = (layer: Layer): string[] => {
  try {
    return collectFiles(join(SRC, layer)).filter((f) => !/\.test\.tsx?$/.test(f))
  } catch {
    // The layer has not landed yet; the per-layer suites will catch that.
    return []
  }
}

const IMPORT_PATTERN = /(?:from|import)\s+['"]([^'"]+)['"]/g

const importsOf = (file: string): string[] => {
  const source = readFileSync(file, 'utf8')
  return [...source.matchAll(IMPORT_PATTERN)].map((match) => match[1] as string)
}

/** Resolves an import specifier to the layer it reaches into, if any. */
const layerOf = (specifier: string, fromFile: string): Layer | null => {
  const aliased = specifier.match(/^@(domain|application|infrastructure|presentation)\//)
  if (aliased) return aliased[1] as Layer

  if (!specifier.startsWith('.')) return null

  const resolved = relative(SRC, join(fromFile, '..', specifier))
  const top = resolved.split('/')[0]
  if (top === 'domain' || top === 'application' || top === 'infrastructure' || top === 'presentation') {
    return top
  }
  return null
}

describe('layer dependencies', () => {
  for (const layer of Object.keys(ALLOWED) as Layer[]) {
    it(`${layer} only imports from ${ALLOWED[layer].join(', ')}`, () => {
      const violations: string[] = []

      for (const file of sourceFilesIn(layer)) {
        for (const specifier of importsOf(file)) {
          const target = layerOf(specifier, file)
          if (target && !ALLOWED[layer].includes(target)) {
            violations.push(`${relative(SRC, file)} imports ${specifier} (${target})`)
          }
        }
      }

      expect(violations).toEqual([])
    })
  }
})

describe('inner layers stay pure', () => {
  for (const layer of ['domain', 'application'] as const) {
    it(`${layer} touches no browser or ambient-time globals`, () => {
      const violations: string[] = []

      for (const file of sourceFilesIn(layer)) {
        const source = readFileSync(file, 'utf8')
        for (const global of IMPURE_GLOBALS) {
          // Word-boundary match so `documentation` or `windowSize` do not trip it.
          const pattern = new RegExp(`(?<![\\w.])${global.replace('.', '\\.')}(?![\\w])`)
          if (pattern.test(source)) {
            violations.push(`${relative(SRC, file)} references ${global}`)
          }
        }
      }

      expect(violations).toEqual([])
    })
  }

  it('domain imports nothing outside itself', () => {
    const external: string[] = []

    for (const file of sourceFilesIn('domain')) {
      for (const specifier of importsOf(file)) {
        const isRelative = specifier.startsWith('.')
        const isOwnAlias = specifier.startsWith('@domain/')
        if (!isRelative && !isOwnAlias) {
          external.push(`${relative(SRC, file)} imports ${specifier}`)
        }
      }
    }

    expect(external).toEqual([])
  })

  it('react never reaches the domain or application layers', () => {
    const violations: string[] = []

    for (const layer of ['domain', 'application'] as const) {
      for (const file of sourceFilesIn(layer)) {
        const reactImports = importsOf(file).filter((s) => s === 'react' || s.startsWith('react/'))
        if (reactImports.length > 0) violations.push(relative(SRC, file))
      }
    }

    expect(violations).toEqual([])
  })
})
