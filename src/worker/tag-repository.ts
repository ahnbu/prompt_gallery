import { ApiError, type Item, type ItemTag } from "./item-types"
import { tagsForItems } from "./tag-assignment-reader"
import { TagAutoSync } from "./tag-auto-sync"
import type { CreateTagInput, MergeTagsInput, PatchTagInput, Tag } from "./tag-types"
import {
  TAG_SOURCES,
  type TagCountRow,
  type TagKeywordRow,
  type TagRow,
  rowToTag,
} from "./tag-types"

const SELECT_TAG = `
  SELECT id, name, color, created_at, updated_at
  FROM tags
`

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ")
}

export class TagRepository {
  readonly db: D1Database
  readonly autoSync: TagAutoSync

  constructor(db: D1Database) {
    this.db = db
    this.autoSync = new TagAutoSync(db)
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
    await this.autoSync.syncTag(id)

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
    if (input.keywords !== undefined) {
      await this.autoSync.syncTag(id)
    }

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
          INSERT OR IGNORE INTO item_tags (item_id, tag_id, source, created_at)
          SELECT item_id, ?, source, created_at FROM item_tags WHERE tag_id = ?
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
    await this.autoSync.syncTag(input.targetId)

    const merged = await this.get(input.targetId)
    if (merged === null) {
      throw new ApiError("invalid_merge", "Merged tag was not returned by D1.", 500)
    }

    return merged
  }

  async setItemTagsByNames(itemId: string, names: readonly string[]): Promise<void> {
    const rows = await this.rowsByNames(names, "invalid_item")
    await this.db.batch([
      this.db
        .prepare("DELETE FROM item_tags WHERE item_id = ? AND source = ?")
        .bind(itemId, TAG_SOURCES.MANUAL),
      ...rows.map((row) =>
        this.db
          .prepare("INSERT OR IGNORE INTO item_tags (item_id, tag_id, source) VALUES (?, ?, ?)")
          .bind(itemId, row.id, TAG_SOURCES.MANUAL),
      ),
    ])
  }

  async requireNames(
    names: readonly string[],
    errorCode: "invalid_item" | "invalid_tag",
  ): Promise<void> {
    await this.rowsByNames(names, errorCode)
  }

  async syncAutomaticTagsForItem(item: Item): Promise<void> {
    await this.autoSync.syncItem(item)
  }

  async syncAutomaticTag(tagId: string): Promise<void> {
    await this.autoSync.syncTag(tagId)
  }

  async tagsForItems(itemIds: readonly string[]): Promise<ReadonlyMap<string, readonly ItemTag[]>> {
    return tagsForItems(this.db, itemIds)
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
      .prepare("SELECT COUNT(DISTINCT item_id) AS count FROM item_tags WHERE tag_id = ?")
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
}
