import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('base-converter tool', () => {
  const tool = getTool('base-converter')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('base-converter')
    expect(tool?.category).toBe('dev')
  })

  it('should convert decimal to binary', async () => {
    const result = await tool!.execute({ text: '255', fromBase: 10, toBase: 2 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.result).toBe('11111111')
    expect(parsed.decimal).toBe(255)
  })

  it('should convert hex to decimal', async () => {
    const result = await tool!.execute({ text: 'FF', fromBase: 16, toBase: 10 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.result).toBe('255')
  })

  it('should convert binary to hex', async () => {
    const result = await tool!.execute({ text: '11111111', fromBase: 2, toBase: 16 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.result).toBe('FF')
  })

  it('should handle octal', async () => {
    const result = await tool!.execute({ text: '377', fromBase: 8, toBase: 10 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.result).toBe('255')
  })

  it('should return error for invalid input', async () => {
    const result = await tool!.execute({ text: 'xyz', fromBase: 10, toBase: 2 })
    const parsed = JSON.parse(result.text!)
    expect(parsed.error).toBeDefined()
  })
})
