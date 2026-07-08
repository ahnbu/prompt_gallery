import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const wranglerPath = path.join(rootDir, "wrangler.jsonc")
const outputPath = path.join(rootDir, ".omo/evidence/wave-0-deploy-check.md")

class DeployCheckError extends Error {}

function stripJsonComments(text) {
  return text.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|\s)\/\/.*$/gm, "$1")
}

function assert(condition, message) {
  if (!condition) {
    throw new DeployCheckError(message)
  }
}

function findD1(config) {
  return Array.isArray(config.d1_databases)
    ? config.d1_databases.find((entry) => entry?.binding === "DB")
    : undefined
}

function findR2(config) {
  return Array.isArray(config.r2_buckets)
    ? config.r2_buckets.find((entry) => entry?.binding === "PREVIEWS")
    : undefined
}

async function main() {
  let result = "PASS"
  const checks = []

  try {
    const raw = await readFile(wranglerPath, "utf8")
    assert(!raw.includes("color-db"), "wrangler config must not reference color-db")

    const config = JSON.parse(stripJsonComments(raw))
    const d1 = findD1(config)
    const r2 = findR2(config)

    assert(d1 !== undefined, "D1 binding DB is missing")
    assert(d1.database_name === "prompt-gallery-db", "D1 database name must be prompt-gallery-db")
    assert(
      d1.database_id === "138200be-9d3b-4acf-bb71-42d5ca7e43b7",
      "D1 database id does not match expected prompt-gallery-db id",
    )
    assert(r2 !== undefined, "R2 binding PREVIEWS is missing")
    assert(
      r2.bucket_name === "prompt-gallery-previews",
      "R2 bucket must be prompt-gallery-previews",
    )

    checks.push(
      "DB binding present",
      "prompt-gallery-db database name present",
      "expected database id present",
      "PREVIEWS binding present",
      "prompt-gallery-previews bucket present",
      "color-db absent",
    )
  } catch (error) {
    result = "FAIL"
    checks.push(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    [
      "# Wave 0 Deploy Check",
      "",
      `Result: ${result}`,
      "Remote action: none",
      "",
      "## Checks",
      ...checks.map((check) => `- ${check}`),
      "",
    ].join("\n"),
  )
  console.log(`${result} deploy check: ${outputPath}`)
}

await main()
