import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('json-to-yaml tool', () => {
  const tool = getTool('json-to-yaml')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('json-to-yaml')
    expect(tool?.category).toBe('text')
  })

  it('should convert JSON to YAML', async () => {
    const result = await tool!.execute({
      text: '{"name":"Alice","age":30}',
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('name: Alice')
    expect(result.text).toContain('age: 30')
  })

  it('should handle nested objects', async () => {
    const result = await tool!.execute({
      text: '{"person":{"name":"Alice","address":{"city":"Tokyo"}}}',
    })
    expect(result.text).toContain('person:')
    expect(result.text).toContain('name: Alice')
    expect(result.text).toContain('address:')
    expect(result.text).toContain('city: Tokyo')
  })

  it('should handle arrays', async () => {
    const result = await tool!.execute({
      text: '{"items":["a","b","c"]}',
    })
    expect(result.text).toContain('- a')
    expect(result.text).toContain('- b')
    expect(result.text).toContain('- c')
  })

  it('should throw on invalid JSON', async () => {
    await expect(
      tool!.execute({ text: 'not json' })
    ).rejects.toThrow()
  })
})
