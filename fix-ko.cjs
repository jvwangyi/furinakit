const fs = require('fs');
const p = 'src/lib/locales/ko.json';
let c = fs.readFileSync(p, 'utf8');

// Fix: add missing comma before any of the appended keys
// The pattern is: closing quote + CRLF + CRLF + spaces + opening quote of new key
// Replace: "\r\n\r\n  "academic.settings.persistent"  ->  ",\r\n\r\n  "academic.settings.persistent"
c = c.replace(/"\r?\n\r?\n\s*"academic\.settings\.persistent"/g, '",\r\n\r\n  "academic.settings.persistent"');

// Also handle the case where the line before is "academic.llm.saved_keys"
// Actually the regex above should catch it generically

// Remove duplicate content after the first complete set
// Find the LAST occurrence of academic.settings.browser_hint and its closing }
const lastHint = c.lastIndexOf('"academic.settings.browser_hint"');
if (lastHint > 0) {
  const afterHint = c.indexOf('}', lastHint);
  if (afterHint > 0) {
    c = c.substring(0, afterHint + 1) + '\r\n';
  }
}

try {
  const parsed = JSON.parse(c);
  fs.writeFileSync(p, c, 'utf8');
  console.log('ko.json: fixed (' + Object.keys(parsed).length + ' keys)');
} catch(e) {
  console.log('ko.json: still broken - ' + e.message.substring(0, 100));
}
