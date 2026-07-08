import { spawn } from "node:child_process"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultOutput = path.join(rootDir, ".omo/evidence/wave-0-browser-smoke.md")
const allowedArgs = new Set(["--base-url", "--output", "--scenario"])
const expectedTabs = ["즐겨찾기", "All", "프롬프트", "이미지 프롬프트", "Workflow", "레포"]
const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
]

class BrowserSmokeError extends Error {}

function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv

  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]

    if (!allowedArgs.has(key)) {
      throw new BrowserSmokeError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new BrowserSmokeError(`Missing value for ${key}`)
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
  throw new BrowserSmokeError("Local dev server did not become ready within 30s")
}

function assert(condition, message) {
  if (!condition) {
    throw new BrowserSmokeError(message)
  }
}

async function runWave0(baseUrl, outputPath) {
  const browser = await chromium.launch()
  const artifacts = []
  const screenshotStem = outputPath.replace(/\.[^.]+$/, "")

  try {
    for (const viewport of viewports) {
      const page = await browser.newPage({ viewport })
      await page.goto(baseUrl, { waitUntil: "networkidle" })

      const title = page.getByRole("heading", { name: "Prompt Gallery" })
      assert(
        (await title.count()) === 1 && (await title.first().isVisible()),
        "Prompt Gallery title is not visible",
      )

      const visibleTabs = []
      for (const tabName of expectedTabs) {
        const tab = page.getByRole("button", { name: tabName, exact: true })
        assert(
          (await tab.count()) === 1 && (await tab.first().isVisible()),
          `Tab is not visible: ${tabName}`,
        )
        visibleTabs.push(tabName)
      }

      const search = page.getByRole("searchbox", { name: "검색 준비 중" })
      assert(
        (await search.count()) === 1 && (await search.first().isDisabled()),
        "Wave 0 disabled search is missing",
      )

      const emptyRegion = page.locator(".content-empty")
      const emptyBox = await emptyRegion.boundingBox()
      assert(
        emptyBox !== null && emptyBox.width > 0 && emptyBox.height > 0,
        "Empty content region is not rendered",
      )

      const screenshotPath = `${screenshotStem}-${viewport.name}.png`
      const screenshot = await page.screenshot({ path: screenshotPath, fullPage: true })
      assert(
        screenshot.byteLength > 1000,
        `Screenshot is unexpectedly small: ${screenshot.byteLength} bytes`,
      )

      artifacts.push({
        viewport: viewport.name,
        path: screenshotPath,
        bytes: screenshot.byteLength,
        tabs: visibleTabs,
      })
      await page.close()
    }
  } finally {
    await browser.close()
  }

  return artifacts
}

function renderEvidence(result) {
  const lines = [
    "# Wave 0 Browser Smoke",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  if (result.artifacts !== undefined) {
    lines.push(
      "",
      "## Assertions",
      "- Prompt Gallery heading visible.",
      "- All Wave 0 tab controls visible by accessible role/name.",
      "- Disabled search placeholder visible.",
      "- Empty content region has nonzero dimensions.",
      "- Desktop and mobile screenshots exceed 1KB.",
    )
    lines.push("", "## Screenshots")
    for (const artifact of result.artifacts) {
      lines.push(`- ${artifact.viewport}: ${artifact.path} (${artifact.bytes} bytes)`)
    }
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
      ? "Playwright screenshots written and DOM role assertions passed"
      : "Nonzero CLI exit with captured browser assertion failure",
  )
  return `${lines.join("\n")}\n`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const output = resolvePath(args.get("--output") ?? defaultOutput)
  const suppliedBaseUrl = args.get("--base-url")
  const baseUrl = suppliedBaseUrl ?? "http://127.0.0.1:5173"
  const scenario = args.get("--scenario") ?? "wave-0"
  let app

  await mkdir(path.dirname(output), { recursive: true })

  try {
    if (scenario !== "wave-0") {
      throw new BrowserSmokeError(`Unsupported browser scenario for Wave 0 script: ${scenario}`)
    }
    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(output)
    }

    const artifacts = await runWave0(baseUrl, output)
    await writeFile(
      output,
      renderEvidence({
        scenario,
        baseUrl,
        started: app !== undefined,
        ok: true,
        artifacts,
        devLogs: app,
      }),
    )
    console.log(`PASS browser smoke: ${output}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await writeFile(
      output,
      renderEvidence({
        scenario,
        baseUrl,
        started: app !== undefined,
        ok: false,
        error: message,
        devLogs: app,
      }),
    )
    console.error(`FAIL browser smoke: ${message}`)
    process.exitCode = 1
  } finally {
    if (app !== undefined) {
      await stopProcess(app.child)
    }
  }
}

await main()
