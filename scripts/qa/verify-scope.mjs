import { execFile } from "node:child_process"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultPlan = ".omo/plans/prompt-gallery-implementation.md"
const defaultOutput = ".omo/evidence/wave-0-verify-scope.md"
const allowedArgs = new Set(["--plan", "--output"])
const forbiddenProductMarkers = [
  "Cloudflare Images",
  "Google Drive preview",
  "GitHub raw preview",
  "local folder open",
  "public sharing",
  "app login",
]
const taskFiles = [
  "scripts/qa/",
  "test/fixtures/preview.png",
  ".omo/evidence/",
  ".omo/start-work/ledger.jsonl",
  "package.json",
]

class VerifyScopeError extends Error {}

function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv

  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]

    if (!allowedArgs.has(key)) {
      throw new VerifyScopeError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new VerifyScopeError(`Missing value for ${key}`)
    }

    args.set(key, value)
    index += 1
  }

  return args
}

async function gitStatus() {
  const { stdout } = await execFileAsync("git", ["status", "--short"], {
    cwd: rootDir,
    windowsHide: true,
  })
  return stdout.trim().split(/\r?\n/).filter(Boolean)
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const planPath = path.resolve(rootDir, args.get("--plan") ?? defaultPlan)
  const outputPath = path.resolve(rootDir, args.get("--output") ?? defaultOutput)
  const planText = await readFile(planPath, "utf8")
  const appText = await readFile(path.join(rootDir, "src/client/App.tsx"), "utf8")
  const workerText = await readFile(path.join(rootDir, "src/worker/index.ts"), "utf8")
  const statusLines = await gitStatus()
  const forbiddenHits = forbiddenProductMarkers.filter(
    (marker) => appText.includes(marker) || workerText.includes(marker),
  )
  const scopedLines = statusLines.filter((line) =>
    taskFiles.some((fileName) => line.includes(fileName)),
  )
  const unrelatedDocLine = statusLines.find((line) =>
    line.includes("_docs/20260708_04_R2-비용폭주-방지-의사결정.md"),
  )
  const task3Unchecked = planText.includes(
    "- [ ] 3. Wave 0 - Add repeatable QA, fixture, and evidence scripts",
  )
  const ok = forbiddenHits.length === 0 && task3Unchecked

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    [
      "# Wave 0 Verify Scope",
      "",
      `Result: ${ok ? "PASS" : "FAIL"}`,
      `Plan task 3 unchecked: ${task3Unchecked ? "yes" : "no"}`,
      `Forbidden product markers in app/worker: ${forbiddenHits.length === 0 ? "none" : forbiddenHits.join(", ")}`,
      "",
      "## Dirty Worktree Probe",
      `Total status lines: ${statusLines.length}`,
      `Task-scope status lines: ${scopedLines.length}`,
      unrelatedDocLine === undefined
        ? "Unrelated R2 cost document: not present in git status"
        : `Unrelated R2 cost document: ${unrelatedDocLine}`,
      "",
      "## Task Scope Lines",
      ...scopedLines.map((line) => `- ${line}`),
      "",
    ].join("\n"),
  )

  console.log(`${ok ? "PASS" : "FAIL"} verify scope: ${outputPath}`)
  if (!ok) {
    process.exitCode = 1
  }
}

await main()
