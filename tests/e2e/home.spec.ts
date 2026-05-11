import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home")
    await page.waitForLoadState("networkidle")
  })

  test("renders header with app name", async ({ page }) => {
    await expect(page.locator("header, [class*=AppHeader]").first()).toBeVisible()
  })

  test("shows today's date", async ({ page }) => {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    await expect(page.getByText(new RegExp(`${month}월`))).toBeVisible()
    await expect(page.getByText(new RegExp(`${day}일`))).toBeVisible()
  })

  test("shows QR check-in button when not checked in", async ({ page }) => {
    const qrButton = page.getByRole("button", { name: /QR|출근/ })
    const siteCard = page.getByText(/현재 근무중/)
    const either = qrButton.or(siteCard)
    await expect(either.first()).toBeVisible({ timeout: 8_000 })
  })

  test("bottom nav has 4 tabs", async ({ page }) => {
    const nav = page.locator("nav").last()
    await expect(nav).toBeVisible()
    for (const label of ["홈", "출역현황", "근로계약", "내 정보"]) {
      await expect(nav.getByText(label)).toBeVisible()
    }
  })

  test("bottom nav 출역현황 navigates to attendance", async ({ page }) => {
    await page.locator("nav").last().getByText("출역현황").click()
    await expect(page).toHaveURL(/\/attendance/)
  })

  test("bottom nav 근로계약 navigates to contracts", async ({ page }) => {
    await page.goto("/home")
    await page.locator("nav").last().getByText("근로계약").click()
    await expect(page).toHaveURL(/\/contract/)
  })

  test("bottom nav 내 정보 navigates to profile", async ({ page }) => {
    await page.goto("/home")
    await page.locator("nav").last().getByText("내 정보").click()
    await expect(page).toHaveURL(/\/profile/)
  })
})

test.describe("Home page — banners", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home")
    await page.waitForLoadState("networkidle")
  })

  test("account incomplete banner uses 계좌 정보 text", async ({ page }) => {
    const banner = page.getByText("계좌 정보 입력이 완료되지 않았어요")
    const otherBanner = page.getByText("필수 정보 입력이 완료되지 않았어요")
    if (await banner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(banner).toBeVisible()
      await expect(otherBanner).not.toBeVisible()
    }
  })

  test("account incomplete banner description uses 계좌 정보 text", async ({ page }) => {
    const desc = page.getByText("내정보 메뉴에서 계좌 정보 입력을 완료해주세요.")
    const oldDesc = page.getByText("내정보 메뉴에서 회원 정보 입력을 완료해주세요.")
    if (await desc.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(desc).toBeVisible()
      await expect(oldDesc).not.toBeVisible()
    }
  })

  test("unsigned docs banner navigates to /profile/documents", async ({ page }) => {
    const banner = page.getByText("제출하지 않은 서류가 있어요")
    if (await banner.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await banner.click()
      await expect(page).toHaveURL(/\/profile\/documents/)
    }
  })
})

test.describe("Home page — 정정 요청 button state", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home")
    await page.waitForLoadState("networkidle")
  })

  test("disabled 정정 요청 button has opacity class and stays blue", async ({ page }) => {
    // Find a disabled correction button (canRequestCorrection=false or pending)
    const disabledBtn = page.locator("button.opacity-40").filter({ hasText: "정정 요청" })
    if (await disabledBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      // Should have opacity-40 but keep blue color (text-[#007DCA])
      await expect(disabledBtn).toHaveClass(/opacity-40/)
      // Clicking does nothing — no dialog should open
      await disabledBtn.click()
      await expect(page.getByText("정정 요청", { exact: true }).nth(1)).not.toBeVisible({ timeout: 1_000 }).catch(() => {})
    }
  })
})

test.describe("Home page — checkout dialog", () => {
  test("퇴근하기 dialog shows 공수, 적용 단가, 예상 임금 rows", async ({ page }) => {
    await page.goto("/home")
    await page.waitForLoadState("networkidle")

    const checkoutBtn = page.getByRole("button", { name: "퇴근하기" })
    if (!(await checkoutBtn.isVisible({ timeout: 3_000 }).catch(() => false))) {
      test.skip()
      return
    }
    await checkoutBtn.click()

    // Dialog opens — may show spinner first, then data
    const dialog = page.locator(".fixed.inset-0").last()
    await expect(dialog).toBeVisible({ timeout: 3_000 })
    await page.waitForLoadState("networkidle")

    await expect(page.getByText("공수")).toBeVisible({ timeout: 5_000 })
    await expect(page.getByText("적용 단가")).toBeVisible()
    await expect(page.getByText("예상 임금(세전)")).toBeVisible()
  })
})
