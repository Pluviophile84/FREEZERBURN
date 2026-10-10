import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';

const chromium = process.env.CHROMIUM_PATH || (existsSync('/usr/bin/chromium') ? '/usr/bin/chromium' : undefined);
const port = Number(process.env.PORT || 4173);
const baseURL = `http://127.0.0.1:${port}`;
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL,
    browserName: 'chromium',
    launchOptions: { executablePath: chromium },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 10000,
  },
});
