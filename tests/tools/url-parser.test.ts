import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('url-parser tool', () => {
  const tool = getTool('url-parser')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('url-parser')
    expect(tool?.category).toBe('dev')
  })

  it('should parse a full URL', async () => {
    const result = await tool!.execute({ text: 'https://example.com:8080/path?foo=bar&baz=qux#section' })
    const parsed = JSON.parse(result.text!)
    expect(parsed.protocol).toBe('https:')
    expect(parsed.hostname).toBe('example.com')
    expect(parsed.port).toBe('8080')
    expect(parsed.pathname).toBe('/path')
    expect(parsed.query).toEqual({ foo: 'bar', baz: 'qux' })
    expect(parsed.hash).toBe('#section')
  })

  it('should parse a simple URL', async () => {
    const result = await tool!.execute({ text: 'https://example.com/' })
    const parsed = JSON.parse(result.text!)
    expect(parsed.protocol).toBe('https:')
    expect(parsed.hostname).toBe('example.com')
    expect(parsed.query).toBeNull()
    expect(parsed.hash).toBeNull()
  })

  it('should parse URL with port', async () => {
    const result = await tool!.execute({ text: 'http://localhost:3000/api/test' })
    const parsed = JSON.parse(result.text!)
    expect(parsed.port).toBe('3000')
    expect(parsed.pathname).toBe('/api/test')
  })
})
