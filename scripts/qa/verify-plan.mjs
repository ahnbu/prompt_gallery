import { access, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultPlan = ".omo/plans/prompt-gallery-implementation.md"
const defaultEvidenceDir = ".omo/evidence"
const defaultOutput = ".omo/evidence/final-plan-compliance.md"
const allowedArgs = new Set(["--plan", "--evidence-dir", "--output"])
const requiredFiles = [
  "scripts/qa/api-smoke.mjs",
  "scripts/qa/browser-smoke.mjs",
  "scripts/qa/browser-smoke-support.mjs",
  "scripts/qa/browser-full-regression.mjs",
  "scripts/qa/create-fixtures.mjs",
  "scripts/qa/verify-plan.mjs",
  "scripts/qa/verify-scope.mjs",
  "scripts/qa/verify-cleanup.mjs",
  "scripts/qa/deploy-check.mjs",
  "scripts/qa/backup-local.mjs",
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
  "backup:local",
]
const requiredEvidence = [
  "wave-4-tag-management-gate.md",
  "wave-4-export-test.txt",
  "wave-4-backup/manifest.json",
  "wave-4-deploy-check.txt",
  "wave-4-code-review.md",
  "final-api-qa.txt",
  "final-browser-qa.md",
  "final-code-review.md",
  "final-scope-fidelity.md",
  "final-cleanup.md",
]
const mustHaveCoverage = [
  {
    name: "React/Vite/TS/Workers scaffold",
    terms: ["React", "Vite", "TypeScript", "Workers"],
    evidence: [
      "package.json",
      "vite.config.ts",
      "wrangler.jsonc",
      ".omo/evidence/final-browser-qa.md",
    ],
  },
  {
    name: "D1 and R2 bindings",
    terms: ["D1", "R2"],
    evidence: ["wrangler.jsonc", ".omo/evidence/wave-4-deploy-check.txt"],
  },
  {
    name: "item/tag/favorite/workflow/repo APIs",
    terms: ["item", "tag", "favorite", "workflow", "repo"],
    evidence: [".omo/evidence/final-api-qa.txt", ".omo/evidence/wave-4-export-test.txt"],
  },
  {
    name: "asset R2 protected preview",
    terms: ["asset", "R2", "preview"],
    evidence: [".omo/evidence/final-api-qa.txt", ".omo/evidence/final-browser-qa.md"],
  },
  {
    name: "tag management",
    terms: ["tag management", "태그"],
    evidence: [".omo/evidence/wave-4-tag-management-gate.md", ".omo/evidence/final-browser-qa.md"],
  },
  {
    name: "workflow/repo UI",
    terms: ["workflow", "repo"],
    evidence: [".omo/evidence/final-browser-qa.md"],
  },
  {
    name: "export and local backup",
    terms: ["export", "backup"],
    evidence: [
      ".omo/evidence/wave-4-backup/manifest.json",
      ".omo/evidence/wave-4-backup/d1.sql",
      ".omo/evidence/wave-4-backup/d1-export.json",
    ],
  },
  {
    name: "deploy readiness",
    terms: ["deploy"],
    evidence: [".omo/evidence/wave-4-deploy-check.txt"],
  },
  {
    name: "final scope and cleanup",
    terms: ["scope", "cleanup"],
    evidence: [".omo/evidence/final-scope-fidelity.md", ".omo/evidence/final-cleanup.md"],
  },
  {
    name: "forbidden features excluded",
    terms: ["금지", "forbidden", "scope"],
    evidence: [".omo/evidence/final-scope-fidelity.md", ".omo/evidence/final-code-review.md"],
  },
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
    name: "plan contains Final verification wave",
    ok: planText.includes("## Final verification wave"),
  })
  results.push({
    name: "plan has no unchecked task checkboxes",
    ok: !/^- \[ \]/m.test(planText),
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
  const coverageRows = []
  for (const row of mustHaveCoverage) {
    const termOk = row.terms.some((term) => planText.toLowerCase().includes(term.toLowerCase()))
    const evidenceChecks = []
    for (const evidenceName of row.evidence) {
      const existsOk = await exists(path.join(rootDir, evidenceName))
      evidenceChecks.push({ name: evidenceName, ok: existsOk })
    }
    const rowOk = termOk && evidenceChecks.every((check) => check.ok)
    coverageRows.push({ ...row, termOk, evidenceChecks, ok: rowOk })
    results.push({ name: `must-have coverage ${row.name}`, ok: rowOk })
  }

  const ok = results.every((result) => result.ok)
  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    [
      "# Final Plan Compliance",
      "",
      `Plan: ${planPath}`,
      `Evidence dir: ${evidenceDir}`,
      `Result: ${ok ? "PASS" : "FAIL"}`,
      "",
      "## Checks",
      ...results.map((result) => `- ${result.ok ? "PASS" : "FAIL"} ${result.name}`),
      "",
      "## Must-Have Coverage Map",
      ...coverageRows.flatMap((row) => [
        `- ${row.ok ? "PASS" : "FAIL"} ${row.name}`,
        `  - plan terms: ${row.termOk ? "matched" : "missing"} (${row.terms.join(", ")})`,
        `  - evidence: ${row.evidenceChecks.map((check) => `${check.ok ? "PASS" : "FAIL"} ${check.name}`).join("; ")}`,
      ]),
      "",
    ].join("\n"),
  )

  console.log(`${ok ? "PASS" : "FAIL"} verify plan: ${outputPath}`)
  if (!ok) {
    process.exitCode = 1
  }
}

await main()
