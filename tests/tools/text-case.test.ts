import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('text-case tool', () => {
  const tool = getTool('text-case')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('text-case')
    expect(tool?.category).toBe('text')
  })

  it('should convert to upper case', async () => {
    const result = await tool!.execute({ text: 'hello world', case: 'upper' })
    expect(result.text).toBe('HELLO WORLD')
  })

  it('should convert to lower case', async () => {
    const result = await tool!.execute({ text: 'HELLO WORLD', case: 'lower' })
    expect(result.text).toBe('hello world')
  })

  it('should convert to title case', async () => {
    const result = await tool!.execute({ text: 'hello world', case: 'title' })
    expect(result.text).toBe('Hello World')
  })

  it('should convert to camel case', async () => {
    const result = await tool!.execute({ text: 'hello world foo', case: 'camel' })
    expect(result.text).toBe('helloWorldFoo')
  })

  it('should convert to snake case', async () => {
    const result = await tool!.execute({ text: 'helloWorldFoo', case: 'snake' })
    expect(result.text).toBe('hello_world_foo')
  })

  it('should convert to kebab case', async () => {
    const result = await tool!.execute({ text: 'helloWorldFoo', case: 'kebab' })
    expect(result.text).toBe('hello-world-foo')
  })

  it('should convert to pascal case', async () => {
    const result = await tool!.execute({ text: 'hello world foo', case: 'pascal' })
    expect(result.text).toBe('HelloWorldFoo')
  })

  it('should convert to sentence case', async () => {
    const result = await tool!.execute({ text: 'hello world. foo bar.', case: 'sentence' })
    expect(result.text).toBe('Hello world. Foo bar.')
  })
})
