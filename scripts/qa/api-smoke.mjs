import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { runAssets } from "./api-smoke-assets.mjs"
import {
  SmokeError,
  defaultOutput,
  parseArgs,
  renderEvidence,
  resolvePath,
  startLocalApp,
  stopProcess,
} from "./api-smoke-support.mjs"
import { runWave1 } from "./api-smoke-wave1.mjs"

const localHostnames = new Set(["localhost", "127.0.0.1", "::1", "[::1]"])

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const scenario = args.get("--scenario") ?? "wave1"
  const output = resolvePath(args.get("--output") ?? defaultOutput)
  const suppliedBaseUrl = args.get("--base-url")
  const baseUrl = suppliedBaseUrl ?? "http://127.0.0.1:5173"
  const context = { checks: [], cleanup: [] }
  let app

  await mkdir(path.dirname(output), { recursive: true })

  try {
    let parsedBaseUrl
    try {
      parsedBaseUrl = new URL(baseUrl)
    } catch (error) {
      if (error instanceof TypeError) {
        throw new SmokeError(`Invalid --base-url: ${baseUrl}`)
      }
      throw error
    }
    if (parsedBaseUrl.protocol !== "http:" || !localHostnames.has(parsedBaseUrl.hostname)) {
      throw new SmokeError(`Refusing mutating API smoke for non-local --base-url: ${baseUrl}`)
    }

    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(output)
    }

    const scenarioBaseUrl = app?.baseUrl ?? baseUrl
    const smoke =
      scenario === "assets"
        ? await runAssets(scenarioBaseUrl, context)
        : scenario === "wave1"
          ? await runWave1(scenarioBaseUrl, context)
          : scenario === "full-regression"
            ? await runFullRegression(scenarioBaseUrl, context)
            : null
    if (smoke === null) {
      throw new SmokeError(`Unknown scenario: ${scenario}`)
    }
    await writeFile(
      output,
      renderEvidence({
        title: scenario === "assets" ? "Wave 3 Assets API Smoke" : undefined,
        baseUrl: scenarioBaseUrl,
        started: app !== undefined,
        ok: true,
        checks: context.checks,
        cleanup: context.cleanup,
        health: smoke.health,
        binaryObservable:
          scenario === "assets"
            ? "Live API upload, protected content retrieval, replacement cleanup, explicit delete, and cleanup assertions passed."
            : undefined,
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
        title: scenario === "assets" ? "Wave 3 Assets API Smoke" : undefined,
        baseUrl: app?.baseUrl ?? baseUrl,
        started: app !== undefined,
        ok: false,
        checks: context.checks,
        cleanup: context.cleanup,
        error: message,
        binaryObservable: "Nonzero CLI exit with captured API assertion failure.",
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

async function runFullRegression(baseUrl, context) {
  const wave1 = await runWave1(baseUrl, context)
  await runAssets(baseUrl, context)
  const exported = await fetch(new URL("/api/export", baseUrl), {
    signal: AbortSignal.timeout(5000),
  })
  const exportText = await exported.text()
  if (!exported.ok) {
    throw new SmokeError(`GET /api/export expected 200, got ${exported.status}: ${exportText}`)
  }
  const exportJson = JSON.parse(exportText)
  if (exportJson.schemaVersion !== 1 || exportJson.app !== "prompt-gallery") {
    throw new SmokeError(`GET /api/export returned invalid payload: ${exportText}`)
  }
  if (exportText.includes("objectKey") || exportText.includes("previews/")) {
    throw new SmokeError("GET /api/export exposed internal R2 object keys")
  }
  context.checks.push("GET /api/export -> 200 schemaVersion 1 without internal R2 object keys")
  return { health: wave1.health }
}

try {
  await main()
} catch (error) {
  if (error instanceof SmokeError) {
    console.error(`FAIL api smoke: ${error.message}`)
    process.exitCode = 1
  } else {
    throw error
  }
}
