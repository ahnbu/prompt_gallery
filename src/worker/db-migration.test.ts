import { env } from "cloudflare:test"
import { describe, expect, it } from "vitest"

const requiredTables = [
  "items",
  "tags",
  "tag_keywords",
  "item_tags",
  "workflows",
  "workflow_steps",
  "assets",
] as const

type TableRow = {
  readonly name: string
}

describe("D1 migrations", () => {
  it("creates every required table when migrations are applied", async () => {
    // Given: a Worker test database bound as DB
    const placeholders = requiredTables.map(() => "?").join(",")

    // When: the schema tables are listed after migration setup
    const tables = await env.DB.prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${placeholders}) ORDER BY name`,
    )
      .bind(...requiredTables)
      .all<TableRow>()

    const tableNames = tables.results.map((table) => table.name)

    // Then: every table required by the Wave 0 schema contract exists
    expect(tableNames).toEqual([...requiredTables].sort())
    console.info(`required tables: ${tableNames.join(", ")}`)
  })
})
