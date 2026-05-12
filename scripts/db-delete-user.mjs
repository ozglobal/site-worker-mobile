/**
 * Hard-delete a test worker account by phone number.
 * Removes the worker row, all child records, and the sys_user row.
 *
 * Usage:
 *   node scripts/db-delete-user.mjs 010-6369-6595
 *   node scripts/db-delete-user.mjs 01063696595 --force   (skip confirmation)
 *
 * DB credentials are read from tests/.env.local
 */

import { createInterface } from "readline"
import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"
import pg from "../node_modules/pg/lib/index.js"

const { Client } = pg

// ── Config ──────────────────────────────────────────────────────────────────

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ENV_FILE = path.join(__dirname, "../tests/.env.local")

function loadEnv(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
  )
}

const env = { ...process.env, ...loadEnv(ENV_FILE) }

const DB = {
  host:     env.DB_HOST     || "43.201.238.126",
  port:     parseInt(env.DB_PORT || "5432"),
  database: env.DB_NAME     || "appdb",
  user:     env.DB_USER     || "app",
  password: env.DB_PASSWORD || "",
}

// ── Args ─────────────────────────────────────────────────────────────────────

const rawPhone = process.argv[2]
const force    = process.argv.includes("--force")

if (!rawPhone) {
  console.error("Usage: node scripts/db-delete-user.mjs <phone> [--force]")
  console.error("  e.g. node scripts/db-delete-user.mjs 010-6369-6595")
  process.exit(1)
}

// Normalize: keep digits only → 01063696595, also store formatted → 010-6369-6595
const digits    = rawPhone.replace(/\D/g, "")
const formatted = digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3")

// ── Helpers ──────────────────────────────────────────────────────────────────

function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    rl.question(question, (ans) => { rl.close(); resolve(ans.trim()) })
  })
}

// ── Main ─────────────────────────────────────────────────────────────────────

const client = new Client(DB)

try {
  await client.connect()
  console.log(`\n연결됨: ${DB.host}/${DB.database}\n`)

  // 1. Find worker
  const { rows: workers } = await client.query(
    `SELECT w.id, w.name_ko, w.mobile_phone, w.id_type, w.is_active,
            w.onboarding_completed, w.create_time, u.id AS user_id, u.username, u.status
     FROM workers w
     LEFT JOIN sys_user u ON u.id = w.user_id
     WHERE REPLACE(w.mobile_phone, '-', '') = $1
       AND w.deleted = 0`,
    [digits]
  )

  if (workers.length === 0) {
    // Try sys_user directly (in case worker row is already gone)
    const { rows: users } = await client.query(
      `SELECT id, username, phone, status, create_time
       FROM sys_user
       WHERE REPLACE(phone, '-', '') = $1 AND deleted = 0`,
      [digits]
    )
    if (users.length === 0) {
      console.log(`❌ 번호 ${formatted} 로 등록된 사용자가 없습니다.\n`)
      process.exit(0)
    }
    console.log(`workers 행 없음, sys_user 만 발견:`)
    users.forEach((u) => console.log(`  sys_user id=${u.id}  username=${u.username}  phone=${u.phone}  status=${u.status}`))

    if (!force) {
      const ans = await ask("\nsys_user 행만 삭제하시겠습니까? (yes/no): ")
      if (ans !== "yes") { console.log("취소됨."); process.exit(0) }
    }
    for (const u of users) {
      await client.query("DELETE FROM sys_user WHERE id = $1", [u.id])
      console.log(`✅ sys_user ${u.id} 삭제 완료`)
    }
    process.exit(0)
  }

  // 2. Show summary
  console.log(`삭제 대상 (${workers.length}건):`)
  console.log("─".repeat(60))
  for (const w of workers) {
    console.log(`  workers.id     : ${w.id}`)
    console.log(`  이름           : ${w.name_ko}`)
    console.log(`  휴대폰         : ${w.mobile_phone}`)
    console.log(`  신분증 유형    : ${w.id_type}`)
    console.log(`  활성 여부      : ${w.is_active}`)
    console.log(`  온보딩 완료    : ${w.onboarding_completed}`)
    console.log(`  가입일         : ${w.create_time?.toISOString().slice(0, 10)}`)
    console.log(`  sys_user.id    : ${w.user_id}  (${w.username})`)
    console.log()
  }

  // 3. Show child record counts
  const childTables = [
    ["worker_attendance",                  "worker_id"],
    ["worker_equipment",                   "worker_id"],
    ["worker_site_profiles",               "worker_id"],
    ["worker_site_doc_compliance",         "worker_id"],
    ["worker_site_doc_compliance_snapshot","worker_id"],
    ["worker_bank_change_request",         "worker_id"],
    ["site_team_members",                  "worker_id"],
    ["monthly_closing_worker_snapshot",    "worker_id"],
  ]

  for (const w of workers) {
    console.log(`연관 데이터 (worker ${w.id}):`)
    for (const [table, col] of childTables) {
      const { rows } = await client.query(
        `SELECT COUNT(*) AS n FROM ${table} WHERE ${col} = $1`, [w.id]
      )
      const n = parseInt(rows[0].n)
      if (n > 0) console.log(`  ${table}: ${n}건`)
    }
  }

  // Also check efs_member and related docs
  for (const w of workers) {
    const { rows } = await client.query(
      `SELECT COUNT(*) AS n FROM efs_member WHERE REPLACE(phone,'-','') = $1`, [digits]
    )
    const n = parseInt(rows[0].n)
    if (n > 0) console.log(`  efs_member (phone): ${n}건`)
  }

  // 4. Confirm
  if (!force) {
    console.log()
    const ans = await ask("위 데이터를 모두 삭제하시겠습니까? (yes/no): ")
    if (ans !== "yes") { console.log("취소됨."); process.exit(0) }
  }

  // 5. Delete in FK order
  console.log("\n삭제 중...")

  for (const w of workers) {
    for (const [table, col] of childTables) {
      const r = await client.query(`DELETE FROM ${table} WHERE ${col} = $1`, [w.id])
      if (r.rowCount > 0) console.log(`  ✓ ${table}: ${r.rowCount}건`)
    }

    // efs_member by phone
    const efsr = await client.query(
      `DELETE FROM efs_member WHERE REPLACE(phone,'-','') = $1`, [digits]
    )
    if (efsr.rowCount > 0) console.log(`  ✓ efs_member: ${efsr.rowCount}건`)

    // sys_sms_log / sys_nice_log (optional — non-critical logs)
    const smsr = await client.query(
      `DELETE FROM sys_sms_log WHERE REPLACE(phone,'-','') = $1`, [digits]
    )
    if (smsr.rowCount > 0) console.log(`  ✓ sys_sms_log: ${smsr.rowCount}건`)

    // workers row
    await client.query("DELETE FROM workers WHERE id = $1", [w.id])
    console.log(`  ✓ workers ${w.id}`)

    // sys_user row
    if (w.user_id) {
      await client.query("DELETE FROM sys_user WHERE id = $1", [w.user_id])
      console.log(`  ✓ sys_user ${w.user_id} (${w.username})`)
    }
  }

  console.log(`\n✅ ${formatted} 계정 삭제 완료\n`)
} catch (err) {
  console.error("\n❌ 오류:", err.message)
  process.exit(1)
} finally {
  await client.end()
}
