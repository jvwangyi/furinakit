import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestPdf(pageCount: number = 2): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage([595, 842])
    page.drawText(`Page ${i + 1}`, { x: 50, y: 800 })
  }
  return Buffer.from(await pdf.save())
}

describe('pdf-to-image tool', () => {
  const tool = getTool('pdf-to-image')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-to-image')
    expect(tool?.category).toBe('pdf')
  })

  it('should convert first page to PNG', async () => {
    const pdf = await createTestPdf(2)
    const result = await tool!.execute({ file: pdf, page: 1 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('image/png')
    expect(result.filename).toBe('page-1.png')
  })

  it('should convert specific page', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf, page: 2, format: 'jpeg' })

    expect(result.mimeType).toBe('image/jpeg')
    expect(result.filename).toBe('page-2.jpeg')
  })

  it('should throw on invalid page number', async () => {
    const pdf = await createTestPdf(1)
    await expect(
      tool!.execute({ file: pdf, page: 5 })
    ).rejects.toThrow()
  })
})
