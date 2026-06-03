import { describe, it, expect, beforeAll } from 'vitest'
import '@/lib/tools' // Import all tools to register them
import { getTool } from '@/lib/registry'

describe('json-format tool', () => {
  const tool = getTool('json-format')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('json-format')
    expect(tool?.category).toBe('text')
  })

  it('should format valid JSON', async () => {
    const result = await tool!.execute({
      text: '{"name":"test","value":123}',
      indent: 2,
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('"name": "test"')
    expect(result.text).toContain('"value": 123')
  })

  it('should sort keys when sortKeys is true', async () => {
    const result = await tool!.execute({
      text: '{"z":1,"a":2,"m":3}',
      indent: 2,
      sortKeys: true,
    })
    expect(result.text).toBeDefined()
    const lines = result.text!.split('\n')
    const aIndex = lines.findIndex(l => l.includes('"a"'))
    const mIndex = lines.findIndex(l => l.includes('"m"'))
    const zIndex = lines.findIndex(l => l.includes('"z"'))
    expect(aIndex).toBeLessThan(mIndex)
    expect(mIndex).toBeLessThan(zIndex)
  })

  it('should throw on invalid JSON', async () => {
    await expect(
      tool!.execute({ text: 'not valid json' })
    ).rejects.toThrow()
  })
})
