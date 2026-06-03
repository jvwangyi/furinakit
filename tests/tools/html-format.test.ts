import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('html-format tool', () => {
  const tool = getTool('html-format')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('html-format')
    expect(tool?.category).toBe('dev')
  })

  it('should format simple HTML', async () => {
    const result = await tool!.execute({ text: '<div><p>Hello</p></div>' })
    expect(result.text).toContain('<div>')
    expect(result.text).toContain('<p>')
    expect(result.text).toContain('Hello')
    expect(result.text).toContain('</div>')
  })

  it('should handle void elements', async () => {
    const result = await tool!.execute({ text: '<div><br><img src="a.png"><hr></div>' })
    expect(result.text).toContain('<br>')
    expect(result.text).toContain('<img')
    expect(result.text).toContain('<hr>')
  })

  it('should respect indent size', async () => {
    const result = await tool!.execute({ text: '<div><p>Hi</p></div>', indent: 4 })
    expect(result.text).toContain('    <p>')
  })
})
