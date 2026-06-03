import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('uuid-gen tool', () => {
  const tool = getTool('uuid-gen')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('uuid-gen')
    expect(tool?.category).toBe('dev')
  })

  it('should generate a single UUID by default', async () => {
    const result = await tool!.execute({})
    const parsed = JSON.parse(result.text!)

    expect(parsed.count).toBe(1)
    expect(parsed.uuids).toHaveLength(1)
    expect(parsed.uuids[0]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    )
  })

  it('should generate multiple UUIDs', async () => {
    const result = await tool!.execute({ count: 5 })
    const parsed = JSON.parse(result.text!)

    expect(parsed.count).toBe(5)
    expect(parsed.uuids).toHaveLength(5)

    // All should be unique
    const unique = new Set(parsed.uuids)
    expect(unique.size).toBe(5)
  })

  it('should generate valid v4 UUIDs', async () => {
    const result = await tool!.execute({ count: 10 })
    const parsed = JSON.parse(result.text!)

    for (const uuid of parsed.uuids) {
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      )
    }
  })
})
