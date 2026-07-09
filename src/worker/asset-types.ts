export type Asset = {
  readonly id: string
  readonly itemId: string | null
  readonly objectKey: string
  readonly filename: string
  readonly contentType: string
  readonly sizeBytes: number
  readonly width: number | null
  readonly height: number | null
  readonly hash: string | null
  readonly createdAt: string
  readonly updatedAt: string
}

export type AssetRow = {
  readonly id: string
  readonly item_id: string | null
  readonly object_key: string
  readonly filename: string
  readonly content_type: string
  readonly size_bytes: number
  readonly width: number | null
  readonly height: number | null
  readonly hash: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type CreateAssetInput = {
  readonly id: string
  readonly itemId: string | null
  readonly objectKey: string
  readonly filename: string
  readonly contentType: string
  readonly sizeBytes: number
  readonly hash: string
}

export type AssetObjectKeyRow = {
  readonly object_key: string
}

export function rowToAsset(row: AssetRow): Asset {
  return {
    id: row.id,
    itemId: row.item_id,
    objectKey: row.object_key,
    filename: row.filename,
    contentType: row.content_type,
    sizeBytes: row.size_bytes,
    width: row.width,
    height: row.height,
    hash: row.hash,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
