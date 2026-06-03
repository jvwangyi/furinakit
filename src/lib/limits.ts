export const LIMITS = {
  image: { maxSize: 50 * 1024 * 1024, timeout: 30_000 },
  pdf: { maxSize: 200 * 1024 * 1024, timeout: 60_000 },
  video: { maxSize: 500 * 1024 * 1024, timeout: 300_000 },
  audio: { maxSize: 500 * 1024 * 1024, timeout: 300_000 },
  text: { maxSize: 1 * 1024 * 1024, timeout: 10_000 },
} as const;
