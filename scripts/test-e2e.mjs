import { readFileSync } from "fs"
import { spawnSync } from "child_process"

try {
  readFileSync(".env.test", "utf-8")
    .split("\n")
    .forEach((line) => {
      const eq = line.indexOf("=")
      if (eq > 0) {
        const key = line.slice(0, eq).trim()
        const val = line.slice(eq + 1).trim()
        if (key) process.env[key] = val
      }
    })
} catch {
  // .env.test missing — rely on shell env vars
}

const args = ["playwright", "test", ...process.argv.slice(2)]
const result = spawnSync("npx", args, { stdio: "inherit", shell: true })
process.exit(result.status ?? 0)
