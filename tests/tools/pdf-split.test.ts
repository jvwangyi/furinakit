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

describe('pdf-split tool', () => {
  const tool = getTool('pdf-split')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-split')
    expect(tool?.category).toBe('pdf')
  })

  it('should split PDF by page numbers', async () => {
    const pdf = await createTestPdf(5)
    const result = await tool!.execute({ file: pdf, pages: [1, 3, 5] })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('split.pdf')

    const split = await PDFDocument.load(result.data as Buffer)
    expect(split.getPageCount()).toBe(3)
  })

  it('should split PDF by page ranges', async () => {
    const pdf = await createTestPdf(6)
    const result = await tool!.execute({
      file: pdf,
      ranges: [{ start: 2, end: 4 }],
    })

    expect(result.data).toBeDefined()
    const split = await PDFDocument.load(result.data as Buffer)
    expect(split.getPageCount()).toBe(3)
  })

  it('should return all pages when neither pages nor ranges specified', async () => {
    const pdf = await createTestPdf(4)
    const result = await tool!.execute({ file: pdf })

    expect(result.data).toBeDefined()
    const split = await PDFDocument.load(result.data as Buffer)
    expect(split.getPageCount()).toBe(4)
  })
})
