import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('timestamp tool', () => {
  const tool = getTool('timestamp')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('timestamp')
    expect(tool?.category).toBe('dev')
  })

  it('should convert timestamp to date', async () => {
    const result = await tool!.execute({
      mode: 'to-date',
      value: 1516239022,
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.timestamp).toBe(1516239022)
    expect(parsed.date).toContain('2018') // Year check
  })

  it('should convert date to timestamp', async () => {
    const result = await tool!.execute({
      mode: 'from-date',
      value: '2018-01-18T01:30:22.000Z',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.timestamp).toBe(1516239022)
  })

  it('should handle string timestamp', async () => {
    const result = await tool!.execute({
      mode: 'to-date',
      value: '1516239022',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.timestamp).toBe(1516239022)
  })

  it('should throw on invalid date', async () => {
    await expect(
      tool!.execute({ mode: 'from-date', value: 'not-a-date' })
    ).rejects.toThrow()
  })
})
