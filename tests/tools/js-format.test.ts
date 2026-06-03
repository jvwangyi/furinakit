import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('js-format tool', () => {
  const tool = getTool('js-format')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('js-format')
    expect(tool?.category).toBe('dev')
  })

  it('should format simple JS', async () => {
    const result = await tool!.execute({ text: 'function foo(){return 1;}' })
    expect(result.text).toContain('function foo()')
    expect(result.text).toContain('return 1;')
    expect(result.text).toContain('}')
  })

  it('should respect indent size', async () => {
    const result = await tool!.execute({ text: 'function foo(){return 1;}', indent: 4 })
    expect(result.text).toContain('    return 1;')
  })

  it('should handle multiple statements', async () => {
    const result = await tool!.execute({ text: 'const a=1;const b=2;console.log(a+b);' })
    expect(result.text).toContain('const a=1')
    expect(result.text).toContain('console.log')
  })
})
