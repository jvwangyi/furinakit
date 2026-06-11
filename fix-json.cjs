const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'lib', 'locales');

// Keys to ensure exist (from the PowerShell append that broke the files)
const keysToAdd = {
  'en': {
    "academic.settings.persistent": "Persistent",
    "academic.settings.temporary": "Temporary",
    "academic.settings.configure": "Configure API Key",
    "academic.settings.loading": "Loading...",
    "academic.settings.no_saved": "No saved configurations",
    "academic.settings.shared_desc": "Configuration is shared across all academic sub-pages, configure once to use in literature review, paper writing, review and other modules.",
    "academic.settings.browser_hint": "Browser local storage will be lost when browser data is cleared, recommend saving to account after login.",
    "nav.settings": "Settings"
  },
  'ja': {
    "academic.settings.persistent": "永続的",
    "academic.settings.temporary": "一時的",
    "academic.settings.configure": "APIキーを設定",
    "academic.settings.loading": "読み込み中...",
    "academic.settings.no_saved": "保存済みの設定なし",
    "academic.settings.shared_desc": "設定はすべての学術サブページで共有されます。文献綜述、論文作成、レビューモジュールで1回の設定で使用できます。",
    "academic.settings.browser_hint": "ブラウザのローカルストレージはブラウザデータの消去時に失われます。ログイン後にアカウントに保存することをお勧めします。",
    "nav.settings": "設定"
  },
  'ko': {
    "academic.settings.persistent": "영구적",
    "academic.settings.temporary": "임시",
    "academic.settings.configure": "API 키 설정",
    "academic.settings.loading": "로딩 중...",
    "academic.settings.no_saved": "저장된 설정 없음",
    "academic.settings.shared_desc": "설정은 모든 학술 하위 페이지에서 공유됩니다. 문헌 종술, 논문 작성, 리뷰 모듈에서 한 번 설정으로 사용할 수 있습니다.",
    "academic.settings.browser_hint": "브라우저 로컬 저장소는 브라우저 데이터 삭제 시 사라집니다. 로그인 후 계정에 저장하는 것을 권장합니다.",
    "nav.settings": "설정"
  }
};

for (const [lang, newKeys] of Object.entries(keysToAdd)) {
  const filePath = path.join(dir, `${lang}.json`);
  let raw = fs.readFileSync(filePath, 'utf8');
  
  // Remove BOM
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  
  // Find the first closing brace - everything after it is junk from the broken append
  const firstCloseBrace = raw.indexOf('\n}');
  if (firstCloseBrace === -1) {
    console.log(`${lang}.json: could not find closing brace`);
    continue;
  }
  
  // Get the content up to (but not including) the closing brace
  let content = raw.substring(0, firstCloseBrace);
  
  // Add new keys
  for (const [key, value] of Object.entries(newKeys)) {
    if (!content.includes(`"${key}"`)) {
      content += `,\n  "${key}": "${value}"`;
    }
  }
  
  // Close the JSON
  content += '\n}\n';
  
  // Validate
  try {
    JSON.parse(content);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${lang}.json: fixed and valid (${Object.keys(JSON.parse(content)).length} keys)`);
  } catch(e) {
    console.log(`${lang}.json: still invalid after fix - ${e.message.substring(0, 80)}`);
  }
}
