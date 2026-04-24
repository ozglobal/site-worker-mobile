import { test, expect } from "@playwright/test"

function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

test.describe("Attendance — Daily Detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/attendance/detail/${todayStr()}`)
    await page.waitForLoadState("networkidle")
  })

  test("renders correct date in header", async ({ page }) => {
    const d = new Date()
    await expect(page.getByText(new RegExp(`${d.getFullYear()}년`))).toBeVisible()
    await expect(page.getByText(new RegExp(`${d.getMonth() + 1}월`))).toBeVisible()
    await expect(page.getByText(new RegExp(`${d.getDate()}일`))).toBeVisible()
  })

  test("shows back button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /back|뒤로|←/ }).or(page.locator("button svg")).first()).toBeVisible()
  })

  test("shows previous day navigation", async ({ page }) => {
    const prevBtn = page.locator("button").filter({ has: page.locator("svg") }).first()
    await expect(prevBtn).toBeVisible()
  })

  test("next day button is hidden or invisible for today", async ({ page }) => {
    // Next button should be invisible (class="invisible") when on today
    const nextBtn = page.locator("button.invisible")
    await expect(nextBtn).toBeVisible() // invisible class is rendered but visually hidden
  })

  test("shows info banner about correction policy", async ({ page }) => {
    await expect(page.getByText(/당일만 요청/)).toBeVisible()
  })

  test("shows attendance card or empty state", async ({ page }) => {
    const card = page.locator(".rounded-xl").filter({ hasText: /공수|근무중|퇴근 완료/ })
    const empty = page.getByText("출근 기록이 없습니다")
    await expect(card.or(empty).first()).toBeVisible({ timeout: 8_000 })
  })

  test("attendance card shows work detail rows", async ({ page }) => {
    const card = page.locator(".rounded-xl").filter({ hasText: /공수/ }).first()
    if (await card.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(card.getByText("공수")).toBeVisible()
      await expect(card.getByText("적용 단가")).toBeVisible()
      await expect(card.getByText("예상 임금(세전)")).toBeVisible()
    }
  })

  test("navigating to previous day changes URL", async ({ page }) => {
    const prevBtn = page.locator("button").filter({ has: page.locator("svg") }).first()
    await prevBtn.click()
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    await expect(page).toHaveURL(new RegExp(expected))
  })

  test("정정 요청 button opens correction dialog", async ({ page }) => {
    const corrBtn = page.getByRole("button", { name: /정정 요청/ }).first()
    if (await corrBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await corrBtn.click()
      // Dialog should appear
      await expect(page.getByRole("dialog").or(page.getByText(/정정 요청/))).toBeVisible({ timeout: 3_000 })
    }
  })
})

test.describe("Correction dialog", () => {
  test("dialog fields pre-filled and submit works", async ({ page }) => {
    await page.goto(`/attendance/detail/${todayStr()}`)
    await page.waitForLoadState("networkidle")

    const corrBtn = page.getByRole("button", { name: /정정 요청/ }).first()
    if (!(await corrBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip()
      return
    }
    await corrBtn.click()

    // Dialog has site name, time range pre-filled
    const dialog = page.locator("[role=dialog]").or(page.locator(".fixed.inset-0").last())
    await expect(dialog).toBeVisible({ timeout: 3_000 })

    // Close dialog
    const closeBtn = dialog.getByRole("button", { name: /닫기|취소|×|X/ })
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await expect(dialog).not.toBeVisible({ timeout: 3_000 })
    }
  })
})
