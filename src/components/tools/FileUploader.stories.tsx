import type { Meta, StoryObj } from '@storybook/react';
import { FileUploader } from './FileUploader';

const onFilesSelected = (files: File[]) => { /* selected files handler */ };

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
    label: 'Drop files here or click to upload',
  },
};

export const MultipleFiles: Story = {
  args: {
    onFilesSelected,
    multiple: true,
    label: 'Supports multiple files',
  },
};

export const ImageOnly: Story = {
  args: {
    onFilesSelected,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    label: 'Images only (PNG, JPG, GIF, WebP)',
  },
};

export const WithSizeLimit: Story = {
  args: {
    onFilesSelected,
    maxSize: 5 * 1024 * 1024, // 5MB
    label: 'Max file size: 5MB',
  },
};

export const PDFOnly: Story = {
  args: {
    onFilesSelected,
    accept: {
      'application/pdf': ['.pdf'],
    },
    label: 'PDF only',
  },
};
