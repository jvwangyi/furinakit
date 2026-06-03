import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImageBase64(format: 'png' | 'jpeg' = 'png'): Promise<string> {
  const buffer = await sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    [format]()
    .toBuffer()

  const mime = format === 'png' ? 'image/png' : 'image/jpeg'
  return `data:${mime};base64,${buffer.toString('base64')}`
}

describe('base64-to-image tool', () => {
  const tool = getTool('base64-to-image')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('base64-to-image')
    expect(tool?.category).toBe('convert')
  })

  it('should convert base64 data URI to PNG', async () => {
    const base64 = await createTestImageBase64('png')
    const result = await tool!.execute({ text: base64 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('decoded.png')

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should convert base64 data URI to JPG', async () => {
    const base64 = await createTestImageBase64('png')
    const result = await tool!.execute({ text: base64, format: 'jpg' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.filename).toBe('decoded.jpg')
  })

  it('should handle raw base64 without data URI prefix', async () => {
    const buffer = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 4,
        background: { r: 0, g: 255, b: 0, alpha: 1 },
      },
    })
      .png()
      .toBuffer()

    const rawBase64 = buffer.toString('base64')
    const result = await tool!.execute({ text: rawBase64 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
  })

  it('should convert to webp format', async () => {
    const base64 = await createTestImageBase64('png')
    const result = await tool!.execute({ text: base64, format: 'webp' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/webp')
    expect(result.filename).toBe('decoded.webp')
  })

  it('should throw on empty base64', async () => {
    await expect(
      tool!.execute({ text: '' })
    ).rejects.toThrow()
  })

  it('should throw on invalid base64', async () => {
    // Valid base64 but not an image
    const invalidBase64 = Buffer.from('not an image').toString('base64')
    await expect(
      tool!.execute({ text: invalidBase64 })
    ).rejects.toThrow()
  })
})
