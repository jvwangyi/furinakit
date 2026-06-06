import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('ip-lookup tool', () => {
  const tool = getTool('ip-lookup')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('ip-lookup')
    expect(tool?.category).toBe('dev')
  })

  it('should have correct input schema', () => {
    expect(tool?.inputSchema).toBeDefined()
  })

  // Note: Actual API calls are skipped in unit tests to avoid external dependencies
  // The tool uses ip-api.com which may rate-limit or be unavailable in CI
})
