import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('file-hash tool', () => {
  const tool = getTool('file-hash')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('file-hash')
    expect(tool?.category).toBe('file')
  })

  it('should calculate SHA256 by default', async () => {
    const testContent = Buffer.from('Hello').toString('base64')

    const result = await tool!.execute({
      file: testContent,
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.algorithm).toBe('sha256')
    expect(parsed.hash).toBeDefined()
    expect(parsed.hash).toHaveLength(64) // SHA256 is 64 hex chars
  })

  it('should calculate MD5', async () => {
    const testContent = Buffer.from('test').toString('base64')

    const result = await tool!.execute({
      file: testContent,
      algorithm: 'md5',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.algorithm).toBe('md5')
    expect(parsed.hash).toBe('098f6bcd4621d373cade4e832627b4f6')
  })

  it('should calculate SHA1', async () => {
    const testContent = Buffer.from('test').toString('base64')

    const result = await tool!.execute({
      file: testContent,
      algorithm: 'sha1',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.algorithm).toBe('sha1')
    expect(parsed.hash).toHaveLength(40) // SHA1 is 40 hex chars
  })

  it('should calculate SHA512', async () => {
    const testContent = Buffer.from('test').toString('base64')

    const result = await tool!.execute({
      file: testContent,
      algorithm: 'sha512',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.algorithm).toBe('sha512')
    expect(parsed.hash).toHaveLength(128) // SHA512 is 128 hex chars
  })

  it('should include file size', async () => {
    const testContent = Buffer.from('Hello, World!').toString('base64')

    const result = await tool!.execute({
      file: testContent,
      filename: 'test.txt',
    })
    const parsed = JSON.parse(result.text!)

    expect(parsed.size).toBe(13)
    expect(parsed.filename).toBe('test.txt')
  })
})
