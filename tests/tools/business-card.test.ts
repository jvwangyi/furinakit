import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('business-card tool', () => {
  const tool = getTool('business-card')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('business-card')
    expect(tool?.category).toBe('craft')
  })

  it('should return web interface message', async () => {
    const result = await tool!.execute({})
    expect(result.text).toBe('Please use the web interface for this tool')
  })
})
