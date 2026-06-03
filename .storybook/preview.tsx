import type { Preview } from '@storybook/nextjs-vite';
import React from 'react';
import '../src/app/globals.css';
import { I18nProvider } from '../src/lib/i18n';
import { Toaster } from 'sonner';

const preview: Preview = {
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <I18nProvider>
        <Story />
        <Toaster position="top-right" />
      </I18nProvider>
    ),
  ],
};

export default preview;
