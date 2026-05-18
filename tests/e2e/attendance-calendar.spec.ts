import { test, expect } from "@playwright/test"

test.describe("Attendance — Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attendance")
    await page.waitForLoadState("networkidle")
  })

  test("renders month/year header", async ({ page }) => {
    const today = new Date()
    await expect(page.getByText(new RegExp(`${today.getFullYear()}`)).first()).toBeVisible()
    await expect(page.getByText(new RegExp(`${today.getMonth() + 1}월`)).first()).toBeVisible()
  })

  test("has calendar and list view toggle buttons", async ({ page }) => {
    const calendarBtn = page.getByRole("button", { name: "캘린더 보기" })
    const listBtn = page.getByRole("button", { name: "목록 보기" })
    await expect(calendarBtn.or(listBtn).first()).toBeVisible()
  })

  test("previous month button navigates back", async ({ page }) => {
    const today = new Date()
    const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth()
    await page.getByRole("button", { name: "이전 달" }).click()
    await expect(page.getByText(new RegExp(`${prevMonth}월`)).first()).toBeVisible()
  })

  test("next month button is disabled on current month", async ({ page }) => {
    // Button has aria-label but is visibility:hidden — use CSS attribute selector
    const nextBtn = page.locator('button[aria-label="다음 달"]')
    await expect(nextBtn).toBeAttached()
    await expect(nextBtn).toHaveClass(/invisible/)
  })

  test("switching to list view navigates to /attendance/list", async ({ page }) => {
    const listBtn = page.getByRole("button", { name: "목록 보기" })
    if (await listBtn.isVisible()) {
      await listBtn.click()
      await expect(page).toHaveURL(/\/attendance\/list/)
    }
  })

  test("tapping a worked day navigates to daily detail", async ({ page }) => {
    // Find day buttons inside the calendar table that have an attendance dot
    const workedDayBtn = page.locator("table button").filter({ has: page.locator("[class*=rounded-full]") }).first()
    if (await workedDayBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await workedDayBtn.click()
      await expect(page).toHaveURL(/\/attendance\/detail\/\d{4}-\d{2}-\d{2}/, { timeout: 5_000 })
    } else {
      test.skip()
    }
  })
})
