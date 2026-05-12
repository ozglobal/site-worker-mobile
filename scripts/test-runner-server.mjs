/**
 * E2E Test Runner — web UI
 * Usage: node scripts/test-runner-server.mjs
 *        npm run test:ui
 */

import { createServer } from "http"
import { spawn } from "child_process"
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs"
import { fileURLToPath } from "url"
import path from "path"

const PORT = 3737
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, "..")
const ENV_FILE = path.join(ROOT, "tests/.env.local")

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {}
  return Object.fromEntries(
    readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .filter((l) => l.trim() && !l.startsWith("#"))
      .map((l) => {
        const idx = l.indexOf("=")
        return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
      })
  )
}

const STAGES = {
  1: {
    title: "Stage 1 — 내국인 (주민등록증)",
    desc: "기존 계정 삭제 → SMS 회원가입 내국인 RRN",
    time: "약 10분 + SMS 수동 입력",
    clearAuth: true,
    steps: [
      { type: "node",       label: "기존 계정 삭제",   args: ["scripts/db-delete-user.mjs", "$TEST_PHONE", "--force"] },
      { type: "playwright", label: "회원가입 (내국인)", args: ["tests/e2e/signup-real.spec.ts", "--headed", "--no-deps", "--grep", "Scenario A:"] },
    ],
  },
  2: {
    title: "Stage 2 — 외국인 (외국인등록증)",
    desc: "기존 계정 삭제 → SMS 회원가입 외국인 FRN",
    time: "약 10분 + SMS 수동 입력",
    clearAuth: true,
    steps: [
      { type: "node",       label: "기존 계정 삭제",   args: ["scripts/db-delete-user.mjs", "$TEST_PHONE", "--force"] },
      { type: "playwright", label: "회원가입 (외국인)", args: ["tests/e2e/signup-real.spec.ts", "--headed", "--no-deps", "--grep", "Scenario B"] },
    ],
  },
  3: {
    title: "Stage 3 — 연수생 (여권)",
    desc: "기존 계정 삭제 → SMS 회원가입 연수생 PN",
    time: "약 10분 + SMS 수동 입력",
    clearAuth: true,
    steps: [
      { type: "node",       label: "기존 계정 삭제",   args: ["scripts/db-delete-user.mjs", "$TEST_PHONE", "--force"] },
      { type: "playwright", label: "회원가입 (연수생)", args: ["tests/e2e/signup-real.spec.ts", "--headed", "--no-deps", "--grep", "Scenario C"] },
    ],
  },
  4: {
    title: "Stage 4 — 출퇴근",
    desc: "로그인·출퇴근·캘린더·출퇴근상세·수정요청",
    time: "약 3~5분",
    args: [
      "--grep-invert", "5회 실패 → 잠금 → 5분 대기|Scenario 3B|\\[headed\\]|Contracts page|Notices|Real Signup",
    ],
  },
  5: {
    title: "Stage 5 — 계약서",
    desc: "계약서 목록·서명·열람 테스트\n사이트 매니저가 계약서를 먼저 발송한 후 실행",
    time: "약 1~2분",
    args: [
      "tests/e2e/contracts.spec.ts",
      "--no-deps",
    ],
  },
  6: {
    title: "Stage 6 — 알림",
    desc: "알림 패널·읽음 처리·전체 읽음 테스트\n사이트 매니저가 알림을 먼저 발송한 후 실행",
    time: "약 1~2분",
    args: [
      "tests/e2e/notices.spec.ts",
      "--no-deps",
    ],
  },
  7: {
    title: "Stage 7 — 패스워드 잠금",
    desc: "잘못된 비밀번호 5회 입력 → 5분 잠금 → 복구 확인",
    time: "약 7분",
    args: [
      "tests/e2e/login.spec.ts",
      "--no-deps",
      "--grep", "5회 실패 → 잠금 → 5분 대기",
      "--timeout", "420000",
    ],
  },
  8: {
    title: "Stage 8 — 휴대폰 번호 변경",
    desc: "SMS 인증으로 번호 변경 확인 (TEST_NEW_PHONE 필요)\n계정 번호가 바뀌므로 반드시 마지막에 실행",
    time: "약 3분 + SMS 수동 입력",
    args: [
      "tests/e2e/profile.spec.ts",
      "--no-deps",
      "--grep", "Scenario 3B",
    ],
  },
}

// Strip ANSI escape codes
function stripAnsi(str) {
  return str.replace(/\x1B\[[0-9;]*[A-Za-z]/g, "")
}

// Colorize terminal lines for HTML display
function colorize(line) {
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const l = esc(stripAnsi(line))
  if (/^\s+ok\s/.test(l))  return `<span class="ok">${l}</span>`
  if (/^\s+x\s/.test(l))   return `<span class="fail">${l}</span>`
  if (/^\s+-\s/.test(l))   return `<span class="skip">${l}</span>`
  if (/^[─═▶✅❌]/.test(l.trim())) return `<span class="section">${l}</span>`
  if (/PASS|passed/.test(l)) return `<span class="ok">${l}</span>`
  if (/FAIL|failed|Error/.test(l)) return `<span class="fail">${l}</span>`
  return l
}

const HTML = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>E2E Test Runner</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f4f6f9;color:#1a1a1a;min-height:100vh}
    .header{background:#007DCA;color:#fff;padding:16px 24px;display:flex;align-items:center;gap:12px}
    .header h1{font-size:18px;font-weight:700;letter-spacing:-.3px}
    .header .sub{font-size:13px;opacity:.8;margin-top:2px}
    .stages{display:flex;gap:16px;padding:24px;flex-wrap:wrap}
    .card{background:#fff;border-radius:14px;padding:22px;flex:1;min-width:260px;box-shadow:0 1px 6px rgba(0,0,0,.07);border:2px solid transparent;transition:border-color .2s}
    .card.active{border-color:#007DCA}
    .card.done-pass{border-color:#10b981}
    .card.done-fail{border-color:#ef4444}
    .card-num{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:50%;background:#007DCA;color:#fff;font-size:14px;font-weight:700;flex-shrink:0}
    .card-title{font-size:15px;font-weight:700;color:#111}
    .card-header{display:flex;align-items:center;gap:10px;margin-bottom:12px}
    .card-desc{font-size:13px;color:#555;line-height:1.6;margin-bottom:8px;white-space:pre-line}
    .card-time{font-size:12px;color:#999;margin-bottom:16px}
    .badge{display:inline-block;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;margin-bottom:14px}
    .badge-idle{background:#f0f0f0;color:#888}
    .badge-running{background:#fff3cd;color:#92600a;animation:pulse 1.4s infinite}
    .badge-pass{background:#d1fae5;color:#065f46}
    .badge-fail{background:#fee2e2;color:#991b1b}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.6}}
    .run-btn{width:100%;padding:11px;background:#007DCA;color:#fff;border:none;border-radius:9px;font-size:14px;font-weight:600;cursor:pointer;transition:background .15s}
    .run-btn:hover:not(:disabled){background:#005fa3}
    .run-btn:disabled{background:#93c5fd;cursor:not-allowed}
    .output-wrap{padding:0 24px 32px}
    .output-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px}
    .output-hdr h2{font-size:14px;font-weight:700;color:#333}
    .output-hdr .running-label{font-size:12px;color:#92600a;background:#fff3cd;padding:2px 8px;border-radius:999px;display:none}
    .output-hdr .running-label.show{display:inline-block}
    .terminal{background:#161b22;color:#c9d1d9;border-radius:12px;padding:18px 20px;font-family:'Menlo','Consolas','Courier New',monospace;font-size:12px;line-height:1.7;min-height:180px;max-height:55vh;overflow-y:auto;white-space:pre-wrap;word-break:break-all}
    .terminal .ok{color:#3fb950}
    .terminal .fail{color:#f85149}
    .terminal .skip{color:#d29922}
    .terminal .section{color:#79c0ff;font-weight:bold}
    .clear-btn{margin-left:auto;background:none;border:1px solid #ddd;padding:3px 10px;border-radius:6px;font-size:12px;cursor:pointer;color:#666}
    .clear-btn:hover{background:#f0f0f0}
  </style>
</head>
<body>
<div class="header">
  <div>
    <div class="header h1">E2E Test Runner</div>
    <div class="sub">site-worker-mobile · Playwright</div>
  </div>
</div>

<div class="stages" id="stages"></div>

<div class="output-wrap">
  <div class="output-hdr">
    <h2>출력</h2>
    <span class="running-label" id="running-label">실행 중...</span>
    <button class="clear-btn" onclick="clearLog()">지우기</button>
  </div>
  <div class="terminal" id="terminal"><span style="color:#555">여기에 테스트 결과가 표시됩니다.</span></div>
</div>

<script>
const STAGES = ${JSON.stringify(
  Object.entries(STAGES).reduce((acc, [k, v]) => {
    acc[k] = { title: v.title, desc: v.desc, time: v.time }
    return acc
  }, {})
)}

let currentES = null
let running = false

function renderStages() {
  const container = document.getElementById("stages")
  container.innerHTML = Object.entries(STAGES).map(([n, s]) => \`
    <div class="card" id="card-\${n}">
      <div class="card-header">
        <span class="card-num">\${n}</span>
        <span class="card-title">\${s.title}</span>
      </div>
      <div class="card-desc">\${s.desc}</div>
      <div class="card-time">⏱ \${s.time}</div>
      <div class="badge badge-idle" id="badge-\${n}">대기</div>
      <button class="run-btn" id="btn-\${n}" onclick="runStage(\${n})">▶ 실행</button>
    </div>
  \`).join("")
}

function setStatus(n, status) {
  const badge = document.getElementById(\`badge-\${n}\`)
  const card = document.getElementById(\`card-\${n}\`)
  card.className = "card"
  badge.className = "badge"
  const map = {
    idle:    ["badge-idle",    "대기",    ""],
    running: ["badge-running", "실행 중", "active"],
    pass:    ["badge-pass",    "✅ 통과", "done-pass"],
    fail:    ["badge-fail",    "❌ 실패", "done-fail"],
  }
  const [bc, label, cc] = map[status]
  badge.classList.add(bc)
  badge.textContent = label
  if (cc) card.classList.add(cc)
}

function setBtns(disabled) {
  ;[1,2,3,4,5,6,7,8].forEach(n => {
    const el = document.getElementById(\`btn-\${n}\`)
    if (el) el.disabled = disabled
  })
}

function appendLog(html) {
  const t = document.getElementById("terminal")
  const atBottom = t.scrollHeight - t.scrollTop <= t.clientHeight + 40
  t.innerHTML += html
  if (atBottom) t.scrollTop = t.scrollHeight
}

function clearLog() {
  document.getElementById("terminal").innerHTML = ""
}

function runStage(n) {
  if (running) return
  if (currentES) { currentES.close(); currentES = null }

  running = true
  setBtns(true)
  setStatus(n, "running")
  clearLog()
  appendLog(\`<span class="section">▶ Stage \${n} — \${STAGES[n].title} 시작...</span>\\n\\n\`)
  document.getElementById("running-label").classList.add("show")

  const url = \`/run?stage=\${n}\`
  const es = new EventSource(url)
  currentES = es

  es.addEventListener("log", (e) => {
    const lines = JSON.parse(e.data).split("\\n")
    appendLog(lines.map(colorize).join("\\n"))
  })

  es.addEventListener("done", (e) => {
    const { code } = JSON.parse(e.data)
    es.close()
    currentES = null
    running = false
    setBtns(false)
    setStatus(n, code === 0 ? "pass" : "fail")
    document.getElementById("running-label").classList.remove("show")
    appendLog(\`\\n<span class="\${code===0?"ok":"fail"}">\${code===0?"✅ 완료 (PASS)":"❌ 실패 (FAIL)"}</span>\\n\`)
  })

  es.onerror = () => {
    if (running) {
      es.close()
      currentES = null
      running = false
      setBtns(false)
      setStatus(n, "fail")
      document.getElementById("running-label").classList.remove("show")
      appendLog('\\n<span class="fail">연결 오류 — 서버를 확인하세요</span>\\n')
    }
  }
}

function colorize(line) {
  const esc = s => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  const l = esc(line)
  if (/^\\s+ok\\s/.test(l))  return \`<span class="ok">\${l}</span>\`
  if (/^\\s+x\\s/.test(l))   return \`<span class="fail">\${l}</span>\`
  if (/^\\s+-\\s/.test(l))   return \`<span class="skip">\${l}</span>\`
  if (/^[─═▶✅❌]/.test(l.trim())) return \`<span class="section">\${l}</span>\`
  if (/PASS|passed/.test(l))  return \`<span class="ok">\${l}</span>\`
  if (/FAIL|failed|Error/.test(l)) return \`<span class="fail">\${l}</span>\`
  return l
}

renderStages()
</script>
</body>
</html>`

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`)

  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(HTML)
    return
  }

  if (url.pathname === "/run") {
    const stageNum = parseInt(url.searchParams.get("stage"))
    const stage = STAGES[stageNum]

    if (!stage) {
      res.writeHead(400)
      res.end("Invalid stage")
      return
    }

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    })

    const envVars = { ...process.env, ...loadEnvFile(ENV_FILE) }
    const send = (event, data) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
    }

    // Replace saved auth state with empty state so the signup test starts with no session
    if (stage.clearAuth) {
      const authFile = path.join(ROOT, "tests/e2e/.auth/worker.json")
      mkdirSync(path.dirname(authFile), { recursive: true })
      writeFileSync(authFile, JSON.stringify({ cookies: [], origins: [] }))
      send("log", "✓ Auth state cleared\n\n")
    }

    // Normalize to steps format
    const steps = stage.steps ?? [{ type: "playwright", label: stage.title, args: stage.args }]

    // Run steps sequentially; track active child for cleanup
    let activeChild = null
    let aborted = false
    req.on("close", () => {
      aborted = true
      if (activeChild) activeChild.kill()
    })

    async function runStep(step) {
      const resolved = step.args.map((a) => a === "$TEST_PHONE" ? (envVars.TEST_PHONE ?? "") : a)

      let child
      if (step.type === "node") {
        // shell: false — args are passed directly, no shell injection risk
        child = spawn("node", resolved, { cwd: ROOT, env: envVars, shell: false })
      } else {
        const safe = resolved.map((a) => (/[|&<>\s]/.test(a) ? `"${a}"` : a))
        const allArgs = ["playwright", "test", ...safe]
        if (!safe.includes("--headed")) allArgs.push("--headed")
        // Pass full command as a single string to avoid DEP0190 (no separate args array)
        child = spawn(`npx ${allArgs.join(" ")}`, { cwd: ROOT, env: envVars, shell: true })
      }

      return new Promise((resolve) => {
        activeChild = child
        child.stdout.on("data", (chunk) => send("log", chunk.toString()))
        child.stderr.on("data", (chunk) => send("log", chunk.toString()))
        child.on("close", (code) => {
          activeChild = null
          resolve(code ?? 1)
        })
      })
    }

    ;(async () => {
      let finalCode = 0
      for (const step of steps) {
        if (aborted) break
        send("log", `\n${"─".repeat(50)}\n▶  ${step.label}\n${"─".repeat(50)}\n\n`)
        const code = await runStep(step)
        if (code !== 0) {
          finalCode = code
          if (step.stopOnFail) {
            send("log", `\n❌ 단계 실패 (${step.label}) — 이후 단계 건너뜀\n`)
            break
          }
        }
      }
      send("done", { code: finalCode })
      res.end()
    })()

    return
  }

  res.writeHead(404)
  res.end("Not found")
})

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(`\n  ❌ 포트 ${PORT}가 이미 사용 중입니다.`)
    console.error(`  실행 중인 서버를 종료하거나 다른 포트를 사용하세요.\n`)
  } else {
    console.error(err)
  }
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`\n  E2E Test Runner`)
  console.log(`  ─────────────────────────────`)
  console.log(`  http://localhost:${PORT}\n`)
})
