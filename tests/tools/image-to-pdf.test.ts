import { describe, it, expect } from 'vitest'
import sharp from 'sharp'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestImage(width: number = 200, height: number = 200): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 100, g: 150, b: 200 },
    },
  })
    .png()
    .toBuffer()
}

describe('image-to-pdf tool', () => {
  const tool = getTool('image-to-pdf')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('image-to-pdf')
    expect(tool?.category).toBe('convert')
  })

  it('should convert a single image to PDF', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ files: [image] })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('converted.pdf')

    const pdf = await PDFDocument.load(result.data as Buffer)
    expect(pdf.getPageCount()).toBe(1)
  })

  it('should convert multiple images to multi-page PDF', async () => {
    const image1 = await createTestImage(200, 200)
    const image2 = await createTestImage(300, 300)
    const image3 = await createTestImage(150, 150)

    const result = await tool!.execute({ files: [image1, image2, image3] })

    expect(result.data).toBeInstanceOf(Buffer)
    const pdf = await PDFDocument.load(result.data as Buffer)
    expect(pdf.getPageCount()).toBe(3)
  })

  it('should use A4 page size by default', async () => {
    const image = await createTestImage()
    const result = await tool!.execute({ files: [image] })

    const pdf = await PDFDocument.load(result.data as Buffer)
    const page = pdf.getPage(0)
    const { width, height } = page.getSize()

    // A4: 595.28 x 841.89
    expect(Math.round(width)).toBe(595)
    expect(Math.round(height)).toBe(842)
  })

  it('should use fit page size', async () => {
    const image = await createTestImage(300, 400)
    const result = await tool!.execute({ files: [image], pageSize: 'fit' })

    const pdf = await PDFDocument.load(result.data as Buffer)
    const page = pdf.getPage(0)
    const { width, height } = page.getSize()

    expect(Math.round(width)).toBe(300)
    expect(Math.round(height)).toBe(400)
  })

  it('should throw on empty files array', async () => {
    await expect(tool!.execute({ files: [] })).rejects.toThrow()
  })
})
