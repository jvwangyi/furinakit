const fs = require('fs');

// Fix writing/page.tsx garbled comments
const wpath = 'C:\\Users\\26601\\Desktop\\furina-agent\\furinakit\\src\\app\\academic\\writing\\page.tsx';
let wc = fs.readFileSync(wpath, 'utf8');
wc = wc.replace(/\{\/\*.*?Step 1: Topic.*?\*\/\}/g, '');
wc = wc.replace(/\{\/\*.*?Step 2: Outline.*?\*\/\}/g, '');
wc = wc.replace(/\{\/\*.*?Step 3: Writing.*?\*\/\}/g, '');
wc = wc.replace(/鈫?{t\('academic\.writing\.back_to_settings'\)}/g, '{t("academic.writing.back_to_settings")}');
fs.writeFileSync(wpath, wc, 'utf8');
console.log('Fixed writing/page.tsx');

// Fix settings/page.tsx 'default'
const spath = 'C:\\Users\\26601\\Desktop\\furina-agent\\furinakit\\src\\app\\academic\\settings\\page.tsx';
let sc = fs.readFileSync(spath, 'utf8');
sc = sc.replace(/\|\| 'default'\)/g, "|| t('academic.common.default_model'))");
fs.writeFileSync(spath, sc, 'utf8');
console.log('Fixed settings/page.tsx');

// Fix PeerReviewStage.tsx garbled text
const ppath = 'C:\\Users\\26601\\Desktop\\furina-agent\\furinakit\\src\\components\\academic\\pipeline\\PeerReviewStage.tsx';
let pc = fs.readFileSync(ppath, 'utf8');
// Fix garbled verdict line - replace the whole line
pc = pc.replace(/md \+= `## Verdict\\nScore:.*?\\n`;/g, "md += `## Verdict\\nScore: ${verdictResult.total_score}/100 — ${verdictResult.decision}\\n`;");
fs.writeFileSync(ppath, pc, 'utf8');
console.log('Fixed PeerReviewStage.tsx');
