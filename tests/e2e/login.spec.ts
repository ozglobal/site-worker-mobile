import { test, expect } from "@playwright/test"

// Login tests run WITHOUT saved auth state (no storageState dependency)
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("renders phone, password fields and login button", async ({ page }) => {
    await expect(page.getByPlaceholder("휴대폰 번호")).toBeVisible()
    await expect(page.getByPlaceholder("비밀번호")).toBeVisible()
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible()
  })

  test("shows error when fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page.getByText("휴대폰 번호와 비밀번호를 입력해주세요")).toBeVisible()
  })

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByPlaceholder("휴대폰 번호").fill("01000000000")
    await page.getByPlaceholder("비밀번호").fill("wrongpassword")
    await page.getByRole("button", { name: "로그인" }).click()
    // Button switches to loading state then shows API error
    await expect(page.locator("p.text-red-500")).toBeVisible({ timeout: 10_000 })
  })

  test("password visibility toggle works", async ({ page }) => {
    const input = page.getByPlaceholder("비밀번호")
    await expect(input).toHaveAttribute("type", "password")
    await page.locator("button[type=button]").first().click()
    await expect(input).toHaveAttribute("type", "text")
    await page.locator("button[type=button]").first().click()
    await expect(input).toHaveAttribute("type", "password")
  })

  test("has 회원 가입 and 비밀번호 재설정 links", async ({ page }) => {
    await expect(page.getByRole("button", { name: "회원 가입" })).toBeVisible()
    await expect(page.getByRole("button", { name: "비밀번호 재설정" })).toBeVisible()
  })

  test("valid login redirects to /home", async ({ page }) => {
    const phone = process.env.TEST_PHONE
    const password = process.env.TEST_PASSWORD
    if (!phone || !password) test.skip()

    await page.getByPlaceholder("휴대폰 번호").fill(phone!)
    await page.getByPlaceholder("비밀번호").fill(password!)
    await page.getByRole("button", { name: "로그인" }).click()
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 15_000 })
    expect(page.url()).toMatch(/\/(home|onboarding)/)
  })
})
