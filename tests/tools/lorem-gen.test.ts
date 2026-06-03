import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('lorem-gen tool', () => {
  const tool = getTool('lorem-gen')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('lorem-gen')
    expect(tool?.category).toBe('dev')
  })

  it('should generate default lorem ipsum', async () => {
    const result = await tool!.execute({})
    const parsed = JSON.parse(result.text!)
    expect(parsed.paragraphs).toBe(3)
    expect(parsed.sentencesPerParagraph).toBe(4)
    expect(parsed.text).toBeDefined()
    expect(typeof parsed.text).toBe('string')
    // Should have 2 paragraph separators
    const paraCount = parsed.text.split('\n\n').length
    expect(paraCount).toBe(3)
  })

  it('should respect paragraph count', async () => {
    const result = await tool!.execute({ paragraphs: 5, sentencesPerParagraph: 2 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.paragraphs).toBe(5)
    const paraCount = parsed.text.split('\n\n').length
    expect(paraCount).toBe(5)
  })

  it('should generate text with proper sentences', async () => {
    const result = await tool!.execute({ paragraphs: 1, sentencesPerParagraph: 1 })
    const parsed = JSON.parse(result.text!)
    // Should end with a period
    expect(parsed.text.trim()).toMatch(/\.$/)
    // Should start with a capital letter
    expect(parsed.text.trim()).toMatch(/^[A-Z]/)
  })
})
