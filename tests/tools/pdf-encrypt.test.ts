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

describe('pdf-encrypt tool', () => {
  const tool = getTool('pdf-encrypt')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('pdf-encrypt')
    expect(tool?.category).toBe('pdf')
  })

  it('should encrypt PDF with a password', async () => {
    const pdf = await createTestPdf(1)
    const result = await tool!.execute({ file: pdf, password: 'test123' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('encrypted.pdf')
  })

  it('should produce a valid PDF after encryption', async () => {
    const pdf = await createTestPdf(2)
    const result = await tool!.execute({ file: pdf, password: 'secret' })

    expect(result.data).toBeDefined()
    const loaded = await PDFDocument.load(result.data as Buffer, { ignoreEncryption: false })
    expect(loaded.getPageCount()).toBe(2)
  })

  it('should accept ownerPassword option', async () => {
    const pdf = await createTestPdf(1)
    const result = await tool!.execute({
      file: pdf,
      password: 'user123',
      ownerPassword: 'owner456',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
  })

  it('should throw error when password is missing', async () => {
    const pdf = await createTestPdf(1)
    await expect(tool!.execute({ file: pdf, password: '' })).rejects.toThrow()
  })
})
