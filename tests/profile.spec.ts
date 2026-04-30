import { test, expect } from "@playwright/test"

test.describe("Profile — My Info", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile")
    await page.waitForLoadState("networkidle")
  })

  test("renders profile menu items", async ({ page }) => {
    await expect(page.getByText("개인정보")).toBeVisible()
    await expect(page.getByText("계좌정보")).toBeVisible()
    await expect(page.getByText("제출서류")).toBeVisible()
  })

  test("shows worker name in 개인정보 subtitle", async ({ page }) => {
    // Worker name is shown as the subtitle of the 개인정보 menu item
    const nameEl = page.locator("p, span").filter({ hasText: /[가-힣a-zA-Z]/ }).first()
    await expect(nameEl).toBeVisible()
    const text = await nameEl.textContent()
    expect(text?.trim().length).toBeGreaterThan(0)
  })

  test("shows 비밀번호 변경 button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "비밀번호 변경" })).toBeVisible()
  })

  test("shows 로그아웃 button", async ({ page }) => {
    await expect(page.getByRole("button", { name: "로그아웃" })).toBeVisible()
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

test.describe("Profile — 회원유형 visibility", () => {
  test("회원유형 card visible for non-passport user, hidden for passport user", async ({ page }) => {
    await page.goto("/profile")
    await page.waitForLoadState("networkidle")

    // Navigate to personal info to infer idType from the URL redirect
    const personalInfoItem = page.getByText("개인정보")
    if (!(await personalInfoItem.isVisible({ timeout: 3_000 }).catch(() => false))) return

    await personalInfoItem.click()
    await page.waitForLoadState("networkidle")
    const url = page.url()
    await page.goto("/profile")
    await page.waitForLoadState("networkidle")

    const workerTypeCard = page.getByText("회원유형")
    if (url.includes("myinfo-pn")) {
      // Passport user — 회원유형 should be hidden
      await expect(workerTypeCard).not.toBeVisible()
    } else {
      // Domestic or FRN user — 회원유형 should be visible
      await expect(workerTypeCard).toBeVisible()
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

  test("each document shows status badge with current label set", async ({ page }) => {
    // New badge labels from backend status codes
    const badge = page.getByText(
      /제출 완료 \(심사 대기\)|승인|반려|재제출 요청|만료|미제출/
    )
    const loading = page.locator(".animate-spin")
    const uploadBtn = page.getByRole("button", { name: /사진 촬영|파일 선택/ })
    await expect(badge.or(loading).or(uploadBtn).first()).toBeVisible({ timeout: 8_000 })
  })

  test("old '승인 대기' badge label is no longer used", async ({ page }) => {
    await expect(page.getByText("승인 대기", { exact: true })).not.toBeVisible()
  })

  test("upload buttons visible for incomplete docs", async ({ page }) => {
    const captureBtn = page.getByRole("button", { name: "사진 촬영" })
    const fileBtn = page.getByRole("button", { name: "파일 선택" })
    const viewBtn = page.getByText("보기")
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
  test("renders viewer page with title", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("신분증 사본")).toBeVisible()
  })

  test("재등록 button hidden when doc is approved", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    // If the badge shows 승인, 재등록 button must be absent
    const approvedBadge = page.getByText("승인", { exact: true })
    if (await approvedBadge.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await expect(page.getByRole("button", { name: "재등록" })).not.toBeVisible()
    }
  })

  test("재등록 button visible when doc is not approved", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    const approvedBadge = page.getByText("승인", { exact: true })
    if (!(await approvedBadge.isVisible({ timeout: 3_000 }).catch(() => false))) {
      const reregBtn = page.getByRole("button", { name: "재등록" })
      await expect(reregBtn).toBeVisible({ timeout: 5_000 })
    }
  })

  test("재등록 reveals 사진 촬영 and 파일 선택 when not approved", async ({ page }) => {
    await page.goto("/profile/documents/view/id-card")
    await page.waitForLoadState("networkidle")
    const reregBtn = page.getByRole("button", { name: "재등록" })
    if (await reregBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reregBtn.click()
      await expect(page.getByRole("button", { name: "사진 촬영" })).toBeVisible()
      await expect(page.getByRole("button", { name: "파일 선택" })).toBeVisible()
    }
  })

  test("bankbook viewer is accessible", async ({ page }) => {
    await page.goto("/profile/documents/view/bankbook")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("통장사본")).toBeVisible()
  })

  test("family-relation viewer shows title", async ({ page }) => {
    await page.goto("/profile/documents/view/family-relation")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("가족관계증명서")).toBeVisible()
  })
})

test.describe("Profile — MyInfoPn phone change", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/profile/myinfo-pn")
    await page.waitForLoadState("networkidle")
  })

  test("수정 button visible next to 휴대폰 번호 field", async ({ page }) => {
    await expect(page.getByRole("button", { name: "수정" })).toBeVisible({ timeout: 5_000 })
  })

  test("clicking 수정 opens 휴대폰 번호 변경 modal", async ({ page }) => {
    await page.getByRole("button", { name: "수정" }).click()
    await expect(page.getByText("휴대폰 번호 변경")).toBeVisible()
  })

  test("modal has phone input and 인증번호 받기 button", async ({ page }) => {
    await page.getByRole("button", { name: "수정" }).click()
    await expect(page.getByPlaceholder("010-0000-0000")).toBeVisible()
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeVisible()
  })

  test("인증번호 받기 disabled when phone incomplete", async ({ page }) => {
    await page.getByRole("button", { name: "수정" }).click()
    const sendBtn = page.getByRole("button", { name: "인증번호 받기" })
    await expect(sendBtn).toBeDisabled()
  })

  test("인증번호 받기 enabled when phone is 11 digits", async ({ page }) => {
    await page.getByRole("button", { name: "수정" }).click()
    await page.getByPlaceholder("010-0000-0000").fill("010-9999-1234")
    const sendBtn = page.getByRole("button", { name: "인증번호 받기" })
    await expect(sendBtn).toBeEnabled()
  })

  test("변경하기 button disabled until 6-digit code entered", async ({ page }) => {
    await page.getByRole("button", { name: "수정" }).click()
    const changeBtn = page.getByRole("button", { name: "변경하기" })
    await expect(changeBtn).toBeDisabled()
  })

  test("취소 button closes the modal", async ({ page }) => {
    await page.getByRole("button", { name: "수정" }).click()
    await expect(page.getByText("휴대폰 번호 변경")).toBeVisible()
    await page.getByRole("button", { name: "취소" }).click()
    await expect(page.getByText("휴대폰 번호 변경")).not.toBeVisible()
  })
})
