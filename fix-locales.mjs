import fs from 'fs';
import path from 'path';

const dir = path.join('C:\\Users\\26601\\Desktop\\furina-agent\\furinakit\\src\\lib\\locales');
const files = ['en.json', 'ja.json', 'ko.json', 'zh.json'];

for (const file of files) {
  const fullPath = path.join(dir, file);
  let raw = fs.readFileSync(fullPath, 'utf8');

  // 1. Remove BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
    console.log(`[${file}] Removed BOM`);
  }

  // 2. Line-by-line fix
  const lines = raw.split('\n');
  const fixed = [];
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    let trimmed = line.trimEnd();
    
    // Fix multiple consecutive commas → single comma
    if (trimmed.match(/,{2,}/)) {
      trimmed = trimmed.replace(/,{2,}/g, ',');
      console.log(`[${file}] Line ${i+1}: Fixed multi-comma`);
    }
    
    // Check if next line starts with a key (") and current line is a value without trailing comma
    if (i < lines.length - 1) {
      const nextTrimmed = lines[i + 1].trimStart();
      const currentTrimmed = trimmed.trimEnd();
      
      // Current line ends with a string value "..." without comma, next line is a key "..."
      if (currentTrimmed.endsWith('"') && nextTrimmed.startsWith('"') && nextTrimmed.includes(': ')) {
        // But NOT if current line is just a key without value (has ": " before the quote)
        // A value line looks like: "key": "value"   (ends with quote, no colon after last quote)
        // A key-start line: "key": "value",  or "key": {
        
        // Check if the last '"' is part of a value (not a key)
        // Simple heuristic: count quotes. If current line has an even number of quotes and doesn't end with comma
        const quoteCount = (currentTrimmed.match(/"/g) || []).length;
        if (quoteCount >= 2 && !currentTrimmed.endsWith(',') && !currentTrimmed.endsWith('{') && !currentTrimmed.endsWith('[')) {
          // Check it's not already a structural line like just "}"
          if (!currentTrimmed.endsWith('}') && !currentTrimmed.endsWith(']')) {
            trimmed = trimmed.trimEnd() + ',';
            console.log(`[${file}] Line ${i+1}: Added missing comma after: ${currentTrimmed.slice(-60)}`);
          }
        }
      }
    }
    
    fixed.push(trimmed);
  }
  
  raw = fixed.join('\n');

  // 3. Remove trailing commas before } or ]
  raw = raw.replace(/,(\s*[}\]])/g, '$1');

  // 4. Try to parse
  let obj;
  try {
    obj = JSON.parse(raw);
    console.log(`[${file}] JSON parsed OK (${Object.keys(obj).length} keys)`);
  } catch (e) {
    console.error(`[${file}] JSON still invalid: ${e.message}`);
    const pos = parseInt(e.message.match(/position (\d+)/)?.[1] || '0');
    if (pos > 0) {
      const ctx = raw.slice(Math.max(0, pos - 100), pos + 100);
      console.error(`  Context around pos ${pos}:`);
      console.error(`  ...${ctx}...`);
    }
    continue;
  }

  // 5. Serialize with consistent formatting
  const output = JSON.stringify(obj, null, 2) + '\n';
  
  // 6. Write without BOM
  fs.writeFileSync(fullPath, output, 'utf8');
  console.log(`[${file}] Written successfully (${Object.keys(obj).length} keys)\n`);
}

console.log('All locale files fixed!');
