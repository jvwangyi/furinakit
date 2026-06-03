import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('css-format tool', () => {
  const tool = getTool('css-format')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('css-format')
    expect(tool?.category).toBe('dev')
  })

  it('should format simple CSS', async () => {
    const result = await tool!.execute({ text: 'body{color:red;margin:0;}' })
    expect(result.text).toContain('body')
    expect(result.text).toContain('{')
    expect(result.text).toContain('}')
    expect(result.text).toContain('color:red')
    expect(result.text).toContain('margin:0')
  })

  it('should respect indent size', async () => {
    const result = await tool!.execute({ text: 'body{color:red;}', indent: 4 })
    expect(result.text).toContain('    color:red')
  })

  it('should handle nested selectors', async () => {
    const result = await tool!.execute({ text: '.parent{color:red;.child{font-size:12px;}}' })
    expect(result.text).toContain('.parent')
    expect(result.text).toContain('.child')
  })
})
