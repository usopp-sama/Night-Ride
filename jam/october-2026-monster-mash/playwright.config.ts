import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4173', trace: 'retain-on-failure' },
  projects: [
    // Hardware GL: with SwiftShader the detailed car model slows the frame-paced sim enough to time out.
    { name: 'chromium', use: { ...devices['Desktop Chrome'], launchOptions: { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] } } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: { command: 'node scripts/serve-test.mjs', port: 4173, reuseExistingServer: false },
});

