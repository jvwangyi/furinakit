import type { Meta, StoryObj } from '@storybook/react';
import { JsonTreeView } from './JsonTreeView';

const meta: Meta<typeof JsonTreeView> = {
  title: 'Tools/JsonTreeView',
  component: JsonTreeView,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof JsonTreeView>;

const sampleData = {
  name: 'FurinaKit',
  version: '0.1.0',
  features: ['PDF Tools', 'Image Processing', 'Text Utilities'],
  config: {
    theme: 'dark',
    language: 'zh',
    settings: {
      autoSave: true,
      maxFileSize: 10485760,
    },
  },
  contributors: [
    { name: 'Alice', role: 'developer' },
    { name: 'Bob', role: 'designer' },
  ],
};

export const Default: Story = {
  args: {
    data: sampleData,
  },
};

export const SimpleObject: Story = {
  args: {
    data: { key: 'value', count: 42, active: true },
  },
};

export const ArrayData: Story = {
  args: {
    data: ['apple', 'banana', 'cherry', 'date'],
  },
};

export const NestedDeep: Story = {
  args: {
    data: {
      level1: {
        level2: {
          level3: {
            level4: {
              value: 'deeply nested',
            },
          },
        },
      },
    },
  },
};

export const StringInput: Story = {
  args: {
    data: '{"parsed":"from string","number":123}',
  },
};

export const EmptyObject: Story = {
  args: {
    data: {},
  },
};
