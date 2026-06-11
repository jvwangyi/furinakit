const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'lib', 'locales');

for (const lang of ['ja', 'ko']) {
  const p = path.join(dir, lang + '.json');
  let c = fs.readFileSync(p, 'utf8');
  
  // Fix: add missing comma before "academic.settings.persistent" 
  // Pattern: ..."\n\n  "academic.settings.persistent"  (missing comma after previous value)
  c = c.replace(/"\n\n  "academic\.settings\.persistent"/g, '",\n\n  "academic.settings.persistent"');
  
  // Fix: remove duplicate content after the first complete JSON object
  // Find the last occurrence of "academic.settings.browser_hint" and its closing }
  const lastHint = c.lastIndexOf('"academic.settings.browser_hint"');
  if (lastHint > 0) {
    const afterHint = c.indexOf('}', lastHint);
    if (afterHint > 0) {
      c = c.substring(0, afterHint + 1) + '\n';
    }
  }
  
  try {
    const parsed = JSON.parse(c);
    fs.writeFileSync(p, c, 'utf8');
    console.log(lang + '.json: fixed (' + Object.keys(parsed).length + ' keys)');
  } catch(e) {
    console.log(lang + '.json: still broken - ' + e.message.substring(0, 80));
  }
}
