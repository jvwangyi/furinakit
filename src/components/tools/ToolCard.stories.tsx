import type { Meta, StoryObj } from '@storybook/react';
import { ToolCard } from './ToolCard';

const meta: Meta<typeof ToolCard> = {
  title: 'Tools/ToolCard',
  component: ToolCard,
  tags: ['autodocs'],
  argTypes: {
    category: {
      control: 'select',
      options: ['pdf', 'image', 'text', 'video', 'audio', 'dev', 'convert', 'file', 'craft'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ToolCard>;

export const PDFTool: Story = {
  args: {
    name: 'pdf-merge',
    description: '合并多个 PDF 文件为一个文件',
    category: 'pdf',
  },
};

export const ImageTool: Story = {
  args: {
    name: 'image-compress',
    description: '压缩图片文件大小，支持批量处理',
    category: 'image',
  },
};

export const TextTool: Story = {
  args: {
    name: 'text-diff',
    description: '对比两段文本的差异，高亮显示变更',
    category: 'text',
  },
};

export const DevTool: Story = {
  args: {
    name: 'json-formatter',
    description: '格式化和验证 JSON 数据',
    category: 'dev',
  },
};

export const VideoTool: Story = {
  args: {
    name: 'video-convert',
    description: '转换视频格式，支持多种编解码器',
    category: 'video',
  },
};

export const AudioTool: Story = {
  args: {
    name: 'audio-convert',
    description: '转换音频格式，支持批量处理',
    category: 'audio',
  },
};

export const AllCategories: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4 max-w-3xl">
      {['pdf', 'image', 'text', 'video', 'audio', 'dev', 'convert', 'file', 'craft'].map((cat) => (
        <ToolCard
          key={cat}
          name={`${cat}-tool`}
          description={`${cat} 类别的示例工具`}
          category={cat}
        />
      ))}
    </div>
  ),
};
