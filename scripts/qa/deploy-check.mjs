import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultWranglerPath = path.join(rootDir, "wrangler.jsonc")
const defaultOutputPath = path.join(rootDir, ".omo/evidence/wave-4-deploy-check.txt")
const expectedD1Id = "138200be-9d3b-4acf-bb71-42d5ca7e43b7"
const allowedArgs = new Set(["--config", "--output"])

class DeployCheckError extends Error {}

function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv
  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]
    if (!allowedArgs.has(key)) {
      throw new DeployCheckError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new DeployCheckError(`Missing value for ${key}`)
    }
    args.set(key, value)
    index += 1
  }
  return args
}

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

function runWrangler(args) {
  return new Promise((resolve) => {
    const command = process.platform === "win32" ? "cmd.exe" : "pnpm"
    const commandArgs =
      process.platform === "win32"
        ? ["/d", "/s", "/c", ["pnpm", "exec", "wrangler", ...args].join(" ")]
        : ["exec", "wrangler", ...args]
    const child = spawn(command, commandArgs, {
      cwd: rootDir,
      env: { ...process.env, NO_UPDATE_NOTIFIER: "1" },
      stdio: ["ignore", "pipe", "pipe"],
    })
    let stdout = ""
    let stderr = ""
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString()
    })
    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr })
    })
  })
}

function sanitizeOutput(value) {
  return value
    .replace(/api[_-]?token[^\n]*/gi, "api_token=[redacted]")
    .replace(/bearer\s+[A-Za-z0-9._-]+/gi, "bearer [redacted]")
    .slice(0, 2000)
}

function outputContainsJsonName(output, name) {
  try {
    const parsed = JSON.parse(output)
    return JSON.stringify(parsed).includes(name)
  } catch {
    return output.includes(name)
  }
}

async function checkRemoteResources(checks, limitations) {
  const whoami = await runWrangler(["whoami"])
  if (whoami.code !== 0) {
    limitations.push(`wrangler auth unavailable: ${sanitizeOutput(whoami.stderr || whoami.stdout)}`)
    return
  }
  checks.push("wrangler whoami succeeded")

  const d1 = await runWrangler(["d1", "list", "--json"])
  if (d1.code !== 0) {
    limitations.push(`wrangler d1 list unavailable: ${sanitizeOutput(d1.stderr || d1.stdout)}`)
  } else {
    assert(
      outputContainsJsonName(d1.stdout, "prompt-gallery-db"),
      "Remote D1 prompt-gallery-db was not listed",
    )
    checks.push("remote D1 prompt-gallery-db listed")
  }

  const r2 = await runWrangler(["r2", "bucket", "list"])
  if (r2.code !== 0) {
    limitations.push(
      `wrangler r2 bucket list unavailable: ${sanitizeOutput(r2.stderr || r2.stdout)}`,
    )
  } else {
    assert(
      outputContainsJsonName(r2.stdout, "prompt-gallery-previews"),
      "Remote R2 prompt-gallery-previews was not listed",
    )
    checks.push("remote R2 prompt-gallery-previews listed")
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const wranglerPath = path.resolve(rootDir, args.get("--config") ?? defaultWranglerPath)
  const outputPath = path.resolve(rootDir, args.get("--output") ?? defaultOutputPath)
  let result = "PASS"
  const checks = []
  const limitations = []

  try {
    const raw = await readFile(wranglerPath, "utf8")
    assert(!raw.includes("color-db"), "wrangler config must not reference color-db")

    const config = JSON.parse(stripJsonComments(raw))
    const d1 = findD1(config)
    const r2 = findR2(config)

    assert(d1 !== undefined, "D1 binding DB is missing")
    assert(d1.database_name === "prompt-gallery-db", "D1 database name must be prompt-gallery-db")
    assert(
      d1.database_id === expectedD1Id,
      "D1 database id does not match expected prompt-gallery-db id",
    )
    assert(r2 !== undefined, "R2 binding PREVIEWS is missing")
    assert(
      r2.bucket_name === "prompt-gallery-previews",
      "R2 bucket must be prompt-gallery-previews",
    )
    assert(
      existsSync(path.join(rootDir, "dist/client/index.html")),
      "Build output dist/client/index.html is missing",
    )

    checks.push(
      "DB binding present",
      "prompt-gallery-db database name present",
      "expected database id present",
      "PREVIEWS binding present",
      "prompt-gallery-previews bucket present",
      "color-db absent",
      "build output dist/client/index.html present",
    )
    await checkRemoteResources(checks, limitations)
  } catch (error) {
    result = "FAIL"
    checks.push(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }

  await mkdir(path.dirname(outputPath), { recursive: true })
  await writeFile(
    outputPath,
    [
      "# Wave 4 Deploy Check",
      "",
      `Result: ${result}`,
      "Remote action: read-only",
      "",
      "## Checks",
      ...checks.map((check) => `- ${check}`),
      "",
      "## Auth / Remote Limitations",
      ...(limitations.length === 0 ? ["- none"] : limitations.map((entry) => `- ${entry}`)),
      "",
    ].join("\n"),
  )
  console.log(`${result} deploy check: ${outputPath}`)
}

try {
  await main()
} catch (error) {
  console.error(`FAIL deploy check: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
