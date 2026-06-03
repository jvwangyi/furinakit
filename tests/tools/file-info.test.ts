import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('file-info tool', () => {
  const tool = getTool('file-info')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('file-info')
    expect(tool?.category).toBe('file')
  })

  it('should analyze file metadata', async () => {
    // Create a small test file (base64 encoded)
    const testContent = Buffer.from('Hello, World!').toString('base64')

    const result = await tool!.execute({
      file: testContent,
      filename: 'test.txt',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.name).toBe('test.txt')
    expect(parsed.size).toBe(13)
    expect(parsed.sizeFormatted).toBe('13 B')
    expect(parsed.mimeType).toBe('text/plain')
    expect(parsed.md5).toBeDefined()
    expect(parsed.sha256).toBeDefined()
  })

  it('should calculate correct hashes', async () => {
    const testContent = Buffer.from('test').toString('base64')

    const result = await tool!.execute({
      file: testContent,
      filename: 'test.bin',
    })
    const parsed = JSON.parse(result.text!)

    // MD5 of "test" is 098f6bcd4621d373cade4e832627b4f6
    expect(parsed.md5).toBe('098f6bcd4621d373cade4e832627b4f6')
  })

  it('should format file size correctly', async () => {
    // Create a 1KB file
    const testContent = Buffer.alloc(1024).toString('base64')

    const result = await tool!.execute({
      file: testContent,
      filename: 'large.bin',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.sizeFormatted).toBe('1.00 KB')
  })
})
