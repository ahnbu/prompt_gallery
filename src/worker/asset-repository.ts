import type { Asset, AssetObjectKeyRow, AssetRow, CreateAssetInput } from "./asset-types"
import { rowToAsset } from "./asset-types"

const SELECT_ASSET = `
  SELECT id, item_id, object_key, filename, content_type, size_bytes,
    width, height, hash, created_at, updated_at
  FROM assets
`

export class AssetRepository {
  readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async create(input: CreateAssetInput): Promise<Asset> {
    await this.db
      .prepare(`
        INSERT INTO assets (id, item_id, object_key, filename, content_type, size_bytes, hash)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        input.id,
        input.itemId,
        input.objectKey,
        input.filename,
        input.contentType,
        input.sizeBytes,
        input.hash,
      )
      .run()

    const asset = await this.get(input.id)
    if (asset === null) {
      throw new Error("Created asset was not returned by D1.")
    }

    return asset
  }

  async get(id: string): Promise<Asset | null> {
    const row = await this.db.prepare(`${SELECT_ASSET} WHERE id = ?`).bind(id).first<AssetRow>()
    return row === null ? null : rowToAsset(row)
  }

  async list(): Promise<readonly Asset[]> {
    const rows = await this.db
      .prepare(`${SELECT_ASSET} ORDER BY created_at ASC, id ASC`)
      .all<AssetRow>()
    return rows.results.map(rowToAsset)
  }

  async getByObjectKey(objectKey: string): Promise<Asset | null> {
    const row = await this.db
      .prepare(`${SELECT_ASSET} WHERE object_key = ?`)
      .bind(objectKey)
      .first<AssetRow>()
    return row === null ? null : rowToAsset(row)
  }

  async delete(id: string): Promise<Asset | null> {
    const asset = await this.get(id)
    if (asset === null) {
      return null
    }

    await this.db.prepare("DELETE FROM assets WHERE id = ?").bind(id).run()
    return asset
  }

  async deleteByObjectKey(objectKey: string): Promise<void> {
    await this.db.prepare("DELETE FROM assets WHERE object_key = ?").bind(objectKey).run()
  }

  async setItemImageKey(itemId: string, objectKey: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE items
        SET image_key = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ?
      `)
      .bind(objectKey, itemId)
      .run()
  }

  async setAssetItem(assetId: string, itemId: string | null): Promise<void> {
    await this.db.prepare("UPDATE assets SET item_id = ? WHERE id = ?").bind(itemId, assetId).run()
  }

  async clearItemImageKey(itemId: string, objectKey: string): Promise<void> {
    await this.db
      .prepare(`
        UPDATE items
        SET image_key = NULL, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
        WHERE id = ? AND image_key = ?
      `)
      .bind(itemId, objectKey)
      .run()
  }

  async objectKeys(): Promise<readonly string[]> {
    const rows = await this.db
      .prepare("SELECT object_key FROM assets ORDER BY object_key ASC")
      .all<AssetObjectKeyRow>()
    return rows.results.map((row) => row.object_key)
  }
}
