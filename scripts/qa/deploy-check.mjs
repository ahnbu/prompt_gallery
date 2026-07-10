import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const defaultWranglerPath = path.join(rootDir, "wrangler.jsonc")
const defaultOutputPath = path.join(rootDir, ".omo/evidence/wave-4-deploy-check.txt")
const defaultMigrationsPath = path.join(rootDir, "migrations")
const expectedD1Id = "138200be-9d3b-4acf-bb71-42d5ca7e43b7"
const allowedArgs = new Set(["--config", "--output"])

class DeployCheckError extends Error {}

class PendingMigrationsError extends DeployCheckError {
  constructor(pendingMigrations) {
    super(`Pending remote D1 migrations: ${pendingMigrations.join(", ")}`)
    this.pendingMigrations = pendingMigrations
  }
}

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

function runWrangler(args, cwd = rootDir) {
  return new Promise((resolve) => {
    const commandInfo = wranglerCommand()
    const commandArgs = [...commandInfo.prefixArgs, ...wranglerArgs(args)]
    const child = spawn(commandInfo.command, commandArgs, {
      cwd,
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
    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: error.message })
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

function quoteWindowsArg(value) {
  if (/^[A-Za-z0-9_./:=@-]+$/.test(value)) {
    return value
  }

  return `"${value.replace(/(["^%])/g, "^$1")}"`
}

function wranglerCommand() {
  if (process.platform === "win32") {
    return { command: "cmd.exe", prefixArgs: ["/d", "/c"] }
  }

  return { command: "pnpm", prefixArgs: ["exec", "wrangler"] }
}

function wranglerArgs(args) {
  if (process.platform === "win32") {
    return [["pnpm", "exec", "wrangler", ...args].map(quoteWindowsArg).join(" ")]
  }

  return args
}

async function localMigrationNames(migrationsPath = defaultMigrationsPath) {
  const entries = await readdir(migrationsPath, { withFileTypes: true })
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right))
}

function jsonSlice(output) {
  const firstBracket = output.indexOf("[")
  const lastBracket = output.lastIndexOf("]")
  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    throw new DeployCheckError("Remote D1 migration output did not include JSON results")
  }

  return output.slice(firstBracket, lastBracket + 1)
}

function remoteMigrationNames(output) {
  const parsed = JSON.parse(jsonSlice(output))
  if (!Array.isArray(parsed)) {
    throw new DeployCheckError("Remote D1 migration output was not an array")
  }

  const names = new Set()
  for (const group of parsed) {
    const results = group?.results
    if (!Array.isArray(results)) {
      continue
    }
    for (const row of results) {
      if (typeof row?.name === "string") {
        names.add(row.name)
      }
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right))
}

function pendingMigrationNames(localNames, remoteNames) {
  const remote = new Set(remoteNames)
  return localNames.filter((name) => !remote.has(name))
}

async function checkRemoteMigrations(checks, runner, migrationsPath) {
  const localNames = await localMigrationNames(migrationsPath)
  const remoteResult = await runner([
    "d1",
    "execute",
    "prompt-gallery-db",
    "--remote",
    "--command",
    "SELECT name FROM d1_migrations ORDER BY id",
  ])
  if (remoteResult.code !== 0) {
    throw new DeployCheckError(
      `wrangler d1 migrations query failed: ${sanitizeOutput(
        remoteResult.stderr || remoteResult.stdout,
      )}`,
    )
  }

  const pendingMigrations = pendingMigrationNames(
    localNames,
    remoteMigrationNames(remoteResult.stdout),
  )
  if (pendingMigrations.length > 0) {
    throw new PendingMigrationsError(pendingMigrations)
  }
  checks.push("remote D1 migrations current")
  return pendingMigrations
}

async function checkRemoteResources(checks, limitations, options) {
  const whoami = await options.runner(["whoami"])
  if (whoami.code !== 0) {
    limitations.push(`wrangler auth unavailable: ${sanitizeOutput(whoami.stderr || whoami.stdout)}`)
    return []
  }
  checks.push("wrangler whoami succeeded")

  const d1 = await options.runner(["d1", "list", "--json"])
  if (d1.code !== 0) {
    limitations.push(`wrangler d1 list unavailable: ${sanitizeOutput(d1.stderr || d1.stdout)}`)
  } else {
    assert(
      outputContainsJsonName(d1.stdout, "prompt-gallery-db"),
      "Remote D1 prompt-gallery-db was not listed",
    )
    checks.push("remote D1 prompt-gallery-db listed")
  }

  const r2 = await options.runner(["r2", "bucket", "list"])
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

  return checkRemoteMigrations(checks, options.runner, options.migrationsPath)
}

export async function runDeployCheck(options = {}) {
  const checkRootDir = path.resolve(options.rootDir ?? rootDir)
  const wranglerPath = path.resolve(checkRootDir, options.wranglerPath ?? defaultWranglerPath)
  const outputPath = path.resolve(checkRootDir, options.outputPath ?? defaultOutputPath)
  const migrationsPath = path.resolve(checkRootDir, options.migrationsPath ?? defaultMigrationsPath)
  const runner = options.runner ?? ((args) => runWrangler(args, checkRootDir))
  let result = "PASS"
  const checks = []
  const limitations = []
  let pendingMigrations = []

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
    pendingMigrations = await checkRemoteResources(checks, limitations, {
      migrationsPath,
      runner,
    })
  } catch (error) {
    result = "FAIL"
    if (error instanceof PendingMigrationsError) {
      pendingMigrations = error.pendingMigrations
    }
    checks.push(error instanceof Error ? error.message : String(error))
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
  return { result, outputPath, checks, limitations, pendingMigrations }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const check = await runDeployCheck({
    wranglerPath: args.get("--config") ?? defaultWranglerPath,
    outputPath: args.get("--output") ?? defaultOutputPath,
  })
  if (check.result === "FAIL") {
    process.exitCode = 1
  }
  console.log(`${check.result} deploy check: ${check.outputPath}`)
}

if (
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    await main()
  } catch (error) {
    console.error(`FAIL deploy check: ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
