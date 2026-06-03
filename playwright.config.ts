import { defineConfig } from '@playwright/test';

const isCI = process.env.CI === 'true';

export default defineConfig({
  testDir: './e2e',
  timeout: 30000,
  use: {
    baseURL: isCI ? 'http://localhost:3000' : 'http://localhost:3000/furinakit',
    headless: true,
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
});
