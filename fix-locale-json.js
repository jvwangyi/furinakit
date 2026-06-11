const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'lib', 'locales');
const files = ['en.json', 'zh.json', 'ja.json', 'ko.json'];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Remove BOM
  if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    console.log(`[${file}] Removed BOM`);
  }

  // 2. Fix missing commas between key-value pairs
  // Pattern: "}\n  "key" -> add comma after }
  // Pattern: ""\n  "key" (value string ending, next key on new line) -> add comma
  content = content.replace(/"\s*\n(\s*"[^"]+"\s*:)/g, '",\n$1');

  // Also fix cases like: }  \n  "key" (closing brace then next key)
  content = content.replace(/\}\s*\n(\s*"[^"]+"\s*:)/g, '},\n$1');

  // Fix multiple consecutive commas (like ,,,,)
  content = content.replace(/,{2,}/g, ',');

  // 3. Remove trailing commas before } or ]
  content = content.replace(/,(\s*[}\]])/g, '$1');

  // 4. Parse and re-stringify to detect any remaining issues and deduplicate keys
  let obj;
  try {
    obj = JSON.parse(content);
    console.log(`[${file}] JSON.parse OK`);
  } catch (e) {
    console.error(`[${file}] JSON.parse still fails after fixes: ${e.message}`);
    // Try to show context
    const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
    if (pos > 0) {
      console.error(`  Context: ${JSON.stringify(content.substring(pos - 30, pos + 30))}`);
    }
    continue;
  }

  // Write back with proper formatting, no BOM
  const output = JSON.stringify(obj, null, 2) + '\n';
  fs.writeFileSync(filePath, output, 'utf8');
  console.log(`[${file}] Written successfully (${output.length} bytes)`);
}
