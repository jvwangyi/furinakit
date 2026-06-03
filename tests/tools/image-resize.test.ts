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
    .png()
    .toBuffer()
}

describe('image-resize tool', () => {
  const tool = getTool('image-resize')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-resize')
    expect(tool?.category).toBe('image')
  })

  it('should resize image to smaller dimensions', async () => {
    const image = await createTestImage(200, 200)
    const result = await tool!.execute({ file: image, width: 100, height: 100 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('resized.png')

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should resize image to larger dimensions', async () => {
    const image = await createTestImage(100, 100)
    const result = await tool!.execute({ file: image, width: 300, height: 300 })

    expect(result.data).toBeInstanceOf(Buffer)
    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(300)
    expect(metadata.height).toBe(300)
  })

  it('should resize with only width (maintain aspect ratio)', async () => {
    const image = await createTestImage(200, 100)
    const result = await tool!.execute({ file: image, width: 100 })

    expect(result.data).toBeInstanceOf(Buffer)
    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(100)
  })

  it('should resize with only height (maintain aspect ratio)', async () => {
    const image = await createTestImage(200, 100)
    const result = await tool!.execute({ file: image, height: 50 })

    expect(result.data).toBeInstanceOf(Buffer)
    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.height).toBe(50)
  })

  it('should throw when neither width nor height is provided', async () => {
    const image = await createTestImage(200, 200)
    await expect(tool!.execute({ file: image })).rejects.toThrow()
  })

  it('should output specified format', async () => {
    const image = await createTestImage(200, 200)
    const result = await tool!.execute({ file: image, width: 100, height: 100, format: 'jpeg' })

    expect(result.mimeType).toBe('image/jpeg')
    expect(result.filename).toBe('resized.jpeg')
  })
})
