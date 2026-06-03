import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(format: 'png' | 'jpeg' = 'png'): Promise<Buffer> {
  return sharp({
    create: {
      width: 100,
      height: 100,
      channels: 4,
      background: { r: 255, g: 0, b: 0, alpha: 1 },
    },
  })
    [format]()
    .toBuffer()
}

describe('image-to-base64 tool', () => {
  const tool = getTool('image-to-base64')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-to-base64')
    expect(tool?.category).toBe('convert')
  })

  it('should convert PNG image to base64 with data URI', async () => {
    const image = await createTestImage('png')
    const result = await tool!.execute({ file: image })

    expect(result.text).toBeDefined()
    expect(result.text).toMatch(/^data:image\/png;base64,/)
  })

  it('should convert JPEG image to base64', async () => {
    const image = await createTestImage('jpeg')
    const result = await tool!.execute({ file: image })

    expect(result.text).toBeDefined()
    expect(result.text).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('should output raw base64 without data URI when addDataUri=false', async () => {
    const image = await createTestImage('png')
    const result = await tool!.execute({ file: image, addDataUri: false })

    expect(result.text).toBeDefined()
    expect(result.text).not.toContain('data:')
    // Should be valid base64
    const decoded = Buffer.from(result.text!, 'base64')
    expect(decoded.length).toBeGreaterThan(0)
  })

  it('should convert to specified output format', async () => {
    const image = await createTestImage('png')
    const result = await tool!.execute({ file: image, outputFormat: 'jpg' })

    expect(result.text).toBeDefined()
    expect(result.text).toMatch(/^data:image\/jpeg;base64,/)
  })

  it('should produce valid base64 that decodes back to image', async () => {
    const image = await createTestImage('png')
    const result = await tool!.execute({ file: image, addDataUri: false })

    const decoded = Buffer.from(result.text!, 'base64')
    const metadata = await sharp(decoded).metadata()
    expect(metadata.width).toBe(100)
    expect(metadata.height).toBe(100)
  })
})
