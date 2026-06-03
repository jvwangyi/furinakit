import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('password-gen tool', () => {
  const tool = getTool('password-gen')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('password-gen')
    expect(tool?.category).toBe('dev')
  })

  it('should generate password with default options', async () => {
    const result = await tool!.execute({})
    const parsed = JSON.parse(result.text!)

    expect(parsed.count).toBe(1)
    expect(parsed.passwords).toHaveLength(1)
    expect(parsed.passwords[0]).toHaveLength(16)
  })

  it('should generate password with custom length', async () => {
    const result = await tool!.execute({ length: 32 })
    const parsed = JSON.parse(result.text!)

    expect(parsed.passwords[0]).toHaveLength(32)
  })

  it('should generate multiple passwords', async () => {
    const result = await tool!.execute({ count: 3 })
    const parsed = JSON.parse(result.text!)

    expect(parsed.passwords).toHaveLength(3)

    // All should be unique (extremely unlikely to be same)
    const unique = new Set(parsed.passwords)
    expect(unique.size).toBe(3)
  })

  it('should generate uppercase-only password', async () => {
    const result = await tool!.execute({
      length: 20,
      uppercase: true,
      lowercase: false,
      numbers: false,
      symbols: false,
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.passwords[0]).toMatch(/^[A-Z]+$/)
  })

  it('should generate numbers-only password', async () => {
    const result = await tool!.execute({
      length: 10,
      uppercase: false,
      lowercase: false,
      numbers: true,
      symbols: false,
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.passwords[0]).toMatch(/^[0-9]+$/)
  })
})
