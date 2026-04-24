import { test, expect } from "@playwright/test"

test.describe("Home page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home")
    // Wait for the page to settle (API data loads)
    await page.waitForLoadState("networkidle")
  })

  test("renders header with app name", async ({ page }) => {
    await expect(page.locator("header, [class*=AppHeader]").first()).toBeVisible()
  })

  test("shows today's date", async ({ page }) => {
    const today = new Date()
    const month = today.getMonth() + 1
    const day = today.getDate()
    // Date appears somewhere on the page in Korean format
    await expect(page.getByText(new RegExp(`${month}월`))).toBeVisible()
    await expect(page.getByText(new RegExp(`${day}일`))).toBeVisible()
  })

  test("shows QR check-in button when not checked in", async ({ page }) => {
    // Either the QR button or the active site card is shown
    const qrButton = page.getByRole("button", { name: /QR|출근/ })
    const siteCard = page.getByText(/현재 근무중/)
    const either = qrButton.or(siteCard)
    await expect(either.first()).toBeVisible({ timeout: 8_000 })
  })

  test("bottom nav has 4 tabs", async ({ page }) => {
    const nav = page.locator("nav").last()
    await expect(nav).toBeVisible()
    // 홈, 출역, 계약서, 내정보
    for (const label of ["홈", "출역", "계약서", "내정보"]) {
      await expect(nav.getByText(label)).toBeVisible()
    }
  })

  test("bottom nav 출역 navigates to attendance", async ({ page }) => {
    await page.locator("nav").last().getByText("출역").click()
    await expect(page).toHaveURL(/\/attendance/)
  })

  test("bottom nav 계약서 navigates to contracts", async ({ page }) => {
    await page.goto("/home")
    await page.locator("nav").last().getByText("계약서").click()
    await expect(page).toHaveURL(/\/contract/)
  })

  test("bottom nav 내정보 navigates to profile", async ({ page }) => {
    await page.goto("/home")
    await page.locator("nav").last().getByText("내정보").click()
    await expect(page).toHaveURL(/\/profile/)
  })
})
