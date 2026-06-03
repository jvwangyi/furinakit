import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('url-encode tool', () => {
  const tool = getTool('url-encode')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('url-encode')
    expect(tool?.category).toBe('text')
  })

  it('should encode URL string', async () => {
    const result = await tool!.execute({
      text: 'Hello World',
      action: 'encode',
    })
    expect(result.text).toBe('Hello%20World')
  })

  it('should decode URL string', async () => {
    const result = await tool!.execute({
      text: 'Hello%20World',
      action: 'decode',
    })
    expect(result.text).toBe('Hello World')
  })

  it('should encode special characters', async () => {
    const result = await tool!.execute({
      text: 'key=value&foo=bar',
      action: 'encode',
    })
    expect(result.text).toContain('key%3Dvalue')
    expect(result.text).toContain('foo%3Dbar')
  })
})
