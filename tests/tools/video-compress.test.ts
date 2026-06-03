import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

// Check ffmpeg availability and generate test video at module level
let ffmpegAvailable = false
const testVideoPath = join(tmpdir(), 'furinakit-test-compress.mp4')

try {
  execSync('ffmpeg -version', { stdio: 'pipe' })
  ffmpegAvailable = true
  // Generate a 2-second test video with color bars
  execSync(
    `ffmpeg -y -f lavfi -i color=c=blue:s=320x240:d=2 -c:v libx264 -pix_fmt yuv420p "${testVideoPath}"`,
    { stdio: 'pipe', timeout: 30000 }
  )
} catch {
  ffmpegAvailable = false
}

const itIfFfmpeg = ffmpegAvailable ? it : it.skip

describe('video-compress tool', () => {
  const tool = getTool('video-compress')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('video-compress')
    expect(tool?.category).toBe('video')
  })

  it('should throw when quality is invalid', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({ file: fakeBuffer, quality: 'ultra' as any })
    ).rejects.toThrow()
  })

  it('should throw when maxWidth is too small', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({ file: fakeBuffer, maxWidth: 50 })
    ).rejects.toThrow()
  })

  it('should throw when maxWidth is too large', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({ file: fakeBuffer, maxWidth: 5000 })
    ).rejects.toThrow()
  })

  itIfFfmpeg('should compress video with default settings', async () => {
    expect(existsSync(testVideoPath)).toBe(true)
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    expect(result.filename).toBe('compressed.mp4')
    // Output should be a valid MP4 (starts with ftyp box)
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 4, 8)).toBe('ftyp')
  }, 60000)

  itIfFfmpeg('should compress video with low quality', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, quality: 'low' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    expect(result.filename).toBe('compressed.mp4')
  }, 60000)

  itIfFfmpeg('should compress video with high quality', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, quality: 'high' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    expect(result.filename).toBe('compressed.mp4')
  }, 60000)

  itIfFfmpeg('should compress video with maxWidth constraint', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, maxWidth: 160 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    expect(result.filename).toBe('compressed.mp4')
  }, 60000)
})
