import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('sql-format tool', () => {
  const tool = getTool('sql-format')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('sql-format')
    expect(tool?.category).toBe('dev')
  })

  it('should format a simple SELECT statement', async () => {
    const result = await tool!.execute({ text: 'SELECT id, name FROM users WHERE id = 1' })

    expect(result.text).toBeDefined()
    expect(result.text).toContain('SELECT')
    expect(result.text).toContain('FROM')
    // Formatted output should have newlines
    expect(result.text).toContain('\n')
  })

  it('should format a complex query', async () => {
    const sql = 'SELECT u.id, u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id WHERE o.total > 100 ORDER BY o.total DESC'
    const result = await tool!.execute({ text: sql })

    expect(result.text).toBeDefined()
    expect(result.text).toContain('SELECT')
    expect(result.text).toContain('JOIN')
    expect(result.text).toContain('WHERE')
    expect(result.text).toContain('ORDER BY')
  })

  it('should support different SQL dialects', async () => {
    const sql = 'SELECT * FROM users LIMIT 10'
    const result = await tool!.execute({ text: sql, language: 'postgresql' })

    expect(result.text).toBeDefined()
    expect(result.text).toContain('SELECT')
  })

  it('should handle INSERT statement', async () => {
    const sql = "INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com')"
    const result = await tool!.execute({ text: sql })

    expect(result.text).toContain('INSERT')
    expect(result.text).toContain('VALUES')
  })

  it('should format UPDATE statement', async () => {
    const sql = 'UPDATE users SET name = \'Bob\' WHERE id = 1'
    const result = await tool!.execute({ text: sql })

    expect(result.text).toContain('UPDATE')
    expect(result.text).toContain('SET')
    expect(result.text).toContain('WHERE')
  })
})
