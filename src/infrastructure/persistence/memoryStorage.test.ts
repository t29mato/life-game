import { describe, expect, it } from 'vitest'
import { createMemoryStorage } from './memoryStorage'

describe('createMemoryStorage', () => {
  it('returns null for a key that was never set', () => {
    expect(createMemoryStorage().getItem('missing')).toBeNull()
  })

  it('round-trips a value through setItem/getItem', () => {
    const storage = createMemoryStorage()
    storage.setItem('a', 'hello')
    expect(storage.getItem('a')).toBe('hello')
  })

  it('overwrites an existing value', () => {
    const storage = createMemoryStorage()
    storage.setItem('a', 'first')
    storage.setItem('a', 'second')
    expect(storage.getItem('a')).toBe('second')
  })

  it('removes an item', () => {
    const storage = createMemoryStorage()
    storage.setItem('a', 'hello')
    storage.removeItem('a')
    expect(storage.getItem('a')).toBeNull()
  })

  it('clears every item', () => {
    const storage = createMemoryStorage()
    storage.setItem('a', '1')
    storage.setItem('b', '2')
    storage.clear()
    expect(storage.getItem('a')).toBeNull()
    expect(storage.getItem('b')).toBeNull()
    expect(storage.length).toBe(0)
  })

  it('reports length', () => {
    const storage = createMemoryStorage()
    expect(storage.length).toBe(0)
    storage.setItem('a', '1')
    storage.setItem('b', '2')
    expect(storage.length).toBe(2)
  })

  it('exposes stored keys through key(index)', () => {
    const storage = createMemoryStorage()
    storage.setItem('a', '1')
    expect(storage.key(0)).toBe('a')
    expect(storage.key(1)).toBeNull()
  })

  it('keeps separate instances independent', () => {
    const a = createMemoryStorage()
    const b = createMemoryStorage()
    a.setItem('shared', 'from-a')
    expect(b.getItem('shared')).toBeNull()
  })
})
