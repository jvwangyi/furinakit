const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'lib', 'locales');
const files = ['en.json', 'ja.json', 'ko.json'];
for (const f of files) {
  const p = path.join(dir, f);
  let content = fs.readFileSync(p, 'utf8');
  // Remove BOM if present
  if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
  // Fix: add comma before new keys that follow a closing quote without comma
  // Pattern: "...value"\n\n  "academic.settings.persistent"
  content = content.replace(/"\s*\n\n\s*"academic\.settings\.persistent"/, '",\n\n  "academic.settings.persistent"');
  // Also fix any missing comma between no_server_storage and the new block
  content = content.replace(/"no_server_storage":\s*"[^"]*"\s*\n\n\s*"academic\.settings\.persistent"/, (match) => {
    return match.replace(/"\s*\n\n\s*"academic/", '",\n\n  "academic');
  });
  // Remove duplicate keys that already existed earlier
  // The keys were added at the end but some already exist - remove the trailing duplicates
  // Find the last } and check if there's duplicate content before it
  try {
    JSON.parse(content);
    console.log(`${f}: already valid after comma fix`);
  } catch(e) {
    console.log(`${f}: still invalid - ${e.message.substring(0, 80)}`);
  }
  fs.writeFileSync(p, content, 'utf8');
}
