import { describe, it, expect } from 'vitest'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

describe('css-gradient tool', () => {
  const tool = getTool('css-gradient')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('css-gradient')
    expect(tool?.category).toBe('dev')
  })

  it('should generate linear gradient', async () => {
    const result = await tool!.execute({
      type: 'linear',
      angle: 90,
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#0000ff', position: 100 },
      ],
    })
    const data = JSON.parse(result.text!)
    expect(data.css).toContain('linear-gradient(90deg')
    expect(data.css).toContain('#ff0000 0%')
    expect(data.css).toContain('#0000ff 100%')
  })

  it('should generate radial gradient', async () => {
    const result = await tool!.execute({
      type: 'radial',
      colorStops: [
        { color: '#ffffff', position: 0 },
        { color: '#000000', position: 100 },
      ],
      shape: 'circle',
    })
    const data = JSON.parse(result.text!)
    expect(data.css).toContain('radial-gradient(circle')
  })

  it('should generate conic gradient', async () => {
    const result = await tool!.execute({
      type: 'conic',
      angle: 0,
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#00ff00', position: 33 },
        { color: '#0000ff', position: 66 },
        { color: '#ff0000', position: 100 },
      ],
    })
    const data = JSON.parse(result.text!)
    expect(data.css).toContain('conic-gradient(from 0deg')
  })
})
