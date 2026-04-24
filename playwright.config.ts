import { defineConfig, devices } from "@playwright/test"

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:5200",
    ...devices["Pixel 5"],
    locale: "ko-KR",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Step 1: Login once and save auth state
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },
    // Step 2: Run all test suites reusing saved auth
    {
      name: "worker-mobile",
      testIgnore: /auth\.setup\.ts/,
      dependencies: ["setup"],
      use: {
        storageState: "tests/.auth/worker.json",
      },
    },
  ],

  webServer: {
    command: "npm run dev",
    url: "http://localhost:5200",
    reuseExistingServer: true,
    timeout: 30_000,
  },
})
