import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(): Promise<Buffer> {
  return sharp({
    create: {
      width: 400,
      height: 300,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .png()
    .toBuffer()
}

describe('image-add-watermark tool', () => {
  const tool = getTool('image-add-watermark')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-add-watermark')
    expect(tool?.category).toBe('image')
  })

  it('should add watermark with default settings', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({
      file: image,
      text: 'WATERMARK',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('watermarked.png')
  })

  it('should add watermark at different positions', async () => {
    const image = await createTestImage()

    const center = await tool!.execute({
      file: image,
      text: 'Center',
      position: 'center',
    })

    const bottomRight = await tool!.execute({
      file: image,
      text: 'BR',
      position: 'bottom-right',
    })

    expect(center.data).toBeInstanceOf(Buffer)
    expect(bottomRight.data).toBeInstanceOf(Buffer)
  })

  it('should add watermark with custom opacity', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({
      file: image,
      text: 'Test',
      opacity: 0.3,
    })

    expect(result.data).toBeInstanceOf(Buffer)
  })
})
