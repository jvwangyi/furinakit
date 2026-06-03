import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('json-to-csv tool', () => {
  const tool = getTool('json-to-csv')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('json-to-csv')
    expect(tool?.category).toBe('text')
  })

  it('should convert JSON array to CSV', async () => {
    const result = await tool!.execute({
      text: '[{"name":"Alice","age":30},{"name":"Bob","age":25}]',
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('name,age')
    expect(result.text).toContain('Alice,30')
    expect(result.text).toContain('Bob,25')
  })

  it('should use custom delimiter', async () => {
    const result = await tool!.execute({
      text: '[{"a":1,"b":2}]',
      delimiter: ';',
    })
    expect(result.text).toContain('a;b')
  })

  it('should handle empty array', async () => {
    const result = await tool!.execute({
      text: '[]',
    })
    expect(result.text).toBe('')
  })

  it('should throw on non-array JSON', async () => {
    await expect(
      tool!.execute({ text: '{"key":"value"}' })
    ).rejects.toThrow()
  })

  it('should throw on invalid JSON', async () => {
    await expect(
      tool!.execute({ text: 'not json' })
    ).rejects.toThrow()
  })
})
