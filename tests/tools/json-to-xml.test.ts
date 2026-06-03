import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('json-to-xml tool', () => {
  const tool = getTool('json-to-xml')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('json-to-xml')
    expect(tool?.category).toBe('text')
  })

  it('should convert JSON object to XML', async () => {
    const result = await tool!.execute({
      text: '{"name":"Alice","age":30}',
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('<name>Alice</name>')
    expect(result.text).toContain('<age>30</age>')
  })

  it('should wrap arrays in root element', async () => {
    const result = await tool!.execute({
      text: '[1,2,3]',
      rootName: 'data',
      arrayItemName: 'item',
    })
    expect(result.text).toBeDefined()
    expect(result.text).toContain('data')
  })

  it('should use custom root name', async () => {
    const result = await tool!.execute({
      text: '{"data":"test"}',
      rootName: 'custom',
    })
    expect(result.text).toContain('<data>test</data>')
  })

  it('should throw on invalid JSON', async () => {
    await expect(
      tool!.execute({ text: 'not json' })
    ).rejects.toThrow()
  })
})
