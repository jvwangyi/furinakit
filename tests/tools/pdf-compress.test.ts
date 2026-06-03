import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestPdf(pageCount: number = 1): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    const page = pdf.addPage([595, 842]) // A4 size
    page.drawText(`Test Page ${i + 1}`, { x: 50, y: 800 })
  }
  return Buffer.from(await pdf.save())
}

describe('pdf-compress tool', () => {
  const tool = getTool('pdf-compress')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-compress')
    expect(tool?.category).toBe('pdf')
  })

  it('should compress PDF with default settings', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('compressed.pdf')
  })

  it('should compress with different quality levels', async () => {
    const pdf = await createTestPdf(2)

    const lowResult = await tool!.execute({ file: pdf, quality: 'low' })
    const highResult = await tool!.execute({ file: pdf, quality: 'high' })

    expect(lowResult.data).toBeInstanceOf(Buffer)
    expect(highResult.data).toBeInstanceOf(Buffer)
  })
})
