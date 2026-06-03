import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(): Promise<Buffer> {
  return sharp({
    create: {
      width: 128,
      height: 128,
      channels: 3,
      background: { r: 255, g: 128, b: 0 },
    },
  })
    .png()
    .toBuffer()
}

describe('image-to-ico tool', () => {
  const tool = getTool('image-to-ico')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-to-ico')
    expect(tool?.category).toBe('image')
  })

  it('should generate an ICO file', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/x-icon')
    expect(result.filename).toBe('favicon.ico')
  })

  it('should produce valid ICO header', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image })

    const buf = result.data as Buffer
    // ICO header: reserved(2) + type(2) + count(2) = 6 bytes
    expect(buf.readUInt16LE(0)).toBe(0)      // Reserved
    expect(buf.readUInt16LE(2)).toBe(1)      // Type: ICO
    expect(buf.readUInt16LE(4)).toBe(1)      // Number of images
  })

  it('should respect custom size', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image, size: 32 })

    const buf = result.data as Buffer
    // Directory entry width is at offset 6
    expect(buf.readUInt8(6)).toBe(32)
  })

  it('should produce a buffer larger than the ICO header', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ file: image })

    const buf = result.data as Buffer
    // ICO header (6) + directory (16) + PNG data
    expect(buf.length).toBeGreaterThan(22)
  })
})
