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

describe('pdf-watermark tool', () => {
  const tool = getTool('pdf-watermark')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-watermark')
    expect(tool?.category).toBe('pdf')
  })

  it('should add text watermark to PDF', async () => {
    const pdf = await createTestPdf(1)
    const result = await tool!.execute({ file: pdf, text: 'CONFIDENTIAL' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('watermarked.pdf')
  })

  it('should produce a valid PDF after watermarking', async () => {
    const pdf = await createTestPdf(2)
    const result = await tool!.execute({ file: pdf, text: 'DRAFT' })

    expect(result.data).toBeDefined()
    const loaded = await PDFDocument.load(result.data as Buffer)
    expect(loaded.getPageCount()).toBe(2)
  })

  it('should accept custom watermark options', async () => {
    const pdf = await createTestPdf(1)
    const result = await tool!.execute({
      file: pdf,
      text: 'SAMPLE',
      fontSize: 80,
      opacity: 0.5,
      color: '#FF0000',
      position: 'top-right',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
  })

  it('should throw error when text is empty', async () => {
    const pdf = await createTestPdf(1)
    await expect(tool!.execute({ file: pdf, text: '' })).rejects.toThrow()
  })
})
