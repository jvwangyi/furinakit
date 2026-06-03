import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(width: number = 100, height: number = 100, color: string = 'red'): Promise<Buffer> {
  const colors: Record<string, { r: number; g: number; b: number }> = {
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 255, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
  }

  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: colors[color] || colors.red,
    },
  })
    .png()
    .toBuffer()
}

describe('image-merge tool', () => {
  const tool = getTool('image-merge')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-merge')
    expect(tool?.category).toBe('image')
  })

  it('should merge images horizontally', async () => {
    const img1 = await createTestImage(100, 100, 'red')
    const img2 = await createTestImage(100, 100, 'blue')

    const result = await tool!.execute({
      files: [img1, img2],
      direction: 'horizontal',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(200)
    expect(metadata.height).toBe(100)
  })

  it('should merge images vertically', async () => {
    const img1 = await createTestImage(100, 100, 'red')
    const img2 = await createTestImage(100, 100, 'blue')

    const result = await tool!.execute({
      files: [img1, img2],
      direction: 'vertical',
    })

    const metadata = await sharp(result.data as Buffer).metadata()
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(200)
  })

  it('should throw with less than 2 images', async () => {
    const img = await createTestImage()
    await expect(
      tool!.execute({ files: [img] })
    ).rejects.toThrow()
  })
})
