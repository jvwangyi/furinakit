import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestPdf(pageCount: number = 3): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842])
  }
  return Buffer.from(await pdf.save())
}

describe('pdf-add-page-numbers tool', () => {
  const tool = getTool('pdf-add-page-numbers')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-add-page-numbers')
    expect(tool?.category).toBe('pdf')
  })

  it('should add page numbers with default options', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('numbered.pdf')

    // Verify the output is a valid PDF
    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(3)
  })

  it('should add page numbers at top-left position', async () => {
    const pdf = await createTestPdf(2)
    const result = await tool!.execute({
      file: pdf,
      position: 'top-left',
      fontSize: 16,
    })

    expect(result.data).toBeInstanceOf(Buffer)
    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(2)
  })

  it('should add page numbers at bottom-right position', async () => {
    const pdf = await createTestPdf(2)
    const result = await tool!.execute({
      file: pdf,
      position: 'bottom-right',
    })

    expect(result.data).toBeInstanceOf(Buffer)
  })

  it('should handle custom font size', async () => {
    const pdf = await createTestPdf(1)
    const result = await tool!.execute({
      file: pdf,
      fontSize: 24,
    })

    expect(result.data).toBeInstanceOf(Buffer)
  })

  it('should work with single page PDF', async () => {
    const pdf = await createTestPdf(1)
    const result = await tool!.execute({ file: pdf })

    expect(result.data).toBeInstanceOf(Buffer)
    const outputDoc = await PDFDocument.load(result.data as Buffer)
    expect(outputDoc.getPageCount()).toBe(1)
  })

  it('should throw on invalid PDF', async () => {
    const invalidPdf = Buffer.from('not a pdf')
    await expect(
      tool!.execute({ file: invalidPdf })
    ).rejects.toThrow()
  })
})
