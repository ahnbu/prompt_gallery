import { type Item, type ItemRow, rowToItem } from "./item-types"
import { TAG_SOURCES, type TagKeywordRow } from "./tag-types"

type TagKeywordMatchRow = {
  readonly tag_id: string
  readonly keyword: string
}

const SELECT_ITEM = `
  SELECT id, type, title, body, notes, github_url, image_key,
    (SELECT assets.id FROM assets WHERE assets.object_key = items.image_key LIMIT 1) AS image_asset_id,
    favorite, created_at, updated_at
  FROM items
`

function itemSearchText(item: Item): string {
  return [item.title, item.body, item.notes, item.githubUrl]
    .filter((value): value is string => value !== null)
    .join(" ")
    .toLowerCase()
}

export class TagAutoSync {
  readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async syncItem(item: Item): Promise<void> {
    const rows = await this.db
      .prepare(`
        SELECT tags.id AS tag_id, tag_keywords.keyword
        FROM tags
        JOIN tag_keywords ON tag_keywords.tag_id = tags.id
        ORDER BY tags.name ASC, tag_keywords.keyword ASC
      `)
      .all<TagKeywordMatchRow>()
    const text = itemSearchText(item)
    const tagIds = new Set<string>()

    for (const row of rows.results) {
      if (text.includes(row.keyword.toLowerCase())) {
        tagIds.add(row.tag_id)
      }
    }

    await this.db.batch([
      this.db
        .prepare("DELETE FROM item_tags WHERE item_id = ? AND source = ?")
        .bind(item.id, TAG_SOURCES.AUTO),
      ...[...tagIds].map((tagId) =>
        this.db
          .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id, source) VALUES (?, ?, ?)")
          .bind(item.id, tagId, TAG_SOURCES.AUTO),
      ),
    ])
  }

  async syncTag(tagId: string): Promise<void> {
    const keywords = (await this.keywords(tagId)).map((keyword) => keyword.toLowerCase())
    const rows = await this.db.prepare(`${SELECT_ITEM} ORDER BY updated_at DESC`).all<ItemRow>()
    const itemIds = rows.results
      .map(rowToItem)
      .filter((item) => keywords.some((keyword) => itemSearchText(item).includes(keyword)))
      .map((item) => item.id)

    await this.db.batch([
      this.db
        .prepare("DELETE FROM item_tags WHERE tag_id = ? AND source = ?")
        .bind(tagId, TAG_SOURCES.AUTO),
      ...itemIds.map((itemId) =>
        this.db
          .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id, source) VALUES (?, ?, ?)")
          .bind(itemId, tagId, TAG_SOURCES.AUTO),
      ),
    ])
  }

  private async keywords(tagId: string): Promise<readonly string[]> {
    const rows = await this.db
      .prepare("SELECT keyword FROM tag_keywords WHERE tag_id = ? ORDER BY keyword ASC")
      .bind(tagId)
      .all<TagKeywordRow>()

    return rows.results.map((row) => row.keyword)
  }
}
