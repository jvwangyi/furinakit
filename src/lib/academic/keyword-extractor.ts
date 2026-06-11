/**
 * Rule-based keyword extraction for conversational literature search.
 * No LLM required — works entirely client-side for instant results.
 */

// ─── Chinese stop words ─────────────────────────────────────────────────────
const ZH_STOP_WORDS = new Set([
  '我', '我们', '你', '你们', '他', '她', '它', '他们',
  '想', '要', '需要', '找', '搜索', '查', '查看', '研究',
  '关于', '的', '了', '吗', '呢', '吧', '啊', '嗯',
  '和', '与', '及', '或', '但', '而', '也', '还', '就',
  '在', '是', '有', '被', '把', '从', '到', '对', '为',
  '这', '那', '这些', '那些', '什么', '怎么', '如何', '哪些',
  '一种', '一些', '一下', '比较', '非常', '很', '更', '最',
  '方法', '技术', '研究', '方面', '领域', '问题', '领域',
  '请问', '能否', '可以', '怎样', '什么样',
]);

// ─── English stop words ─────────────────────────────────────────────────────
const EN_STOP_WORDS = new Set([
  'i', 'we', 'you', 'he', 'she', 'it', 'they',
  'want', 'need', 'find', 'search', 'look', 'about',
  'the', 'a', 'an', 'of', 'in', 'on', 'at', 'to', 'for',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did',
  'will', 'would', 'could', 'should', 'may', 'might',
  'and', 'or', 'but', 'not', 'no', 'nor',
  'this', 'that', 'these', 'those', 'some', 'any',
  'how', 'what', 'which', 'who', 'whom', 'where', 'when',
  'can', 'please', 'would', 'like', 'me', 'my',
  'method', 'methods', 'technique', 'techniques', 'approach',
  'paper', 'papers', 'study', 'research',
]);

// ─── Chinese → English domain synonyms ──────────────────────────────────────
const ZH_EN_SYNONYMS: Record<string, string[]> = {
  '骨架': ['skeleton', 'skeletal extraction', 'branch structure'],
  '提取': ['extraction', 'detection', 'segmentation'],
  '自动化': ['automated', 'automatic', 'automation'],
  '自动': ['automated', 'automatic', 'automation'],
  '树': ['tree', 'plant', 'arbor'],
  '梨树': ['pear tree', 'Pyrus'],
  '苹果树': ['apple tree', 'Malus'],
  '修剪': ['pruning', 'trimming'],
  '生长': ['growth', 'growing'],
  '叶片': ['leaf', 'leaves', 'foliage'],
  '果实': ['fruit', 'fruits'],
  '根': ['root', 'roots'],
  '枝': ['branch', 'branches', 'twig'],
  '干': ['trunk', 'stem'],
  '植物': ['plant', 'vegetation'],
  '图像': ['image', 'imagery'],
  '视觉': ['vision', 'visual'],
  '三维': ['3D', 'three-dimensional'],
  '重建': ['reconstruction', 'modeling'],
  '检测': ['detection', 'recognition'],
  '分割': ['segmentation'],
  '识别': ['recognition', 'identification'],
  '分类': ['classification', 'categorization'],
  '预测': ['prediction', 'forecasting'],
  '优化': ['optimization'],
  '分析': ['analysis'],
  '模型': ['model', 'modeling'],
  '网络': ['network'],
  '深度学习': ['deep learning'],
  '机器学习': ['machine learning'],
  '计算机视觉': ['computer vision'],
  '自然语言': ['natural language'],
  '处理': ['processing'],
  '数据': ['data'],
  '算法': ['algorithm', 'algorithms'],
  '农业': ['agriculture', 'agricultural'],
  '果树': ['fruit tree', 'orchard'],
  '温室': ['greenhouse'],
  '无人机': ['drone', 'UAV', 'unmanned aerial vehicle'],
  '遥感': ['remote sensing'],
  '光谱': ['spectrum', 'spectral'],
  '传感器': ['sensor'],
  '物联网': ['IoT', 'Internet of Things'],
  '精度': ['accuracy', 'precision'],
  '产量': ['yield', 'production'],
  '病害': ['disease', 'pest'],
  '杂草': ['weed'],
  '土壤': ['soil'],
  '灌溉': ['irrigation'],
  '授粉': ['pollination'],
  '开花': ['flowering', 'bloom'],
};

// ─── English synonym expansion ──────────────────────────────────────────────
const EN_SYNONYMS: Record<string, string[]> = {
  'tree': ['plant', 'arbor', 'dendrology'],
  'skeleton': ['skeletal', 'branch structure', 'topology'],
  'extraction': ['detection', 'segmentation', 'identification'],
  'automated': ['automatic', 'autonomous', 'robotic'],
  'pruning': ['trimming', 'cutting', 'training'],
  'growth': ['development', 'phenology'],
  'leaf': ['foliage', 'canopy'],
  'fruit': ['harvest', 'yield'],
  'root': ['rhizome', 'root system'],
  'branch': ['twig', 'limb', 'shoot'],
  'image': ['imagery', 'photograph'],
  'vision': ['visual', 'imaging'],
  'reconstruction': ['modeling', '3D modeling'],
  'detection': ['recognition', 'identification'],
  'segmentation': ['partitioning', 'parsing'],
  'classification': ['categorization', 'recognition'],
  'deep learning': ['neural network', 'CNN', 'convolutional'],
  'agriculture': ['farming', 'agronomy', 'horticulture'],
  'drone': ['UAV', 'unmanned aerial vehicle'],
};

// ─── Detect language ────────────────────────────────────────────────────────
function detectLanguage(text: string): 'zh' | 'en' | 'mixed' {
  const zhChars = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const enChars = (text.match(/[a-zA-Z]/g) || []).length;
  const total = zhChars + enChars;
  if (total === 0) return 'en';
  if (zhChars / total > 0.6) return 'zh';
  if (enChars / total > 0.6) return 'en';
  return 'mixed';
}

// ─── Segment Chinese text (simple rule-based) ──────────────────────────────
function segmentChinese(text: string): string[] {
  // Try to match known multi-char terms first, then fall back to bigrams
  const terms: string[] = [];
  let i = 0;
  const zhText = text.replace(/[^\u4e00-\u9fff]/g, '');

  while (i < zhText.length) {
    let matched = false;
    // Try 4-char, 3-char, then 2-char matches
    for (let len = 4; len >= 2; len--) {
      if (i + len <= zhText.length) {
        const candidate = zhText.slice(i, i + len);
        if (ZH_EN_SYNONYMS[candidate]) {
          terms.push(candidate);
          i += len;
          matched = true;
          break;
        }
      }
    }
    if (!matched) {
      // Single char — skip stop words
      const char = zhText[i];
      if (!ZH_STOP_WORDS.has(char) && char.length > 0) {
        terms.push(char);
      }
      i++;
    }
  }
  return terms;
}

// ─── Main extraction function ──────────────────────────────────────────────

export interface ExtractedKeywords {
  /** Primary English keywords for search */
  keywords: string[];
  /** Original input language */
  language: 'zh' | 'en' | 'mixed';
  /** Detected domain terms (for display) */
  domainTerms: string[];
  /** Whether LLM enhancement would help */
  suggestLLM: boolean;
}

/**
 * Extract search keywords from natural language input.
 * Rule-based, no LLM needed — runs in <50ms.
 */
export function extractKeywords(input: string): ExtractedKeywords {
  const trimmed = input.trim();
  if (!trimmed) {
    return { keywords: [], language: 'en', domainTerms: [], suggestLLM: false };
  }

  const lang = detectLanguage(trimmed);
  const keywords: string[] = [];
  const domainTerms: string[] = [];

  if (lang === 'zh' || lang === 'mixed') {
    // Chinese input: segment and translate
    const segments = segmentChinese(trimmed);
    const translated: string[] = [];

    for (const seg of segments) {
      if (ZH_EN_SYNONYMS[seg]) {
        domainTerms.push(seg);
        // Take first synonym as primary keyword
        translated.push(ZH_EN_SYNONYMS[seg][0]);
      } else if (!ZH_STOP_WORDS.has(seg) && seg.length > 1) {
        // Keep as-is if it's a meaningful term (2+ chars, not stop word)
        domainTerms.push(seg);
      }
    }

    // Deduplicate and clean
    const seen = new Set<string>();
    for (const kw of translated) {
      const lower = kw.toLowerCase();
      if (!seen.has(lower) && !EN_STOP_WORDS.has(lower)) {
        seen.add(lower);
        keywords.push(kw);
      }
    }

    // If we got very few keywords, also extract English words from mixed input
    if (keywords.length < 2) {
      const enWords = trimmed.match(/[a-zA-Z]{3,}/g) || [];
      for (const w of enWords) {
        const lower = w.toLowerCase();
        if (!EN_STOP_WORDS.has(lower) && !seen.has(lower)) {
          seen.add(lower);
          keywords.push(w);
        }
      }
    }
  } else {
    // English input: extract nouns and key terms
    const words = trimmed
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

    const seen = new Set<string>();
    for (const w of words) {
      if (!EN_STOP_WORDS.has(w) && !seen.has(w)) {
        seen.add(w);
        keywords.push(w);
      }
    }

    // Try to match known phrases
    const lowerInput = trimmed.toLowerCase();
    const phrases = Object.keys(EN_SYNONYMS);
    for (const phrase of phrases) {
      if (phrase.includes(' ') && lowerInput.includes(phrase)) {
        if (!seen.has(phrase)) {
          seen.add(phrase);
          // Move phrase keywords to front
          keywords.unshift(phrase);
        }
      }
    }
  }

  // Expand with synonyms (take one extra synonym per keyword)
  const expanded: string[] = [...keywords];
  const expandedSeen = new Set(keywords.map(k => k.toLowerCase()));

  for (const kw of keywords.slice(0, 4)) {
    const lower = kw.toLowerCase();
    const synonyms = EN_SYNONYMS[lower];
    if (synonyms) {
      for (const syn of synonyms.slice(0, 1)) {
        if (!expandedSeen.has(syn.toLowerCase())) {
          expandedSeen.add(syn.toLowerCase());
          expanded.push(syn);
        }
      }
    }
  }

  // Suggest LLM if input is complex (many keywords, or Chinese input)
  const suggestLLM = keywords.length >= 4 || lang === 'zh';

  return {
    keywords: expanded.slice(0, 8), // Cap at 8 keywords
    language: lang,
    domainTerms: domainTerms.slice(0, 6),
    suggestLLM,
  };
}

/**
 * LLM-enhanced keyword extraction (requires API call).
 * This is the "Plan B" — called only when user has LLM API key configured.
 */
export async function extractKeywordsWithLLM(
  input: string,
  llmConfig: Record<string, string>,
): Promise<string[] | null> {
  try {
    const res = await fetch('/api/academic/analyze-query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: input, llm: llmConfig }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (data.success && data.keywords?.length > 0) {
      return data.keywords;
    }
    return null;
  } catch {
    return null;
  }
}
