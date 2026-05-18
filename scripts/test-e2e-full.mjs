/**
 * Full E2E run in ordered stages:
 *   1. 내국인 (RRN)  — delete account → SMS signup Scenario A → full suite
 *   2. 외국인 (FRN)  — delete account → SMS signup Scenario B → full suite
 *   3. 연수생 (PN)   — delete account → SMS signup Scenario C → full suite
 *   4. Lockout test  — 5-minute wait, must run after stage 1-3
 *   5. Phone-change  — changes TEST_PHONE → TEST_NEW_PHONE, must run last
 *   6. Contracts     — requires site-manager to send contracts first
 *   7. Notices       — requires site-manager to send notices first
 *
 * Usage:
 *   node scripts/test-e2e-full.mjs              (run all stages)
 *   node scripts/test-e2e-full.mjs stage=1      (내국인 only)
 *   node scripts/test-e2e-full.mjs stage=4      (lockout only)
 */

import { spawnSync } from "child_process"
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs"

const ENV_FILE = "tests/.env.local"

function loadEnvFile(path) {
  if (!existsSync(path)) return {}
  return Object.fromEntries(
    readFileSync(path, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=")
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
      })
  )
}

const envVars = { ...process.env, ...loadEnvFile(ENV_FILE) }

const stageArg = process.argv.slice(2).find((a) => a.startsWith("stage="))
const targetStage = stageArg ? parseInt(stageArg.split("=")[1], 10) : null
const extra = process.argv.slice(2).filter((a) => !a.startsWith("stage=") && a !== "--headed")

function safeArgs(args) {
  return args.map((a) => (/[|&<>\s]/.test(a) ? `"${a}"` : a))
}

function printHeader(label) {
  console.log(`\n${"─".repeat(60)}`)
  console.log(`▶  ${label}`)
  console.log(`${"─".repeat(60)}\n`)
}

function run(label, args) {
  printHeader(label)
  const allArgs = ["playwright", "test", ...safeArgs(args), "--headed", ...extra]
  // Single string command avoids DEP0190 (shell:true + separate args array)
  const result = spawnSync(`npx ${allArgs.join(" ")}`, { stdio: "inherit", shell: true, env: envVars })
  return result.status ?? 1
}

function runNode(label, args) {
  printHeader(label)
  const result = spawnSync("node", args, { stdio: "inherit", shell: false, env: envVars })
  return result.status ?? 1
}

const results = {}

function runStage(n, label, args) {
  if (targetStage !== null && targetStage !== n) return
  results[n] = run(label, args)
}

// Stages 1-3: delete → clear auth → SMS signup (headed) → full suite
function runSignupStage(n, scenarioLabel, signupGrep) {
  if (targetStage !== null && targetStage !== n) return

  const phone = envVars.TEST_PHONE ?? "010-6369-6595"

  runNode(
    `Stage ${n}a — 기존 계정 삭제 (${phone})`,
    ["scripts/db-delete-user.mjs", phone, "--force"]
  )

  mkdirSync("tests/e2e/.auth", { recursive: true })
  writeFileSync("tests/e2e/.auth/worker.json", JSON.stringify({ cookies: [], origins: [] }))
  console.log("✓ Auth state cleared\n")

  results[n] = run(
    `Stage ${n}b — 회원가입 (${scenarioLabel}, --headed)`,
    ["tests/e2e/signup-real.spec.ts", "--headed", "--no-deps", "--grep", signupGrep]
  )
}

runSignupStage(1, "내국인 (RRN)", "Scenario A:")
runSignupStage(2, "외국인 (FRN)", "Scenario B")
runSignupStage(3, "연수생 (PN)",  "Scenario C")

// Stage 4: full suite (attendance etc.)
runStage(
  4,
  "Stage 4 — 출퇴근",
  [
    "--grep-invert", "5회 실패 → 잠금 → 5분 대기|Scenario 3B|\\[headed\\]|Contracts page|Notices|Real Signup",
  ]
)

// Stage 5: lockout
runStage(
  5,
  "Stage 5 — 패스워드 잠금 (5분 대기 포함)",
  [
    "tests/e2e/login.spec.ts",
    "--no-deps",
    "--grep", "5회 실패 → 잠금 → 5분 대기",
    "--timeout", "420000",
  ]
)

// Stage 6: phone-change
runStage(
  6,
  "Stage 6 — 휴대폰 번호 변경 (TEST_NEW_PHONE 필요)",
  [
    "tests/e2e/profile.spec.ts",
    "--no-deps",
    "--grep", "Scenario 3B",
  ]
)

// Stage 7: contracts
runStage(
  7,
  "Stage 7 — 계약서 (사이트 매니저 계약서 발송 후 실행)",
  [
    "tests/e2e/contracts.spec.ts",
    "--no-deps",
  ]
)

// Stage 8: notices
runStage(
  8,
  "Stage 8 — 알림 (사이트 매니저 알림 발송 후 실행)",
  [
    "tests/e2e/notices.spec.ts",
    "--no-deps",
  ]
)

// Summary
const label = {
  1: "Stage 1 내국인 (RRN)",
  2: "Stage 2 외국인 (FRN)",
  3: "Stage 3 연수생 (PN)",
  4: "Stage 4 전체 스위트",
  5: "Stage 5 잠금 테스트",
  6: "Stage 6 번호 변경",
  7: "Stage 7 계약서",
  8: "Stage 8 알림",
}
console.log(`\n${"═".repeat(60)}`)
for (const [n, code] of Object.entries(results)) {
  console.log(`${label[n]}:  ${code === 0 ? "✅ PASS" : "❌ FAIL"}`)
}
console.log(`${"═".repeat(60)}\n`)

process.exit(Object.values(results).some((c) => c !== 0) ? 1 : 0)
