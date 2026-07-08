import { spawn } from "node:child_process"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const evidenceDir = path.join(rootDir, ".omo/evidence")
const allowedArgs = new Set(["--base-url", "--output"])
const childEnv = { BROWSER: "none", CI: "1", NO_UPDATE_NOTIFIER: "1" }

export const defaultOutput = path.join(evidenceDir, "wave-1-api-smoke.txt")

export class SmokeError extends Error {}

export function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv

  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]

    if (!allowedArgs.has(key)) {
      throw new SmokeError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new SmokeError(`Missing value for ${key}`)
    }

    args.set(key, value)
    index += 1
  }

  return args
}

export function resolvePath(value) {
  return path.resolve(rootDir, value)
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function waitForExit(child, ms) {
  if (child.exitCode !== null) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms)
    child.once("exit", () => {
      clearTimeout(timer)
      resolve()
    })
  })
}

export async function stopProcess(child) {
  if (child.exitCode !== null) {
    return
  }

  if (process.platform === "win32" && child.pid !== undefined) {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" })
  } else {
    child.kill("SIGTERM")
  }

  await waitForExit(child, 2500)
}

export async function startLocalApp(outputPath) {
  const stem = outputPath.replace(/\.[^.]+$/, "")
  const stdoutPath = `${stem}-dev.stdout.log`
  const stderrPath = `${stem}-dev.stderr.log`
  let stdout = ""
  let stderr = ""
  const viteBin = path.join(rootDir, "node_modules/vite/bin/vite.js")
  const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1"], {
    cwd: rootDir,
    env: childEnv,
    stdio: ["ignore", "pipe", "pipe"],
  })

  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString()
  })
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString()
  })

  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch("http://127.0.0.1:5173/api/health", {
        signal: AbortSignal.timeout(1000),
      })
      if (response.ok) {
        await writeFile(stdoutPath, stdout)
        await writeFile(stderrPath, stderr)
        return { child, stdoutPath, stderrPath }
      }
    } catch (error) {
      if (!(error instanceof Error)) {
        throw error
      }
    }

    await delay(500)
  }

  await writeFile(stdoutPath, stdout)
  await writeFile(stderrPath, stderr)
  await stopProcess(child)
  throw new SmokeError("Local dev server did not become ready within 30s")
}

export async function requestJson(baseUrl, method, pathname, body) {
  const response = await fetch(new URL(pathname, baseUrl), {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  })
  const bodyText = await response.text()

  try {
    return {
      status: response.status,
      contentType: response.headers.get("content-type") ?? "",
      bodyText,
      json: JSON.parse(bodyText),
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SmokeError(`${method} ${pathname} response is not JSON: ${bodyText}`)
    }
    throw error
  }
}

export function assertSmoke(condition, message) {
  if (!condition) {
    throw new SmokeError(message)
  }
}

export function expectStatus(result, status, label) {
  assertSmoke(
    result.status === status,
    `${label} expected ${status}, got ${result.status}: ${result.bodyText}`,
  )
}

export function requireItem(result, label) {
  const item = result.json?.item
  assertSmoke(typeof item?.id === "string", `${label} did not return item.id: ${result.bodyText}`)
  return item
}

export function renderEvidence(result) {
  const lines = [
    "# Wave 1 API Smoke",
    "",
    `Base URL: ${result.baseUrl}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  if (result.checks.length > 0) {
    lines.push("", "## Coverage")
    for (const check of result.checks) {
      lines.push(`- ${check}`)
    }
  }
  if (result.cleanup.length > 0) {
    lines.push("", "## Cleanup", ...result.cleanup.map((entry) => `- ${entry}`))
  }
  if (result.health !== undefined) {
    lines.push(
      "",
      "## Health",
      `Status: ${result.health.status}`,
      `Content-Type: ${result.health.contentType}`,
      "Body:",
      result.health.bodyText,
    )
  }
  if (result.error !== undefined) {
    lines.push("", "## Failure", result.error)
  }
  if (result.devLogs !== undefined) {
    lines.push(
      "",
      "## Dev Logs",
      `stdout: ${result.devLogs.stdoutPath}`,
      `stderr: ${result.devLogs.stderrPath}`,
    )
  }

  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Health, item fallback, tags filter, favorite, workflow, malformed JSON 400, and cleanup assertions passed."
      : "Nonzero CLI exit with captured API assertion failure.",
  )
  return `${lines.join("\n")}\n`
}
