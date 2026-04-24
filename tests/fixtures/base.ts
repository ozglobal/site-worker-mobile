import { test as base, expect, type Page } from "@playwright/test"

export { expect }

/** Fill the login form and submit. Waits until navigation away from /login. */
export async function loginAs(page: Page, phone: string, password: string) {
  await page.goto("/login")
  await page.getByPlaceholder("휴대폰 번호").fill(phone)
  await page.getByPlaceholder("비밀번호").fill(password)
  await page.getByRole("button", { name: "로그인" }).click()
  await page.waitForURL(/\/(home|onboarding)/, { timeout: 15_000 })
}

export const test = base.extend({
  page: async ({ page }, use) => {
    // Ensure the bottom nav is always in the viewport for navigation
    await page.setViewportSize({ width: 390, height: 844 })
    await use(page)
  },
})
