/* eslint-env node */
// @ts-check
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './playwright_tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    /* Global settings for all tests */
    use: {
        /* FIX 1: Using https to match your Vite server */
        baseURL: 'https://localhost:55629',

        /* FIX 2: Ignore self-signed certificate errors in the browser */
        ignoreHTTPSErrors: true,

        trace: 'on-first-retry',
    },

    /* Configure projects for major browsers */
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],

    /* Run your local dev server before starting the tests */
    webServer: {
        command: 'npm run dev',
        url: 'https://localhost:55629',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
        /* FIX 3: This is the specific line you needed for the terminal spam */
        ignoreHTTPSErrors: true,
    },
});