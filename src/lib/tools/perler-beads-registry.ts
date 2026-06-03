import { z } from 'zod';
import { Tool, ToolResult, register } from '../registry';

const tool: Tool = {
  name: 'perler-beads',
  description: '拼豆底稿生成器 — 上传图片自动生成拼豆图纸和采购清单',
  category: 'craft',
  inputSchema: z.object({
    file: z.instanceof(Buffer).optional(),
  }),
  execute: async (): Promise<ToolResult> => {
    // 纯客户端工具，不需要服务端处理
    return { text: '请使用 Web 界面操作此工具' };
  },
};

register(tool);
export default tool;
