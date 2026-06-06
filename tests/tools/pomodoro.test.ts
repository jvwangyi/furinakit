import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('pomodoro tool', () => {
  const tool = getTool('pomodoro')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pomodoro')
    expect(tool?.category).toBe('craft')
  })

  it('should return web interface message', async () => {
    const result = await tool!.execute({})
    expect(result.text).toBe('Please use the web interface for this tool')
  })
})
