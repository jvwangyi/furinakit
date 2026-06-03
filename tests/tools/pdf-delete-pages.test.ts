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

describe('pdf-delete-pages tool', () => {
  const tool = getTool('pdf-delete-pages')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-delete-pages')
    expect(tool?.category).toBe('pdf')
  })

  it('should delete a single page', async () => {
    const pdf = await createTestPdf(5)
    const result = await tool!.execute({ file: pdf, pages: [3] })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('deleted-pages.pdf')

    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(4)
  })

  it('should delete multiple pages', async () => {
    const pdf = await createTestPdf(5)
    const result = await tool!.execute({ file: pdf, pages: [1, 3, 5] })

    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(2)
  })

  it('should delete first page', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf, pages: [1] })

    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(2)
  })

  it('should delete last page', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf, pages: [3] })

    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(2)
  })

  it('should throw on invalid page number', async () => {
    const pdf = await createTestPdf(3)
    await expect(
      tool!.execute({ file: pdf, pages: [5] })
    ).rejects.toThrow()
  })

  it('should throw when trying to delete all pages', async () => {
    const pdf = await createTestPdf(2)
    await expect(
      tool!.execute({ file: pdf, pages: [1, 2] })
    ).rejects.toThrow()
  })
})
