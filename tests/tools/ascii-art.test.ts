import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('ascii-art tool', () => {
  const tool = getTool('ascii-art')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('ascii-art')
    expect(tool?.category).toBe('dev')
  })

  it('should generate ASCII art with default font', async () => {
    const result = await tool!.execute({ text: 'Hello' })
    expect(result.text).toBeDefined()
    expect(result.text!.length).toBeGreaterThan(0)
    // figlet output should contain some block characters
    expect(result.text).toMatch(/[A-Za-z#|/_\\]/)
  })

  it('should generate ASCII art with specified font', async () => {
    const result = await tool!.execute({ text: 'Test', font: 'Big' })
    expect(result.text).toBeDefined()
    expect(result.text!.length).toBeGreaterThan(0)
  })

  it('should reject empty text', async () => {
    await expect(tool!.execute({ text: '' })).rejects.toThrow()
  })

  it('should reject text over 200 chars', async () => {
    const longText = 'a'.repeat(201)
    await expect(tool!.execute({ text: longText })).rejects.toThrow()
  })
})
