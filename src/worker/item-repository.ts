import { AssetRepository } from "./asset-repository"
import type { CreateItemInput, Item, ItemRow, PatchItemInput } from "./item-types"
import { ApiError } from "./item-types"
import { rowToItem } from "./item-types"
import { TagRepository } from "./tag-repository"

type ItemColumnValue = string | number | null
type StringFieldChange = {
  readonly column: string
  readonly value: string | null | undefined
}
type ItemListFilter = {
  readonly tagNames: readonly string[]
  readonly favoriteOnly: boolean
}

const SELECT_ITEM = `
  SELECT id, type, title, body, notes, github_url, image_key,
    (SELECT assets.id FROM assets WHERE assets.object_key = items.image_key LIMIT 1) AS image_asset_id,
    favorite, created_at, updated_at
  FROM items
`

class ItemPersistenceError extends Error {}

function favoriteValue(value: boolean): number {
  return value ? 1 : 0
}

export class ItemRepository {
  readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async list(
    filter: ItemListFilter = { tagNames: [], favoriteOnly: false },
  ): Promise<readonly Item[]> {
    const conditions: string[] = []
    const values: ItemColumnValue[] = []

    if (filter.favoriteOnly) {
      conditions.push("favorite = ?")
      values.push(1)
    }
    if (filter.tagNames.length > 0) {
      conditions.push(`
        items.id IN (
          SELECT item_tags.item_id
          FROM item_tags
          JOIN tags ON tags.id = item_tags.tag_id
          WHERE tags.name IN (${placeholders(filter.tagNames)})
          GROUP BY item_tags.item_id
          HAVING COUNT(DISTINCT tags.name) = ?
        )
      `)
      values.push(...filter.tagNames, filter.tagNames.length)
    }

    const whereClause = conditions.length === 0 ? "" : `WHERE ${conditions.join(" AND ")}`
    const statement = this.db.prepare(`
      ${SELECT_ITEM}
      ${whereClause}
      ORDER BY updated_at DESC, created_at DESC, id DESC
    `)
    const rows =
      values.length === 0
        ? await statement.all<ItemRow>()
        : await statement.bind(...values).all<ItemRow>()

    return this.withTags(rows.results.map(rowToItem))
  }

  async get(id: string): Promise<Item | null> {
    const row = await this.db.prepare(`${SELECT_ITEM} WHERE id = ?`).bind(id).first<ItemRow>()
    if (row === null) {
      return null
    }

    const items = await this.withTags([rowToItem(row)])
    return items[0] ?? null
  }

  async create(input: CreateItemInput): Promise<Item> {
    const id = crypto.randomUUID()
    const tagRepository = new TagRepository(this.db)
    if (input.tagNames !== null) {
      await tagRepository.requireNames(input.tagNames, "invalid_item")
    }

    await this.db
      .prepare(`
        INSERT INTO items (id, type, title, body, notes, github_url, image_key, favorite)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        input.type,
        input.title,
        input.body,
        input.notes,
        input.githubUrl,
        null,
        favoriteValue(input.favorite),
      )
      .run()

    const item = await this.get(id)
    if (item === null) {
      throw new ItemPersistenceError("Created item was not returned by D1.")
    }

    if (input.tagNames !== null) {
      await tagRepository.setItemTagsByNames(id, input.tagNames)
    }
    await tagRepository.syncAutomaticTagsForItem(item)

    const taggedItem = await this.get(id)
    if (taggedItem === null) {
      throw new ItemPersistenceError("Tagged item was not returned by D1.")
    }

    return taggedItem
  }

  async update(id: string, input: PatchItemInput): Promise<Item | null> {
    const tagRepository = new TagRepository(this.db)
    const assetRepository = new AssetRepository(this.db)
    if (input.tagNames !== undefined) {
      await tagRepository.requireNames(input.tagNames, "invalid_item")
    }

    const fields: string[] = []
    const values: ItemColumnValue[] = []

    addStringField(fields, values, { column: "title", value: input.title })
    addStringField(fields, values, { column: "body", value: input.body })
    addStringField(fields, values, { column: "notes", value: input.notes })
    addStringField(fields, values, { column: "github_url", value: input.githubUrl })
    if (input.imageAssetId !== undefined) {
      let objectKey: string | null = null
      if (input.imageAssetId !== null) {
        const asset = await assetRepository.get(input.imageAssetId)
        if (asset === null) {
          throw new ApiError("invalid_item", "imageAssetId must reference an uploaded asset.", 400)
        }
        objectKey = asset.objectKey
      }
      fields.push("image_key = ?")
      values.push(objectKey)
    }
    if (input.favorite !== undefined) {
      fields.push("favorite = ?")
      values.push(favoriteValue(input.favorite))
    }

    fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
    values.push(id)

    await this.db
      .prepare(`UPDATE items SET ${fields.join(", ")} WHERE id = ?`)
      .bind(...values)
      .run()

    const item = await this.get(id)
    if (item === null) {
      return null
    }

    if (input.tagNames !== undefined) {
      await tagRepository.setItemTagsByNames(id, input.tagNames)
    }
    await tagRepository.syncAutomaticTagsForItem(item)
    if (input.imageAssetId !== undefined && input.imageAssetId !== null) {
      await assetRepository.setAssetItem(input.imageAssetId, id)
    }

    return this.get(id)
  }

  async updateFavorite(id: string, favorite: boolean): Promise<Item | null> {
    await this.db
      .prepare(`
        UPDATE items
        SET favorite = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `)
      .bind(favoriteValue(favorite), id)
      .run()

    return this.get(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare("DELETE FROM items WHERE id = ?").bind(id).run()
    return result.meta.changes > 0
  }

  private async withTags(items: readonly Item[]): Promise<readonly Item[]> {
    const tagsByItemId = await new TagRepository(this.db).tagsForItems(items.map((item) => item.id))
    return items.map((item) => ({
      ...item,
      tags: tagsByItemId.get(item.id) ?? [],
    }))
  }
}

function placeholders(values: readonly unknown[]): string {
  return values.map(() => "?").join(", ")
}

function addStringField(
  fields: string[],
  values: ItemColumnValue[],
  change: StringFieldChange,
): void {
  if (change.value === undefined) {
    return
  }

  fields.push(`${change.column} = ?`)
  values.push(change.value)
}
