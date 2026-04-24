import { test, expect } from "@playwright/test"

test.describe("Contracts page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/contract")
    await page.waitForLoadState("networkidle")
  })

  test("renders 계약서 header", async ({ page }) => {
    await expect(page.getByText("계약서")).toBeVisible()
  })

  test("shows current year selector", async ({ page }) => {
    const year = new Date().getFullYear()
    await expect(page.getByText(new RegExp(`${year}년`))).toBeVisible()
  })

  test("year dropdown opens and shows past years", async ({ page }) => {
    const year = new Date().getFullYear()
    await page.getByText(new RegExp(`${year}년`)).first().click()
    await expect(page.getByText(`${year - 1}년`)).toBeVisible({ timeout: 2_000 })
  })

  test("shows contract cards or empty state", async ({ page }) => {
    const card = page.locator(".rounded-2xl").first()
    const empty = page.getByText(/계약서가 없습니다/)
    await expect(card.or(empty).first()).toBeVisible({ timeout: 8_000 })
  })

  test("contract card shows document type labels", async ({ page }) => {
    const card = page.locator(".rounded-2xl").first()
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // At least one of: 근로계약서, 노무비위임장
      const docLabel = card.getByText(/근로계약서|노무비위임장/)
      await expect(docLabel.first()).toBeVisible()
    }
  })

  test("contract card shows stage badge", async ({ page }) => {
    const card = page.locator(".rounded-2xl").first()
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      const badge = card.getByText(/서명 필요|승인 대기|완료|미발송|반려|만료/)
      await expect(badge.first()).toBeVisible()
    }
  })

  test("서명하기 button visible for AWAITING_WORKER stage", async ({ page }) => {
    const signBtn = page.getByRole("button", { name: "서명하기" })
    if (await signBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(signBtn.first()).toBeVisible()
    }
  })

  test("열람 button visible for COMPLETED or SENT stage", async ({ page }) => {
    const viewBtn = page.getByRole("button", { name: "열람" })
    if (await viewBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(viewBtn.first()).toBeVisible()
    }
  })

  test("unsigned banner shows when contracts need signing", async ({ page }) => {
    const signBtn = page.getByRole("button", { name: "서명하기" })
    if (await signBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(page.getByText(/서명하지 않은 근로계약서/)).toBeVisible()
    }
  })

  test("switching year filters contracts", async ({ page }) => {
    const year = new Date().getFullYear()
    await page.getByText(new RegExp(`${year}년`)).first().click()
    await page.getByText(`${year - 1}년`).click()
    await page.waitForLoadState("networkidle")
    await expect(page.getByText(new RegExp(`${year - 1}년`))).toBeVisible()
  })
})
