const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'lib', 'locales');

for (const lang of ['ja', 'ko']) {
  const filePath = path.join(dir, `${lang}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  
  // Find ALL positions of "academic.settings.persistent"
  // The first occurrence is in the original content, the second is from the append
  const firstOccurrence = raw.indexOf('"academic.settings.persistent"');
  if (firstOccurrence === -1) {
    console.log(`${lang}.json: key not found`);
    continue;
  }
  
  // Find the second occurrence (the appended one)
  const secondOccurrence = raw.indexOf('"academic.settings.persistent"', firstOccurrence + 1);
  
  if (secondOccurrence === -1) {
    // Only one occurrence - check if it's properly in the JSON
    console.log(`${lang}.json: only one occurrence, checking structure...`);
    // The key exists but maybe missing comma
    // Find the line before it
    const beforeKey = raw.substring(0, firstOccurrence);
    const lastNewline = beforeKey.lastIndexOf('\n');
    const prevLine = beforeKey.substring(beforeKey.lastIndexOf('\n', lastNewline - 1), lastNewline).trim();
    console.log(`  Previous line: ${prevLine}`);
    continue;
  }
  
  // Two occurrences means the PowerShell script added duplicates
  // Remove everything from the second occurrence to the end, then close properly
  let content = raw.substring(0, secondOccurrence);
  
  // Now content ends with the keys from the first append but before the second duplicate
  // We need to find where the original JSON ends and add a proper closing brace
  // Look for the pattern: ...some_value"\n\n (which is where the original JSON ended)
  
  // Actually, let's just parse what we have and try to fix it
  // The content should end with something like: ..."value"\n  "key": "value",\n  ...
  // We need to find the last valid key-value pair and close with \n}
  
  // Remove trailing comma if any
  content = content.trimEnd();
  if (content.endsWith(',')) {
    content = content.slice(0, -1);
  }
  
  // Close the JSON
  if (!content.endsWith('}')) {
    content += '\n}';
  }
  
  try {
    const parsed = JSON.parse(content);
    fs.writeFileSync(filePath, content + '\n', 'utf8');
    console.log(`${lang}.json: fixed (${Object.keys(parsed).length} keys)`);
  } catch(e) {
    // Try a different approach: find the first } and take everything before it
    const firstBrace = content.indexOf('\n}');
    if (firstBrace !== -1) {
      let fixed = content.substring(0, firstBrace) + '\n}';
      try {
        const parsed2 = JSON.parse(fixed);
        fs.writeFileSync(filePath, fixed + '\n', 'utf8');
        console.log(`${lang}.json: fixed with first-brace approach (${Object.keys(parsed2).length} keys)`);
      } catch(e2) {
        console.log(`${lang}.json: both approaches failed - ${e2.message.substring(0, 80)}`);
      }
    } else {
      console.log(`${lang}.json: could not fix - ${e.message.substring(0, 80)}`);
    }
  }
}
