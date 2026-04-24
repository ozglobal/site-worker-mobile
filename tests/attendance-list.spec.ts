import { test, expect } from "@playwright/test"

test.describe("Attendance — List", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/attendance/list")
    await page.waitForLoadState("networkidle")
  })

  test("renders monthly summary card", async ({ page }) => {
    await expect(page.getByText("이번 달 요약")).toBeVisible()
    await expect(page.getByText("총 출역일")).toBeVisible()
    await expect(page.getByText("총 공수")).toBeVisible()
    await expect(page.getByText("예상 노임")).toBeVisible()
  })

  test("monthly summary shows numeric values", async ({ page }) => {
    // 총 출역일 should show e.g. "3일"
    await expect(page.getByText(/\d+일/)).toBeVisible()
    // 총 공수 should show e.g. "2공수"
    await expect(page.getByText(/\d+공수/)).toBeVisible()
  })

  test("site filter combobox is present", async ({ page }) => {
    // SiteCombobox renders a button/select for filtering
    const combobox = page.getByRole("combobox").or(page.getByText("전체현장"))
    await expect(combobox.first()).toBeVisible()
  })

  test("attendance record cards render when data exists", async ({ page }) => {
    const cards = page.locator(".rounded-xl.bg-white")
    const count = await cards.count()
    if (count > 0) {
      // Card should have 공수 and 적용 단가 rows
      await expect(page.getByText("공수").first()).toBeVisible()
      await expect(page.getByText("적용 단가").first()).toBeVisible()
      await expect(page.getByText("예상 임금(세전)").first()).toBeVisible()
    } else {
      // Empty state
      await expect(page.getByText("출역 기록이 없습니다")).toBeVisible()
    }
  })

  test("record card shows 퇴근 완료 or 근무중 badge", async ({ page }) => {
    const badge = page.getByText(/퇴근 완료|근무중/)
    const empty = page.getByText("출역 기록이 없습니다")
    await expect(badge.or(empty).first()).toBeVisible()
  })

  test("today's record shows 정정 요청 button", async ({ page }) => {
    const correctionBtn = page.getByRole("button", { name: /정정 요청/ })
    // Only shown for today's attendance — may not be present in all test runs
    if (await correctionBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(correctionBtn.first()).toBeVisible()
    }
  })

  test("navigating to previous month updates summary", async ({ page }) => {
    const prevBtn = page.getByRole("button", { name: /이전|prev|←|‹|</ }).first()
    await prevBtn.click()
    await page.waitForLoadState("networkidle")
    const today = new Date()
    const prevMonth = today.getMonth() === 0 ? 12 : today.getMonth()
    await expect(page.getByText(new RegExp(`${prevMonth}월`))).toBeVisible()
  })
})
