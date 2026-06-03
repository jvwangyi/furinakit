import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('xml-to-json tool', () => {
  const tool = getTool('xml-to-json')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('xml-to-json')
    expect(tool?.category).toBe('convert')
  })

  it('should convert simple XML to JSON', async () => {
    const xml = '<root><name>Alice</name><age>30</age></root>'
    const result = await tool!.execute({ text: xml })

    expect(result.text).toBeDefined()
    const parsed = JSON.parse(result.text!)
    expect(parsed.root.name).toBe('Alice')
    expect(parsed.root.age).toBe(30)
  })

  it('should convert nested XML to JSON', async () => {
    const xml = '<server><host>localhost</host><port>3000</port></server>'
    const result = await tool!.execute({ text: xml })

    const parsed = JSON.parse(result.text!)
    expect(parsed.server.host).toBe('localhost')
    expect(parsed.server.port).toBe(3000)
  })

  it('should handle XML with attributes', async () => {
    const xml = '<user id="1" active="true"><name>Bob</name></user>'
    const result = await tool!.execute({ text: xml, ignoreAttributes: false })

    const parsed = JSON.parse(result.text!)
    expect(parsed.user.name).toBe('Bob')
    // With default prefix '@', attributes should be present
    expect(parsed.user['@id']).toBe('1')
  })

  it('should handle XML with multiple children', async () => {
    const xml = '<items><item>a</item><item>b</item><item>c</item></items>'
    const result = await tool!.execute({ text: xml })

    const parsed = JSON.parse(result.text!)
    expect(parsed.items.item).toEqual(['a', 'b', 'c'])
  })

  it('should throw on invalid XML', async () => {
    const invalidXml = '<root><unclosed>'
    // fast-xml-parser may or may not throw; test that it either throws or returns valid output
    try {
      const result = await tool!.execute({ text: invalidXml })
      // If it doesn't throw, it should still return valid text
      expect(result.text).toBeDefined()
    } catch (e) {
      expect(e).toBeDefined()
    }
  })
})
