import { describe, it, expect } from 'vitest'
import { PDFDocument } from 'pdf-lib'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('markdown-to-pdf tool', () => {
  const tool = getTool('markdown-to-pdf')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('markdown-to-pdf')
    expect(tool?.category).toBe('convert')
  })

  it('should convert simple markdown to PDF', async () => {
    const markdown = '# Hello World\n\nThis is a paragraph.'
    const result = await tool!.execute({ text: markdown })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('application/pdf')
    expect(result.filename).toBe('converted.pdf')

    // Verify the output is a valid PDF
    const pdfDoc = await PDFDocument.load(result.data as Buffer)
    expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(1)
  })

  it('should handle multi-line markdown', async () => {
    const markdown = `# Title

## Subtitle

- Item 1
- Item 2
- Item 3

**Bold text** and *italic text*

[Link](https://example.com)`
    const result = await tool!.execute({ text: markdown })

    expect(result.data).toBeInstanceOf(Buffer)
    const pdfDoc = await PDFDocument.load(result.data as Buffer)
    expect(pdfDoc.getPageCount()).toBeGreaterThanOrEqual(1)
  })

  it('should handle long content with multiple pages', async () => {
    const lines = Array(100).fill('This is a line of text that will take up space.').join('\n')
    const result = await tool!.execute({ text: lines })

    expect(result.data).toBeInstanceOf(Buffer)
    const pdfDoc = await PDFDocument.load(result.data as Buffer)
    expect(pdfDoc.getPageCount()).toBeGreaterThan(1)
  })

  it('should respect custom font size', async () => {
    const markdown = 'Test content'
    const result = await tool!.execute({ text: markdown, fontSize: 18 })

    expect(result.data).toBeInstanceOf(Buffer)
  })

  it('should respect custom margin', async () => {
    const markdown = 'Test content'
    const result = await tool!.execute({ text: markdown, margin: 100 })

    expect(result.data).toBeInstanceOf(Buffer)
  })

  it('should throw on empty text', async () => {
    await expect(
      tool!.execute({ text: '' })
    ).rejects.toThrow()
  })
})
