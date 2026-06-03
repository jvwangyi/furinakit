import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('csv-to-excel tool', () => {
  const tool = getTool('csv-to-excel')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('csv-to-excel')
    expect(tool?.category).toBe('convert')
  })

  it('should convert basic CSV to Excel', async () => {
    const csv = Buffer.from('name,age\nAlice,30\nBob,25')
    const result = await tool!.execute({ file: csv })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    expect(result.filename).toBe('converted.xlsx')
  })

  it('should produce a valid xlsx buffer', async () => {
    const csv = Buffer.from('name,age\nAlice,30\nBob,25')
    const result = await tool!.execute({ file: csv })

    // xlsx files start with PK (ZIP signature)
    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.data![0]).toBe(0x50) // 'P'
    expect(result.data![1]).toBe(0x4b) // 'K'
  })

  it('should handle custom delimiter (semicolon)', async () => {
    const csv = Buffer.from('name;age;city\nAlice;30;NYC\nBob;25;LA')
    const result = await tool!.execute({ file: csv, delimiter: ';' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  })

  it('should handle header=false mode', async () => {
    const csv = Buffer.from('name,age\nAlice,30\nBob,25')
    const result = await tool!.execute({ file: csv, header: false })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  })

  it('should accept custom sheetName', async () => {
    const csv = Buffer.from('col1,col2\n1,2')
    const result = await tool!.execute({ file: csv, sheetName: 'MySheet' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.filename).toBe('converted.xlsx')
  })
})
