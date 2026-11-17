// Browser checks for the Advent House: the built-in ?selftest across all 24 scenes, and the gift link round trip.
// WebGL runs on SwiftShader in headless Chromium, so the scenes really render, just slowly.
const { defineConfig, devices } = require('@playwright/test');
const PORT = 8124;
module.exports = defineConfig({
  testDir: 'tests',
  timeout: 240_000,
  expect: { timeout: 15_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    ...devices['Desktop Chrome'],
    channel: process.env.PW_CHANNEL || 'chromium', // the full browser in new headless mode: closer to real Chrome's WebGL
    launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] },
  },
  webServer: { command: 'node server.js', env: { PORT: String(PORT) }, url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI },
});
