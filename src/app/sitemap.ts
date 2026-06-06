import type { MetadataRoute } from 'next';

const BASE = 'https://furinakit.example.com/furinakit';

const tools: { category: string; name: string }[] = [
  // PDF
  { category: 'pdf', name: 'pdf-merge' },
  { category: 'pdf', name: 'pdf-split' },
  { category: 'pdf', name: 'pdf-compress' },
  { category: 'pdf', name: 'pdf-to-image' },
  { category: 'pdf', name: 'pdf-rotate' },
  { category: 'pdf', name: 'pdf-extract-pages' },
  { category: 'pdf', name: 'pdf-encrypt' },
  { category: 'pdf', name: 'pdf-watermark' },
  { category: 'pdf', name: 'pdf-add-page-numbers' },
  { category: 'pdf', name: 'pdf-delete-pages' },
  // Image
  { category: 'image', name: 'image-resize' },
  { category: 'image', name: 'image-crop' },
  { category: 'image', name: 'image-convert' },
  { category: 'image', name: 'image-compress' },
  { category: 'image', name: 'image-rotate' },
  { category: 'image', name: 'image-merge' },
  { category: 'image', name: 'image-add-watermark' },
  { category: 'image', name: 'image-to-ico' },
  { category: 'image', name: 'image-exif' },
  { category: 'image', name: 'image-compare' },
  { category: 'image', name: 'gif-maker' },
  // Text
  { category: 'text', name: 'json-format' },
  { category: 'text', name: 'text-diff' },
  { category: 'text', name: 'base64' },
  { category: 'text', name: 'hash' },
  { category: 'text', name: 'url-encode' },
  { category: 'text', name: 'json-to-csv' },
  { category: 'text', name: 'csv-to-json' },
  { category: 'text', name: 'json-to-yaml' },
  { category: 'text', name: 'json-to-xml' },
  { category: 'text', name: 'markdown-to-html' },
  { category: 'text', name: 'regex-tester' },
  { category: 'text', name: 'text-case' },
  { category: 'text', name: 'text-count' },
  { category: 'text', name: 'font-preview' },
  { category: 'text', name: 'markdown-live' },
  // Convert
  { category: 'convert', name: 'csv-to-excel' },
  { category: 'convert', name: 'excel-to-csv' },
  { category: 'convert', name: 'yaml-to-json' },
  { category: 'convert', name: 'xml-to-json' },
  { category: 'convert', name: 'markdown-to-pdf' },
  { category: 'convert', name: 'image-to-pdf' },
  { category: 'convert', name: 'image-to-base64' },
  { category: 'convert', name: 'base64-to-image' },
  { category: 'convert', name: 'barcode-gen' },
  // Dev
  { category: 'dev', name: 'jwt-decode' },
  { category: 'dev', name: 'timestamp' },
  { category: 'dev', name: 'sql-format' },
  { category: 'dev', name: 'uuid-gen' },
  { category: 'dev', name: 'password-gen' },
  { category: 'dev', name: 'qrcode-gen' },
  { category: 'dev', name: 'color-convert' },
  { category: 'dev', name: 'css-format' },
  { category: 'dev', name: 'js-format' },
  { category: 'dev', name: 'html-format' },
  { category: 'dev', name: 'cron-gen' },
  { category: 'dev', name: 'cron-parser' },
  { category: 'dev', name: 'url-parser' },
  { category: 'dev', name: 'base-converter' },
  { category: 'dev', name: 'lorem-gen' },
  { category: 'dev', name: 'text-crypto' },
  { category: 'dev', name: 'css-gradient' },
  { category: 'dev', name: 'code-minify' },
  { category: 'dev', name: 'json-schema-validate' },
  { category: 'dev', name: 'openapi-viewer' },
  { category: 'dev', name: 'color-palette' },
  { category: 'dev', name: 'svg-optimize' },
  { category: 'dev', name: 'dns-lookup' },
  { category: 'dev', name: 'ssl-checker' },
  { category: 'dev', name: 'user-agent-parser' },
  // Audio
  { category: 'audio', name: 'audio-convert' },
  { category: 'audio', name: 'audio-trim' },
  // Video
  { category: 'video', name: 'video-to-audio' },
  { category: 'video', name: 'video-compress' },
  { category: 'video', name: 'video-trim' },
  { category: 'video', name: 'video-thumbnail' },
  // File
  { category: 'file', name: 'file-info' },
  { category: 'file', name: 'file-hash' },
  // Craft
  { category: 'craft', name: 'perler-beads' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const toolEntries = tools.map(({ category, name }) => ({
    url: `${BASE}/${category}/${name}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  return [
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/api-docs`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...toolEntries,
  ];
}
