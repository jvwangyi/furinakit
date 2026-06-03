import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('yaml-to-json tool', () => {
  const tool = getTool('yaml-to-json')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('yaml-to-json')
    expect(tool?.category).toBe('convert')
  })

  it('should convert simple YAML to JSON', async () => {
    const yaml = 'name: Alice\nage: 30'
    const result = await tool!.execute({ text: yaml })

    expect(result.text).toBeDefined()
    const parsed = JSON.parse(result.text!)
    expect(parsed.name).toBe('Alice')
    expect(parsed.age).toBe(30)
  })

  it('should convert nested YAML to JSON', async () => {
    const yaml = 'server:\n  host: localhost\n  port: 3000'
    const result = await tool!.execute({ text: yaml })

    const parsed = JSON.parse(result.text!)
    expect(parsed.server.host).toBe('localhost')
    expect(parsed.server.port).toBe(3000)
  })

  it('should convert YAML array to JSON', async () => {
    const yaml = '- apple\n- banana\n- cherry'
    const result = await tool!.execute({ text: yaml })

    const parsed = JSON.parse(result.text!)
    expect(parsed).toEqual(['apple', 'banana', 'cherry'])
  })

  it('should respect indent option', async () => {
    const yaml = 'key: value'
    const result = await tool!.execute({ text: yaml, indent: 4 })

    expect(result.text).toContain('    "key"')
  })

  it('should throw on invalid YAML', async () => {
    // This particular malformed YAML might or might not throw depending on parser leniency
    // Using a truly broken structure
    const invalidYaml = '{{invalid'
    await expect(tool!.execute({ text: invalidYaml })).rejects.toThrow()
  })
})
