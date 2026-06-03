import type { Meta, StoryObj } from '@storybook/react';
import { FileUploader } from './FileUploader';

const onFilesSelected = (files: File[]) => console.log('Selected files:', files);

const meta: Meta<typeof FileUploader> = {
  title: 'Tools/FileUploader',
  component: FileUploader,
  tags: ['autodocs'],
  argTypes: {
    multiple: { control: 'boolean' },
    maxSize: { control: 'number' },
    label: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof FileUploader>;

export const Default: Story = {
  args: {
    onFilesSelected,
    label: '拖拽文件到此处或点击上传',
  },
};

export const MultipleFiles: Story = {
  args: {
    onFilesSelected,
    multiple: true,
    label: '支持多文件上传',
  },
};

export const ImageOnly: Story = {
  args: {
    onFilesSelected,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    label: '仅支持图片文件（PNG, JPG, GIF, WebP）',
  },
};

export const WithSizeLimit: Story = {
  args: {
    onFilesSelected,
    maxSize: 5 * 1024 * 1024, // 5MB
    label: '文件大小限制 5MB',
  },
};

export const PDFOnly: Story = {
  args: {
    onFilesSelected,
    accept: {
      'application/pdf': ['.pdf'],
    },
    label: '仅支持 PDF 文件',
  },
};
