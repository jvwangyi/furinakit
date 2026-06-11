const fs = require('fs');
const path = 'C:\\Users\\26601\\Desktop\\furina-agent\\furinakit\\src\\app\\academic\\literature\\page.tsx';
let c = fs.readFileSync(path, 'utf8');

// Fix garbled error message
c = c.replace(/setError\('.*?Ч.*?'\);/g, "setError(t('academic.common.search_failed'));");

// Fix garbled select option
c = c.replace(/<option value="">.*?{t\('academic\.projects\.title'\)}.*?<\/option>/g,
  '<option value="">{t(\'academic.projects.title\')}</option>');

// Fix searching fallback
c = c.replace(/\|\| '.*?\.\.\.'/g, '');

// Fix page_info fallback with garbled chars
c = c.replace(/\|\| `.*?\$\{currentPage\}.*?\$\{Math\.ceil\(totalResults \/ LIMIT\)\}.*?`/g, '');

// Fix results_unit fallback
c = c.replace(/\|\| 'ƪ'/g, '');

// Fix garbled separator text
c = c.replace(/\{' �� '\}/g, "{' '}");

// Fix garbled comment blocks
c = c.replace(/\{\/\*.*?Phase: Topic Input.*?\*\/\}/g, '');
c = c.replace(/\{\/\*.*?Phase: Keyword Discussion.*?\*\/\}/g, '');
c = c.replace(/\{\/\*.*?Phase: Search.*?\*\/\}/g, '');
c = c.replace(/\{\/\*.*?Generate Review Section.*?\*\/\}/g, '');

// Fix garbled Chinese button text (the pattern is: >garbled_text</Button>)
// Find the specific line with the language button
const lines = c.split('\n');
for (let i = 0; i < lines.length; i++) {
  // Fix the Chinese language button
  if (lines[i].match(/className="flex-1 text-xs">/) && lines[i].match(/[\x80-\xff]{4,}/) && lines[i].includes('</Button>')) {
    if (lines[i].includes('variant={reviewLang')) {
      lines[i] = lines[i].replace(/>[\x80-\xff]+<\/Button>/g, ">{t('academic.common.chinese')}</Button>");
    }
  }
}
c = lines.join('\n');

fs.writeFileSync(path, c, 'utf8');
console.log('Fixed literature/page.tsx garbled text');
