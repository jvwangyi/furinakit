import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

// Check ffmpeg availability and generate test audio at module level
let ffmpegAvailable = false
const testMp3Path = join(tmpdir(), 'furinakit-test-trim.mp3')

try {
  execSync('ffmpeg -version', { stdio: 'pipe' })
  ffmpegAvailable = true
  // Generate a 5-second test MP3 file (mp3 input needed for -c copy to work)
  execSync(
    `ffmpeg -y -f lavfi -i sine=frequency=440:duration=5 -ar 44100 -acodec libmp3lame -b:a 128k "${testMp3Path}"`,
    { stdio: 'pipe', timeout: 15000 }
  )
} catch {
  ffmpegAvailable = false
}

const itIfFfmpeg = ffmpegAvailable ? it : it.skip

describe('audio-trim tool', () => {
  const tool = getTool('audio-trim')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('audio-trim')
    expect(tool?.category).toBe('audio')
  })

  it('should throw when both endTime and duration are missing', async () => {
    const fakeBuffer = Buffer.from('not real audio')
    await expect(
      tool!.execute({ file: fakeBuffer, startTime: '00:00:00' })
    ).rejects.toThrow()
  })

  it('should reject invalid startTime format', async () => {
    const fakeBuffer = Buffer.from('not real audio')
    await expect(
      tool!.execute({
        file: fakeBuffer,
        startTime: 'invalid',
        endTime: '00:00:05',
      })
    ).rejects.toThrow()
  })

  it('should reject startTime without HH:MM:SS format', async () => {
    const fakeBuffer = Buffer.from('not real audio')
    await expect(
      tool!.execute({
        file: fakeBuffer,
        startTime: '0:0:0',
        duration: '00:00:02',
      })
    ).rejects.toThrow()
  })

  it('should reject invalid endTime format', async () => {
    const fakeBuffer = Buffer.from('not real audio')
    await expect(
      tool!.execute({
        file: fakeBuffer,
        startTime: '00:00:00',
        endTime: 'bad',
      })
    ).rejects.toThrow()
  })

  itIfFfmpeg('should trim audio with endTime', async () => {
    expect(existsSync(testMp3Path)).toBe(true)
    const mp3Buffer = readFileSync(testMp3Path)
    const result = await tool!.execute({
      file: mp3Buffer,
      startTime: '00:00:00',
      endTime: '00:00:02',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/mpeg')
    expect(result.filename).toBe('trimmed.mp3')
    // Output should be smaller than input (5s → 2s)
    expect((result.data as Buffer).length).toBeLessThan(mp3Buffer.length)
  }, 30000)

  itIfFfmpeg('should trim audio with duration', async () => {
    const mp3Buffer = readFileSync(testMp3Path)
    const result = await tool!.execute({
      file: mp3Buffer,
      startTime: '00:00:01',
      duration: '00:00:02',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/mpeg')
    expect(result.filename).toBe('trimmed.mp3')
    expect((result.data as Buffer).length).toBeGreaterThan(0)
  }, 30000)

  itIfFfmpeg('should trim from middle of audio', async () => {
    const mp3Buffer = readFileSync(testMp3Path)
    const result = await tool!.execute({
      file: mp3Buffer,
      startTime: '00:00:02',
      endTime: '00:00:04',
    })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/mpeg')
    // Should produce valid MP3
    const buf = result.data as Buffer
    const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33
    const isSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0
    expect(isId3 || isSync).toBe(true)
  }, 30000)
})
