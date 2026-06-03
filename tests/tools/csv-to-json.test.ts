import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('csv-to-json tool', () => {
  const tool = getTool('csv-to-json')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('csv-to-json')
    expect(tool?.category).toBe('text')
  })

  it('should convert CSV to JSON array', async () => {
    const result = await tool!.execute({
      text: 'name,age\nAlice,30\nBob,25',
    })
    expect(result.text).toBeDefined()
    const parsed = JSON.parse(result.text!)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(2)
    expect(parsed[0].name).toBe('Alice')
    expect(parsed[0].age).toBe(30)
  })

  it('should use custom delimiter', async () => {
    const result = await tool!.execute({
      text: 'a;b\n1;2',
      delimiter: ';',
    })
    const parsed = JSON.parse(result.text!)
    expect(parsed[0].a).toBe(1)
  })

  it('should handle empty CSV', async () => {
    const result = await tool!.execute({
      text: '',
    })
    const parsed = JSON.parse(result.text!)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed).toHaveLength(0)
  })
})
