import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

async function createTestPdf(pageCount: number = 2): Promise<Buffer> {
  const pdf = await PDFDocument.create()
  for (let i = 0; i < pageCount; i++) {
    pdf.addPage([595, 842])
  }
  return Buffer.from(await pdf.save())
}

describe('pdf-rotate tool', () => {
  const tool = getTool('pdf-rotate')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-rotate')
    expect(tool?.category).toBe('pdf')
  })

  it('should rotate all pages by 90 degrees', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({ file: pdf, rotation: 90 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('rotated.pdf')
  })

  it('should rotate specific pages', async () => {
    const pdf = await createTestPdf(3)
    const result = await tool!.execute({
      file: pdf,
      rotation: 180,
      pages: [1, 3],
    })

    expect(result.data).toBeInstanceOf(Buffer)
  })

  it('should throw on invalid page number', async () => {
    const pdf = await createTestPdf(2)
    await expect(
      tool!.execute({ file: pdf, rotation: 90, pages: [5] })
    ).rejects.toThrow()
  })
})
