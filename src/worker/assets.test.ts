import { env } from "cloudflare:test"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { findAssetOrphans } from "./asset-orphans"
import { AssetRepository } from "./asset-repository"
import {
  COLLISION_ID,
  PNG_BYTES,
  apiRequest,
  clearPreviewBucket,
  createItem,
  imageKeyForItem,
  requireUploadedAsset,
  uploadAsset,
} from "./asset-test-support"

type CountRow = {
  readonly count: number
}

async function metadataCountByObjectKey(objectKey: string): Promise<number> {
  const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM assets WHERE object_key = ?")
    .bind(objectKey)
    .first<CountRow>()
  return row?.count ?? 0
}

describe("assets API", () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
    await clearPreviewBucket()
    await env.DB.prepare("DELETE FROM assets").run()
    await env.DB.prepare("DELETE FROM items").run()
  })

  it("uploads metadata and retrieves protected content through the Worker", async () => {
    const uploadResponse = await uploadAsset({})
    const asset = await requireUploadedAsset(uploadResponse)

    expect(asset.itemId).toBeNull()
    expect(asset.objectKey).toMatch(/^previews\/.+\.png$/)
    expect(asset.filename).toBe("preview.png")
    expect(asset.contentType).toBe("image/png")
    expect(asset.sizeBytes).toBe(PNG_BYTES.byteLength)
    expect(asset.contentUrl).toBe(`/api/assets/${asset.id}/content`)
    expect(await env.PREVIEWS.head(asset.objectKey)).not.toBeNull()

    const contentResponse = await apiRequest("GET", `/api/assets/${asset.id}/content`)
    expect(contentResponse.status).toBe(200)
    expect(contentResponse.headers.get("content-type")).toContain("image/png")
    expect(new Uint8Array(await contentResponse.arrayBuffer())).toEqual(PNG_BYTES)
  })

  it("replaces an item asset and deletes the old R2 object", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Render a quiet workspace" })
    const first = await requireUploadedAsset(await uploadAsset({ itemId }))
    const second = await requireUploadedAsset(
      await uploadAsset({ itemId, bytes: new Uint8Array([...PNG_BYTES, 0x01]) }),
    )

    expect(second.itemId).toBe(itemId)
    expect(second.objectKey).not.toBe(first.objectKey)
    expect(await imageKeyForItem(itemId)).toBe(second.objectKey)
    expect(await env.PREVIEWS.head(first.objectKey)).toBeNull()
    expect(await env.PREVIEWS.head(second.objectKey)).not.toBeNull()
  })

  it("keeps replacement when old R2 cleanup fails", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Keep prior preview" })
    const first = await requireUploadedAsset(await uploadAsset({ itemId }))
    const originalDelete = env.PREVIEWS.delete.bind(env.PREVIEWS)
    vi.spyOn(env.PREVIEWS, "delete").mockImplementation(async (key) => {
      if (typeof key === "string" && key === first.objectKey) {
        throw new Error("forced old asset cleanup failure")
      }
      await originalDelete(key)
    })

    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const second = await requireUploadedAsset(
      await uploadAsset({ itemId, bytes: new Uint8Array([...PNG_BYTES, 0x01]) }),
    )

    expect(await imageKeyForItem(itemId)).toBe(second.objectKey)
    expect(await env.PREVIEWS.head(first.objectKey)).not.toBeNull()
    expect(await env.PREVIEWS.head(second.objectKey)).not.toBeNull()
    expect(warn).toHaveBeenCalledWith("asset_cleanup_failed", first.objectKey)
  })

  it("keeps replacement when old metadata cleanup fails after old R2 delete", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Keep new preview" })
    const first = await requireUploadedAsset(await uploadAsset({ itemId }))
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.spyOn(AssetRepository.prototype, "deleteByObjectKey").mockImplementation(
      async (objectKey) => {
        if (objectKey === first.objectKey) {
          throw new Error("forced metadata cleanup failure")
        }
        await env.DB.prepare("DELETE FROM assets WHERE object_key = ?").bind(objectKey).run()
      },
    )

    const second = await requireUploadedAsset(
      await uploadAsset({ itemId, bytes: new Uint8Array([...PNG_BYTES, 0x01]) }),
    )

    expect(await imageKeyForItem(itemId)).toBe(second.objectKey)
    expect(await env.PREVIEWS.head(first.objectKey)).toBeNull()
    expect(await env.PREVIEWS.head(second.objectKey)).not.toBeNull()
    expect(await metadataCountByObjectKey(first.objectKey)).toBe(1)
    expect(warn).toHaveBeenCalledWith("asset_metadata_cleanup_failed", first.objectKey)
  })

  it("deletes asset metadata, item relation, and object through DELETE /api/assets", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Attach this preview" })
    const asset = await requireUploadedAsset(await uploadAsset({ itemId }))

    const response = await apiRequest("DELETE", "/api/assets", { id: asset.id })

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
    expect(await imageKeyForItem(itemId)).toBeNull()
    expect(await env.PREVIEWS.head(asset.objectKey)).toBeNull()
    expect((await apiRequest("GET", `/api/assets/${asset.id}/content`)).status).toBe(404)
  })

  it("connects a temporary asset to an item only when the item is explicitly patched", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Save this preview explicitly" })
    const asset = await requireUploadedAsset(await uploadAsset({}))

    expect(asset.itemId).toBeNull()
    expect(await imageKeyForItem(itemId)).toBeNull()

    const patchResponse = await apiRequest("PATCH", `/api/items/${itemId}`, {
      title: "Saved image prompt",
      imageAssetId: asset.id,
    })
    expect(patchResponse.status).toBe(200)
    const patchPayload: unknown = await patchResponse.json()
    const serialized = JSON.stringify(patchPayload)
    expect(serialized).not.toContain("imageKey")
    expect(serialized).not.toContain("previews/")
    expect(patchPayload).toMatchObject({
      item: {
        id: itemId,
        imageAssetId: asset.id,
        contentUrl: `/api/assets/${asset.id}/content`,
      },
    })
    expect(await imageKeyForItem(itemId)).toBe(asset.objectKey)
  })

  it("deletes associated R2 objects when an item is deleted", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Temporary image prompt" })
    const asset = await requireUploadedAsset(await uploadAsset({ itemId }))

    const response = await apiRequest("DELETE", `/api/items/${itemId}`)

    expect(response.status).toBe(200)
    expect(await env.PREVIEWS.head(asset.objectKey)).toBeNull()
    expect((await apiRequest("GET", `/api/assets/${asset.id}/content`)).status).toBe(404)
  })

  it("keeps item delete successful when associated asset cleanup fails", async () => {
    const itemId = await createItem({ type: "image_prompt", body: "Delete despite cleanup fault" })
    const asset = await requireUploadedAsset(await uploadAsset({ itemId }))
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    vi.spyOn(env.PREVIEWS, "delete").mockRejectedValue(new Error("forced cleanup failure"))

    const response = await apiRequest("DELETE", `/api/items/${itemId}`)

    expect(response.status).toBe(200)
    expect(warn).toHaveBeenCalledWith("asset_cleanup_failed", asset.objectKey)
    expect((await apiRequest("GET", `/api/items/${itemId}`)).status).toBe(404)
    expect(await env.PREVIEWS.head(asset.objectKey)).not.toBeNull()
  })

  it("cleans the temporary upload and rethrows when D1 metadata save fails", async () => {
    await env.DB.prepare(`
      INSERT INTO assets (id, object_key, filename, content_type, size_bytes)
      VALUES (?, ?, ?, ?, ?)
    `)
      .bind(COLLISION_ID, "previews/existing-collision.png", "existing.png", "image/png", 1)
      .run()
    await env.PREVIEWS.put("previews/existing-collision.png", PNG_BYTES)
    vi.spyOn(crypto, "randomUUID").mockImplementation(() => COLLISION_ID)
    vi.spyOn(console, "warn").mockImplementation(() => undefined)

    await expect(uploadAsset({})).rejects.toThrow("D1_ERROR")

    expect(await env.PREVIEWS.head(`previews/${COLLISION_ID}.png`)).toBeNull()
    expect(await env.PREVIEWS.head("previews/existing-collision.png")).not.toBeNull()
  })

  it("reports missing R2 objects, untracked R2 objects, and dangling item image keys", async () => {
    const asset = await requireUploadedAsset(await uploadAsset({}))
    await env.PREVIEWS.put("previews/manual-orphan.png", PNG_BYTES)
    await env.PREVIEWS.delete(asset.objectKey)
    const itemId = await createItem({ type: "image_prompt", body: "Dangling image key" })
    await env.DB.prepare("UPDATE items SET image_key = ? WHERE id = ?")
      .bind("previews/missing-item-reference.png", itemId)
      .run()

    const report = await findAssetOrphans(env.DB, env.PREVIEWS)

    expect(report.missingObjects).toContain(asset.objectKey)
    expect(report.orphanObjects).toContain("previews/manual-orphan.png")
    expect(report.danglingItemImageKeys).toContain("previews/missing-item-reference.png")
  })

  it("rejects unsupported content types before writing to R2", async () => {
    const response = await uploadAsset({
      bytes: new Uint8Array([0x61, 0x62, 0x63]),
      contentType: "text/plain",
      filename: "notes.txt",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_asset",
        message: "Asset content type must be image/png, image/jpeg, or image/webp.",
      },
    })
    expect((await env.PREVIEWS.list({ prefix: "previews/" })).objects).toHaveLength(0)
  })

  it("rejects files whose magic bytes do not match the claimed image type", async () => {
    const response = await uploadAsset({
      bytes: new Uint8Array([0x61, 0x62, 0x63]),
      contentType: "image/png",
      filename: "fake.png",
    })

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_asset",
        message: "Asset bytes must match the declared PNG, JPEG, or WebP content type.",
      },
    })
    expect((await env.PREVIEWS.list({ prefix: "previews/" })).objects).toHaveLength(0)
  })
})
