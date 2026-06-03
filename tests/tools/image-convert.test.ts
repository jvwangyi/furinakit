import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(format: 'png' | 'jpeg' = 'png'): Promise<Buffer> {
  return sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 0, g: 0, b: 255 },
    },
  })
    [format]()
    .toBuffer()
}

describe('image-convert tool', () => {
  const tool = getTool('image-convert')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-convert')
    expect(tool?.category).toBe('image')
  })

  it('should convert PNG to JPEG', async () => {
    const image = await createTestImage('png')
    const result = await tool!.execute({ file: image, format: 'jpeg' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/jpeg')
    expect(result.filename).toBe('converted.jpeg')
  })

  it('should convert JPEG to PNG', async () => {
    const image = await createTestImage('jpeg')
    const result = await tool!.execute({ file: image, format: 'png' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('converted.png')
  })

  it('should convert to WebP', async () => {
    const image = await createTestImage('png')
    const result = await tool!.execute({ file: image, format: 'webp' })

    expect(result.mimeType).toBe('image/webp')
    expect(result.filename).toBe('converted.webp')
  })

  it('should respect quality option', async () => {
    const image = await createTestImage('png')
    const lowQ = await tool!.execute({ file: image, format: 'jpeg', quality: 10 })
    const highQ = await tool!.execute({ file: image, format: 'jpeg', quality: 95 })

    expect(lowQ.data).toBeInstanceOf(Buffer)
    expect(highQ.data).toBeInstanceOf(Buffer)
    // Low quality should produce smaller file
    expect((lowQ.data as Buffer).length).toBeLessThanOrEqual((highQ.data as Buffer).length)
  })
})
