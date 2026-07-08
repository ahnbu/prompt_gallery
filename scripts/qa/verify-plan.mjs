import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultPlan = ".omo/plans/prompt-gallery-implementation.md"
const defaultEvidenceDir = ".omo/evidence"
const defaultOutput = ".omo/evidence/wave-0-verify-plan.md"
const allowedArgs = new Set(["--plan", "--evidence-dir", "--output"])
const requiredFiles = [
  "scripts/qa/api-smoke.mjs",
  "scripts/qa/browser-smoke.mjs",
  "scripts/qa/create-fixtures.mjs",
  "scripts/qa/verify-plan.mjs",
  "scripts/qa/verify-scope.mjs",
  "scripts/qa/verify-cleanup.mjs",
  "scripts/qa/deploy-check.mjs",
  "test/fixtures/preview.png",
]
const requiredScripts = [
  "qa:api",
  "qa:browser",
  "qa:fixtures",
  "verify:plan",
  "verify:scope",
  "verify:cleanup",
  "deploy:check",
]
const requiredEvidence = [
  "wave-0-api-smoke-fail.txt",
  "wave-0-api-smoke.txt",
  "wave-0-browser-smoke.md",
]

class VerifyPlanError extends Error {}

function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv

  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]

    if (!allowedArgs.has(key)) {
      throw new VerifyPlanError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new VerifyPlanError(`Missing value for ${key}`)
    }

    args.set(key, value)
    index += 1
  }

  return args
}

async function exists(filePath) {
  try {
    await access(filePath)
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
  const planPath = path.resolve(rootDir, args.get("--plan") ?? defaultPlan)
  const evidenceDir = path.resolve(rootDir, args.get("--evidence-dir") ?? defaultEvidenceDir)
  const outputPath = path.resolve(rootDir, args.get("--output") ?? defaultOutput)
  const planText = await readFile(planPath, "utf8")
  const packageJson = JSON.parse(await readFile(path.join(rootDir, "package.json"), "utf8"))
  const results = []

  results.push({
    name: "Wave 0 task 3 remains unchecked",
    ok: planText.includes("- [ ] 3. Wave 0 - Add repeatable QA, fixture, and evidence scripts"),
  })
  for (const scriptName of requiredScripts) {
    results.push({
      name: `package script ${scriptName}`,
      ok: packageJson.scripts?.[scriptName] !== undefined,
    })
  }
  for (const fileName of requiredFiles) {
    results.push({ name: `file ${fileName}`, ok: await exists(path.join(rootDir, fileName)) })
  }
  for (const evidenceName of requiredEvidence) {
    results.push({
      name: `evidence ${evidenceName}`,
      ok: await exists(path.join(evidenceDir, evidenceName)),
    })
  }

  const ok = results.every((result) => result.ok)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    [
      "# Wave 0 Verify Plan",
      "",
      `Plan: ${planPath}`,
      `Evidence dir: ${evidenceDir}`,
      `Result: ${ok ? "PASS" : "FAIL"}`,
      "",
      "## Checks",
      ...results.map((result) => `- ${result.ok ? "PASS" : "FAIL"} ${result.name}`),
      "",
    ].join("\n"),
  )

  console.log(`${ok ? "PASS" : "FAIL"} verify plan: ${outputPath}`)
  if (!ok) {
    process.exitCode = 1
  }
}

await main()
