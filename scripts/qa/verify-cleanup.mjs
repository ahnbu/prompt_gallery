import { execFile } from "node:child_process"
import { access, mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultOutput = ".omo/evidence/final-cleanup.md"
const allowedArgs = new Set(["--output"])
const disallowedArtifacts = [
  "backup-smoke",
  "wave-4-backup",
  "test-results",
  "playwright-report",
  ".playwright",
]
const expectedEvidenceArtifacts = [
  ".omo/evidence/final-browser-qa.md",
  ".omo/evidence/final-browser-qa-dev.stdout.log",
  ".omo/evidence/final-browser-qa-dev.stderr.log",
  ".omo/evidence/final-browser-qa-tag-management-desktop-export.json",
  ".omo/evidence/final-browser-qa-tag-management-mobile-export.json",
  ".omo/evidence/final-api-qa.txt",
]

class CleanupError extends Error {}

function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv

  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]

    if (!allowedArgs.has(key)) {
      throw new CleanupError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new CleanupError(`Missing value for ${key}`)
    }

    args.set(key, value)
    index += 1
  }

  return args
}

async function portListeners() {
  if (process.platform === "win32") {
    const { stdout } = await execFileAsync("netstat", ["-ano", "-p", "tcp"], { windowsHide: true })
    return stdout
      .split(/\r?\n/)
      .filter((line) => line.includes(":5173") && line.includes("LISTENING"))
      .map((line) => line.trim())
  }

  const { stdout } = await execFileAsync("sh", ["-c", "lsof -nP -iTCP:5173 -sTCP:LISTEN || true"])
  return stdout.trim().split(/\r?\n/).filter(Boolean)
}

async function exists(relativePath) {
  try {
    await access(path.join(rootDir, relativePath))
    return true
  } catch (error) {
    if (error instanceof Error) {
      return false
    }
    throw error
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outputPath = path.resolve(rootDir, args.get("--output") ?? defaultOutput)
  const listeners = await portListeners()
  const leftoverArtifacts = []
  for (const artifact of disallowedArtifacts) {
    if (await exists(artifact)) {
      leftoverArtifacts.push(artifact)
    }
  }
  const missingExpectedArtifacts = []
  for (const artifact of expectedEvidenceArtifacts) {
    if (!(await exists(artifact))) {
      missingExpectedArtifacts.push(artifact)
    }
  }
  const ok =
    listeners.length === 0 &&
    leftoverArtifacts.length === 0 &&
    missingExpectedArtifacts.length === 0

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    [
      "# Final Cleanup Receipt",
      "",
      `Result: ${ok ? "PASS" : "FAIL"}`,
      `Port 5173 listeners: ${listeners.length}`,
      "",
      "## Listener Probe",
      ...(listeners.length === 0 ? ["- none"] : listeners.map((line) => `- ${line}`)),
      "",
      "## Artifact Probe",
      `Unexpected root/temp artifacts: ${leftoverArtifacts.length}`,
      ...(leftoverArtifacts.length === 0
        ? ["- none"]
        : leftoverArtifacts.map((artifact) => `- ${artifact}`)),
      "",
      "## Expected Evidence Artifacts",
      ...(missingExpectedArtifacts.length === 0
        ? expectedEvidenceArtifacts.map((artifact) => `- PASS ${artifact}`)
        : missingExpectedArtifacts.map((artifact) => `- MISSING ${artifact}`)),
      "",
      "## Notes",
      "- QA scripts only stop child dev-server processes they start.",
      "- Playwright browser instances are closed inside browser-smoke finally blocks.",
      "- Export downloads are written into .omo/evidence and are expected final evidence, not temporary leftovers.",
      "",
    ].join("\n"),
  )

  console.log(`${ok ? "PASS" : "FAIL"} verify cleanup: ${outputPath}`)
  if (!ok) {
    process.exitCode = 1
  }
}

await main()
