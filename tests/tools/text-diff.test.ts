import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('text-diff tool', () => {
  const tool = getTool('text-diff')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('text-diff')
    expect(tool?.category).toBe('text')
  })

  it('should detect additions', async () => {
    const result = await tool!.execute({
      oldText: 'Hello',
      newText: 'Hello World',
      mode: 'words',
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('World')
  })

  it('should detect deletions', async () => {
    const result = await tool!.execute({
      oldText: 'Hello World',
      newText: 'Hello',
      mode: 'words',
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('World')
  })

  it('should return stats', async () => {
    const result = await tool!.execute({
      oldText: 'Hello World',
      newText: 'Hello Universe',
      mode: 'words',
    })
    expect(result.data).toBeDefined()
    const stats = JSON.parse(result.data as string)
    expect(stats.additions).toBe(1)
    expect(stats.deletions).toBe(1)
  })
})
