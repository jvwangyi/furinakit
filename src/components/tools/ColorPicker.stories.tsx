import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { ColorPicker } from './ColorPicker';

const meta: Meta<typeof ColorPicker> = {
  title: 'Tools/ColorPicker',
  component: ColorPicker,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {
  args: {
    color: '#3498DB',
    onColorChange: fn(),
  },
};

export const Red: Story = {
  args: {
    color: '#E74C3C',
    onColorChange: fn(),
  },
};

export const Green: Story = {
  args: {
    color: '#2ECC71',
    onColorChange: fn(),
  },
};

export const WithResult: Story = {
  args: {
    color: '#9B59B6',
    result: 'RGB(155, 89, 182)',
    onColorChange: fn(),
  },
};

export const BlackAndWhite: Story = {
  args: {
    color: '#000000',
    onColorChange: fn(),
  },
};
