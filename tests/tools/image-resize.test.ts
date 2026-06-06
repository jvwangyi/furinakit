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

  describe('batch mode', () => {
    it('should resize multiple files in batch mode', async () => {
      const images = [await createTestImage(200, 200), await createTestImage(300, 300)]
      const result = await tool!.execute({ files: images, width: 100, height: 100 })

      expect(result.text).toBeDefined()
      const batch = JSON.parse(result.text!)
      expect(batch.batch).toBe(true)
      expect(batch.total).toBe(2)
      expect(batch.success).toBe(2)
      expect(batch.failed).toBe(0)
      expect(batch.results).toHaveLength(2)

      // Verify each result is a valid resized image
      for (const r of batch.results) {
        const buf = Buffer.from(r.data, 'base64')
        const meta = await sharp(buf).metadata()
        expect(meta.width).toBe(100)
        expect(meta.height).toBe(100)
      }
    })

    it('should return single-file result for single item array', async () => {
      const image = await createTestImage(200, 200)
      const result = await tool!.execute({ files: [image], width: 100, height: 100 })

      expect(result.data).toBeInstanceOf(Buffer)
      const metadata = await sharp(result.data as Buffer).metadata()
      expect(metadata.width).toBe(100)
    })

    it('should report errors in batch mode', async () => {
      const validImage = await createTestImage(200, 200)
      const invalidBuffer = Buffer.from('not an image')

      const result = await tool!.execute({ files: [validImage, invalidBuffer], width: 100, height: 100 })

      const batch = JSON.parse(result.text!)
      expect(batch.total).toBe(2)
      expect(batch.success).toBe(1)
      expect(batch.failed).toBe(1)
      expect(batch.errors).toHaveLength(1)
    })
  })
})
