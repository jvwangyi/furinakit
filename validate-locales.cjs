const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'lib', 'locales');
const files = ['en.json', 'ja.json', 'ko.json', 'zh.json'];
for (const f of files) {
  const p = path.join(dir, f);
  try {
    const data = JSON.parse(fs.readFileSync(p, 'utf8'));
    const keys = Object.keys(data);
    console.log(`${f}: valid (${keys.length} keys)`);
  } catch(e) {
    console.log(`${f}: INVALID at pos ${e.message.match(/position (\d+)/)?.[1] || '?'}: ${e.message.substring(0, 100)}`);
  }
}
