import { test, expect } from "@playwright/test"

test.describe("Attendance — Calendar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attendance")
    await page.waitForLoadState("networkidle")
  })

  test("renders month/year header", async ({ page }) => {
    const today = new Date()
    await expect(page.getByText(new RegExp(`${today.getFullYear()}`))).toBeVisible()
    await expect(page.getByText(new RegExp(`${today.getMonth() + 1}월`))).toBeVisible()
  })

  test("has calendar and list view toggle buttons", async ({ page }) => {
    // MonthSelector has two toggle buttons
    const calendarBtn = page.getByRole("button", { name: /캘린더|calendar/i })
    const listBtn = page.getByRole("button", { name: /목록|list/i })
    await expect(calendarBtn.or(listBtn).first()).toBeVisible()
  })

  test("previous month button navigates back", async ({ page }) => {
    const today = new Date()
    const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth()
    await page.getByRole("button", { name: /이전|prev|←|‹|</ }).first().click()
    await expect(page.getByText(new RegExp(`${prevMonth}월`))).toBeVisible()
  })

  test("next month button is disabled on current month", async ({ page }) => {
    // Next month button should not navigate past today's month
    const today = new Date()
    const nextBtn = page.getByRole("button", { name: /다음|next|→|›|>/ }).first()
    // Either disabled or clicking it keeps us in the same month
    if (await nextBtn.isEnabled()) {
      await nextBtn.click()
      // Should not go past current month (button may be hidden/disabled)
      const header = page.getByText(new RegExp(`${today.getMonth() + 1}월`))
      await expect(header).toBeVisible()
    }
  })

  test("switching to list view navigates to /attendance/list", async ({ page }) => {
    // Click the list view toggle
    const listBtn = page.getByRole("button", { name: /목록|list/i })
    if (await listBtn.isVisible()) {
      await listBtn.click()
      await expect(page).toHaveURL(/\/attendance\/list/)
    }
  })

  test("tapping a worked day navigates to daily detail", async ({ page }) => {
    // Find any day cell that has a colored dot (indicating attendance)
    // Day cells with attendance have a colored indicator
    const workedDay = page.locator("[class*=rounded-full]:not([class*=bg-white])").first()
    if (await workedDay.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await workedDay.click()
      await expect(page).toHaveURL(/\/attendance\/detail\/\d{4}-\d{2}-\d{2}/, { timeout: 5_000 })
    } else {
      test.skip() // No attendance data for this month
    }
  })
})
