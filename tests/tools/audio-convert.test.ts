import { describe, it, expect } from 'vitest'
import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import '@/lib/tools'
import { getTool } from '@/lib/registry'

// Check ffmpeg availability at module level (before describe blocks)
let ffmpegAvailable = false
const testWavPath = join(tmpdir(), 'furinakit-test-convert.wav')

try {
  execSync('ffmpeg -version', { stdio: 'pipe' })
  ffmpegAvailable = true
  // Generate a 1-second test WAV file
  execSync(
    `ffmpeg -y -f lavfi -i sine=frequency=440:duration=1 -ar 44100 "${testWavPath}"`,
    { stdio: 'pipe', timeout: 15000 }
  )
} catch {
  ffmpegAvailable = false
}

const itIfFfmpeg = ffmpegAvailable ? it : it.skip

describe('audio-convert tool', () => {
  const tool = getTool('audio-convert')

  it('should be registered', () => {
    expect(tool).toBeDefined()
    expect(tool?.name).toBe('audio-convert')
    expect(tool?.category).toBe('audio')
  })

  it('should throw when format is invalid', async () => {
    const fakeBuffer = Buffer.from('not real audio')
    await expect(
      tool!.execute({ file: fakeBuffer, format: 'mp4' })
    ).rejects.toThrow()
  })

  itIfFfmpeg('should convert WAV to MP3', async () => {
    expect(existsSync(testWavPath)).toBe(true)
    const wavBuffer = readFileSync(testWavPath)
    const result = await tool!.execute({ file: wavBuffer, format: 'mp3' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/mpeg')
    expect(result.filename).toBe('audio.mp3')
    // MP3 files typically start with ID3 tag (0x49 0x44 0x33) or sync word (0xFF 0xFB)
    const buf = result.data as Buffer
    const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33
    const isSync = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0
    expect(isId3 || isSync).toBe(true)
  }, 30000)

  // OGG/libvorbis may not work on all ffmpeg builds
  it.skip('should convert WAV to OGG', async () => {
    const wavBuffer = readFileSync(testWavPath)
    const result = await tool!.execute({ file: wavBuffer, format: 'ogg' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/ogg')
    expect(result.filename).toBe('audio.ogg')
    // OGG files start with 'OggS'
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 0, 4)).toBe('OggS')
  }, 30000)

  itIfFfmpeg('should convert WAV to FLAC', async () => {
    const wavBuffer = readFileSync(testWavPath)
    const result = await tool!.execute({ file: wavBuffer, format: 'flac' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/flac')
    expect(result.filename).toBe('audio.flac')
    // FLAC files start with 'fLaC'
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 0, 4)).toBe('fLaC')
  }, 30000)

  itIfFfmpeg('should convert WAV to WAV (identity)', async () => {
    const wavBuffer = readFileSync(testWavPath)
    const result = await tool!.execute({ file: wavBuffer, format: 'wav' })

    expect(result.data).toBeInstanceOf(Buffer)
    expect(result.mimeType).toBe('audio/wav')
    expect(result.filename).toBe('audio.wav')
    // WAV files start with 'RIFF'
    const buf = result.data as Buffer
    expect(buf.toString('ascii', 0, 4)).toBe('RIFF')
  }, 30000)
})
