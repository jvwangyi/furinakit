import { ToolError, ErrorCode } from './errors';
import { logger } from './logger';

/**
 * Magic bytes for common file types.
 * Only includes types FurinaKit actually processes.
 */
const MAGIC_BYTES: { mime: string; signatures: number[][] }[] = [
  // Images
  { mime: 'image/png',  signatures: [[0x89, 0x50, 0x4E, 0x47]] },
  { mime: 'image/jpeg', signatures: [[0xFF, 0xD8, 0xFF]] },
  { mime: 'image/gif',  signatures: [[0x47, 0x49, 0x46, 0x38]] },
  { mime: 'image/webp', signatures: [[0x52, 0x49, 0x46, 0x46]] }, // RIFF....WEBP
  { mime: 'image/bmp',  signatures: [[0x42, 0x4D]] },
  { mime: 'image/ico',  signatures: [[0x00, 0x00, 0x01, 0x00]] },
  // PDF
  { mime: 'application/pdf', signatures: [[0x25, 0x50, 0x44, 0x46]] },
  // Video
  { mime: 'video/mp4',  signatures: [[0x00, 0x00, 0x00], [0x66, 0x74, 0x79, 0x70]] }, // ftyp at offset 4
  { mime: 'video/webm', signatures: [[0x1A, 0x45, 0xDF, 0xA3]] },
  { mime: 'video/avi',  signatures: [[0x52, 0x49, 0x46, 0x46]] }, // RIFF....AVI
  // Audio
  { mime: 'audio/mpeg', signatures: [[0xFF, 0xFB], [0xFF, 0xF3], [0xFF, 0xF2], [0x49, 0x44, 0x33]] },
  { mime: 'audio/wav',  signatures: [[0x52, 0x49, 0x46, 0x46]] }, // RIFF....WAVE
  { mime: 'audio/ogg',  signatures: [[0x4F, 0x67, 0x67, 0x53]] },
  { mime: 'audio/flac', signatures: [[0x66, 0x4C, 0x61, 0x43]] },
  // Archives (for reference, not processed)
  { mime: 'application/zip', signatures: [[0x50, 0x4B, 0x03, 0x04]] },
];

/** Allowed MIME types per tool category */
const ALLOWED_MIME_TYPES: Record<string, string[]> = {
  image: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/ico', 'image/tiff'],
  pdf:   ['application/pdf'],
  video: ['video/mp4', 'video/webm', 'video/avi', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a'],
};

/** Dangerous file extensions that should never be allowed */
const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.com', '.msi', '.scr', '.pif',
  '.sh', '.bash', '.csh', '.ksh',
  '.js', '.mjs', '.cjs', '.vbs', '.vbe', '.wsf', '.wsh',
  '.ps1', '.psm1', '.psd1', '.ps1xml',
  '.jar', '.class', '.py', '.rb', '.php', '.pl',
  '.dll', '.sys', '.drv', '.ocx',
  '.lnk', '.inf', '.reg', '.rgs',
]);

/**
 * Detect MIME type from magic bytes (first N bytes of file).
 * Returns null if unknown.
 */
export function detectMimeType(buffer: Buffer): string | null {
  for (const { mime, signatures } of MAGIC_BYTES) {
    for (const sig of signatures) {
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (buffer[i] !== sig[i]) { match = false; break; }
      }
      if (match) return mime;
    }
  }
  return null;
}

/**
 * Validate file type by checking magic bytes against allowed types.
 * This prevents attacks where someone renames a .exe to .jpg.
 */
export function validateFileType(buffer: Buffer, category: string, filename?: string): void {
  // Check blocked extensions first
  if (filename) {
    const ext = getExtension(filename).toLowerCase();
    if (BLOCKED_EXTENSIONS.has(ext)) {
      logger.warn({ filename, ext }, 'Blocked dangerous file extension');
      throw new ToolError(ErrorCode.INVALID_INPUT, `不支持的文件类型: ${ext}`);
    }
  }

  const allowedTypes = ALLOWED_MIME_TYPES[category];
  if (!allowedTypes) return; // No restriction for unknown categories

  // For small files, skip magic byte check (they might be too small)
  if (buffer.length < 4) return;

  const detected = detectMimeType(buffer);
  if (detected && !allowedTypes.includes(detected)) {
    logger.warn({ detected, category, filename }, 'File type mismatch');
    throw new ToolError(
      ErrorCode.INVALID_INPUT,
      `文件类型不匹配：检测到 ${detected}，但该工具只接受 ${category} 类型的文件`
    );
  }
}

/**
 * Get file extension from filename
 */
export function getExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  return lastDot === -1 ? '' : filename.slice(lastDot);
}

/**
 * Sanitize filename: remove path traversal, special chars, limit length.
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  let name = filename.replace(/^.*[\\/]/, '');
  // Remove special characters except dash, underscore, dot
  name = name.replace(/[^a-zA-Z0-9._\-\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff]/g, '_');
  // Limit length
  if (name.length > 200) {
    const ext = getExtension(name);
    name = name.slice(0, 200 - ext.length) + ext;
  }
  // Ensure not empty
  if (!name || name === '.') name = 'file';
  return name;
}

/**
 * Create a timeout wrapper for long-running operations.
 * Rejects with ToolError after the specified timeout.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number, operation = '操作'): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new ToolError(ErrorCode.TIMEOUT, `${operation}超时（超过 ${Math.round(ms / 1000)} 秒）`));
      }, ms);
    }),
  ]);
}

/** Default timeouts by category (ms) */
export const OPERATION_TIMEOUT: Record<string, number> = {
  image: 30_000,    // 30s
  pdf:   120_000,   // 2 min
  video: 300_000,   // 5 min
  audio: 120_000,   // 2 min
  default: 60_000,  // 1 min
};

/**
 * Wrap a tool execution with timeout based on category.
 */
export function withCategoryTimeout<T>(promise: Promise<T>, category: string): Promise<T> {
  const timeout = OPERATION_TIMEOUT[category] || OPERATION_TIMEOUT.default;
  return withTimeout(promise, timeout, category);
}
