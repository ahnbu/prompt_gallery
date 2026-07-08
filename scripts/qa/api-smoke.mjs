import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const evidenceDir = path.join(rootDir, ".omo/evidence")
const defaultOutput = path.join(evidenceDir, "wave-0-api-smoke.txt")
const allowedArgs = new Set(["--base-url", "--output"])

class SmokeError extends Error {}

function parseArgs(argv) {
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

function resolvePath(value) {
  return path.resolve(rootDir, value)
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

async function stopProcess(child) {
  if (child.exitCode !== null) {
    return
  }

  if (process.platform === "win32" && child.pid !== undefined) {
    spawn("taskkill", ["/pid", String(child.pid), "/t", "/f"], { stdio: "ignore" })
  } else {
    child.kill("SIGTERM")
  }

  await delay(1500)
}

async function startLocalApp(outputPath) {
  const stem = outputPath.replace(/\.[^.]+$/, "")
  const stdoutPath = `${stem}-dev.stdout.log`
  const stderrPath = `${stem}-dev.stderr.log`
  let stdout = ""
  let stderr = ""
  const viteBin = path.join(rootDir, "node_modules/vite/bin/vite.js")
  const child = spawn(process.execPath, [viteBin, "--host", "127.0.0.1"], {
    cwd: rootDir,
    env: { BROWSER: "none", NO_UPDATE_NOTIFIER: "1" },
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

async function requestHealth(baseUrl) {
  const response = await fetch(new URL("/api/health", baseUrl), {
    signal: AbortSignal.timeout(5000),
  })
  const bodyText = await response.text()
  let parsed

  try {
    parsed = JSON.parse(bodyText)
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new SmokeError(`Health response is not JSON: ${bodyText}`)
    }
    throw error
  }

  if (!response.ok || parsed?.ok !== true) {
    throw new SmokeError(`Health check failed with status ${response.status}: ${bodyText}`)
  }

  return {
    status: response.status,
    contentType: response.headers.get("content-type") ?? "",
    bodyText,
  }
}

function renderEvidence(result) {
  const lines = [
    "# Wave 0 API Smoke",
    "",
    `Base URL: ${result.baseUrl}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

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
      ? "HTTP 200 with JSON body containing ok:true"
      : "Nonzero CLI exit with captured connection or health failure",
  )
  return `${lines.join("\n")}\n`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const output = resolvePath(args.get("--output") ?? defaultOutput)
  const suppliedBaseUrl = args.get("--base-url")
  const baseUrl = suppliedBaseUrl ?? "http://127.0.0.1:5173"
  let app

  await mkdir(path.dirname(output), { recursive: true })

  try {
    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(output)
    }

    const health = await requestHealth(baseUrl)
    await writeFile(
      output,
      renderEvidence({
        baseUrl,
        started: app !== undefined,
        ok: true,
        health,
        devLogs:
          app === undefined
            ? undefined
            : { stdoutPath: app.stdoutPath, stderrPath: app.stderrPath },
      }),
    )
    console.log(`PASS api smoke: ${output}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await writeFile(
      output,
      renderEvidence({
        baseUrl,
        started: app !== undefined,
        ok: false,
        error: message,
        devLogs:
          app === undefined
            ? undefined
            : { stdoutPath: app.stdoutPath, stderrPath: app.stderrPath },
      }),
    )
    console.error(`FAIL api smoke: ${message}`)
    process.exitCode = 1
  } finally {
    if (app !== undefined) {
      await stopProcess(app.child)
    }
  }
}

await main()
