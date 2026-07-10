import assert from "node:assert/strict"
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import test from "node:test"
import { runDeployCheck } from "./deploy-check.mjs"

const WRANGLER_CONFIG = JSON.stringify({
  d1_databases: [
    {
      binding: "DB",
      database_name: "prompt-gallery-db",
      database_id: "138200be-9d3b-4acf-bb71-42d5ca7e43b7",
    },
  ],
  r2_buckets: [{ binding: "PREVIEWS", bucket_name: "prompt-gallery-previews" }],
})

async function createDeployCheckFixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "prompt-gallery-deploy-check-"))
  await mkdir(path.join(rootDir, "migrations"), { recursive: true })
  await mkdir(path.join(rootDir, "dist/client"), { recursive: true })
  await writeFile(path.join(rootDir, "wrangler.jsonc"), WRANGLER_CONFIG)
  await writeFile(path.join(rootDir, "dist/client/index.html"), "<!doctype html>")
  await writeFile(path.join(rootDir, "migrations/0001_initial.sql"), "CREATE TABLE items(id TEXT);")
  await writeFile(path.join(rootDir, "migrations/0002_source_aware_item_tags.sql"), "")

  return {
    rootDir,
    wranglerPath: path.join(rootDir, "wrangler.jsonc"),
    outputPath: path.join(rootDir, ".omo/evidence/deploy-check.txt"),
    cleanup: () => rm(rootDir, { recursive: true, force: true }),
  }
}

function d1MigrationOutput(names) {
  return JSON.stringify([
    {
      results: names.map((name) => ({ name })),
      success: true,
    },
  ])
}

function createRunner(remoteMigrationNames) {
  return async (args) => {
    const command = args.join(" ")
    if (command === "whoami") {
      return { code: 0, stdout: "byungwook.an@gmail.com", stderr: "" }
    }
    if (command === "d1 list --json") {
      return { code: 0, stdout: JSON.stringify([{ name: "prompt-gallery-db" }]), stderr: "" }
    }
    if (command === "r2 bucket list") {
      return { code: 0, stdout: "prompt-gallery-previews", stderr: "" }
    }
    if (command.startsWith("d1 execute prompt-gallery-db --remote --command")) {
      return { code: 0, stdout: d1MigrationOutput(remoteMigrationNames), stderr: "" }
    }

    throw new Error(`Unexpected wrangler command: ${command}`)
  }
}

test("deploy check fails when remote D1 is missing a local migration", async () => {
  const fixture = await createDeployCheckFixture()
  try {
    const result = await runDeployCheck({
      rootDir: fixture.rootDir,
      wranglerPath: fixture.wranglerPath,
      outputPath: fixture.outputPath,
      runner: createRunner(["0001_initial.sql"]),
    })

    assert.equal(result.result, "FAIL")
    assert.deepEqual(result.pendingMigrations, ["0002_source_aware_item_tags.sql"])
    const evidence = await readFile(fixture.outputPath, "utf8")
    assert.match(evidence, /Pending remote D1 migrations: 0002_source_aware_item_tags\.sql/)
  } finally {
    await fixture.cleanup()
  }
})

test("deploy check passes when all local migrations are applied remotely", async () => {
  const fixture = await createDeployCheckFixture()
  try {
    const result = await runDeployCheck({
      rootDir: fixture.rootDir,
      wranglerPath: fixture.wranglerPath,
      outputPath: fixture.outputPath,
      runner: createRunner(["0001_initial.sql", "0002_source_aware_item_tags.sql"]),
    })

    assert.equal(result.result, "PASS")
    assert.deepEqual(result.pendingMigrations, [])
    const evidence = await readFile(fixture.outputPath, "utf8")
    assert.match(evidence, /remote D1 migrations current/)
  } finally {
    await fixture.cleanup()
  }
})
