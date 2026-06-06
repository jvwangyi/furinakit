const routes = [
  'dev/cron-gen',
  'dev/unit-converter',
  'dev/text-crypto',
  'dev/css-gradient',
  'dev/code-minify',
  'dev/user-agent-parser',
  'dev/json-schema-validate',
  'dev/color-palette',
  'dev/dns-lookup',
  'dev/ssl-checker',
  'dev/svg-optimize',
  'dev/openapi-viewer',
  'image/image-exif',
  'image/image-compare',
  'image/gif-maker',
  'video/video-thumbnail',
  'convert/barcode-gen',
  'text/markdown-live',
  'text/font-preview',
];

// Read each route file to understand the pattern
import { readFileSync } from 'fs';
import { join } from 'path';

for (const r of routes) {
  const p = join('C:\\Users\\26601\\Desktop\\furina-agent\\furinakit\\src\\app\\api', r, 'route.ts');
  try {
    const content = readFileSync(p, 'utf-8').trim();
    const first3 = content.split('\n').slice(0, 3).join(' | ');
    console.log(`${r}: ${first3}`);
  } catch (e) {
    console.log(`${r}: ERROR - ${e.message}`);
  }
}
