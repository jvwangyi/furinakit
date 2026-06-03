import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('qrcode-gen tool', () => {
  const tool = getTool('qrcode-gen')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('qrcode-gen')
    expect(tool?.category).toBe('dev')
  })

  it('should generate PNG QR code by default', async () => {
    const result = await tool!.execute({ text: 'https://example.com' })

    expect(result.data).toBeDefined()
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('qrcode.png')
  })

  it('should generate SVG QR code', async () => {
    const result = await tool!.execute({
      text: 'https://example.com',
      format: 'svg',
    })

    expect(result.text).toBeDefined()
    expect(result.text).toContain('<svg')
    expect(result.mimeType).toBe('image/svg+xml')
  })

  it('should generate terminal QR code', async () => {
    const result = await tool!.execute({
      text: 'Hello',
      format: 'terminal',
    })

    expect(result.text).toBeDefined()
    // Terminal output contains special characters
    expect(result.text!.length).toBeGreaterThan(0)
  })

  it('should throw on empty text', async () => {
    await expect(
      tool!.execute({ text: '' })
    ).rejects.toThrow()
  })
})
