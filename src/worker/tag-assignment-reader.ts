import type { ItemTag } from "./item-types"
import type { ItemTagRow, TagSource } from "./tag-types"
import { TAG_SOURCES } from "./tag-types"

type MutableItemTag = {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly sources: TagSource[]
}

const SOURCE_ORDER: readonly TagSource[] = [TAG_SOURCES.MANUAL, TAG_SOURCES.AUTO]

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ")
}

function compareSources(left: TagSource, right: TagSource): number {
  return SOURCE_ORDER.indexOf(left) - SOURCE_ORDER.indexOf(right)
}

export async function tagsForItems(
  db: D1Database,
  itemIds: readonly string[],
): Promise<ReadonlyMap<string, readonly ItemTag[]>> {
  const tagsByItemId = new Map<string, MutableItemTag[]>()
  if (itemIds.length === 0) {
    return tagsByItemId
  }

  const rows = await db
    .prepare(`
      SELECT item_tags.item_id, tags.id, tags.name, tags.color, item_tags.source
      FROM item_tags
      JOIN tags ON tags.id = item_tags.tag_id
      WHERE item_tags.item_id IN (${placeholders(itemIds)})
      ORDER BY tags.name ASC, item_tags.source DESC
    `)
    .bind(...itemIds)
    .all<ItemTagRow>()

  for (const row of rows.results) {
    const existing = tagsByItemId.get(row.item_id)
    if (existing === undefined) {
      tagsByItemId.set(row.item_id, [
        { id: row.id, name: row.name, color: row.color, sources: [row.source] },
      ])
      continue
    }

    const tag = existing.find((entry) => entry.id === row.id)
    if (tag === undefined) {
      existing.push({ id: row.id, name: row.name, color: row.color, sources: [row.source] })
    } else if (!tag.sources.includes(row.source)) {
      tag.sources.push(row.source)
      tag.sources.sort(compareSources)
    }
  }

  return tagsByItemId
}
