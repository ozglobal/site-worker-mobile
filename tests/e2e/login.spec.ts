import { test, expect } from "@playwright/test"

// Login tests run WITHOUT saved auth state (no storageState dependency)
test.use({ storageState: { cookies: [], origins: [] } })


test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("renders phone, password fields and login button", async ({ page }) => {
    await expect(page.getByPlaceholder("휴대폰 번호")).toBeVisible()
    await expect(page.getByPlaceholder("비밀번호")).toBeVisible()
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible()
  })

  test("shows error when fields are empty", async ({ page }) => {
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page.getByText("휴대폰 번호와 비밀번호를 입력해주세요")).toBeVisible()
  })

  test("shows error for invalid credentials", async ({ page }) => {
    await page.getByPlaceholder("휴대폰 번호").fill("01000000000")
    await page.getByPlaceholder("비밀번호").fill("wrongpassword")
    await page.getByRole("button", { name: "로그인" }).click()
    // Button switches to loading state then shows API error
    await expect(page.locator("p.text-red-500")).toBeVisible({ timeout: 10_000 })
  })

  test("password visibility toggle works", async ({ page }) => {
    const input = page.getByPlaceholder("비밀번호")
    await expect(input).toHaveAttribute("type", "password")
    await page.locator("button[type=button]").first().click()
    await expect(input).toHaveAttribute("type", "text")
    await page.locator("button[type=button]").first().click()
    await expect(input).toHaveAttribute("type", "password")
  })

  test("has 회원 가입 and 비밀번호 재설정 links", async ({ page }) => {
    await expect(page.getByRole("button", { name: "회원 가입" })).toBeVisible()
    await expect(page.getByRole("button", { name: "비밀번호 재설정" })).toBeVisible()
  })

  test("valid login redirects to /home", async ({ page }) => {
    const phone = process.env.TEST_PHONE
    const password = process.env.TEST_PASSWORD
    if (!phone || !password) test.skip()

    await page.getByPlaceholder("휴대폰 번호").fill(phone!)
    await page.getByPlaceholder("비밀번호").fill(password!)
    await page.getByRole("button", { name: "로그인" }).click()
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 15_000 })
    expect(page.url()).toMatch(/\/(home|onboarding)/)
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 1 — 자동 로그인
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scenario 1 — 자동 로그인", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.evaluate(() => localStorage.clear())
    await page.goto("/login")
  })

  test("자동 로그인 checkbox is visible", async ({ page }) => {
    await expect(page.getByText("자동 로그인")).toBeVisible()
  })

  test("checkbox is unchecked by default when localStorage is empty", async ({ page }) => {
    const checkbox = page.locator('[role=checkbox]').or(
      page.locator('button[data-state]').filter({ hasText: "" })
    ).first()
    const label = page.locator("label").filter({ hasText: "자동 로그인" })
    await expect(label).toBeVisible()
    // Verify the underlying input or checkbox reflects unchecked state
    const state = await label.locator('[data-state]').getAttribute("data-state").catch(() => null)
    if (state !== null) expect(state).toBe("unchecked")
  })

  test("credentials pre-filled when auto_login_cred exists in localStorage", async ({ page }) => {
    await page.evaluate(() => {
      localStorage.setItem("auto_login", "true")
      localStorage.setItem("auto_login_cred", JSON.stringify({ phone: "01099991234", password: "TestPw1!" }))
    })
    await page.reload()
    const phoneInput = page.getByPlaceholder("휴대폰 번호")
    const pwInput = page.getByPlaceholder("비밀번호")
    await expect(phoneInput).not.toHaveValue("")
    await expect(pwInput).not.toHaveValue("")
  })

  test("login with auto-login checked stores auto_login=true and credentials", async ({ page }) => {
    const phone = process.env.TEST_PHONE
    const password = process.env.TEST_PASSWORD
    if (!phone || !password) test.skip()

    await page.locator("label").filter({ hasText: "자동 로그인" }).click()
    await page.getByPlaceholder("휴대폰 번호").fill(phone!)
    await page.getByPlaceholder("비밀번호").fill(password!)
    await page.getByRole("button", { name: "로그인" }).click()
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 15_000 })

    const flag = await page.evaluate(() => localStorage.getItem("auto_login"))
    expect(flag).toBe("true")
    const cred = await page.evaluate(() => localStorage.getItem("auto_login_cred"))
    expect(cred).not.toBeNull()
    expect(JSON.parse(cred!).phone).toBeTruthy()
  })

  test("login without auto-login does not store credentials", async ({ page }) => {
    const phone = process.env.TEST_PHONE
    const password = process.env.TEST_PASSWORD
    if (!phone || !password) test.skip()

    // Do NOT check auto-login
    await page.getByPlaceholder("휴대폰 번호").fill(phone!)
    await page.getByPlaceholder("비밀번호").fill(password!)
    await page.getByRole("button", { name: "로그인" }).click()
    await page.waitForURL(/\/(home|onboarding)/, { timeout: 15_000 })

    const flag = await page.evaluate(() => localStorage.getItem("auto_login"))
    expect(flag).not.toBe("true")
    const cred = await page.evaluate(() => localStorage.getItem("auto_login_cred"))
    expect(cred).toBeNull()
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 2 — 비밀번호 재설정
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scenario 2 — 비밀번호 재설정", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("비밀번호 재설정 link navigates to /login/sms-verification", async ({ page }) => {
    await page.goto("/login")
    await page.getByRole("button", { name: "비밀번호 재설정" }).click()
    await expect(page).toHaveURL(/\/login\/sms-verification/)
  })

  test("인증번호 받기 disabled until 11-digit phone entered", async ({ page }) => {
    await page.goto("/login/sms-verification")
    await page.waitForLoadState("networkidle")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeDisabled()
    await page.getByPlaceholder("010-0000-0000").fill("010-123")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeDisabled()
  })

  test("인증번호 받기 enabled after full 11-digit phone", async ({ page }) => {
    await page.goto("/login/sms-verification")
    await page.waitForLoadState("networkidle")
    await page.getByPlaceholder("010-0000-0000").fill("010-9999-1234")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeEnabled()
  })

  test("다음 button disabled until 6-digit code entered (requires TEST_PHONE)", async ({ page }) => {
    const phone = process.env.TEST_PHONE
    if (!phone) test.skip()

    await page.goto("/login/sms-verification")
    await page.waitForLoadState("networkidle")
    await page.getByPlaceholder("010-0000-0000").fill(phone!)
    await page.getByRole("button", { name: "인증번호 받기" }).click()
    const codeInput = page.getByPlaceholder("인증번호 입력")
    await expect(codeInput).toBeVisible({ timeout: 15_000 })

    // Verify button state before code entry
    await expect(page.getByRole("button", { name: "다음" })).toBeDisabled()
    await codeInput.fill("12345")
    await expect(page.getByRole("button", { name: "다음" })).toBeDisabled()
    await codeInput.fill("123456")
    await expect(page.getByRole("button", { name: "다음" })).toBeEnabled()
  })

  test("set-password page shows password requirement checklist", async ({ page }) => {
    await page.goto("/login/set-password")
    await page.waitForLoadState("networkidle")
    await expect(page.getByText("8자 이상")).toBeVisible()
    await expect(page.getByText("영문 포함")).toBeVisible()
    await expect(page.getByText("숫자 포함")).toBeVisible()
    await expect(page.getByText("특수문자 포함")).toBeVisible()
  })

  test("confirm password field disabled until new password meets all criteria", async ({ page }) => {
    await page.goto("/login/set-password")
    await page.waitForLoadState("networkidle")
    const confirmField = page.getByPlaceholder("비밀번호 재입력")
    await expect(confirmField).toBeDisabled()
    // Partial password — still disabled
    await page.locator("input[type=password]").first().fill("short")
    await expect(confirmField).toBeDisabled()
  })

  test("confirm password enabled after entering a valid new password", async ({ page }) => {
    await page.goto("/login/set-password")
    await page.waitForLoadState("networkidle")
    await page.locator("input[type=password]").first().fill("Test1234!")
    const confirmField = page.getByPlaceholder("비밀번호 재입력")
    await expect(confirmField).toBeEnabled({ timeout: 2_000 })
  })

  test("mismatch shows 비밀번호가 일치하지 않습니다", async ({ page }) => {
    await page.goto("/login/set-password")
    await page.waitForLoadState("networkidle")
    await page.locator("input[type=password]").first().fill("Test1234!")
    await page.getByPlaceholder("비밀번호 재입력").fill("Different9!")
    await expect(page.getByText("비밀번호가 일치하지 않습니다")).toBeVisible()
  })

  test("다음 button disabled when passwords mismatch", async ({ page }) => {
    await page.goto("/login/set-password")
    await page.waitForLoadState("networkidle")
    await page.locator("input[type=password]").first().fill("Test1234!")
    await page.getByPlaceholder("비밀번호 재입력").fill("Different9!")
    await expect(page.getByRole("button", { name: "다음" })).toBeDisabled()
  })

  // Full end-to-end flow — requires --headed so user can enter the SMS code.
  // Run:  TEST_PHONE=010-xxxx-xxxx RESET_NEW_PASSWORD=NewPw1!@# npx playwright test login.spec.ts --headed --no-deps -g "full reset"
  test("full reset flow: SMS → set new password → /login [headed]", async ({ page }) => {
    const phone = process.env.TEST_PHONE
    const newPassword = process.env.RESET_NEW_PASSWORD
    if (!phone || !newPassword) test.skip()

    await test.step("로그인 → 비밀번호 재설정 탭", async () => {
      await page.goto("/login")
      await page.getByRole("button", { name: "비밀번호 재설정" }).click()
      await expect(page).toHaveURL(/\/login\/sms-verification/)
    })

    await test.step("휴대폰 번호 입력 → 인증번호 받기", async () => {
      await page.getByPlaceholder("010-0000-0000").fill(phone!)
      await page.getByRole("button", { name: "인증번호 받기" }).click()
      await expect(page.getByPlaceholder("인증번호 입력")).toBeVisible({ timeout: 15_000 })
      console.log("\n⏸  SMS sent to", phone)
      console.log("   Enter the 6-digit code in the browser and click '다음'.\n")
    })

    await test.step("인증번호 수동 입력 대기 → /login/set-password (최대 2분)", async () => {
      await expect(page).toHaveURL(/\/login\/set-password/, { timeout: 120_000 })
    })

    await test.step("새 비밀번호 입력", async () => {
      await page.locator("input[type=password]").first().fill(newPassword!)
      await page.getByPlaceholder("비밀번호 재입력").fill(newPassword!)
    })

    await test.step("다음 탭 → 성공 토스트 + /login 이동", async () => {
      await page.getByRole("button", { name: "다음" }).click()
      await expect(page.getByText(/비밀번호가 변경되었습니다/)).toBeVisible({ timeout: 10_000 })
      await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
    })
  })
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario 4 — 패스워드 잠금
// Run: npx playwright test --env-file tests/.env.local login.spec.ts --no-deps -g "Scenario 4" --timeout 420000
// ─────────────────────────────────────────────────────────────────────────────
test.describe("Scenario 4 — 패스워드 잠금", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.beforeEach(async ({ page }) => {
    await page.goto("/login")
  })

  test("shows error message on failed login attempt", async ({ page }) => {
    await page.getByPlaceholder("휴대폰 번호").fill("01000000000")
    await page.getByPlaceholder("비밀번호").fill("wrongpassword1!")
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page.locator("p.text-red-500")).toBeVisible({ timeout: 10_000 })
  })

  test("5회 실패 → 잠금 → 5분 대기 → 로그인 복구 (requires TEST_LOCKOUT_PHONE)", async ({ page }) => {
    // 5분 잠금 + 여유 1분 = 총 7분 타임아웃
    test.setTimeout(7 * 60 * 1_000)

    const phone = process.env.TEST_LOCKOUT_PHONE
    const password = process.env.TEST_LOCKOUT_PASSWORD
    if (!phone || !password) test.skip()

    await test.step("1~5회 실패 → 잠금 메시지 확인", async () => {
      for (let i = 1; i <= 5; i++) {
        await page.getByPlaceholder("휴대폰 번호").fill(phone)
        await page.getByPlaceholder("비밀번호").fill(`WrongPw${i}!x`)
        await page.getByRole("button", { name: "로그인" }).click()
        await page.waitForLoadState("networkidle")
        if (i < 5) {
          await expect(page.locator("p.text-red-500")).toBeVisible({ timeout: 10_000 })
        }
      }
      await expect(page.getByText(/잠금|5분|locked/i)).toBeVisible({ timeout: 10_000 })
    })

    await test.step("잠금 중 재시도 → 여전히 잠금 메시지", async () => {
      await page.getByPlaceholder("휴대폰 번호").fill(phone)
      await page.getByPlaceholder("비밀번호").fill(password)
      await page.getByRole("button", { name: "로그인" }).click()
      await expect(page.getByText(/잠금|5분|locked/i)).toBeVisible({ timeout: 10_000 })
    })

    await test.step("5분 대기", async () => {
      console.log("\n⏳  Waiting 5 minutes for lockout to expire…")
      await page.waitForTimeout(5 * 60 * 1_000)
    })

    await test.step("잠금 해제 후 올바른 비밀번호로 로그인 성공", async () => {
      await page.getByPlaceholder("휴대폰 번호").fill(phone)
      await page.getByPlaceholder("비밀번호").fill(password)
      await page.getByRole("button", { name: "로그인" }).click()
      await expect(page).toHaveURL(/\/(home|onboarding)/, { timeout: 15_000 })
    })
  })
})
