import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { startLocalApp, stopProcess } from "./api-smoke-support.mjs"

const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
const allowedArgs = new Set(["--base-url", "--out"])

class BackupError extends Error {}

function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv
  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]
    if (!allowedArgs.has(key)) {
      throw new BackupError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new BackupError(`Missing value for ${key}`)
    }
    args.set(key, value)
    index += 1
  }
  return args
}

async function fetchJson(baseUrl, pathname) {
  const response = await fetch(new URL(pathname, baseUrl), { signal: AbortSignal.timeout(5000) })
  const bodyText = await response.text()
  if (!response.ok) {
    throw new BackupError(`${pathname} expected 2xx, got ${response.status}: ${bodyText}`)
  }
  return JSON.parse(bodyText)
}

async function downloadAsset(baseUrl, asset, previewsDir) {
  const response = await fetch(new URL(asset.contentUrl, baseUrl), {
    signal: AbortSignal.timeout(5000),
  })
  if (!response.ok) {
    throw new BackupError(`${asset.contentUrl} expected 2xx, got ${response.status}`)
  }
  const bytes = new Uint8Array(await response.arrayBuffer())
  const filename = `${asset.id}-${asset.filename}`
  const filePath = path.join(previewsDir, filename)
  await writeFile(filePath, bytes)
  return {
    id: asset.id,
    filename,
    contentType: asset.contentType,
    sizeBytes: bytes.byteLength,
  }
}

function renderSqlEquivalent(exportPayload) {
  const escapedPayload = JSON.stringify(exportPayload).replaceAll("'", "''")
  return [
    "-- prompt-gallery local backup",
    "-- This file stores the complete D1-equivalent JSON export in SQL form.",
    "-- R2 binary payloads are stored separately under previews/ and listed in r2-objects.json.",
    `-- schemaVersion: ${exportPayload.schemaVersion}`,
    `-- exportedAt: ${exportPayload.exportedAt}`,
    "",
    "CREATE TABLE IF NOT EXISTS prompt_gallery_backup_export (",
    "  schema_version INTEGER NOT NULL,",
    "  exported_at TEXT NOT NULL,",
    "  payload_json TEXT NOT NULL",
    ");",
    "DELETE FROM prompt_gallery_backup_export;",
    `INSERT INTO prompt_gallery_backup_export (schema_version, exported_at, payload_json) VALUES (${Number(exportPayload.schemaVersion)}, '${String(exportPayload.exportedAt).replaceAll("'", "''")}', '${escapedPayload}');`,
    "",
  ].join("\n")
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const outDir = path.resolve(rootDir, args.get("--out") ?? ".omo/evidence/wave-4-backup")
  const suppliedBaseUrl = args.get("--base-url")
  const baseUrl = suppliedBaseUrl ?? "http://127.0.0.1:5173"
  let app

  await mkdir(outDir, { recursive: true })
  const previewsDir = path.join(outDir, "previews")
  await mkdir(previewsDir, { recursive: true })

  try {
    if (suppliedBaseUrl === undefined) {
      app = await startLocalApp(path.join(outDir, "backup-local.md"))
    }
    const exportPayload = await fetchJson(baseUrl, "/api/export")
    const assetRows = []
    for (const asset of exportPayload.assets ?? []) {
      assetRows.push(await downloadAsset(baseUrl, asset, previewsDir))
    }

    await writeFile(
      path.join(outDir, "prompt-gallery-export.json"),
      `${JSON.stringify(exportPayload, null, 2)}\n`,
    )
    await writeFile(
      path.join(outDir, "d1-export.json"),
      `${JSON.stringify(exportPayload, null, 2)}\n`,
    )
    await writeFile(path.join(outDir, "d1.sql"), renderSqlEquivalent(exportPayload))
    await writeFile(path.join(outDir, "r2-objects.json"), `${JSON.stringify(assetRows, null, 2)}\n`)
    await writeFile(
      path.join(outDir, "manifest.json"),
      `${JSON.stringify(
        {
          schemaVersion: 1,
          app: "prompt-gallery",
          baseUrl,
          localAppStarted: app !== undefined,
          files: {
            export: "prompt-gallery-export.json",
            d1: "d1.sql",
            d1EquivalentJson: "d1-export.json",
            r2Objects: "r2-objects.json",
            previews: "previews/",
          },
          counts: {
            items: exportPayload.items?.length ?? 0,
            tags: exportPayload.tags?.length ?? 0,
            workflows: exportPayload.workflows?.length ?? 0,
            assets: assetRows.length,
          },
        },
        null,
        2,
      )}\n`,
    )
    console.log(`PASS backup local: ${outDir}`)
  } finally {
    if (app !== undefined) {
      await stopProcess(app.child)
    }
  }
}

try {
  await main()
} catch (error) {
  console.error(`FAIL backup local: ${error instanceof Error ? error.message : String(error)}`)
  process.exitCode = 1
}
