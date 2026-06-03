import { describe, it, expect } from 'vitest'
import * as XLSX from 'xlsx'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

function createTestExcel(data: string[][] = [['Name', 'Age'], ['Alice', '30'], ['Bob', '25']]): Buffer {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(data)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  return Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))
}

describe('excel-to-csv tool', () => {
  const tool = getTool('excel-to-csv')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('excel-to-csv')
    expect(tool?.category).toBe('convert')
  })

  it('should convert basic Excel to CSV', async () => {
    const xlsx = createTestExcel()
    const result = await tool!.execute({ file: xlsx })

    expect(result.text).toBeDefined()
    expect(result.text).toContain('Name')
    expect(result.text).toContain('Alice')
    expect(result.text).toContain('Bob')
  })

  it('should handle custom delimiter', async () => {
    const xlsx = createTestExcel()
    const result = await tool!.execute({ file: xlsx, delimiter: ';' })

    expect(result.text).toBeDefined()
    expect(result.text).toContain(';')
  })

  it('should handle sheetIndex parameter', async () => {
    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.aoa_to_sheet([['A', 'B'], ['1', '2']])
    const ws2 = XLSX.utils.aoa_to_sheet([['X', 'Y'], ['10', '20']])
    XLSX.utils.book_append_sheet(wb, ws1, 'First')
    XLSX.utils.book_append_sheet(wb, ws2, 'Second')
    const xlsx = Buffer.from(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }))

    const result = await tool!.execute({ file: xlsx, sheetIndex: 1 })
    expect(result.text).toContain('X')
    expect(result.text).toContain('10')
  })

  it('should throw on invalid sheet index', async () => {
    const xlsx = createTestExcel()
    await expect(
      tool!.execute({ file: xlsx, sheetIndex: 5 })
    ).rejects.toThrow()
  })

  it('should produce valid CSV with empty cells', async () => {
    const data = [['A', 'B', 'C'], ['1', '', '3'], ['', '2', '']]
    const xlsx = createTestExcel(data)
    const result = await tool!.execute({ file: xlsx })

    expect(result.text).toBeDefined()
    expect(result.text).toContain('A')
    expect(result.text).toContain('3')
  })
})
