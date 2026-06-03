import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('color-convert tool', () => {
  const tool = getTool('color-convert')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('color-convert')
    expect(tool?.category).toBe('dev')
  })

  it('should convert hex to rgb', async () => {
    const result = await tool!.execute({
      color: '#ff0000',
      from: 'hex',
      to: 'rgb',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.result).toBe('rgb(255, 0, 0)')
  })

  it('should convert rgb to hex', async () => {
    const result = await tool!.execute({
      color: 'rgb(0, 255, 0)',
      from: 'rgb',
      to: 'hex',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.result).toBe('#00ff00')
  })

  it('should convert hex to hsl', async () => {
    const result = await tool!.execute({
      color: '#0000ff',
      from: 'hex',
      to: 'hsl',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.result).toContain('hsl(240')
  })

  it('should convert hsl to rgb', async () => {
    const result = await tool!.execute({
      color: 'hsl(0, 100%, 50%)',
      from: 'hsl',
      to: 'rgb',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.result).toBe('rgb(255, 0, 0)')
  })

  it('should handle 3-char hex', async () => {
    const result = await tool!.execute({
      color: '#f00',
      from: 'hex',
      to: 'rgb',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.result).toBe('rgb(255, 0, 0)')
  })

  it('should throw on invalid hex', async () => {
    await expect(
      tool!.execute({ color: 'not-a-color', from: 'hex', to: 'rgb' })
    ).rejects.toThrow()
  })
})
