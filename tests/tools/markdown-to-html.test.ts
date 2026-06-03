import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('markdown-to-html tool', () => {
  const tool = getTool('markdown-to-html')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('markdown-to-html')
    expect(tool?.category).toBe('text')
  })

  it('should convert markdown headings', async () => {
    const result = await tool!.execute({
      text: '# Hello World',
    })
    expect(result.text).toContain('<h1')
    expect(result.text).toContain('Hello World')
  })

  it('should convert bold and italic', async () => {
    const result = await tool!.execute({
      text: '**bold** and *italic*',
    })
    expect(result.text).toContain('<strong>bold</strong>')
    expect(result.text).toContain('<em>italic</em>')
  })

  it('should convert links', async () => {
    const result = await tool!.execute({
      text: '[link](https://example.com)',
    })
    expect(result.text).toContain('<a')
    expect(result.text).toContain('https://example.com')
  })

  it('should convert code blocks', async () => {
    const result = await tool!.execute({
      text: '```js\nconsole.log("hi")\n```',
    })
    expect(result.text).toContain('<code')
    expect(result.text).toContain('console.log')
  })

  it('should convert lists', async () => {
    const result = await tool!.execute({
      text: '- item 1\n- item 2',
    })
    expect(result.text).toContain('<ul')
    expect(result.text).toContain('<li')
  })
})
