import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('word-cloud tool', () => {
  const tool = getTool('word-cloud')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('word-cloud')
    expect(tool?.category).toBe('craft')
  })

  it('should generate SVG word cloud', async () => {
    const text = 'hello world testing word cloud generation with enough words to make it interesting and colorful'
    const result = await tool!.execute({ text })
    expect(result.text).toBeDefined()
    expect(result.mimeType).toBe('image/svg+xml')
    expect(result.filename).toBe('word-cloud.svg')
    expect(result.text).toContain('<svg')
    expect(result.text).toContain('</svg>')
  })

  it('should respect maxWords parameter', async () => {
    const text = 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen'
    const result = await tool!.execute({ text, maxWords: 5 })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('<svg')
  })

  it('should reject text shorter than 10 chars', async () => {
    await expect(tool!.execute({ text: 'short' })).rejects.toThrow()
  })

  it('should reject text over 10000 chars', async () => {
    const longText = 'word '.repeat(2500)
    await expect(tool!.execute({ text: longText })).rejects.toThrow()
  })
})
