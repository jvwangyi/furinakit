import type { Meta, StoryObj } from '@storybook/react';
import { Breadcrumb } from './Breadcrumb';

const meta: Meta<typeof Breadcrumb> = {
  title: 'Layout/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

export const SingleItem: Story = {
  args: {
    items: [
      { label: 'PDF 工具' },
    ],
  },
};

export const TwoItems: Story = {
  args: {
    items: [
      { label: 'PDF 工具', href: '/pdf' },
      { label: 'PDF 合并' },
    ],
  },
};

export const ThreeItems: Story = {
  args: {
    items: [
      { label: '工具箱', href: '/' },
      { label: '图片工具', href: '/image' },
      { label: '图片压缩' },
    ],
  },
};

export const WithLongLabels: Story = {
  args: {
    items: [
      { label: '开发工具', href: '/dev' },
      { label: 'JSON 格式化与验证工具' },
    ],
  },
};

export const MobileView: Story = {
  args: {
    items: [
      { label: 'PDF 工具', href: '/pdf' },
      { label: 'PDF 分割与提取页面工具' },
    ],
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};
