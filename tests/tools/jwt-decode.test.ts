import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('jwt-decode tool', () => {
  const tool = getTool('jwt-decode')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('jwt-decode')
    expect(tool?.category).toBe('dev')
  })

  it('should decode a valid JWT', async () => {
    // Example JWT from jwt.io
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'
    const result = await tool!.execute({ token })
    const parsed = JSON.parse(result.text!)

    expect(parsed.header).toBeDefined()
    expect(parsed.header.alg).toBe('HS256')
    expect(parsed.payload).toBeDefined()
    expect(parsed.payload.sub).toBe('1234567890')
    expect(parsed.payload.name).toBe('John Doe')
    expect(parsed.signature).toBeDefined()
  })

  it('should throw on invalid JWT format', async () => {
    await expect(
      tool!.execute({ token: 'invalid.token' })
    ).rejects.toThrow()
  })

  it('should throw on malformed JWT', async () => {
    await expect(
      tool!.execute({ token: 'not.a.jwt' })
    ).rejects.toThrow()
  })
})
