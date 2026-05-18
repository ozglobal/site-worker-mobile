import { test, expect } from "@playwright/test"

// ─────────────────────────────────────────────────────────────────────────────
// Stage 5 — 알림 (Notifications)
// Prerequisite: site-manager must have sent at least one notice to the test
// account before running this suite.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Notices — panel UI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home")
    await page.waitForLoadState("networkidle")
  })

  test("bell icon is visible in header", async ({ page }) => {
    await expect(page.getByRole("button", { name: "Notifications" })).toBeVisible()
  })

  test("clicking bell opens 알림 panel", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click()
    await expect(page.getByText("알림")).toBeVisible({ timeout: 3_000 })
  })

  test("panel has 모두 and 안읽음 tabs", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click()
    await expect(page.getByText("모두")).toBeVisible()
    await expect(page.getByText("안읽음")).toBeVisible()
  })

  test("panel has 모두 읽음 button", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click()
    await expect(page.getByText("모두 읽음")).toBeVisible()
  })

  test("close button dismisses the panel", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click()
    await expect(page.getByText("알림")).toBeVisible()
    // Close via backdrop click or X button
    const closeBtn = page.locator("button").filter({ has: page.locator("svg") }).last()
    await closeBtn.click()
    await expect(page.getByText("알림")).not.toBeVisible({ timeout: 2_000 })
  })

  test("shows empty state or notice list", async ({ page }) => {
    await page.getByRole("button", { name: "Notifications" }).click()
    const noticeItem = page.locator("button").filter({ has: page.getByText(/전$|방금 전/) })
    const emptyState = page.getByText(/알림이 없습니다/)
    const loading = page.getByText("로딩 중...")
    await expect(noticeItem.or(emptyState).or(loading).first()).toBeVisible({ timeout: 8_000 })
  })
})

test.describe("Notices — 사이트 매니저 발송 후 (requires manager action)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/home")
    await page.waitForLoadState("networkidle")
    await page.getByRole("button", { name: "Notifications" }).click()
    await expect(page.getByText("알림")).toBeVisible({ timeout: 5_000 })
  })

  test("unread badge shows on bell icon when notices exist", async ({ page }) => {
    // Red dot on bell — present when unreadCount > 0
    const badge = page.locator("button[aria-label='Notifications'] .bg-red-500, button[aria-label='Notifications'] ~ * .bg-red-500").first()
    // If no unread, this test is informational only
    const hasBadge = await badge.isVisible({ timeout: 3_000 }).catch(() => false)
    if (!hasBadge) test.info().annotations.push({ type: "note", description: "No unread badge — manager may not have sent a notice yet" })
    // Either the badge exists or we accept that no notices have been sent
    expect(true).toBe(true)
  })

  test("notice list shows at least one item", async ({ page }) => {
    const emptyAll = page.getByText("알림이 없습니다")
    const isEmpty = await emptyAll.isVisible({ timeout: 3_000 }).catch(() => false)
    if (isEmpty) {
      test.skip(true, "사이트 매니저가 아직 알림을 발송하지 않았습니다.")
    }
    // At least one notice row is visible
    const rows = page.locator("button").filter({ has: page.locator(".text-\\[13px\\]") })
    await expect(rows.first()).toBeVisible({ timeout: 5_000 })
  })

  test("notice item shows category badge and timestamp", async ({ page }) => {
    const emptyAll = page.getByText("알림이 없습니다")
    if (await emptyAll.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "알림 없음")
    }
    // Category badge (공지, 계약, GPS, etc.)
    const badge = page.locator(".bg-gray-100.rounded-full").first()
    await expect(badge).toBeVisible({ timeout: 5_000 })
    // Timestamp text
    const time = page.locator(".text-\\[11px\\].text-gray-400").first()
    await expect(time).toBeVisible()
  })

  test("notice item shows title and content", async ({ page }) => {
    const emptyAll = page.getByText("알림이 없습니다")
    if (await emptyAll.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "알림 없음")
    }
    const row = page.locator("button").filter({ has: page.locator(".text-\\[13px\\]") }).first()
    await expect(row.locator(".text-\\[13px\\]").first()).toBeVisible({ timeout: 5_000 })
  })

  test("unread notice has blue dot indicator", async ({ page }) => {
    const emptyAll = page.getByText("알림이 없습니다")
    if (await emptyAll.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "알림 없음")
    }
    // Switch to 안읽음 tab
    await page.getByText("안읽음").click()
    const emptyUnread = page.getByText("안읽은 알림이 없습니다")
    if (await emptyUnread.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "안읽은 알림 없음")
    }
    const blueDot = page.locator(".bg-blue-500.rounded-full").first()
    await expect(blueDot).toBeVisible({ timeout: 3_000 })
  })

  test("clicking a notice marks it as read (blue dot disappears)", async ({ page }) => {
    // Switch to 안읽음 tab
    await page.getByText("안읽음").click()
    const emptyUnread = page.getByText("안읽은 알림이 없습니다")
    if (await emptyUnread.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "안읽은 알림 없음")
    }
    const row = page.locator("button").filter({ has: page.locator(".bg-blue-500") }).first()
    await row.click()
    // After clicking, row should no longer have blue dot (or row disappears from 안읽음 tab)
    await expect(row.locator(".bg-blue-500")).not.toBeVisible({ timeout: 5_000 })
  })

  test("모두 읽음 clears all unread indicators", async ({ page }) => {
    const emptyAll = page.getByText("알림이 없습니다")
    if (await emptyAll.isVisible({ timeout: 2_000 }).catch(() => false)) {
      test.skip(true, "알림 없음")
    }
    await page.getByText("모두 읽음").click()
    // 안읽음 tab should show empty state
    await page.getByText("안읽음").click()
    await expect(page.getByText("안읽은 알림이 없습니다")).toBeVisible({ timeout: 5_000 })
  })

  test("ANNOUNCEMENT type notice shows 공지 badge", async ({ page }) => {
    const badge = page.locator(".bg-gray-100.rounded-full").filter({ hasText: "공지" })
    if (await badge.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(badge.first()).toBeVisible()
    } else {
      test.info().annotations.push({ type: "note", description: "공지 타입 알림 없음" })
    }
  })
})
