import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('text-count tool', () => {
  const tool = getTool('text-count')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('text-count')
    expect(tool?.category).toBe('text')
  })

  it('should count characters', async () => {
    const result = await tool!.execute({ text: 'hello' })
    const stats = JSON.parse(result.text!)
    expect(stats.characters).toBe(5)
    expect(stats.charactersNoSpaces).toBe(5)
  })

  it('should count words', async () => {
    const result = await tool!.execute({ text: 'hello world foo' })
    const stats = JSON.parse(result.text!)
    expect(stats.words).toBe(3)
  })

  it('should count lines', async () => {
    const result = await tool!.execute({ text: 'line1\nline2\nline3' })
    const stats = JSON.parse(result.text!)
    expect(stats.lines).toBe(3)
  })

  it('should count sentences', async () => {
    const result = await tool!.execute({ text: 'Hello world. How are you? Fine!' })
    const stats = JSON.parse(result.text!)
    expect(stats.sentences).toBe(3)
  })

  it('should count paragraphs', async () => {
    const result = await tool!.execute({ text: 'para1\n\npara2\n\npara3' })
    const stats = JSON.parse(result.text!)
    expect(stats.paragraphs).toBe(3)
  })

  it('should handle empty text', async () => {
    const result = await tool!.execute({ text: '' })
    const stats = JSON.parse(result.text!)
    expect(stats.characters).toBe(0)
    expect(stats.words).toBe(0)
    expect(stats.lines).toBe(0)
    expect(stats.sentences).toBe(0)
    expect(stats.paragraphs).toBe(0)
  })

  it('should count characters without spaces', async () => {
    const result = await tool!.execute({ text: 'a b c' })
    const stats = JSON.parse(result.text!)
    expect(stats.characters).toBe(5)
    expect(stats.charactersNoSpaces).toBe(3)
  })
})
