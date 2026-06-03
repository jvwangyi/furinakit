import type { Meta, StoryObj } from '@storybook/react';
import { ToolResult } from './ToolResult';

const meta: Meta<typeof ToolResult> = {
  title: 'Tools/ToolResult',
  component: ToolResult,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ToolResult>;

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'result.success': '处理成功',
    'tool.result': '处理结果',
    'tool.copy': '复制',
    'tool.download': '下载文件',
    'tool.file_result': '文件已准备就绪，点击下方按钮下载',
    'tool.raw_json': '查看原始 JSON',
    'btn.download_result': '下载结果',
    'compare.original': '原始大小',
    'compare.processed': '处理后大小',
  };
  return translations[key] || key;
};

const mockTError = (key: string) => key;

export const TextResult: Story = {
  args: {
    result: {
      text: '{"name": "FurinaKit", "version": "1.0.0", "tools": 62}',
    },
    toolName: 'json-format',
    files: [],
    t: mockT,
    tError: mockTError,
  },
};

export const JsonFormattedResult: Story = {
  args: {
    result: {
      text: JSON.stringify({ name: 'FurinaKit', version: '1.0.0', tools: 62 }, null, 2),
    },
    toolName: 'json-format',
    files: [],
    t: mockT,
    tError: mockTError,
  },
};

export const FileResultSmaller: Story = {
  args: {
    result: {
      data: Buffer.from('compressed file content').toString('base64'),
      mimeType: 'application/pdf',
      filename: 'compressed.pdf',
    },
    toolName: 'pdf-compress',
    files: [
      new File([new ArrayBuffer(1024 * 100)], 'original.pdf', { type: 'application/pdf' }),
    ],
    t: mockT,
    tError: mockTError,
  },
};

export const FileResultLarger: Story = {
  args: {
    result: {
      data: Buffer.from('expanded file content').toString('base64'),
      mimeType: 'image/png',
      filename: 'converted.png',
    },
    toolName: 'image-convert',
    files: [
      new File([new ArrayBuffer(1024 * 50)], 'original.jpg', { type: 'image/jpeg' }),
    ],
    t: mockT,
    tError: mockTError,
  },
};

export const DiffResult: Story = {
  args: {
    result: {
      text: `--- a/file.txt
+++ b/file.txt
@@ -1,3 +1,3 @@
 Hello World
-Old content
+New content
 Goodbye`,
    },
    toolName: 'text-diff',
    files: [],
    t: mockT,
    tError: mockTError,
  },
};
