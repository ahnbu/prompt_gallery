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

  it("stores manual and automatic tag assignments as separate sources", async () => {
    const itemId = crypto.randomUUID()
    const tagId = crypto.randomUUID()
    const itemTagColumns = await env.DB.prepare("PRAGMA table_info(item_tags)").all<{
      readonly name: string
    }>()

    expect(itemTagColumns.results.map((column) => column.name)).toContain("source")

    await env.DB.prepare("INSERT INTO items (id, type, title) VALUES (?, ?, ?)")
      .bind(itemId, "prompt", "Source-aware tag item")
      .run()
    await env.DB.prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)")
      .bind(tagId, "source-aware", "#3366cc")
      .run()
    await env.DB.prepare(
      "INSERT INTO item_tags (item_id, tag_id, source) VALUES (?, ?, ?), (?, ?, ?)",
    )
      .bind(itemId, tagId, "manual", itemId, tagId, "auto")
      .run()

    const rows = await env.DB.prepare(
      "SELECT source FROM item_tags WHERE item_id = ? AND tag_id = ? ORDER BY source DESC",
    )
      .bind(itemId, tagId)
      .all<{ readonly source: string }>()

    expect(rows.results.map((row) => row.source)).toEqual(["manual", "auto"])
  })
})
