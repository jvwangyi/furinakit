import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestPdf(pageCount: number = 1): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage([595, 842])
    page.drawText(`Test Page ${i + 1}`, { x: 50, y: 800 })
  }
  return Buffer.from(await pdf.save())
}

describe('pdf-merge tool', () => {
  const tool = getTool('pdf-merge')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-merge')
    expect(tool?.category).toBe('pdf')
  })

  it('should merge 2 PDFs into one', async () => {
    const pdf1 = await createTestPdf(2)
    const pdf2 = await createTestPdf(3)
    const result = await tool!.execute({ files: [pdf1, pdf2] })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('merged.pdf')
  })

  it('should produce merged PDF with combined page count', async () => {
    const pdf1 = await createTestPdf(2)
    const pdf2 = await createTestPdf(3)
    const result = await tool!.execute({ files: [pdf1, pdf2] })

    expect(result.data).toBeDefined()
    const merged = await PDFDocument.load(result.data as Buffer)
    expect(merged.getPageCount()).toBe(5)
  })

  it('should throw error when only 1 file is provided', async () => {
    const pdf = await createTestPdf(1)
    await expect(tool!.execute({ files: [pdf] })).rejects.toThrow()
  })
})
