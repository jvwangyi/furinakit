import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('unit-converter tool', () => {
  const tool = getTool('unit-converter')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('unit-converter')
    expect(tool?.category).toBe('dev')
  })

  it('should convert meters to kilometers', async () => {
    const result = await tool!.execute({
      value: 1000,
      fromUnit: 'm',
      toUnit: 'km',
      category: 'length',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBe(1)
  })

  it('should convert Celsius to Fahrenheit', async () => {
    const result = await tool!.execute({
      value: 100,
      fromUnit: 'celsius',
      toUnit: 'fahrenheit',
      category: 'temperature',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBe(212)
  })

  it('should convert Celsius to Kelvin', async () => {
    const result = await tool!.execute({
      value: 0,
      fromUnit: 'celsius',
      toUnit: 'kelvin',
      category: 'temperature',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBe(273.15)
  })

  it('should convert Fahrenheit to Celsius', async () => {
    const result = await tool!.execute({
      value: 32,
      fromUnit: 'fahrenheit',
      toUnit: 'celsius',
      category: 'temperature',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBe(0)
  })

  it('should convert kilograms to pounds', async () => {
    const result = await tool!.execute({
      value: 1,
      fromUnit: 'kg',
      toUnit: 'lb',
      category: 'weight',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBeCloseTo(2.20462, 4)
  })

  it('should convert square meters to acres', async () => {
    const result = await tool!.execute({
      value: 10000,
      fromUnit: 'm2',
      toUnit: 'acre',
      category: 'area',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBeCloseTo(2.47105, 4)
  })

  it('should convert liters to gallons', async () => {
    const result = await tool!.execute({
      value: 1,
      fromUnit: 'l',
      toUnit: 'gal',
      category: 'volume',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBeCloseTo(0.264172, 4)
  })

  it('should convert km/h to mph', async () => {
    const result = await tool!.execute({
      value: 100,
      fromUnit: 'km/h',
      toUnit: 'mph',
      category: 'speed',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBeCloseTo(62.137, 2)
  })

  it('should handle same unit conversion', async () => {
    const result = await tool!.execute({
      value: 100,
      fromUnit: 'm',
      toUnit: 'm',
      category: 'length',
    })
    const data = JSON.parse(result.text!)
    expect(data.result).toBe(100)
  })

  it('should handle invalid unit for category', async () => {
    const result = await tool!.execute({
      value: 100,
      fromUnit: 'invalid',
      toUnit: 'm',
      category: 'length',
    })
    const data = JSON.parse(result.text!)
    expect(data.error).toBeDefined()
  })
})
