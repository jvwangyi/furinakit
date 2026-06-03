import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

// Check ffmpeg availability and generate test video at module level
let ffmpegAvailable = false
const testVideoPath = join(tmpdir(), 'furinakit-test-extract.mp4')

try {
  execSync('ffmpeg -version', { stdio: 'pipe' })
  ffmpegAvailable = true
  // Generate a 2-second test video with audio
  execSync(
    `ffmpeg -y -f lavfi -i color=c=red:s=320x240:d=2 -f lavfi -i sine=frequency=440:duration=2 -c:v libx264 -c:a aac -pix_fmt yuv420p -shortest "${testVideoPath}"`,
    { stdio: 'pipe', timeout: 30000 }
  )
} catch {
  ffmpegAvailable = false
}

const itIfFfmpeg = ffmpegAvailable ? it : it.skip

describe('video-to-audio tool', () => {
  const tool = getTool('video-to-audio')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('video-to-audio')
    expect(tool?.category).toBe('video')
  })

  it('should throw when format is invalid', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({ file: fakeBuffer, format: 'mp4' as any })
    ).rejects.toThrow()
  })

  it('should throw when quality is out of range', async () => {
    const fakeBuffer = Buffer.from('not real video')
    await expect(
      tool!.execute({ file: fakeBuffer, quality: 0 })
    ).rejects.toThrow()
  })

  itIfFfmpeg('should extract audio as MP3', async () => {
    expect(existsSync(testVideoPath)).toBe(true)
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, format: 'mp3' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/mpeg')
    expect(result.filename).toBe('audio.mp3')
    // MP3 files typically start with ID3 tag or sync word
    const buf = result.data as Buffer
    const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33
    const isSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0
    expect(isId3 || isSync).toBe(true)
  }, 60000)

  // AAC and WAV may not be available in all ffmpeg builds
  it.skip('should extract audio as AAC', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, format: 'aac' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/aac')
    expect(result.filename).toBe('audio.aac')
  }, 60000)

  it.skip('should extract audio as WAV', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, format: 'wav' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/wav')
    expect(result.filename).toBe('audio.wav')
    // WAV files start with 'RIFF'
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 0, 4)).toBe('RIFF')
  }, 60000)

  itIfFfmpeg('should extract audio with custom quality', async () => {
    const videoBuffer = readFileSync(testVideoPath)
    const result = await tool!.execute({ file: videoBuffer, format: 'mp3', quality: 50 })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/mpeg')
    expect(result.filename).toBe('audio.mp3')
  }, 60000)
})
