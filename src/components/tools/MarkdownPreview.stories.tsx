import type { Meta, StoryObj } from '@storybook/react';
import { fn } from 'storybook/test';
import { MarkdownPreview } from './MarkdownPreview';

const meta: Meta<typeof MarkdownPreview> = {
  title: 'Tools/MarkdownPreview',
  component: MarkdownPreview,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof MarkdownPreview>;

export const SimpleText: Story = {
  args: {
    value: '# Hello World\n\nThis is a simple markdown preview.',
    onChange: fn(),
  },
};

export const WithFormatting: Story = {
  args: {
    value: `# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

- List item 1
- List item 2
- List item 3

> This is a blockquote

\`\`\`javascript
const hello = 'world';
console.log(hello);
\`\`\`
`,
    onChange: fn(),
  },
};

export const WithTable: Story = {
  args: {
    value: `## Feature Comparison

| Feature | Basic | Pro | Enterprise |
|---------|-------|-----|------------|
| Users | 1 | 10 | Unlimited |
| Storage | 1GB | 10GB | 100GB |
| Support | Email | Phone | 24/7 |
`,
    onChange: fn(),
  },
};

export const WithLinks: Story = {
  args: {
    value: `# Resources

- [GitHub](https://github.com)
- [Documentation](https://docs.example.com)
- [API Reference](https://api.example.com)

![Alt text](https://via.placeholder.com/150)
`,
    onChange: fn(),
  },
};

export const Empty: Story = {
  args: {
    value: '',
    onChange: fn(),
  },
};
