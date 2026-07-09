import { AssetRepository } from "./asset-repository"

export type AssetOrphanReport = {
  readonly missingObjects: readonly string[]
  readonly orphanObjects: readonly string[]
  readonly danglingItemImageKeys: readonly string[]
}

type ItemImageKeyRow = {
  readonly image_key: string
}

export async function findAssetOrphans(
  db: D1Database,
  bucket: R2Bucket,
): Promise<AssetOrphanReport> {
  const repository = new AssetRepository(db)
  const dbKeys = new Set(await repository.objectKeys())
  const bucketKeys = new Set<string>()
  let cursor: string | undefined

  do {
    const options = cursor === undefined ? { prefix: "previews/" } : { prefix: "previews/", cursor }
    const listing = await bucket.list(options)
    for (const object of listing.objects) {
      bucketKeys.add(object.key)
    }
    cursor = listing.truncated ? listing.cursor : undefined
  } while (cursor !== undefined)

  const itemKeys = await itemImageKeys(db)
  return {
    missingObjects: [...dbKeys].filter((key) => !bucketKeys.has(key)).sort(),
    orphanObjects: [...bucketKeys].filter((key) => !dbKeys.has(key)).sort(),
    danglingItemImageKeys: itemKeys
      .filter((key) => !dbKeys.has(key) || !bucketKeys.has(key))
      .sort(),
  }
}

async function itemImageKeys(db: D1Database): Promise<readonly string[]> {
  const rows = await db
    .prepare(
      "SELECT DISTINCT image_key FROM items WHERE image_key IS NOT NULL ORDER BY image_key ASC",
    )
    .all<ItemImageKeyRow>()
  return rows.results.map((row) => row.image_key)
}
