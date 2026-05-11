import * as path from "path"
import * as fs from "fs"
import { fileURLToPath } from "url"
import { test, expect, type Page } from "@playwright/test"
import { Client } from "pg"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Real-environment signup tests — no API mocks, SMS delivered to a real phone.
// Run one scenario at a time. Requires --headed so page.pause() works.
//
// Scenario A:  DB_PASSWORD=xxx REAL_PHONE=010-6369-6595 RRN_NAME_KO=홍길동 RRN_FIRST=901010 RRN_SECOND=1234567 TEST_PASSWORD=Test123! npx playwright test tests/signup-real.spec.ts --headed --no-deps -g "Scenario A"
// Scenario B:  DB_PASSWORD=xxx REAL_PHONE=010-6369-6595 FRN_NAME_KO=홍길동 "FRN_NAME_EN=HONG GILDONG" FRN_FIRST=901010 FRN_SECOND=1234567 TEST_PASSWORD=Test123! npx playwright test tests/signup-real.spec.ts --headed --no-deps -g "Scenario B"
// Scenario C:  DB_PASSWORD=xxx REAL_PHONE=010-6369-6595 PN_NAME_KO=연수생 "PN_NAME_EN=Trainee" PN_GENDER=남성 PN_PASSPORT=M12345678 PN_NATIONALITY=베트남 PN_BIRTHDATE=1990-01-01 TEST_PASSWORD=Test123! npx playwright test tests/signup-real.spec.ts --headed --no-deps -g "Scenario C"

const REAL_PHONE    = process.env.REAL_PHONE    ?? "010-6369-6595"
const TEST_PASSWORD = process.env.TEST_PASSWORD ?? "Test123!"
const DB_PASSWORD   = process.env.DB_PASSWORD   ?? ""

// ---------------------------------------------------------------------------
// DB cleanup
// ---------------------------------------------------------------------------
async function cleanupTestAccount() {
  if (!DB_PASSWORD) {
    console.warn("⚠  DB_PASSWORD not set — skipping DB cleanup")
    return
  }
  const client = new Client({
    host: "43.201.238.126",
    port: 5432,
    database: "appdb",
    user: "app",
    password: DB_PASSWORD,
  })
  await client.connect()
  try {
    await client.query(`
      DO $$
      DECLARE
        v_mobile_phone TEXT   := '${REAL_PHONE}';
        v_tenant_id    BIGINT := 0;
        v_user_id      BIGINT;
        v_worker_id    UUID;
      BEGIN
        SELECT u.id, w.id
          INTO v_user_id, v_worker_id
          FROM sys_user u
          JOIN workers w ON w.user_id = u.id
         WHERE u.phone = v_mobile_phone
           AND u.tenant_id = v_tenant_id
         LIMIT 1;
        IF v_user_id IS NULL THEN
          RAISE NOTICE '해당 휴대폰 번호의 근로자를 찾을 수 없습니다: %', v_mobile_phone;
          RETURN;
        END IF;
        DELETE FROM attendance_correction_request WHERE requester_id = v_user_id;
        DELETE FROM worker_attendance             WHERE worker_id = v_worker_id;
        DELETE FROM worker_site_doc_compliance    WHERE worker_id = v_worker_id;
        DELETE FROM worker_site_profiles          WHERE worker_id = v_worker_id;
        DELETE FROM worker_documents              WHERE worker_id = v_worker_id;
        DELETE FROM workers                       WHERE id = v_worker_id;
        DELETE FROM sys_user                      WHERE id = v_user_id;
        RAISE NOTICE '삭제 완료: phone=%', v_mobile_phone;
      END $$;
    `)
    console.log(`✓  Cleanup complete for ${REAL_PHONE}`)
  } finally {
    await client.end()
  }
}

// ---------------------------------------------------------------------------
// Console log capture — runs for every test in this file
// ---------------------------------------------------------------------------
const consoleLogs: string[] = []

test.beforeEach(async ({ page }) => {
  consoleLogs.length = 0
  page.on("console", (msg) => {
    consoleLogs.push(`[${new Date().toISOString()}] [${msg.type()}] ${msg.text()}`)
  })
  page.on("pageerror", (err) => {
    consoleLogs.push(`[${new Date().toISOString()}] [pageerror] ${err.message}`)
  })
})

test.afterEach(async ({}, testInfo) => {
  if (consoleLogs.length === 0) return
  const logFile = testInfo.outputPath("console.log")
  fs.mkdirSync(path.dirname(logFile), { recursive: true })
  fs.writeFileSync(logFile, consoleLogs.join("\n"), "utf-8")
  await testInfo.attach("console-log", { path: logFile, contentType: "text/plain" })
})

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------
async function doSmsVerification(page: Page, phone: string) {
  await test.step("SMS 인증 > 휴대폰 번호 → 입력", async () => {
    await page.goto("/signup/sms-verification")
    await page.getByPlaceholder("010-0000-0000").fill(phone)
  })
  await test.step("SMS 인증 > 인증번호 받기 → 클릭", async () => {
    await page.getByRole("button", { name: "인증번호 받기" }).click()
    await expect(page.getByPlaceholder("인증번호 입력")).toBeVisible({ timeout: 15_000 })
    console.log("\n⏸  SMS sent to", phone)
    console.log("   Enter the 6-digit code in the browser and click '인증하기'.\n")
  })
  await test.step("SMS 인증 > 인증번호 → 수동 입력 대기 (최대 2분)", async () => {
    await expect(page).toHaveURL(/\/signup\/agreement/, { timeout: 120_000 })
  })
}

async function doLogin(page: Page, phone: string, password: string) {
  await test.step("로그인 > 휴대폰 번호 → 입력", async () => {
    await expect(page).toHaveURL(/\/login/)
    await page.getByPlaceholder("휴대폰 번호").fill(phone)
  })
  await test.step("로그인 > 비밀번호 → 입력", async () => {
    await page.getByPlaceholder("비밀번호").fill(password)
  })
  await test.step("로그인 > 로그인 → 클릭 → /home 또는 /onboarding", async () => {
    await page.getByRole("button", { name: "로그인" }).click()
    await expect(page).toHaveURL(/\/onboarding|\/home/, { timeout: 15_000 })
  })
}

async function doOnboarding(page: Page, workerTypeLabel: string, dailyWage: string) {
  await test.step("온보딩 > 시작하기 → 클릭", async () => {
    await expect(page).toHaveURL(/\/onboarding$/)
    await page.getByRole("button", { name: "시작하기" }).click()
    await expect(page).toHaveURL(/\/onboarding\/worker-type/)
  })
  await test.step(`온보딩/근무자 유형 > "${workerTypeLabel}" → 선택`, async () => {
    await page.getByText(workerTypeLabel).first().waitFor()
    await page.getByText(workerTypeLabel).first().click()
    await expect(page).toHaveURL(/\/onboarding\/daily-wage/)
  })
  await test.step(`온보딩/일급 > "${dailyWage}원" → 입력 후 저장`, async () => {
    await page.getByPlaceholder("일급 입력").fill(dailyWage)
    await page.getByRole("button", { name: "저장" }).click()
    await page.getByRole("button", { name: "확인" }).waitFor({ timeout: 15_000 })
    await page.getByRole("button", { name: "확인" }).click()
    await expect(page).toHaveURL(/\/home/)
  })
}

async function doPersonalInfoCheck(page: Page, expected: { name: string }) {
  await test.step("내 정보 탭 > 개인정보 → 클릭", async () => {
    await page.getByText("내 정보").click()
    await expect(page).toHaveURL(/\/profile$/)
    await page.getByText("개인정보").click()
    await expect(page).toHaveURL(/\/profile\/myinfo-(rrn|frn|pn)/)
  })
  await test.step(`개인정보 > 이름 → "${expected.name}" 확인`, async () => {
    // RRN page uses "이름", FRN/PN pages use "한글 이름"
    await expect(
      page.locator("label", { hasText: /^(이름|한글 이름)$/ }).locator("..").locator("input")
    ).toHaveValue(expected.name)
  })
  await page.goto("/home")
}

type BankItem = { code: string; name: string }

// Pick the right image for a viewer page based on its URL slug.
function imageForSlug(slug: string, imageDir: string, fallbackIndex: number): string {
  if (slug === "passport")        return path.join(imageDir, "여권.jpg")
  if (slug === "bankbook")        return path.join(imageDir, "통장jpg.jpg")
  if (slug === "safety-cert")     return path.join(imageDir, "기초안전보건교육이수증.jpg")
  if (slug === "id-card")         return path.join(imageDir, "외국인등록증.jpg")
  if (slug === "family-relation") return path.join(imageDir, "가족관계증명서.jpg")
  const fallback = ["여권.jpg", "통장jpg.jpg", "기초안전보건교육이수증.jpg", "외국인등록증.jpg"]
  return path.join(imageDir, fallback[fallbackIndex % fallback.length])
}

// Pick the right image for a document based on its label text shown in the UI.
async function imageForDocButton(btn: import("@playwright/test").Locator, imageDir: string, fallbackIndex: number): Promise<string> {
  const label = await btn.evaluate((el) => {
    const row = el.closest(".flex.items-center.justify-between")
    return row?.querySelector("p")?.textContent?.trim() ?? ""
  }).catch(() => "")

  if (/여권/.test(label))           return path.join(imageDir, "여권.jpg")
  if (/통장/.test(label))           return path.join(imageDir, "통장jpg.jpg")
  if (/안전|교육|이수/.test(label)) return path.join(imageDir, "기초안전보건교육이수증.jpg")
  if (/외국인/.test(label))         return path.join(imageDir, "외국인등록증.jpg")
  if (/가족관계/.test(label))       return path.join(imageDir, "가족관계증명서.jpg")

  // Fallback: cycle through all images
  const fallback = ["여권.jpg", "통장jpg.jpg", "기초안전보건교육이수증.jpg", "외국인등록증.jpg"]
  return path.join(imageDir, fallback[fallbackIndex % fallback.length])
}

// Open a custom Select dropdown and pick an option by label text or data-value.
async function selectDropdown(
  page: Page,
  trigger: import("@playwright/test").Locator,
  pick: { label?: string; value?: string },
) {
  await trigger.waitFor()
  await trigger.click()
  if (pick.value !== undefined) {
    await page.locator(`[data-value="${pick.value}"]`).first().waitFor()
    await page.locator(`[data-value="${pick.value}"]`).first().click()
  } else if (pick.label !== undefined) {
    await page.getByRole("button", { name: pick.label, exact: true }).waitFor()
    await page.getByRole("button", { name: pick.label, exact: true }).click()
  }
}

async function doOutsourcingSetup(page: Page) {
  await test.step("내 정보 > 근무자 유형 → 용역 클릭 → 용역회사 페이지 이동", async () => {
    await page.goto("/profile/worker-type")
    await page.getByText("용역").first().waitFor()
    await page.getByText("용역").first().click()
    await expect(page).toHaveURL(/\/profile\/outsourcing/, { timeout: 5_000 })
  })
  await test.step("용역회사 선택 > 첫 번째 항목 선택", async () => {
    const trigger = page.getByRole("button", { name: "용역회사 선택" })
    await trigger.waitFor({ timeout: 10_000 })
    await trigger.click()
    await page.locator("[data-value]").first().waitFor({ timeout: 10_000 })
    await page.locator("[data-value]").first().click()
  })
  await test.step("용역회사 > 저장 → 클릭", async () => {
    await page.getByRole("button", { name: "저장" }).click()
    await page.getByText("으로 변경되었습니다.").waitFor({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/profile$/, { timeout: 5_000 })
  })
}

type AccountOptions =
  | { type: "본인 계좌"; bank: string; accountNumber: string }
  | { type: "가족 계좌"; holderName: string; relation: string; bank: string; accountNumber: string }

async function doAccountSetup(page: Page, options: AccountOptions) {
  // Intercept GET /system/common/dict/bank_name before navigating so we capture
  // the API response (code + name) the moment the account page loads it.
  let bankItems: BankItem[] = []
  let resolveBankDict!: () => void
  const bankDictReady = new Promise<void>((r) => { resolveBankDict = r })

  await page.route("**/system/common/dict/bank_name", async (route) => {
    const response = await route.fetch()
    try {
      const json = (await response.json()) as Record<string, unknown>
      const raw = json.data ?? json.result ?? json
      if (Array.isArray(raw)) {
        bankItems = (raw as Record<string, unknown>[])
          .map((e) => ({ code: String(e.value ?? e.code ?? ""), name: String(e.label ?? e.name ?? "") }))
          .filter((i) => i.code)
      }
    } catch {}
    await route.fulfill({ response })
    resolveBankDict()
  })

  await test.step("홈 > 계좌 정보 미완료 배너 → 클릭 (없으면 직접 이동)", async () => {
    await page.waitForLoadState("networkidle")
    const banner = page.getByText("계좌 정보 입력이 완료되지 않았어요")
    const hasBanner = await banner.isVisible().catch(() => false)
    if (hasBanner) {
      await banner.click()
    } else {
      // Workers who completed onboarding already have onboardingCompleted=true
      // so the banner is absent — navigate directly.
      await page.goto("/profile")
    }
    await expect(page).toHaveURL(/\/profile$/)
  })
  await test.step("내 정보 > 계좌정보 → 클릭", async () => {
    await page.getByText("계좌정보").click()
    await expect(page).toHaveURL(/\/profile\/payroll-account/)
  })
  await test.step(`급여 계좌 > "${options.type}" → 선택`, async () => {
    await page.getByText(options.type).click()
  })

  // Wait for bank dict API + profile refetch to settle before filling form
  await bankDictReady
  await page.unroute("**/system/common/dict/bank_name")
  await page.waitForLoadState("networkidle")

  const bankCode = bankItems.find((b) => b.name.trim() === options.bank.trim())?.code
  if (!bankCode) {
    throw new Error(
      `Bank "${options.bank}" not found. Available: ${bankItems.map((b) => `${b.code}:${b.name}`).join(" | ")}`,
    )
  }

  if (options.type === "본인 계좌") {
    await test.step(`본인 계좌 > 은행 → "${options.bank}" (${bankCode}) 선택`, async () => {
      await expect(page).toHaveURL(/\/profile\/my-account/)
      await selectDropdown(page, page.getByRole("button", { name: "은행 선택" }), { value: bankCode })
    })
    await test.step(`본인 계좌 > 계좌번호 → "${options.accountNumber}" 입력`, async () => {
      await page.getByPlaceholder("- 없이 숫자만 입력").fill(options.accountNumber)
    })
  } else {
    await test.step(`가족 계좌 > 예금주 → "${options.holderName}" 입력`, async () => {
      await expect(page).toHaveURL(/\/profile\/family-account/)
      await page.getByPlaceholder("예금주 이름").fill(options.holderName)
    })
    await test.step(`가족 계좌 > 관계 → "${options.relation}" 선택`, async () => {
      await selectDropdown(page, page.getByRole("button", { name: "관계 선택" }), { label: options.relation })
    })
    await test.step(`가족 계좌 > 은행 → "${options.bank}" (${bankCode}) 선택`, async () => {
      await selectDropdown(page, page.getByRole("button", { name: "은행 선택" }), { value: bankCode })
    })
    await test.step(`가족 계좌 > 계좌번호 → "${options.accountNumber}" 입력`, async () => {
      await page.getByPlaceholder("- 없이 숫자만 입력").fill(options.accountNumber)
    })
  }

  await test.step("계좌 정보 > 저장 → 클릭 → 저장되었습니다.", async () => {
    await page.getByRole("button", { name: "저장" }).click()
    await page.getByText("저장되었습니다.").waitFor({ timeout: 10_000 })
    await expect(page).toHaveURL(/\/profile$/)
    await page.goto("/home")
  })
}

async function doDocumentUpload(page: Page, imageDir: string) {
  // Wait for home data (useDocumentSummary) to finish loading before checking the banner
  await page.waitForLoadState("networkidle")
  const banner = page.getByText("제출하지 않은 서류가 있어요")
  const hasBanner = await banner.isVisible().catch(() => false)
  if (!hasBanner) {
    console.log("ℹ  No pending documents banner — skipping document upload")
    return
  }

  await test.step("홈 > 서류 미제출 배너 → 클릭", async () => {
    await banner.click()
    await expect(page).toHaveURL(/\/profile\/documents/)
    // Wait for document cards to render (useDocumentSummary is async).
    // waitForLoadState("networkidle") is not enough — React may not have painted yet.
    await page.getByRole("button", { name: "파일 선택" }).first().waitFor({ timeout: 15_000 })
  })

  let uploadIndex = 0
  // skippedCount tracks eformsign docs: their "파일 선택" buttons never disappear,
  // so we use nth(skippedCount) to advance past them each iteration.
  let skippedCount = 0

  while (true) {
    const btn = page.getByRole("button", { name: "파일 선택" }).nth(skippedCount)
    if (!(await btn.isVisible())) break
    const imgPath = await imageForDocButton(btn, imageDir, uploadIndex)
    const imgName = path.basename(imgPath)
    let uploaded = false
    await test.step(`제출 서류 > 파일 선택 → "${imgName}" 업로드`, async () => {
      // Start listening BEFORE click so we don't miss the event.
      const fcPromise = page.waitForEvent("filechooser", { timeout: 2500 })
      await btn.click()
      let fc
      try {
        fc = await fcPromise
      } catch {
        // No filechooser within 2.5s — eformsign doc, button stays visible.
        console.log(`  ↳ No file chooser (eformsign?) — skipping`)
        return
      }
      await fc.setFiles(imgPath)
      await page.getByText("제출되었습니다.").waitFor({ timeout: 15_000 })
      // Wait for toast to fully dismiss (3s auto-dismiss) before next click
      await page.getByText("제출되었습니다.").waitFor({ state: "hidden", timeout: 8_000 })
      uploaded = true
    })
    if (uploaded) {
      uploadIndex++
    } else {
      // Button stays in DOM — advance index to skip past it next iteration
      skippedCount++
    }
  }
  console.log(`✓  Uploaded ${uploadIndex} document(s)`)
}

async function doDocumentReupload(page: Page, imageDir: string) {
  let reuploadIndex = 0
  while (true) {
    await page.goto("/profile/documents")
    await page.waitForLoadState("networkidle")
    // If docs list is empty (all submitted & accepted) or no buttons, exit
    const hasButtons = await page.getByRole("button", { name: /보기|파일 선택/ }).first().isVisible().catch(() => false)
    if (!hasButtons) break

    const btn = page.getByRole("button", { name: /보기/ }).nth(reuploadIndex)
    if (!(await btn.isVisible())) break

    await test.step(`제출 서류 목록 > 서류 ${reuploadIndex + 1} 보기 → 클릭`, async () => {
      await btn.click()
    })

    // alien-reg has its own page (not the standard viewer) — skip
    if (page.url().includes("/alien-reg")) {
      reuploadIndex++
      continue
    }

    await expect(page).toHaveURL(/\/profile\/documents\/view\//)

    // "재등록" is hidden when the doc is approved — skip gracefully
    const hasReupload = await page.getByRole("button", { name: "재등록" }).isVisible().catch(() => false)
    if (!hasReupload) {
      console.log(`  ↳ 서류 ${reuploadIndex + 1}: 재등록 버튼 없음 (승인됨?) — 건너뜀`)
      reuploadIndex++
      continue
    }

    await test.step(`서류 뷰어 > 재등록 → 클릭`, async () => {
      await page.getByRole("button", { name: "재등록" }).click()
    })

    // Pick image based on URL slug (e.g. /view/passport, /view/bankbook)
    const slug = page.url().split("/").pop()?.split("?")[0] ?? ""
    const imgPath = imageForSlug(slug, imageDir, reuploadIndex)
    const imgName = path.basename(imgPath)
    await test.step(`서류 뷰어 > 파일 선택 → "${imgName}" 재업로드`, async () => {
      const fcPromise = page.waitForEvent("filechooser", { timeout: 5_000 })
      await page.getByRole("button", { name: "파일 선택" }).click()
      const fc = await fcPromise
      await fc.setFiles(imgPath)
      await page.getByText("업데이트되었습니다.").waitFor({ timeout: 15_000 })
      await page.getByText("업데이트되었습니다.").waitFor({ state: "hidden", timeout: 8_000 })
    })

    reuploadIndex++
  }
  console.log(`✓  Re-uploaded ${reuploadIndex} document(s)`)
  await page.goto("/home")
}

async function doAlienRegUpload(
  page: Page,
  opts: {
    nationality: string
    residenceStatus: string
    periodStart: string
    periodEnd: string
    imageDir: string
  },
) {
  await page.goto("/profile/documents")
  await page.waitForLoadState("networkidle")

  // Alien-reg item shows "제출 >" button when not yet submitted.
  // Regular docs use "파일 선택" — only alien-reg uses "제출" on this page.
  const submitBtn = page.getByRole("button", { name: "제출" })
  const hasSubmitBtn = await submitBtn.isVisible().catch(() => false)
  if (!hasSubmitBtn) {
    console.log("ℹ  No alien-reg 제출 button — skipping alien-reg upload")
    return
  }

  await test.step("제출서류 > 외국인등록증 제출 → 클릭", async () => {
    await submitBtn.click()
    await expect(page).toHaveURL(/\/profile\/documents\/alien-reg/)
    await page.getByRole("button", { name: "파일 선택" }).first().waitFor({ timeout: 10_000 })
  })

  const alienRegFront = path.join(opts.imageDir, "외국인등록증.jpg")
  const alienRegBack  = path.join(opts.imageDir, "외국인등록증뒷면.jpg")

  await test.step("외국인등록증 > 앞면 → 파일 선택", async () => {
    const [fc] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: "파일 선택" }).first().click(),
    ])
    await fc.setFiles(alienRegFront)
  })

  await test.step("외국인등록증 > 뒷면 → 파일 선택", async () => {
    const [fc] = await Promise.all([
      page.waitForEvent("filechooser"),
      page.getByRole("button", { name: "파일 선택" }).nth(1).click(),
    ])
    await fc.setFiles(alienRegBack)
  })

  await test.step(`외국인등록증 > 국적 → "${opts.nationality}" 선택`, async () => {
    await selectDropdown(page, page.getByRole("button", { name: "국적 선택" }), { value: opts.nationality })
  })

  await test.step(`외국인등록증 > 체류자격 → "${opts.residenceStatus}" 선택`, async () => {
    await selectDropdown(page, page.getByRole("button", { name: "체류자격 선택" }), { value: opts.residenceStatus })
  })

  await test.step(`외국인등록증 > 체류기간 시작일 → "${opts.periodStart}" 입력`, async () => {
    await page.getByPlaceholder("YYYY-MM-DD").first().fill(opts.periodStart)
  })

  await test.step(`외국인등록증 > 체류기간 종료일 → "${opts.periodEnd}" 입력`, async () => {
    await page.getByPlaceholder("YYYY-MM-DD").nth(1).fill(opts.periodEnd)
  })

  await test.step("외국인등록증 > 제출 → 클릭", async () => {
    await page.getByRole("button", { name: "제출" }).click()
    await page.getByText("외국인등록증이 제출되었습니다.").waitFor({ timeout: 15_000 })
  })

  console.log("✓  Alien registration doc submitted")
  await page.goto("/home")
}

// ---------------------------------------------------------------------------
// Scenario A — 타인 명의 → 내국인 (RRN)
// ---------------------------------------------------------------------------
async function doRrnSignupAndLogin(page: Page) {
  const NAME   = process.env.RRN_NAME_KO ?? ""
  const FIRST  = process.env.RRN_FIRST   ?? ""
  const SECOND = process.env.RRN_SECOND  ?? ""

  await doSmsVerification(page, REAL_PHONE)

  await test.step("약관 동의 > 동의하기 → 클릭", async () => {
    await page.getByRole("button", { name: "동의하기" }).click()
    await expect(page).toHaveURL(/\/signup\/domestic-foreign/)
  })
  await test.step("내/외국인 선택 > 내국인 → 클릭", async () => {
    await page.getByRole("button", { name: "내국인" }).click()
    await expect(page).toHaveURL(/\/signup\/signup-rrn/)
  })
  await test.step("RRN(주민등록번호) 입력 > 주소 → 세션스토리지 사전 입력", async () => {
    await page.evaluate(() => {
      const cur = JSON.parse(sessionStorage.getItem("signup_data") ?? "{}")
      sessionStorage.setItem("signup_data", JSON.stringify({ ...cur, address: "서울특별시 강남구 테헤란로 1" }))
    })
    await page.reload()
  })
  await test.step(`RRN(주민등록번호) 입력 > 이름 → "${NAME}" 입력`, async () => {
    await page.getByPlaceholder("이름 입력").fill(NAME)
  })
  await test.step(`RRN(주민등록번호) 입력 > 주민번호 앞자리 → "${FIRST}" 입력`, async () => {
    await page.getByPlaceholder("앞 6자리").fill(FIRST)
  })
  await test.step(`RRN(주민등록번호) 입력 > 주민번호 뒷자리 → 입력`, async () => {
    await page.getByPlaceholder("뒤 7자리").fill(SECOND)
  })
  await test.step("RRN(주민등록번호) 입력 > 다음 → 클릭 → 비밀번호 설정", async () => {
    await expect(page.getByRole("button", { name: "다음" })).toBeEnabled()
    await page.getByRole("button", { name: "다음" }).click()
    await expect(page).toHaveURL(/\/signup\/set-password/)
  })
  await test.step("비밀번호 설정 > 비밀번호 / 확인 → 입력", async () => {
    const pw = page.locator("input[type=password]")
    await pw.first().fill(TEST_PASSWORD)
    await pw.nth(1).fill(TEST_PASSWORD)
  })
  await test.step("비밀번호 설정 > 다음 → 클릭 → 가입 완료", async () => {
    await page.getByRole("button", { name: "다음" }).click()
    await expect(page).toHaveURL(/\/signup\/complete/)
  })
  await test.step("가입 완료 > 로그인하기 → 클릭", async () => {
    await expect(page.getByText("회원 가입 완료")).toBeVisible()
    await page.getByRole("button", { name: "로그인하기" }).click()
  })
  await doLogin(page, REAL_PHONE, TEST_PASSWORD)
  await expect(page).toHaveURL(/\/onboarding/)

  return NAME
}

// ---------------------------------------------------------------------------
// Scenario A — 타인 명의 → 내국인 (RRN) / 일반
// ---------------------------------------------------------------------------
test.describe("Real Signup — Scenario A: 타인 명의 → 내국인 (RRN)", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test.beforeEach(() => cleanupTestAccount())
  test.setTimeout(300_000)

  test("complete happy path", async ({ page }) => {
    const WORKER_TYPE     = process.env.WORKER_TYPE    ?? "일반"
    const DAILY_WAGE      = process.env.DAILY_WAGE     ?? "100000"
    const ACCOUNT_BANK    = process.env.ACCOUNT_BANK   ?? "KB국민은행"
    const ACCOUNT_NO      = process.env.ACCOUNT_NUMBER ?? "12345678901"
    const FAMILY_HOLDER   = process.env.FAMILY_HOLDER  ?? ""
    const FAMILY_RELATION = process.env.FAMILY_RELATION ?? "배우자"

    const NAME = await doRrnSignupAndLogin(page)
    await doOnboarding(page, WORKER_TYPE, DAILY_WAGE)
    await doPersonalInfoCheck(page, { name: NAME })
    await doAccountSetup(page, {
      type: "가족 계좌",
      holderName: FAMILY_HOLDER,
      relation: FAMILY_RELATION,
      bank: ACCOUNT_BANK,
      accountNumber: ACCOUNT_NO,
    })
    await doDocumentUpload(page, path.join(__dirname, "image"))
    await doDocumentReupload(page, path.join(__dirname, "image"))
  })
})

// ---------------------------------------------------------------------------
// Scenario A-용역 — 타인 명의 → 내국인 (RRN) / 용역
// ---------------------------------------------------------------------------
test.describe("Real Signup — Scenario A-용역: 타인 명의 → 내국인 (RRN) / 용역", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test.beforeEach(() => cleanupTestAccount())
  test.setTimeout(300_000)

  test("complete happy path", async ({ page }) => {
    const DAILY_WAGE      = process.env.DAILY_WAGE     ?? "100000"
    const ACCOUNT_BANK    = process.env.ACCOUNT_BANK   ?? "KB국민은행"
    const ACCOUNT_NO      = process.env.ACCOUNT_NUMBER ?? "12345678901"
    const FAMILY_HOLDER   = process.env.FAMILY_HOLDER  ?? ""
    const FAMILY_RELATION = process.env.FAMILY_RELATION ?? "배우자"

    const NAME = await doRrnSignupAndLogin(page)
    await doOnboarding(page, "용역", DAILY_WAGE)
    await doPersonalInfoCheck(page, { name: NAME })
    await doOutsourcingSetup(page)
    await doAccountSetup(page, {
      type: "가족 계좌",
      holderName: FAMILY_HOLDER,
      relation: FAMILY_RELATION,
      bank: ACCOUNT_BANK,
      accountNumber: ACCOUNT_NO,
    })
    await doDocumentUpload(page, path.join(__dirname, "image"))
    await doDocumentReupload(page, path.join(__dirname, "image"))
  })
})

// ---------------------------------------------------------------------------
// Scenario A-장비기사 — 타인 명의 → 내국인 (RRN) / 장비기사
// ---------------------------------------------------------------------------
test.describe("Real Signup — Scenario A-장비기사: 타인 명의 → 내국인 (RRN) / 장비기사", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test.beforeEach(() => cleanupTestAccount())
  test.setTimeout(300_000)

  test("complete happy path", async ({ page }) => {
    const DAILY_WAGE      = process.env.DAILY_WAGE     ?? "100000"
    const ACCOUNT_BANK    = process.env.ACCOUNT_BANK   ?? "KB국민은행"
    const ACCOUNT_NO      = process.env.ACCOUNT_NUMBER ?? "12345678901"
    const FAMILY_HOLDER   = process.env.FAMILY_HOLDER  ?? ""
    const FAMILY_RELATION = process.env.FAMILY_RELATION ?? "배우자"

    const NAME = await doRrnSignupAndLogin(page)
    await doOnboarding(page, "장비기사", DAILY_WAGE)
    await doPersonalInfoCheck(page, { name: NAME })
    await doAccountSetup(page, {
      type: "가족 계좌",
      holderName: FAMILY_HOLDER,
      relation: FAMILY_RELATION,
      bank: ACCOUNT_BANK,
      accountNumber: ACCOUNT_NO,
    })
    await doDocumentUpload(page, path.join(__dirname, "image"))
    await doDocumentReupload(page, path.join(__dirname, "image"))
  })
})

// ---------------------------------------------------------------------------
// Scenario B — 타인 명의 → 외국인 → FRN (외국인등록번호)
// ---------------------------------------------------------------------------
test.describe("Real Signup — Scenario B: 타인 명의 → 외국인 → FRN", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test.beforeEach(() => cleanupTestAccount())
  test.setTimeout(300_000)

  test("complete happy path", async ({ page }) => {
    const NAME_KO              = process.env.FRN_NAME_KO             ?? ""
    const NAME_EN              = process.env.FRN_NAME_EN             ?? ""
    const FIRST                = process.env.FRN_FIRST               ?? ""
    const SECOND               = process.env.FRN_SECOND              ?? ""
    const WORKER_TYPE          = process.env.WORKER_TYPE             ?? "일반"
    const DAILY_WAGE           = process.env.DAILY_WAGE              ?? "100000"
    const ACCOUNT_BANK         = process.env.ACCOUNT_BANK            ?? "KB국민은행"
    const ACCOUNT_NO           = process.env.ACCOUNT_NUMBER          ?? "12345678901"
    const ALIEN_NATIONALITY    = process.env.ALIEN_NATIONALITY       ?? "VN"
    const ALIEN_STATUS         = process.env.ALIEN_RESIDENCE_STATUS  ?? "E-9"
    const ALIEN_PERIOD_START   = process.env.ALIEN_PERIOD_START      ?? "2023-01-01"
    const ALIEN_PERIOD_END     = process.env.ALIEN_PERIOD_END        ?? "2028-01-01"

    // 1. SMS verification
    await doSmsVerification(page, REAL_PHONE)

    // 2. Agreement
    await test.step("약관 동의 > 동의하기 → 클릭", async () => {
      await page.getByRole("button", { name: "동의하기" }).click()
      await expect(page).toHaveURL(/\/signup\/domestic-foreign/)
    })

    // 3. Nationality
    await test.step("내/외국인 선택 > 외국인 → 클릭", async () => {
      await page.getByRole("button", { name: "외국인" }).click()
      await expect(page).toHaveURL(/\/signup\/signup-frn/)
    })

    // 4. Pre-seed address
    await test.step("FRN(외국인등록번호) 입력 > 주소 → 세션스토리지 사전 입력", async () => {
      await page.evaluate(() => {
        const cur = JSON.parse(sessionStorage.getItem("signup_data") ?? "{}")
        sessionStorage.setItem("signup_data", JSON.stringify({ ...cur, address: "서울특별시 강남구 테헤란로 1" }))
      })
      await page.reload()
    })

    // 5. Fill FRN form
    await test.step(`FRN(외국인등록번호) 입력 > 한글 이름 → "${NAME_KO}" 입력`, async () => {
      await page.getByPlaceholder("한글 이름").fill(NAME_KO)
    })
    await test.step(`FRN(외국인등록번호) 입력 > 영문 이름 → "${NAME_EN}" 입력`, async () => {
      await page.getByPlaceholder("영문 이름").fill(NAME_EN)
    })
    await test.step(`FRN(외국인등록번호) 입력 > 외국인등록번호 앞자리 → "${FIRST}" 입력`, async () => {
      await page.getByPlaceholder("앞 6자리").fill(FIRST)
    })
    await test.step(`FRN(외국인등록번호) 입력 > 외국인등록번호 뒷자리 → 입력`, async () => {
      await page.getByPlaceholder("뒤 7자리").fill(SECOND)
    })
    await test.step("FRN(외국인등록번호) 입력 > 다음 → 클릭 → 비밀번호 설정", async () => {
      await expect(page.getByRole("button", { name: "다음" })).toBeEnabled()
      await page.getByRole("button", { name: "다음" }).click()
      await expect(page).toHaveURL(/\/signup\/set-password/)
    })

    // 6. Set password
    await test.step("비밀번호 설정 > 비밀번호 / 확인 → 입력", async () => {
      const pw = page.locator("input[type=password]")
      await pw.first().fill(TEST_PASSWORD)
      await pw.nth(1).fill(TEST_PASSWORD)
    })
    await test.step("비밀번호 설정 > 다음 → 클릭 → 가입 완료", async () => {
      await page.getByRole("button", { name: "다음" }).click()
      await expect(page).toHaveURL(/\/signup\/complete/)
    })

    // 7. Complete
    await test.step("가입 완료 > 로그인하기 → 클릭", async () => {
      await expect(page.getByText("회원 가입 완료")).toBeVisible()
      await page.getByRole("button", { name: "로그인하기" }).click()
    })

    // 8. Login
    await doLogin(page, REAL_PHONE, TEST_PASSWORD)
    await expect(page).toHaveURL(/\/onboarding/)

    // 9. Onboarding
    await doOnboarding(page, WORKER_TYPE, DAILY_WAGE)

    // 10. Personal info check
    await doPersonalInfoCheck(page, { name: NAME_KO })

    // 11. Payroll account (own)
    await doAccountSetup(page, { type: "본인 계좌", bank: ACCOUNT_BANK, accountNumber: ACCOUNT_NO })

    // 12. Documents
    await doDocumentUpload(page, path.join(__dirname, "image"))

    // 12.5. Alien registration card (외국인등록증) — FRN-specific
    await doAlienRegUpload(page, {
      nationality: ALIEN_NATIONALITY,
      residenceStatus: ALIEN_STATUS,
      periodStart: ALIEN_PERIOD_START,
      periodEnd: ALIEN_PERIOD_END,
      imageDir: path.join(__dirname, "image"),
    })

    // 13. Re-upload (재등록)
    await doDocumentReupload(page, path.join(__dirname, "image"))
  })
})

// ---------------------------------------------------------------------------
// Scenario C — 타인 명의 → 외국인 → PN (여권번호)
// ---------------------------------------------------------------------------
test.describe("Real Signup — Scenario C: 타인 명의 → 외국인 → PN (여권번호)", () => {
  test.use({ storageState: { cookies: [], origins: [] } })
  test.beforeEach(() => cleanupTestAccount())
  test.setTimeout(300_000)

  test("complete happy path", async ({ page }) => {
    const NAME_KO      = process.env.PN_NAME_KO     ?? ""
    const NAME_EN      = process.env.PN_NAME_EN     ?? ""
    const GENDER       = process.env.PN_GENDER      ?? ""
    const PASSPORT     = process.env.PN_PASSPORT    ?? ""
    const NATIONALITY  = process.env.PN_NATIONALITY ?? ""
    const BIRTHDATE    = process.env.PN_BIRTHDATE   ?? ""
    const ADDRESS      = process.env.PN_ADDRESS     ?? "서울특별시 강남구 테헤란로 1"
    const ACCOUNT_BANK = process.env.ACCOUNT_BANK   ?? "KB국민은행"
    const ACCOUNT_NO   = process.env.ACCOUNT_NUMBER ?? "12345678901"

    // 1. SMS verification
    await doSmsVerification(page, REAL_PHONE)

    // 2. Agreement
    await test.step("약관 동의 > 동의하기 → 클릭", async () => {
      await page.getByRole("button", { name: "동의하기" }).click()
      await expect(page).toHaveURL(/\/signup\/domestic-foreign/)
    })

    // 3. Nationality → 외국인
    await test.step("내/외국인 선택 > 외국인 → 클릭", async () => {
      await page.getByRole("button", { name: "외국인" }).click()
      await expect(page).toHaveURL(/\/signup\/signup-frn/)
    })

    // 4. Pre-seed address, then switch to PN
    await test.step("FRN 페이지 > 주소 → 세션스토리지 사전 입력", async () => {
      await page.evaluate((addr) => {
        const cur = JSON.parse(sessionStorage.getItem("signup_data") ?? "{}")
        sessionStorage.setItem("signup_data", JSON.stringify({ ...cur, address: addr }))
      }, ADDRESS)
    })
    await test.step("FRN 페이지 > 여권번호로 가입하기 → 클릭", async () => {
      await page.getByRole("button", { name: "여권번호로 가입하기" }).click()
      await expect(page).toHaveURL(/\/signup\/signup-pn/)
    })

    // 6. Fill PN form
    await test.step(`PN(여권번호) 입력 > 한글 이름 → "${NAME_KO}" 입력`, async () => {
      await page.getByPlaceholder("한글 이름").fill(NAME_KO)
    })
    await test.step(`PN(여권번호) 입력 > 영문 이름 → "${NAME_EN}" 입력`, async () => {
      await page.getByPlaceholder("영문 이름").fill(NAME_EN)
    })
    await test.step(`PN(여권번호) 입력 > 성별 → "${GENDER}" 선택`, async () => {
      await page.locator('input[type="radio"]').first().waitFor()
      await page.locator('label').filter({ hasText: GENDER }).click()
    })
    await test.step(`PN(여권번호) 입력 > 여권번호 → "${PASSPORT}" 입력`, async () => {
      await page.locator('input[maxlength="12"]').scrollIntoViewIfNeeded()
      await page.locator('input[maxlength="12"]').fill(PASSPORT)
    })
    await test.step(`PN(여권번호) 입력 > 국적 → "${NATIONALITY}" 선택`, async () => {
      await selectDropdown(page, page.getByRole("button", { name: "국적 선택" }), { label: NATIONALITY })
    })
    await test.step(`PN(여권번호) 입력 > 생년월일 → "${BIRTHDATE}" 입력`, async () => {
      await page.getByPlaceholder("yyyy-mm-dd").fill(BIRTHDATE)
    })
    await test.step("PN(여권번호) 입력 > 다음 → 클릭 → 비밀번호 설정", async () => {
      await expect(page.getByRole("button", { name: "다음" })).toBeEnabled()
      await page.getByRole("button", { name: "다음" }).click()
      await expect(page).toHaveURL(/\/signup\/set-password/)
    })

    // 7. Set password
    await test.step("비밀번호 설정 > 비밀번호 / 확인 → 입력", async () => {
      const pw = page.locator("input[type=password]")
      await pw.first().fill(TEST_PASSWORD)
      await pw.nth(1).fill(TEST_PASSWORD)
    })
    await test.step("비밀번호 설정 > 다음 → 클릭 → 가입 완료", async () => {
      await page.getByRole("button", { name: "다음" }).click()
      await expect(page).toHaveURL(/\/signup\/complete/)
    })

    // 8. Complete
    await test.step("가입 완료 > 로그인하기 → 클릭", async () => {
      await expect(page.getByText("회원 가입 완료")).toBeVisible()
      await page.getByRole("button", { name: "로그인하기" }).click()
    })

    // 9. Login (passport users skip onboarding → /home)
    await doLogin(page, REAL_PHONE, TEST_PASSWORD)
    await expect(page).toHaveURL(/\/home/)

    // 10. Personal info check
    await doPersonalInfoCheck(page, { name: NAME_KO })

    // 11. Payroll account (own)
    await doAccountSetup(page, { type: "본인 계좌", bank: ACCOUNT_BANK, accountNumber: ACCOUNT_NO })

    // 12. Documents
    await doDocumentUpload(page, path.join(__dirname, "image"))

    // 13. Re-upload (재등록)
    await doDocumentReupload(page, path.join(__dirname, "image"))
  })
})
