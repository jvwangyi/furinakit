import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('perler-beads tool', () => {
  const tool = getTool('perler-beads')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('perler-beads')
    expect(tool?.category).toBe('craft')
  })

  it('should return web interface message', async () => {
    const result = await tool!.execute({})
    expect(result.text).toBe('请使用 Web 界面操作此工具')
  })
})
