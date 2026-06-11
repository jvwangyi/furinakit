/**
 * Provider preset configurations for academic LLM settings.
 * Users can select a preset (pre-filled endpoint + models) and only need to provide an API key.
 * "Custom" mode allows manual configuration of all fields.
 */

export interface ProviderPreset {
  id: string;
  name: string;
  provider: 'claude' | 'openai' | 'deepseek' | 'mimo';
  baseUrl: string;
  models: string[];
  description: string;
  needsBaseUrl: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: 'mimo-token-plan',
    name: 'MiMo Token Plan',
    provider: 'mimo',
    baseUrl: 'https://token-plan-cn.xiaomimimo.com/v1/chat/completions',
    models: ['mimo-v2.5-pro', 'mimo-v2.5'],
    description: '小米 MiMo Token Plan 订阅用户专用',
    needsBaseUrl: false,
  },
  {
    id: 'mimo-api',
    name: 'MiMo API',
    provider: 'mimo',
    baseUrl: 'https://api.xiaomimimo.com/v1/chat/completions',
    models: ['mimo-v2.5-pro', 'mimo-v2.5'],
    description: '小米 MiMo 按量计费 API',
    needsBaseUrl: false,
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    provider: 'deepseek',
    baseUrl: 'https://api.deepseek.com/v1/chat/completions',
    models: ['deepseek-v4-flash', 'deepseek-v4-pro'],
    description: '高性价比，适合日常学术任务',
    needsBaseUrl: false,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    provider: 'openai',
    baseUrl: 'https://api.openai.com/v1/chat/completions',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o1-preview'],
    description: '通用学术助手，适合文献分析、综述生成',
    needsBaseUrl: false,
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    provider: 'claude',
    baseUrl: 'https://api.anthropic.com/v1/messages',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-4-20250514'],
    description: '长文本理解，适合论文写作和深度分析',
    needsBaseUrl: false,
  },
  {
    id: 'custom',
    name: '自定义 Provider',
    provider: 'openai',
    baseUrl: '',
    models: [],
    description: '手动填写 endpoint、API Key 和模型',
    needsBaseUrl: true,
  },
];

/** Get a preset by its id. Returns undefined if not found. */
export function getPresetById(id: string): ProviderPreset | undefined {
  return PROVIDER_PRESETS.find((p) => p.id === id);
}

/** i18n key mapping for preset names and descriptions. */
export const PRESET_I18N_KEYS: Record<string, { name: string; description: string }> = {
  'mimo-token-plan': {
    name: 'academic.llm.preset_mimo_token_plan',
    description: 'academic.llm.preset_mimo_token_plan_desc',
  },
  'mimo-api': {
    name: 'academic.llm.preset_mimo_api',
    description: 'academic.llm.preset_mimo_api_desc',
  },
  deepseek: {
    name: 'academic.llm.preset_deepseek',
    description: 'academic.llm.preset_deepseek_desc',
  },
  openai: {
    name: 'academic.llm.preset_openai',
    description: 'academic.llm.preset_openai_desc',
  },
  claude: {
    name: 'academic.llm.preset_claude',
    description: 'academic.llm.preset_claude_desc',
  },
  custom: {
    name: 'academic.llm.preset_custom',
    description: 'academic.llm.preset_custom_desc',
  },
};
