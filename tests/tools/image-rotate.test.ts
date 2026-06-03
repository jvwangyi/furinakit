import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(): Promise<Buffer> {
  return sharp({
    create: {
      width: 100,
      height: 100,
      channels: 3,
      background: { r: 255, g: 0, b: 0 },
    },
  })
    .png()
    .toBuffer()
}

describe('image-rotate tool', () => {
  const tool = getTool('image-rotate')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-rotate')
    expect(tool?.category).toBe('image')
  })

  it('should rotate image by 90 degrees', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image, angle: 90 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')

    // Check dimensions are swapped
    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should rotate by 180 degrees', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image, angle: 180 })

    expect(result.data).toBeInstanceOf(Buffer)
  })

  it('should handle negative angles', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image, angle: -90 })

    expect(result.data).toBeInstanceOf(Buffer)
  })
})
