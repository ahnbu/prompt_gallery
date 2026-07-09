import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { renderCopyFavoriteEvidence, runCopyFavorite } from "./browser-copy-favorite.mjs"
import { renderGallerySearchEvidence, runGallerySearch } from "./browser-gallery-search.mjs"
import { renderImagePreviewEvidence, runImagePreview } from "./browser-image-preview.mjs"
import { renderModalCrudEvidence, runModalCrud } from "./browser-modal-crud.mjs"
import { renderTagManagementEvidence, runTagManagement } from "./browser-tag-management.mjs"
import { renderWave0Evidence, runWave0 } from "./browser-wave0-smoke.mjs"
import { renderWorkflowRepoEvidence } from "./browser-workflow-repo-evidence.mjs"
import { runWorkflowRepo } from "./browser-workflow-repo.mjs"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultOutput = path.join(rootDir, ".omo/evidence/wave-2-core-ui.md")
const allowedArgs = new Set(["--base-url", "--output", "--scenario"])

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

function relativePath(value) {
  return path.relative(rootDir, value).replaceAll(path.sep, "/")
}

function invocationFor(scenario, output, suppliedBaseUrl, usesDefaults) {
  if (usesDefaults && suppliedBaseUrl === undefined) {
    return "pnpm qa:browser"
  }

  const args = ["--scenario", scenario, "--output", relativePath(output)]
  if (suppliedBaseUrl !== undefined) {
    args.push("--base-url", suppliedBaseUrl)
  }

  return `pnpm qa:browser -- ${args.join(" ")}`
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
      const health = await fetch("http://127.0.0.1:5173/api/health", {
        signal: AbortSignal.timeout(1000),
      })
      const shell = await fetch("http://127.0.0.1:5173/", {
        signal: AbortSignal.timeout(1000),
      })
      if (health.ok && shell.ok) {
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

function renderScenarioEvidence(result) {
  if (result.scenario === "gallery-search") {
    return renderGallerySearchEvidence(result)
  }
  if (result.scenario === "modal-crud") {
    return renderModalCrudEvidence(result)
  }
  if (result.scenario === "copy-favorite") {
    return renderCopyFavoriteEvidence(result)
  }
  if (result.scenario === "image-preview") {
    return renderImagePreviewEvidence(result)
  }
  if (result.scenario === "workflow-repo") {
    return renderWorkflowRepoEvidence(result)
  }
  if (result.scenario === "tag-management") {
    return renderTagManagementEvidence(result)
  }

  return renderWave0Evidence(result)
}

async function runScenario(scenario, baseUrl, output) {
  switch (scenario) {
    case "wave-0":
      return runWave0(baseUrl, output)
    case "gallery-search":
      return runGallerySearch(baseUrl, output)
    case "modal-crud":
      return runModalCrud(baseUrl, output)
    case "copy-favorite":
      return runCopyFavorite(baseUrl, output)
    case "image-preview":
      return runImagePreview(baseUrl, output)
    case "workflow-repo":
      return runWorkflowRepo(baseUrl, output)
    case "tag-management":
      return runTagManagement(baseUrl, output)
    default:
      throw new BrowserSmokeError(`Unsupported browser scenario: ${scenario}`)
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outputArg = args.get("--output")
  const scenarioArg = args.get("--scenario")
  const output = resolvePath(outputArg ?? defaultOutput)
  const suppliedBaseUrl = args.get("--base-url")
  const baseUrl = suppliedBaseUrl ?? "http://127.0.0.1:5173"
  const scenario = scenarioArg ?? "gallery-search"
  const invocation = invocationFor(
    scenario,
    output,
    suppliedBaseUrl,
    scenarioArg === undefined && outputArg === undefined,
  )
  let app

  await mkdir(path.dirname(output), { recursive: true })
  const previousEvidence = existsSync(output) ? await readFile(output, "utf8") : undefined
  const redOutput = output.replace(/\.md$/, "-red.md")
  const scenarioUsesRedEvidence =
    scenario === "gallery-search" || scenario === "workflow-repo" || scenario === "tag-management"
  const provenanceEvidence =
    scenarioUsesRedEvidence && !output.endsWith("-red.md") && existsSync(redOutput)
      ? await readFile(redOutput, "utf8")
      : previousEvidence

  try {
    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(output)
    }

    const artifacts = await runScenario(scenario, baseUrl, output)
    await writeFile(
      output,
      renderScenarioEvidence({
        scenario,
        baseUrl,
        invocation,
        output: relativePath(output),
        exitCode: 0,
        started: app !== undefined,
        ok: true,
        artifacts,
        devLogs: app,
        previousEvidence: provenanceEvidence,
      }),
    )
    console.log(`PASS browser smoke: ${output}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const failureResult = {
      scenario,
      baseUrl,
      invocation,
      output: relativePath(output),
      exitCode: 1,
      started: app !== undefined,
      ok: false,
      error: message,
      devLogs: app,
      previousEvidence,
    }
    await writeFile(output, renderScenarioEvidence(failureResult))
    if (scenarioUsesRedEvidence && !output.endsWith("-red.md")) {
      await writeFile(
        redOutput,
        renderScenarioEvidence({
          ...failureResult,
          invocation: invocationFor(scenario, redOutput, suppliedBaseUrl, false),
          output: relativePath(redOutput),
        }),
      )
    }
    console.error(`FAIL browser smoke: ${message}`)
    process.exitCode = 1
  } finally {
    if (app !== undefined) {
      await stopProcess(app.child)
    }
  }
}

await main()
