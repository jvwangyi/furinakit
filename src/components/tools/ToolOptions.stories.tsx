import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ToolOptions } from './ToolOptions';

const meta: Meta<typeof ToolOptions> = {
  title: 'Tools/ToolOptions',
  component: ToolOptions,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ToolOptions>;

export const PdfSplitOptions: Story = {
  args: {
    toolName: 'pdf-split',
    options: {},
    setOptions: fn(),
  },
};

export const PdfRotateOptions: Story = {
  args: {
    toolName: 'pdf-rotate',
    options: {},
    setOptions: fn(),
  },
};

export const ImageCompressOptions: Story = {
  args: {
    toolName: 'image-compress',
    options: {},
    setOptions: fn(),
  },
};

export const HashOptions: Story = {
  args: {
    toolName: 'hash',
    options: {},
    setOptions: fn(),
  },
};
