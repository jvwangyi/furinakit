import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('regex-tester tool', () => {
  const tool = getTool('regex-tester')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('regex-tester')
    expect(tool?.category).toBe('text')
  })

  it('should find matches', async () => {
    const result = await tool!.execute({
      text: 'abc 123 def 456',
      pattern: '\\d+',
      flags: 'g',
    })
    const parsed = JSON.parse(result.text!)
    expect(parsed.isMatch).toBe(true)
    expect(parsed.matchCount).toBe(2)
    expect(parsed.matches[0].match).toBe('123')
    expect(parsed.matches[1].match).toBe('456')
  })

  it('should report no matches', async () => {
    const result = await tool!.execute({
      text: 'hello world',
      pattern: '\\d+',
      flags: 'g',
    })
    const parsed = JSON.parse(result.text!)
    expect(parsed.isMatch).toBe(false)
    expect(parsed.matchCount).toBe(0)
  })

  it('should capture groups', async () => {
    const result = await tool!.execute({
      text: '2026-05-30',
      pattern: '(\\d{4})-(\\d{2})-(\\d{2})',
      flags: 'g',
    })
    const parsed = JSON.parse(result.text!)
    expect(parsed.matchCount).toBe(1)
    expect(parsed.matches[0].groups).toBeDefined()
  })

  it('should throw on invalid regex', async () => {
    await expect(
      tool!.execute({ text: 'test', pattern: '[invalid', flags: 'g' })
    ).rejects.toThrow()
  })
})
