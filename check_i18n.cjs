const fs = require('fs');
const tools = fs.readFileSync('src/lib/tools/index.ts','utf8').match(/import '\.\/([^']+)'/g).map(m => m.replace(/import '\.\/(.+)'/,'$1'));
const zh = JSON.parse(fs.readFileSync('src/lib/locales/zh.json','utf8'));
const en = JSON.parse(fs.readFileSync('src/lib/locales/en.json','utf8'));
const missing = [];
for (const t of tools) {
  if (t === 'perler-beads-registry') continue;
  const nameKey = 'tool.' + t;
  const descKey = 'tool.' + t + '.desc';
  const zhName = zh[nameKey] ? 'ok' : 'MISSING';
  const enName = en[nameKey] ? 'ok' : 'MISSING';
  if (zhName === 'MISSING' || enName === 'MISSING') {
    missing.push({ tool: t, zhName, enName });
  }
}
console.log('Total tools:', tools.length);
console.log('Missing i18n:', missing.length);
missing.forEach(m => console.log('  ' + m.tool + ' (zh:' + m.zhName + ' en:' + m.enName + ')'));
