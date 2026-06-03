import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestPdf(pageCount: number = 5): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842])
  }
  return Buffer.from(await pdf.save())
}

describe('pdf-extract-pages tool', () => {
  const tool = getTool('pdf-extract-pages')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-extract-pages')
    expect(tool?.category).toBe('pdf')
  })

  it('should extract single page', async () => {
    const pdf = await createTestPdf(5)
    const result = await tool!.execute({ file: pdf, pages: [1] })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')

    // Verify extracted PDF has 1 page
    const extracted = await PDFDocument.load(result.data as Buffer)
    expect(extracted.getPageCount()).toBe(1)
  })

  it('should extract multiple pages', async () => {
    const pdf = await createTestPdf(5)
    const result = await tool!.execute({ file: pdf, pages: [1, 3, 5] })

    const extracted = await PDFDocument.load(result.data as Buffer)
    expect(extracted.getPageCount()).toBe(3)
  })

  it('should deduplicate pages', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf, pages: [1, 1, 2, 2] })

    const extracted = await PDFDocument.load(result.data as Buffer)
    expect(extracted.getPageCount()).toBe(2)
  })

  it('should throw on invalid page number', async () => {
    const pdf = await createTestPdf(3)
    await expect(
      tool!.execute({ file: pdf, pages: [10] })
    ).rejects.toThrow()
  })
})
