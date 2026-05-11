import { test as setup, expect } from "@playwright/test"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const authFile = path.join(__dirname, ".auth/worker.json")

/**
 * Runs once before all test suites.
 * Logs in with the test account and saves browser storage so every
 * subsequent test starts already authenticated.
 *
 * Credentials: set TEST_PHONE / TEST_PASSWORD env vars, or create a
 * .env.test file at the project root (not committed).
 */
setup("authenticate", async ({ page }) => {
  const phone = process.env.TEST_PHONE
  const password = process.env.TEST_PASSWORD

  if (!phone || !password) {
    throw new Error(
      "Set TEST_PHONE and TEST_PASSWORD environment variables before running E2E tests.\n" +
        "Example: TEST_PHONE=01012345678 TEST_PASSWORD=mypassword npx playwright test"
    )
  }

  await page.goto("/login")

  await page.getByPlaceholder("휴대폰 번호").fill(phone)
  await page.getByPlaceholder("비밀번호").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()

  // Wait for redirect to home (or onboarding for new accounts)
  await page.waitForURL(/\/(home|onboarding)/, { timeout: 15_000 })
  expect(page.url()).toMatch(/\/(home|onboarding)/)

  // Save auth state (localStorage refresh token) for reuse
  await page.context().storageState({ path: authFile })
})
