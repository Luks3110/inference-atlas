import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5184',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined },
  },
  webServer: {
    command: 'npm run build && npx --no-install esbuild --servedir=dist --serve=127.0.0.1:5184',
    url: 'http://127.0.0.1:5184',
    reuseExistingServer: false,
  },
});
