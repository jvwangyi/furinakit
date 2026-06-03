import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ToolFileSection } from './ToolFileSection';

const meta: Meta<typeof ToolFileSection> = {
  title: 'Tools/ToolFileSection',
  component: ToolFileSection,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ToolFileSection>;

// Mock translation function
const mockT = (key: string) => {
  const translations: Record<string, string> = {
    'uploader.dropzone': '拖拽文件到此处或点击上传',
    'uploader.format_hint': '支持格式：{formats}',
    'uploader.size_hint': '最大文件大小：{size}MB',
    'uploader.replace': '替换文件',
    'uploader.remove': '移除文件',
    'tool.file': '文件',
    'tool.file_list': '文件列表',
  };
  return translations[key] || key;
};

export const SingleFile: Story = {
  args: {
    files: [
      new File([new ArrayBuffer(1024 * 50)], 'document.pdf', { type: 'application/pdf' }),
    ],
    category: 'pdf',
    toolName: 'pdf-compress',
    onFilesSelected: fn(),
    imagePreviews: [],
    processedPreview: null,
    currentFileIndex: 0,
    setCurrentFileIndex: fn(),
    t: mockT,
  },
};

export const MultipleFiles: Story = {
  args: {
    files: [
      new File([new ArrayBuffer(1024 * 30)], 'file1.pdf', { type: 'application/pdf' }),
      new File([new ArrayBuffer(1024 * 45)], 'file2.pdf', { type: 'application/pdf' }),
      new File([new ArrayBuffer(1024 * 20)], 'file3.pdf', { type: 'application/pdf' }),
    ],
    category: 'pdf',
    toolName: 'pdf-merge',
    onFilesSelected: fn(),
    imagePreviews: [],
    processedPreview: null,
    currentFileIndex: 0,
    setCurrentFileIndex: fn(),
    t: mockT,
  },
};

export const ImageUpload: Story = {
  args: {
    files: [],
    category: 'image',
    toolName: 'image-compress',
    onFilesSelected: fn(),
    imagePreviews: [],
    processedPreview: null,
    currentFileIndex: 0,
    setCurrentFileIndex: fn(),
    t: mockT,
  },
};

export const WithFileSize: Story = {
  args: {
    files: [
      new File([new ArrayBuffer(1024 * 1024 * 5)], 'large-image.png', { type: 'image/png' }),
    ],
    category: 'image',
    toolName: 'image-compress',
    onFilesSelected: fn(),
    imagePreviews: [],
    processedPreview: null,
    currentFileIndex: 0,
    setCurrentFileIndex: fn(),
    t: mockT,
  },
};
