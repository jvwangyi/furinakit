import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('base64 tool', () => {
  const tool = getTool('base64')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('base64')
    expect(tool?.category).toBe('text')
  })

  it('should encode text to base64', async () => {
    const result = await tool!.execute({
      text: 'Hello World',
      action: 'encode',
    })
    expect(result.text).toBe('SGVsbG8gV29ybGQ=')
  })

  it('should decode base64 to text', async () => {
    const result = await tool!.execute({
      text: 'SGVsbG8gV29ybGQ=',
      action: 'decode',
    })
    expect(result.text).toBe('Hello World')
  })

  it('should support base64url encoding', async () => {
    const result = await tool!.execute({
      text: 'Hello+World/End=',
      action: 'encode',
      encoding: 'base64url',
    })
    expect(result.text).toBeDefined()
    expect(result.text).not.toContain('+')
    expect(result.text).not.toContain('/')
    expect(result.text).not.toContain('=')
  })
})
