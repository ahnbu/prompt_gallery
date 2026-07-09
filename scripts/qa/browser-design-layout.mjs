import {
  defaultOutput,
  parseArgs,
  prepareOutput,
  relativePath,
  resolvePath,
  writeEvidence,
} from "./browser-design-layout-api.mjs"
import { runDesignLayout } from "./browser-design-layout-browser.mjs"
import { startLocalApp, stopProcess } from "./browser-smoke-support.mjs"

function renderEvidence(result) {
  const lines = [
    "# Prompt Gallery Design Layout QA",
    "",
    `Command: ${result.invocation}`,
    `Base URL: ${result.baseUrl}`,
    `Output: ${result.output}`,
    `Exit code: ${result.exitCode}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
    "",
    "## Assertions",
    "- Light design tokens are active on the rendered app shell.",
    "- Desktop prompt row renders no more than 4 non-image cards.",
    "- Prompt, Workflow, and Repo cards are square.",
    "- Image prompt cards use natural-ratio masonry: wide < square < tall.",
    "- Mobile/tablet/desktop viewports have no horizontal overflow.",
    "",
  ]
  if (result.error !== undefined) {
    lines.push("## Failure", result.error, "")
  }
  if (result.fixture !== undefined) {
    lines.push("## Fixture", "```json", JSON.stringify(result.fixture, null, 2), "```", "")
  }
  if (Array.isArray(result.colorSamples) && result.colorSamples.length > 0) {
    lines.push(
      "## Color Samples",
      "```json",
      JSON.stringify(result.colorSamples, null, 2),
      "```",
      "",
    )
  }
  if (Array.isArray(result.metrics) && result.metrics.length > 0) {
    lines.push("## Geometry Metrics", "```json", JSON.stringify(result.metrics, null, 2), "```", "")
  }
  if (Array.isArray(result.artifacts) && result.artifacts.length > 0) {
    lines.push("## Screenshots")
    for (const artifact of result.artifacts) {
      lines.push(
        `- ${artifact.viewport}/${artifact.state}: ${artifact.path} (${artifact.bytes} bytes)`,
      )
    }
    lines.push("")
  }
  if (result.devLogs !== undefined) {
    lines.push(
      "## Dev Server Logs",
      `- stdout: ${relativePath(result.devLogs.stdoutPath)}`,
      `- stderr: ${relativePath(result.devLogs.stderrPath)}`,
      "",
    )
  }
  return `${lines.join("\n")}\n`
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const output = resolvePath(args.get("--output") ?? defaultOutput)
  const suppliedBaseUrl = args.get("--base-url")
  const baseUrl = suppliedBaseUrl ?? "http://127.0.0.1:5173"
  const invocationParts = [
    "node scripts/qa/browser-design-layout.mjs",
    "--output",
    relativePath(output),
  ]
  if (suppliedBaseUrl !== undefined) {
    invocationParts.push("--base-url", suppliedBaseUrl)
  }
  const invocation = invocationParts.join(" ")
  let app

  const previousEvidence = await prepareOutput(output)
  try {
    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(output)
    }
    const scenario = await runDesignLayout(baseUrl, output)
    await writeEvidence(
      output,
      {
        ...scenario,
        invocation,
        baseUrl,
        output: relativePath(output),
        exitCode: 0,
        started: app !== undefined,
        ok: true,
        devLogs: app,
        previousEvidence,
      },
      renderEvidence,
    )
    console.log(`PASS design layout QA: ${relativePath(output)}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await writeEvidence(
      output,
      {
        invocation,
        baseUrl,
        output: relativePath(output),
        exitCode: 1,
        started: app !== undefined,
        ok: false,
        error: message,
        devLogs: app,
        previousEvidence,
      },
      renderEvidence,
    )
    console.error(`FAIL design layout QA: ${message}`)
    process.exitCode = 1
  } finally {
    if (app !== undefined) {
      await stopProcess(app.child)
    }
  }
}

await main()
