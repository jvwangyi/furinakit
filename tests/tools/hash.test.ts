import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('hash tool', () => {
  const tool = getTool('hash')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('hash')
    expect(tool?.category).toBe('text')
  })

  it('should generate SHA-256 hash', async () => {
    const result = await tool!.execute({
      text: 'Hello World',
      algorithm: 'sha256',
    })
    expect(result.text).toBe('a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e')
  })

  it('should generate MD5 hash', async () => {
    const result = await tool!.execute({
      text: 'Hello World',
      algorithm: 'md5',
    })
    expect(result.text).toBe('b10a8db164e0754105b7a99be72e3fe5')
  })

  it('should generate SHA-1 hash', async () => {
    const result = await tool!.execute({
      text: 'Hello World',
      algorithm: 'sha1',
    })
    expect(result.text).toBe('0a4d55a8d778e5022fab701977c5d840bbc486d0')
  })
})
