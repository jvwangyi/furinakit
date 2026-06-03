import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('cron-parser tool', () => {
  const tool = getTool('cron-parser')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('cron-parser')
    expect(tool?.category).toBe('dev')
  })

  it('should parse a cron expression', async () => {
    const result = await tool!.execute({ expression: '0 9 * * 1-5' })
    const parsed = JSON.parse(result.text!)
    expect(parsed.expression).toBe('0 9 * * 1-5')
    expect(parsed.nextRuns).toHaveLength(5)
  })

  it('should return requested count', async () => {
    const result = await tool!.execute({ expression: '0 * * * *', count: 3 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.nextRuns).toHaveLength(3)
  })

  it('should generate valid ISO dates', async () => {
    const result = await tool!.execute({ expression: '0 9 * * *' })
    const parsed = JSON.parse(result.text!)
    for (const run of parsed.nextRuns) {
      expect(new Date(run).toISOString()).toBe(run)
    }
  })

  it('should throw on invalid expression', async () => {
    await expect(tool!.execute({ expression: 'invalid' })).rejects.toThrow()
  })
})
