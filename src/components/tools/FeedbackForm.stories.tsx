import type { Meta, StoryObj } from '@storybook/react';
import { FeedbackForm } from './FeedbackForm';

const meta: Meta<typeof FeedbackForm> = {
  title: 'Tools/FeedbackForm',
  component: FeedbackForm,
  tags: ['autodocs'],
  parameters: {
    mockData: [
      {
        url: '/api/feedback',
        method: 'POST',
        status: 200,
        response: { success: true },
      },
    ],
  },
};

export default meta;
type Story = StoryObj<typeof FeedbackForm>;

export const Default: Story = {
  args: {
    toolName: 'pdf-merge',
  },
};

export const ForImageTool: Story = {
  args: {
    toolName: 'image-compress',
  },
};

export const ForTextTool: Story = {
  args: {
    toolName: 'text-diff',
  },
};
