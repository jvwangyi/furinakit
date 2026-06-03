import type { Meta, StoryObj } from '@storybook/react';
import { DiffViewer } from './DiffViewer';

const meta: Meta<typeof DiffViewer> = {
  title: 'Tools/DiffViewer',
  component: DiffViewer,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['unified', 'split'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof DiffViewer>;

const sampleDiff = `function hello() {
-  console.log("old message");
+  console.log("new message");
  return true;
}

+ function goodbye() {
+   console.log("goodbye");
+ }`;

export const Unified: Story = {
  args: {
    diffText: sampleDiff,
    mode: 'unified',
  },
};

export const Split: Story = {
  args: {
    diffText: sampleDiff,
    mode: 'split',
  },
};

export const OnlyAdditions: Story = {
  args: {
    diffText: `+ const x = 1;
+ const y = 2;
+ const z = x + y;`,
    mode: 'unified',
  },
};

export const OnlyDeletions: Story = {
  args: {
    diffText: `- const oldVar = "removed";
- const anotherOld = 42;`,
    mode: 'unified',
  },
};

export const EmptyDiff: Story = {
  args: {
    diffText: '',
    mode: 'unified',
  },
};
