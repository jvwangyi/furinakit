import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

// Check ffmpeg availability and generate test video at module level
let ffmpegAvailable = false
const testVideoPath = join(tmpdir(), 'furinakit-test-trim.mp4')

try {
  execSync('ffmpeg -version', { stdio: 'pipe' })
  ffmpegAvailable = true
  // Generate a 5-second test video
  execSync(
    `ffmpeg -y -f lavfi -i color=c=green:s=320x240:d=5 -c:v libx264 -pix_fmt yuv420p "${testVideoPath}"`,
    { stdio: 'pipe', timeout: 30000 }
  )
} catch {
  ffmpegAvailable = false
}

const itIfFfmpeg = ffmpegAvailable ? it : it.skip

describe('video-trim tool', () => {
  const tool = getTool('video-trim')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('video-trim')
    expect(tool?.category).toBe('video')
  })

  it('should throw when both endTime and duration are missing', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({ file: fakeBuffer, startTime: '00:00:00' })
    ).rejects.toThrow()
  })

  it('should reject invalid startTime format', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({
        file: fakeBuffer,
        startTime: 'invalid',
        endTime: '00:00:05',
      })
    ).rejects.toThrow()
  })

  it('should reject startTime without HH:MM:SS format', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({
        file: fakeBuffer,
        startTime: '0:0:0',
        duration: '00:00:02',
      })
    ).rejects.toThrow()
  })

  it('should reject invalid endTime format', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({
        file: fakeBuffer,
        startTime: '00:00:00',
        endTime: 'bad',
      })
    ).rejects.toThrow()
  })

  itIfFfmpeg('should trim video with endTime', async () => {
    expect(existsSync(testVideoPath)).toBe(true)
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({
      file: videoBuffer,
      startTime: '00:00:00',
      endTime: '00:00:02',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    expect(result.filename).toBe('trimmed.mp4')
    // Output should be a valid MP4 (starts with ftyp box)
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 4, 8)).toBe('ftyp')
  }, 60000)

  itIfFfmpeg('should trim video with duration', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({
      file: videoBuffer,
      startTime: '00:00:01',
      duration: '00:00:02',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    expect(result.filename).toBe('trimmed.mp4')
    expect((result.data as Buffer).length).toBeGreaterThan(0)
  }, 60000)

  itIfFfmpeg('should trim from middle of video', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({
      file: videoBuffer,
      startTime: '00:00:02',
      endTime: '00:00:04',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('video/mp4')
    // Should produce valid MP4
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 4, 8)).toBe('ftyp')
  }, 60000)
})
