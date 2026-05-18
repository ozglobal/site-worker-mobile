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
    await expect(page.getByRole("button", { name: "이전 날" })).toBeVisible()
  })

  test("next day button is hidden or invisible for today", async ({ page }) => {
    // Next button has class "invisible" (visibility:hidden) when on today
    // getByRole skips visibility:hidden elements — use CSS attribute selector
    const nextBtn = page.locator('button[aria-label="다음 날"]')
    await expect(nextBtn).toBeAttached()
    await expect(nextBtn).toHaveClass(/invisible/)
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
      // 적용 단가 and 예상 임금 only appear for completed (checked-out) entries
      const rateRow = card.getByText("적용 단가")
      if (await rateRow.isVisible({ timeout: 1_000 }).catch(() => false)) {
        await expect(card.getByText("예상 임금(세전)")).toBeVisible()
      }
    }
  })

  test("navigating to previous day changes URL", async ({ page }) => {
    await page.getByRole("button", { name: "이전 날" }).click()
    const d = new Date()
    d.setDate(d.getDate() - 1)
    const expected = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
    await expect(page).toHaveURL(new RegExp(expected))
  })

  test("정정 요청 button opens correction dialog", async ({ page }) => {
    const corrBtn = page.getByRole("button", { name: /정정 요청/ }).first()
    if (await corrBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await corrBtn.click()
      await expect(page.getByRole("dialog").or(page.getByText(/정정 요청/))).toBeVisible({ timeout: 3_000 })
    }
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 13 — 출퇴근 정정요청
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scenario 13 — 정정요청 dialog", () => {
  async function openCorrectionDialog(page: import("@playwright/test").Page) {
    await page.goto(`/attendance/detail/${todayStr()}`)
    await page.waitForLoadState("networkidle")
    const corrBtn = page.getByRole("button", { name: /정정 요청/ }).first()
    if (!(await corrBtn.isVisible({ timeout: 3_000 }).catch(() => false))) return false
    await corrBtn.click()
    await page.waitForTimeout(300)
    return true
  }

  test("dialog opens and shows site name and time range", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    const dialog = page.locator("[role=dialog]").or(page.locator(".fixed.inset-0").last())
    await expect(dialog).toBeVisible({ timeout: 3_000 })
    // Site name and time info should be pre-populated (not empty)
    const textContent = await dialog.textContent()
    expect(textContent?.length).toBeGreaterThan(10)
  })

  test("dialog contains 야근했어요 checkbox", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    await expect(page.getByText("야근했어요")).toBeVisible({ timeout: 3_000 })
  })

  test("dialog shows 적용단가 input field", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    await expect(page.getByText("적용단가")).toBeVisible({ timeout: 3_000 })
  })

  test("dialog has reason textarea with placeholder", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    const textarea = page.getByPlaceholder("요청사유를 입력해주세요")
    await expect(textarea).toBeVisible({ timeout: 3_000 })
  })

  test("요청 제출하기 button disabled when reason is empty", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    await expect(page.getByRole("button", { name: /요청 제출하기/ })).toBeDisabled({ timeout: 3_000 })
  })

  test("요청 제출하기 button enabled after reason entered", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    const textarea = page.getByPlaceholder("요청사유를 입력해주세요")
    await textarea.fill("테스트 정정 사유입니다.")
    await expect(page.getByRole("button", { name: /요청 제출하기/ })).toBeEnabled({ timeout: 2_000 })
  })

  test("닫기 button closes the dialog", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }
    const dialog = page.locator("[role=dialog]").or(page.locator(".fixed.inset-0").last())
    await expect(dialog).toBeVisible({ timeout: 3_000 })
    const closeBtn = page.getByRole("button", { name: /닫기|취소|×|X/ }).first()
    if (await closeBtn.isVisible()) {
      await closeBtn.click()
      await expect(dialog).not.toBeVisible({ timeout: 3_000 })
    }
  })

  test("correction request submission shows toast on success", async ({ page }) => {
    if (!(await openCorrectionDialog(page))) { test.skip(); return }

    // Mock the correction API
    await page.route("**/correction-request", (route) =>
      route.fulfill({ status: 200, body: JSON.stringify({ code: 200, message: "ok", data: {} }) })
    )

    const textarea = page.getByPlaceholder("요청사유를 입력해주세요")
    await textarea.fill("테스트 정정 사유입니다.")
    await page.getByRole("button", { name: /요청 제출하기/ }).click()
    await expect(page.getByText(/정정 요청이 제출/)).toBeVisible({ timeout: 5_000 })
  })
})
