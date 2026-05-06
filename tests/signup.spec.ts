import { test, expect, type Page } from "@playwright/test"

// Signup tests run without saved auth state
test.use({ storageState: { cookies: [], origins: [] } })

test.describe("Signup page — identity verification options", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup")
  })

  test("renders two option cards", async ({ page }) => {
    await expect(page.getByText("내 명의 휴대폰이 있어요")).toBeVisible()
    await expect(page.getByText("타인 명의 휴대폰이 있어요")).toBeVisible()
  })

  test("'타인 명의 휴대폰이 있어요' navigates to /signup/sms-verification", async ({ page }) => {
    await page.getByText("타인 명의 휴대폰이 있어요").click()
    await expect(page).toHaveURL(/\/signup\/sms-verification/)
  })

  test("'내 명의 휴대폰이 있어요' opens NICE popup (not navigate to /signup/nice-api)", async ({ page }) => {
    // In headless mode popups are blocked; assert no navigation to the old route
    const [popup] = await Promise.all([
      page.waitForEvent("popup", { timeout: 3_000 }).catch(() => null),
      page.getByText("내 명의 휴대폰이 있어요").click(),
    ])
    // Either a popup was opened (NICE flow), or the page stayed on /signup (popup blocked)
    // Either way, we must NOT have navigated to the old /signup/nice-api internal route
    if (popup) {
      // Popup opens blank then form posts — just verify it's a popup (not an in-app navigation)
      await popup.waitForLoadState("domcontentloaded").catch(() => {})
      expect(page.url()).not.toContain("/signup/nice-api")
    } else {
      expect(page.url()).not.toContain("/signup/nice-api")
    }
  })
})

test.describe("Signup — SMS verification (타인 명의)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup/sms-verification")
  })

  test("renders phone input and 인증번호 받기 button", async ({ page }) => {
    await expect(page.getByPlaceholder("010-0000-0000")).toBeVisible()
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeVisible()
  })

  test("인증번호 받기 disabled when phone is incomplete", async ({ page }) => {
    await page.getByPlaceholder("010-0000-0000").fill("010-1234")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeDisabled()
  })

  test("인증번호 받기 enabled when phone is 11 digits", async ({ page }) => {
    await page.getByPlaceholder("010-0000-0000").fill("010-1234-5678")
    await expect(page.getByRole("button", { name: "인증번호 받기" })).toBeEnabled()
  })

  test("verification code input hidden before code is sent", async ({ page }) => {
    await expect(page.getByPlaceholder("인증번호 입력")).not.toBeVisible()
  })
})

test.describe("Signup — Set password", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/signup/set-password")
  })

  test("renders two password inputs", async ({ page }) => {
    const inputs = page.locator("input[type=password]")
    await expect(inputs.first()).toBeVisible()
    await expect(inputs.nth(1)).toBeVisible()
  })

  test("다음 button disabled when passwords do not match", async ({ page }) => {
    const inputs = page.locator("input[type=password]")
    await inputs.first().fill("Password1!")
    await inputs.nth(1).fill("Different1!")
    await expect(page.getByRole("button", { name: "다음" })).toBeDisabled()
  })

  test("password requirements checklist is visible", async ({ page }) => {
    await expect(page.getByText(/8자 이상|영문|숫자|특수문자/).first()).toBeVisible()
  })
})

// ---------------------------------------------------------------------------
// Full flow: 타인 명의 휴대폰이 있어요 → 내국인 (RRN path)
// ---------------------------------------------------------------------------

async function mockSignupApis(page: Page) {
  await page.route("**/auth/register/send-code", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: {} }) })
  )
  await page.route("**/auth/register/verify-code", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: { registrationToken: "test-token" } }) })
  )
  await page.route("**/auth/register/worker", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ code: 200, data: {} }) })
  )
}


test.describe("Signup — full flow: 타인 명의 → 내국인 (RRN)", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("SMS code sent → verification input appears", async ({ page }) => {
    await mockSignupApis(page)
    await page.goto("/signup/sms-verification")
    await page.getByPlaceholder("010-0000-0000").fill("010-1234-5678")
    await page.getByRole("button", { name: "인증번호 받기" }).click()
    await expect(page.getByPlaceholder("인증번호 입력")).toBeVisible()
  })

  test("Agreement: 동의하기 navigates to domestic-foreign", async ({ page }) => {
    await page.goto("/signup/agreement")
    await page.getByRole("button", { name: "동의하기" }).click()
    await expect(page).toHaveURL(/\/signup\/domestic-foreign/)
  })

  test("Domestic-foreign: 내국인 → signup-rrn", async ({ page }) => {
    await page.goto("/signup/domestic-foreign")
    await page.getByRole("button", { name: "내국인" }).click()
    await expect(page).toHaveURL(/\/signup\/signup-rrn/)
  })

  test("Domestic-foreign: 외국인 → signup-frn", async ({ page }) => {
    await page.goto("/signup/domestic-foreign")
    await page.getByRole("button", { name: "외국인" }).click()
    await expect(page).toHaveURL(/\/signup\/signup-frn/)
  })

  test("RRN form: 다음 disabled without address", async ({ page }) => {
    await page.goto("/signup/signup-rrn")
    await page.getByPlaceholder("이름 입력").fill("홍길동")
    await page.getByPlaceholder("앞 6자리").fill("901010")
    await page.getByPlaceholder("뒤 7자리").fill("1234567")
    await expect(page.getByRole("button", { name: "다음" })).toBeDisabled()
  })

  test("Complete happy path: signup → SMS → agreement → RRN → password → complete", async ({ page }) => {
    await mockSignupApis(page)

    // 1. Choose 타인 명의
    await page.goto("/signup")
    await page.getByText("타인 명의 휴대폰이 있어요").click()
    await expect(page).toHaveURL(/\/signup\/sms-verification/)

    // 2. SMS verification
    await page.getByPlaceholder("010-0000-0000").fill("010-1234-5678")
    await page.getByRole("button", { name: "인증번호 받기" }).click()
    await expect(page.getByPlaceholder("인증번호 입력")).toBeVisible()
    await page.getByPlaceholder("인증번호 입력").fill("123456")
    await page.getByRole("button", { name: "인증하기" }).click()
    await expect(page).toHaveURL(/\/signup\/agreement/)

    // 3. Agreement
    await page.getByRole("button", { name: "동의하기" }).click()
    await expect(page).toHaveURL(/\/signup\/domestic-foreign/)

    // 4. Nationality selection — pre-seed address before navigating so the form initialises with it
    await page.evaluate(() => {
      const current = JSON.parse(sessionStorage.getItem("signup_data") || "{}")
      sessionStorage.setItem("signup_data", JSON.stringify({ ...current, address: "서울특별시 강남구 테헤란로 1" }))
    })
    await page.getByRole("button", { name: "내국인" }).click()
    await expect(page).toHaveURL(/\/signup\/signup-rrn/)

    // 5. RRN form
    await page.getByPlaceholder("이름 입력").fill("홍길동")
    await page.getByPlaceholder("앞 6자리").fill("901010")
    await page.getByPlaceholder("뒤 7자리").fill("1234567")
    await expect(page.getByRole("button", { name: "다음" })).toBeEnabled()
    await page.getByRole("button", { name: "다음" }).click()
    await expect(page).toHaveURL(/\/signup\/set-password/)

    // 6. Set password
    const pwInputs = page.locator("input[type=password]")
    await pwInputs.first().fill("Test123!")
    await pwInputs.nth(1).fill("Test123!")
    await page.getByRole("button", { name: "다음" }).click()
    await expect(page).toHaveURL(/\/signup\/complete/)

    // 7. Complete
    await expect(page.getByText("회원 가입 완료")).toBeVisible()
    await page.getByRole("button", { name: "로그인하기" }).click()
    await expect(page).toHaveURL(/\/login/)
  })

  test("Signup complete: 로그인하기 navigates to /login", async ({ page }) => {
    await page.goto("/signup/complete")
    await expect(page.getByText("회원 가입 완료")).toBeVisible()
    await page.getByRole("button", { name: "로그인하기" }).click()
    await expect(page).toHaveURL(/\/login/)
  })
})
