import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('cron-gen tool', () => {
  const tool = getTool('cron-gen')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('cron-gen')
    expect(tool?.category).toBe('dev')
  })

  it('should generate default cron expression', async () => {
    const result = await tool!.execute({})
    const parsed = JSON.parse(result.text!)
    expect(parsed.expression).toBe('* * * * *')
    expect(parsed.description).toBeDefined()
  })

  it('should generate specific cron expression', async () => {
    const result = await tool!.execute({ minute: '30', hour: '9', dayOfMonth: '1', month: '*', dayOfWeek: '1-5' })
    const parsed = JSON.parse(result.text!)
    expect(parsed.expression).toBe('30 9 1 * 1-5')
    expect(parsed.description).toContain('09:30')
  })

  it('should handle step values', async () => {
    const result = await tool!.execute({ minute: '*/15', hour: '*' })
    const parsed = JSON.parse(result.text!)
    expect(parsed.expression).toBe('*/15 * * * *')
    expect(parsed.description).toContain('every 15 minutes')
  })
})
