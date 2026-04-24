import { test, expect } from "@playwright/test"

test.describe("Profile — My Info", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile")
    await page.waitForLoadState("networkidle")
  })

  test("renders 내정보 header", async ({ page }) => {
    await expect(page.getByText("내정보")).toBeVisible()
  })

  test("shows worker name", async ({ page }) => {
    // Worker name appears as a heading or prominent text
    // It should be a non-empty string
    const nameEl = page.locator("h2, h3, p.font-bold").first()
    await expect(nameEl).toBeVisible()
    const text = await nameEl.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test("shows phone number", async ({ page }) => {
    await expect(page.getByText(/010-?\d{4}-?\d{4}/)).toBeVisible()
  })

  test("shows daily wage info section", async ({ page }) => {
    await expect(page.getByText(/단가|임금|wage/i)).toBeVisible()
  })

  test("navigates to document submission page", async ({ page }) => {
    const docLink = page.getByText(/제출서류|서류 제출/)
    if (await docLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await docLink.click()
      await expect(page).toHaveURL(/\/profile\/documents/)
    }
  })

  test("navigates to change password page", async ({ page }) => {
    const pwLink = page.getByText(/비밀번호 변경/)
    if (await pwLink.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await pwLink.click()
      await expect(page).toHaveURL(/\/change-password/)
    }
  })
})

test.describe("Profile — Documents", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile/documents")
    await page.waitForLoadState("networkidle")
  })

  test("renders 제출서류 header", async ({ page }) => {
    await expect(page.getByText("제출서류")).toBeVisible()
  })

  test("shows document list", async ({ page }) => {
    const list = page.locator(".rounded-xl").first()
    await expect(list).toBeVisible({ timeout: 8_000 })
  })

  test("each document shows status badge", async ({ page }) => {
    const badge = page.getByText(/제출 완료|승인 대기|반려|미제출/)
    const loading = page.locator("[class*=Spinner]")
    await expect(badge.or(loading).first()).toBeVisible({ timeout: 8_000 })
  })

  test("upload buttons visible for incomplete docs", async ({ page }) => {
    const captureBtn = page.getByRole("button", { name: "사진 촬영" })
    const fileBtn = page.getByRole("button", { name: "파일 선택" })
    const viewBtn = page.getByText("보기")

    // At least one of these actions should be present
    await expect(captureBtn.or(fileBtn).or(viewBtn).first()).toBeVisible({ timeout: 8_000 })
  })

  test("completed doc shows 보기 → navigates to viewer", async ({ page }) => {
    const viewBtn = page.getByText("보기").first()
    if (await viewBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await viewBtn.click()
      await expect(page).toHaveURL(/\/profile\/documents\/view\//)
    }
  })
})

test.describe("Profile — Document Viewer", () => {
  // Navigate to the ID card viewer as a representative test
  test("renders viewer page with title", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("신분증 사본")).toBeVisible()
  })

  test("shows 재등록 button", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    const reregBtn = page.getByRole("button", { name: "재등록" })
    await expect(reregBtn).toBeVisible({ timeout: 5_000 })
  })

  test("재등록 reveals 사진 촬영 and 파일 선택", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    await page.getByRole("button", { name: "재등록" }).click()
    await expect(page.getByRole("button", { name: "사진 촬영" })).toBeVisible()
    await expect(page.getByRole("button", { name: "파일 선택" })).toBeVisible()
  })

  test("bankbook viewer is accessible", async ({ page }) => {
    await page.goto("/profile/documents/view/bankbook")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("통장사본")).toBeVisible()
  })

  test("family-relation viewer shows 재등록", async ({ page }) => {
    await page.goto("/profile/documents/view/family-relation")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("가족관계증명서")).toBeVisible()
    await expect(page.getByRole("button", { name: "재등록" })).toBeVisible({ timeout: 5_000 })
  })
})
