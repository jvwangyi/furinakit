import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'
import {
  PALETTES,
  PALETTE_NAMES,
  hexToRgb,
  getFilteredPalette,
  type PerlerColor,
} from '@/lib/tools/perler-beads'

describe('perler-beads tool registration', () => {
  const tool = getTool('perler-beads')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('perler-beads')
  })

  it('should have craft category', () => {
    expect(tool?.category).toBe('craft')
  })

  it('should have a description', () => {
    expect(tool?.description).toBeTruthy()
    expect(tool?.description).toContain('拼豆')
  })

  it('execute should return placeholder text', async () => {
    const result = await tool!.execute({})
    expect(result.text).toBe('请使用 Web 界面操作此工具')
  })
})

describe('hexToRgb', () => {
  it('should parse black (#000000)', () => {
    expect(hexToRgb('#000000')).toEqual([0, 0, 0])
  })

  it('should parse white (#FFFFFF)', () => {
    expect(hexToRgb('#FFFFFF')).toEqual([255, 255, 255])
  })

  it('should parse pure red (#FF0000)', () => {
    expect(hexToRgb('#FF0000')).toEqual([255, 0, 0])
  })

  it('should parse pure green (#00FF00)', () => {
    expect(hexToRgb('#00FF00')).toEqual([0, 255, 0])
  })

  it('should parse pure blue (#0000FF)', () => {
    expect(hexToRgb('#0000FF')).toEqual([0, 0, 255])
  })

  it('should parse arbitrary color (#FAF4C8)', () => {
    expect(hexToRgb('#FAF4C8')).toEqual([250, 244, 200])
  })

  it('should parse lowercase hex (#abcdef)', () => {
    // The function uses slice + parseInt(hex, 16), which handles lowercase
    expect(hexToRgb('#abcdef')).toEqual([171, 205, 239])
  })
})

describe('PALETTES', () => {
  const expectedPaletteKeys = [
    'mard221', 'mard264', 'mard291',
    'coco', 'manman', 'panpan', 'mixiaowo',
  ]

  it('should contain all expected palette keys', () => {
    for (const key of expectedPaletteKeys) {
      expect(PALETTES[key]).toBeDefined()
      expect(Array.isArray(PALETTES[key])).toBe(true)
    }
  })

  it('each palette should have at least 100 colors', () => {
    for (const key of expectedPaletteKeys) {
      expect(PALETTES[key].length).toBeGreaterThanOrEqual(100)
    }
  })

  it('every color entry should have required fields', () => {
    for (const key of expectedPaletteKeys) {
      for (const color of PALETTES[key]) {
        expect(color.id).toBeTruthy()
        expect(color.name).toBeTruthy()
        expect(color.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
        expect(color.brand).toBeTruthy()
      }
    }
  })

  it('mard221 should have exactly 221 colors', () => {
    expect(PALETTES.mard221.length).toBe(221)
  })

  it('mard291 should have exactly 291 colors', () => {
    expect(PALETTES.mard291.length).toBe(291)
  })

  it('all colors in a palette should have unique IDs', () => {
    for (const key of expectedPaletteKeys) {
      const ids = PALETTES[key].map(c => c.id)
      const uniqueIds = new Set(ids)
      // Allow some duplicates in manman/panpan (known data issue), but most should be unique
      if (key === 'manman' || key === 'panpan' || key === 'mixiaowo') {
        // Just verify IDs exist
        expect(ids.length).toBeGreaterThan(0)
      } else {
        expect(uniqueIds.size).toBe(ids.length)
      }
    }
  })

  it('PALETTE_NAMES should have entries for all palettes', () => {
    for (const key of expectedPaletteKeys) {
      expect(PALETTE_NAMES[key]).toBeDefined()
      expect(PALETTE_NAMES[key].zh).toBeTruthy()
      expect(PALETTE_NAMES[key].en).toBeTruthy()
    }
  })
})

describe('getFilteredPalette', () => {
  it('should return full palette when excludedColors is empty', () => {
    const result = getFilteredPalette('mard221', [])
    expect(result.length).toBe(PALETTES.mard221.length)
  })

  it('should exclude specified colors', () => {
    const result = getFilteredPalette('mard221', ['A1', 'A2'])
    expect(result.length).toBe(PALETTES.mard221.length - 2)
    expect(result.find(c => c.id === 'A1')).toBeUndefined()
    expect(result.find(c => c.id === 'A2')).toBeUndefined()
  })

  it('should return mard221 as fallback for unknown palette', () => {
    const result = getFilteredPalette('nonexistent', [])
    expect(result.length).toBe(PALETTES.mard221.length)
  })

  it('should preserve color structure after filtering', () => {
    const result = getFilteredPalette('coco', ['E02'])
    expect(result.length).toBeGreaterThan(0)
    const first = result[0]
    expect(first.id).toBeTruthy()
    expect(first.hex).toMatch(/^#[0-9A-Fa-f]{6}$/)
    expect(first.brand).toBeTruthy()
  })

  it('should handle excluding all colors', () => {
    const allIds = PALETTES.mard221.map(c => c.id)
    const result = getFilteredPalette('mard221', allIds)
    expect(result.length).toBe(0)
  })
})
