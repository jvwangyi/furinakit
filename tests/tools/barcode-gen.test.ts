import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('barcode-gen tool', () => {
  const tool = getTool('barcode-gen')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('barcode-gen')
    expect(tool?.category).toBe('convert')
  })

  it('should generate Code128 barcode by default', async () => {
    const result = await tool!.execute({ text: 'HELLO123' })

    expect(result.data).toBeDefined()
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('barcode_CODE128_HELLO123.png')
  })

  it('should generate barcode with custom options', async () => {
    const result = await tool!.execute({
      text: 'TEST',
      format: 'CODE128',
      width: 3,
      height: 80,
      displayValue: false,
    })

    expect(result.data).toBeDefined()
    expect(result.mimeType).toBe('image/png')
  })

  it('should generate CODE39 barcode', async () => {
    const result = await tool!.execute({
      text: 'ABC-123',
      format: 'CODE39',
    })

    expect(result.data).toBeDefined()
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toContain('CODE39')
  })

  it('should generate EAN13 barcode', async () => {
    const result = await tool!.execute({
      text: '590123412345',
      format: 'EAN13',
    })

    expect(result.data).toBeDefined()
    expect(result.mimeType).toBe('image/png')
  })

  it('should reject invalid EAN13 input', async () => {
    await expect(
      tool!.execute({ text: 'abc', format: 'EAN13' })
    ).rejects.toThrow('EAN13 requires 12-13 digits')
  })

  it('should reject invalid EAN8 input', async () => {
    await expect(
      tool!.execute({ text: '123', format: 'EAN8' })
    ).rejects.toThrow('EAN8 requires 7-8 digits')
  })

  it('should reject invalid UPC input', async () => {
    await expect(
      tool!.execute({ text: '123', format: 'UPC' })
    ).rejects.toThrow('UPC-A requires 11-12 digits')
  })

  it('should reject invalid ITF14 input', async () => {
    await expect(
      tool!.execute({ text: '123', format: 'ITF14' })
    ).rejects.toThrow('ITF-14 requires 13-14 digits')
  })

  it('should reject invalid CODE39 input', async () => {
    await expect(
      tool!.execute({ text: 'hello lowercase', format: 'CODE39' })
    ).rejects.toThrow('CODE39 only supports')
  })

  it('should throw on empty text', async () => {
    await expect(
      tool!.execute({ text: '' })
    ).rejects.toThrow()
  })

  it('should accept custom colors', async () => {
    const result = await tool!.execute({
      text: 'COLORS',
      background: '#f0f0f0',
      lineColor: '#333333',
    })

    expect(result.data).toBeDefined()
    expect(result.mimeType).toBe('image/png')
  })
})
