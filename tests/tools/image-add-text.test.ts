import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('image-add-text tool', () => {
  const tool = getTool('image-add-text')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-add-text')
    expect(tool?.category).toBe('image')
  })

  it('should add text overlay to image', async () => {
    // Create a simple test image
    const testImage = await sharp({
      create: {
        width: 200,
        height: 200,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer()

    const result = await tool!.execute({
      file: testImage,
      text: 'Hello',
      fontSize: 24,
      color: '#000000',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('text-overlay.png')
  })

  it('should reject empty text', async () => {
    const testImage = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    }).png().toBuffer()

    await expect(tool!.execute({ file: testImage, text: '' })).rejects.toThrow()
  })
})
