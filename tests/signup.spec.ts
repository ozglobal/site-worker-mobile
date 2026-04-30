import { test, expect } from "@playwright/test"

// Signup tests run without saved auth state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Signup page — identity verification options", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup")
  })

  test("renders two option cards", async ({ page }) => {
    await expect(page.getByText("내 명의 휴대폰이 있어요")).toBeVisible()
    await expect(page.getByText("타인 명의 휴대폰이 있어요")).toBeVisible()
  })

  test("'타인 명의 휴대폰이 있어요' navigates to /signup/sms-verification", async ({ page }) => {
    await page.getByText("타인 명의 휴대폰이 있어요").click()
    await expect(page).toHaveURL(/\/signup\/sms-verification/)
  })

  test("'내 명의 휴대폰이 있어요' opens NICE popup (not navigate to /signup/nice-api)", async ({ page }) => {
    // In headless mode popups are blocked; assert no navigation to the old route
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 3_000 }).catch(() => null),
      page.getByText("내 명의 휴대폰이 있어요").click(),
    ])
    // Either a popup was opened (NICE flow), or the page stayed on /signup (popup blocked)
    // Either way, we must NOT have navigated to the old /signup/nice-api internal route
    if (popup) {
      // Popup opens blank then form posts — just verify it's a popup (not an in-app navigation)
      await popup.waitForLoadState("domcontentloaded").catch(() => {})
      expect(page.url()).not.toContain("/signup/nice-api")
    } else {
      expect(page.url()).not.toContain("/signup/nice-api")
    }
  })
})

test.describe("Signup — SMS verification (타인 명의)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup/sms-verification")
  })

  test("renders phone input and 인증번호 받기 button", async ({ page }) => {
    await expect(page.getByPlaceholder("010-0000-0000")).toBeVisible()
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeVisible()
  })

  test("인증번호 받기 disabled when phone is incomplete", async ({ page }) => {
    await page.getByPlaceholder("010-0000-0000").fill("010-1234")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeDisabled()
  })

  test("인증번호 받기 enabled when phone is 11 digits", async ({ page }) => {
    await page.getByPlaceholder("010-0000-0000").fill("010-1234-5678")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeEnabled()
  })

  test("verification code input hidden before code is sent", async ({ page }) => {
    await expect(page.getByPlaceholder("인증번호 입력")).not.toBeVisible()
  })
})

test.describe("Signup — Set password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup/set-password")
  })

  test("renders two password inputs", async ({ page }) => {
    const inputs = page.locator("input[type=password]")
    await expect(inputs.first()).toBeVisible()
    await expect(inputs.nth(1)).toBeVisible()
  })

  test("다음 button disabled when passwords do not match", async ({ page }) => {
    const inputs = page.locator("input[type=password]")
    await inputs.first().fill("Password1!")
    await inputs.nth(1).fill("Different1!")
    await expect(page.getByRole("button", { name: "다음" })).toBeDisabled()
  })

  test("password requirements checklist is visible", async ({ page }) => {
    await expect(page.getByText(/8자 이상|영문|숫자|특수문자/).first()).toBeVisible()
  })
})
