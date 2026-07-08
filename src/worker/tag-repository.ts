import { ApiError, type Item, type ItemTag } from "./item-types"
import type { CreateTagInput, ItemTagRow, MergeTagsInput, PatchTagInput, Tag } from "./tag-types"
import { type TagCountRow, type TagKeywordRow, type TagRow, rowToTag } from "./tag-types"

type TagKeywordMatchRow = {
  readonly tag_id: string
  readonly keyword: string
}

const SELECT_TAG = `
  SELECT id, name, color, created_at, updated_at
  FROM tags
`

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ")
}

function itemSearchText(item: Item): string {
  return [item.title, item.body, item.notes, item.githubUrl]
    .filter((value): value is string => value !== null)
    .join(" ")
    .toLowerCase()
}

export class TagRepository {
  readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async list(): Promise<readonly Tag[]> {
    const rows = await this.db.prepare(`${SELECT_TAG} ORDER BY name ASC`).all<TagRow>()
    return Promise.all(rows.results.map((row) => this.hydrate(row)))
  }

  async get(id: string): Promise<Tag | null> {
    const row = await this.db.prepare(`${SELECT_TAG} WHERE id = ?`).bind(id).first<TagRow>()
    return row === null ? null : this.hydrate(row)
  }

  async create(input: CreateTagInput): Promise<Tag> {
    if ((await this.findRowByName(input.name)) !== null) {
      throw new ApiError("invalid_tag", "Tag name already exists.", 409)
    }

    const id = crypto.randomUUID()
    await this.db.batch([
      this.db
        .prepare("INSERT INTO tags (id, name, color) VALUES (?, ?, ?)")
        .bind(id, input.name, input.color),
      ...this.keywordInsertStatements(id, input.keywords),
    ])

    const tag = await this.get(id)
    if (tag === null) {
      throw new ApiError("invalid_tag", "Created tag was not returned by D1.", 500)
    }

    return tag
  }

  async update(id: string, input: PatchTagInput): Promise<Tag | null> {
    const current = await this.get(id)
    if (current === null) {
      return null
    }
    if (input.name !== undefined && input.name !== current.name) {
      const duplicate = await this.findRowByName(input.name)
      if (duplicate !== null) {
        throw new ApiError("invalid_tag", "Tag name already exists.", 409)
      }
    }

    const statements = [
      this.db
        .prepare(`
          UPDATE tags
          SET name = ?, color = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = ?
        `)
        .bind(input.name ?? current.name, input.color ?? current.color, id),
    ]
    if (input.keywords !== undefined) {
      statements.push(...this.replaceKeywordsStatements(id, input.keywords))
    }
    await this.db.batch(statements)

    return this.get(id)
  }

  async delete(id: string): Promise<boolean> {
    const usage = await this.itemCount(id)
    if (usage > 0) {
      throw new ApiError("tag_in_use", "Tag cannot be deleted while it is assigned to items.", 409)
    }

    const result = await this.db.prepare("DELETE FROM tags WHERE id = ?").bind(id).run()
    return result.meta.changes > 0
  }

  async merge(input: MergeTagsInput): Promise<Tag> {
    const source = await this.get(input.sourceId)
    const target = await this.get(input.targetId)
    if (source === null || target === null) {
      throw new ApiError(
        "invalid_merge",
        "Both sourceId and targetId must reference existing tags.",
        400,
      )
    }

    await this.db.batch([
      this.db
        .prepare(`
          INSERT OR IGNORE INTO item_tags (item_id, tag_id)
          SELECT item_id, ? FROM item_tags WHERE tag_id = ?
        `)
        .bind(input.targetId, input.sourceId),
      this.db
        .prepare(`
          INSERT OR IGNORE INTO tag_keywords (id, tag_id, keyword)
          SELECT lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-' ||
            lower(hex(randomblob(2))) || '-' || lower(hex(randomblob(2))) || '-' ||
            lower(hex(randomblob(6))), ?, keyword
          FROM tag_keywords
          WHERE tag_id = ?
        `)
        .bind(input.targetId, input.sourceId),
      this.db.prepare("DELETE FROM tags WHERE id = ?").bind(input.sourceId),
    ])

    const merged = await this.get(input.targetId)
    if (merged === null) {
      throw new ApiError("invalid_merge", "Merged tag was not returned by D1.", 500)
    }

    return merged
  }

  async setItemTagsByNames(itemId: string, names: readonly string[]): Promise<void> {
    const rows = await this.rowsByNames(names, "invalid_item")
    await this.db.batch([
      this.db.prepare("DELETE FROM item_tags WHERE item_id = ?").bind(itemId),
      ...rows.map((row) =>
        this.db
          .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)")
          .bind(itemId, row.id),
      ),
    ])
  }

  async requireNames(
    names: readonly string[],
    errorCode: "invalid_item" | "invalid_tag",
  ): Promise<void> {
    await this.rowsByNames(names, errorCode)
  }

  async addAutomaticTags(item: Item): Promise<void> {
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

    for (const tagId of tagIds) {
      await this.insertItemTag(item.id, tagId)
    }
  }

  async tagsForItems(itemIds: readonly string[]): Promise<ReadonlyMap<string, readonly ItemTag[]>> {
    const tagsByItemId = new Map<string, ItemTag[]>()
    if (itemIds.length === 0) {
      return tagsByItemId
    }

    const rows = await this.db
      .prepare(`
        SELECT item_tags.item_id, tags.id, tags.name, tags.color
        FROM item_tags
        JOIN tags ON tags.id = item_tags.tag_id
        WHERE item_tags.item_id IN (${placeholders(itemIds)})
        ORDER BY tags.name ASC
      `)
      .bind(...itemIds)
      .all<ItemTagRow>()

    for (const row of rows.results) {
      const tag = { id: row.id, name: row.name, color: row.color }
      const existing = tagsByItemId.get(row.item_id)
      if (existing === undefined) {
        tagsByItemId.set(row.item_id, [tag])
      } else {
        existing.push(tag)
      }
    }

    return tagsByItemId
  }

  private async rowsByNames(
    names: readonly string[],
    errorCode: "invalid_item" | "invalid_tag",
  ): Promise<readonly TagRow[]> {
    if (names.length === 0) {
      return []
    }

    const rows = await this.db
      .prepare(`${SELECT_TAG} WHERE name IN (${placeholders(names)}) ORDER BY name ASC`)
      .bind(...names)
      .all<TagRow>()
    const foundNames = new Set(rows.results.map((row) => row.name))
    for (const name of names) {
      if (!foundNames.has(name)) {
        throw new ApiError(errorCode, `Unknown tag: ${name}.`, 400)
      }
    }

    return rows.results
  }

  private async hydrate(row: TagRow): Promise<Tag> {
    const keywords = await this.keywords(row.id)
    return rowToTag(row, keywords, await this.itemCount(row.id))
  }

  private async keywords(tagId: string): Promise<readonly string[]> {
    const rows = await this.db
      .prepare("SELECT keyword FROM tag_keywords WHERE tag_id = ? ORDER BY keyword ASC")
      .bind(tagId)
      .all<TagKeywordRow>()

    return rows.results.map((row) => row.keyword)
  }

  private async itemCount(tagId: string): Promise<number> {
    const row = await this.db
      .prepare("SELECT COUNT(*) AS count FROM item_tags WHERE tag_id = ?")
      .bind(tagId)
      .first<TagCountRow>()
    return row?.count ?? 0
  }

  private async findRowByName(name: string): Promise<TagRow | null> {
    return this.db.prepare(`${SELECT_TAG} WHERE name = ?`).bind(name).first<TagRow>()
  }

  private replaceKeywordsStatements(
    tagId: string,
    keywords: readonly string[],
  ): D1PreparedStatement[] {
    return [
      this.db.prepare("DELETE FROM tag_keywords WHERE tag_id = ?").bind(tagId),
      ...this.keywordInsertStatements(tagId, keywords),
    ]
  }

  private keywordInsertStatements(
    tagId: string,
    keywords: readonly string[],
  ): D1PreparedStatement[] {
    return keywords.map((keyword) =>
      this.db
        .prepare("INSERT INTO tag_keywords (id, tag_id, keyword) VALUES (?, ?, ?)")
        .bind(crypto.randomUUID(), tagId, keyword),
    )
  }

  private async insertItemTag(itemId: string, tagId: string): Promise<void> {
    await this.db
      .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id) VALUES (?, ?)")
      .bind(itemId, tagId)
      .run()
  }
}
