import { defineConfig } from '@playwright/test';

const isCI = process.env.CI === 'true';
const basePath = isCI ? '' : '/furinakit';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: `http://localhost:3000${basePath}`,
    headless: true,
  },
  webServer: {
    command: isCI ? 'npm run start' : 'npm run dev',
    port: 3000,
    reuseExistingServer: !isCI,
  },
});
