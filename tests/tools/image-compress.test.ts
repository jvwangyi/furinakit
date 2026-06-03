import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(width: number = 200, height: number = 200): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .jpeg()
    .toBuffer()
}

describe('image-compress tool', () => {
  const tool = getTool('image-compress')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-compress')
    expect(tool?.category).toBe('image')
  })

  it('should compress image with default settings', async () => {
    const image = await createTestImage(500, 500)
    const result = await tool!.execute({ file: image })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.filename).toBe('compressed.jpeg')
  })

  it('should compress to different quality levels', async () => {
    const image = await createTestImage()

    const lowResult = await tool!.execute({ file: image, quality: 30 })
    const highResult = await tool!.execute({ file: image, quality: 95 })

    expect(lowResult.data).toBeDefined()
    expect(highResult.data).toBeDefined()
    expect(lowResult.data!.length).toBeLessThan(highResult.data!.length)
  })

  it('should convert format while compressing', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image, format: 'webp' })

    expect(result.mimeType).toBe('image/webp')
    expect(result.filename).toBe('compressed.webp')
  })
})
