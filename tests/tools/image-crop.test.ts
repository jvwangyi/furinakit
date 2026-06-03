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
      background: { r: 0, g: 255, b: 0 },
    },
  })
    .png()
    .toBuffer()
}

describe('image-crop tool', () => {
  const tool = getTool('image-crop')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-crop')
    expect(tool?.category).toBe('image')
  })

  it('should crop a specific region', async () => {
    const image = await createTestImage(200, 200)
    const result = await tool!.execute({ file: image, left: 50, top: 50, width: 100, height: 100 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('cropped.png')

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })

  it('should crop from top-left corner', async () => {
    const image = await createTestImage(300, 300)
    const result = await tool!.execute({ file: image, left: 0, top: 0, width: 150, height: 150 })

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(150)
    expect(metadata.height).toBe(150)
  })

  it('should output correct size for non-square crop', async () => {
    const image = await createTestImage(400, 300)
    const result = await tool!.execute({ file: image, left: 10, top: 10, width: 200, height: 50 })

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(200)
    expect(metadata.height).toBe(50)
  })

  it('should support output format option', async () => {
    const image = await createTestImage(200, 200)
    const result = await tool!.execute({ file: image, left: 0, top: 0, width: 100, height: 100, format: 'jpeg' })

    expect(result.mimeType).toBe('image/jpeg')
    expect(result.filename).toBe('cropped.jpeg')
  })
})
