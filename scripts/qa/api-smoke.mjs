import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
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
      throw new SmokeError(
        `Refusing mutating Wave 1 API smoke for non-local --base-url: ${baseUrl}`,
      )
    }

    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(output)
    }

    const smoke = await runWave1(baseUrl, context)
    await writeFile(
      output,
      renderEvidence({
        baseUrl,
        started: app !== undefined,
        ok: true,
        checks: context.checks,
        cleanup: context.cleanup,
        health: smoke.health,
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
        checks: context.checks,
        cleanup: context.cleanup,
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
