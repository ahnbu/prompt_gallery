import { AssetRepository } from "./asset-repository"
import type { Asset } from "./asset-types"
import {
  extensionFor,
  filenameFor,
  sha256Hex,
  validateAssetBytes,
  validateAssetEnvelope,
} from "./asset-validation"
import type { WorkerEnv } from "./index"
import { readJson } from "./item-input"
import { ItemRepository } from "./item-repository"
import { ApiError, errorResponse } from "./item-types"

type AssetResponse = {
  readonly id: string
  readonly itemId: string | null
  readonly filename: string
  readonly contentType: string
  readonly sizeBytes: number
  readonly createdAt: string
  readonly updatedAt: string
  readonly contentUrl: string
}

function methodNotAllowed(): Response {
  return errorResponse(new ApiError("method_not_allowed", "Method not allowed.", 405))
}

function notFound(): Response {
  return errorResponse(new ApiError("not_found", "Asset not found.", 404))
}

function assetResponse(asset: Asset): AssetResponse {
  return {
    id: asset.id,
    itemId: asset.itemId,
    filename: asset.filename,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
    contentUrl: `/api/assets/${asset.id}/content`,
  }
}

function requireFile(formData: FormData): File {
  const file = formData.get("file")
  if (!(file instanceof File)) {
    throw new ApiError("invalid_asset", "Asset upload requires a file field.", 400)
  }
  return file
}

function normalizedItemId(formData: FormData): string | null {
  const value = formData.get("itemId")
  if (value === null) {
    return null
  }
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new ApiError("invalid_asset", "itemId must be a non-empty string.", 400)
  }
  return value.trim()
}

function deleteId(value: unknown): string {
  if (typeof value !== "object" || value === null) {
    throw new ApiError("invalid_asset", "Delete body must include id.", 400)
  }

  const id = Reflect.get(value, "id")
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new ApiError("invalid_asset", "Delete body must include id.", 400)
  }
  return id.trim()
}

async function deleteObject(bucket: R2Bucket, objectKey: string): Promise<void> {
  try {
    await bucket.delete(objectKey)
  } catch {
    console.warn("asset_cleanup_failed", objectKey)
  }
}

export async function deleteAssetObjectAndMetadata(
  db: D1Database,
  bucket: R2Bucket,
  objectKey: string | null,
): Promise<void> {
  if (objectKey === null) {
    return
  }

  await deleteObject(bucket, objectKey)
  try {
    await new AssetRepository(db).deleteByObjectKey(objectKey)
  } catch {
    console.warn("asset_metadata_cleanup_failed", objectKey)
  }
}

async function uploadAsset(request: Request, env: WorkerEnv): Promise<Response> {
  const formData = await request.formData()
  const file = requireFile(formData)
  validateAssetEnvelope(file)
  const itemId = normalizedItemId(formData)
  const item = itemId === null ? null : await new ItemRepository(env.DB).get(itemId)
  if (itemId !== null && item === null) {
    return errorResponse(new ApiError("not_found", "Item not found.", 404))
  }

  // FormData is already buffered by the Worker runtime; file.size is the earliest size gate here.
  const bytes = await file.arrayBuffer()
  validateAssetBytes(file.type, bytes)

  const id = crypto.randomUUID()
  const extension = extensionFor(file.type)
  const objectKey = `previews/${id}.${extension}`
  const repository = new AssetRepository(env.DB)
  await env.PREVIEWS.put(objectKey, bytes, {
    httpMetadata: { contentType: file.type },
    customMetadata: { assetId: id, itemId: itemId ?? "" },
  })

  try {
    const asset = await repository.create({
      id,
      itemId,
      objectKey,
      filename: filenameFor(file, extension),
      contentType: file.type,
      sizeBytes: bytes.byteLength,
      hash: await sha256Hex(bytes),
    })
    if (itemId !== null) {
      await repository.setItemImageKey(itemId, objectKey)
      await deleteAssetObjectAndMetadata(env.DB, env.PREVIEWS, item?.imageKey ?? null)
    }
    return Response.json({ asset: assetResponse(asset) }, { status: 201 })
  } catch (error) {
    await deleteAssetObjectAndMetadata(env.DB, env.PREVIEWS, objectKey)
    console.warn("asset_metadata_save_failed", objectKey)
    throw error
  }
}

async function contentResponse(env: WorkerEnv, id: string): Promise<Response> {
  const asset = await new AssetRepository(env.DB).get(id)
  if (asset === null) {
    return notFound()
  }

  const object = await env.PREVIEWS.get(asset.objectKey)
  if (object === null) {
    return notFound()
  }

  return new Response(object.body, {
    headers: {
      "cache-control": "private, max-age=60",
      "content-type": object.httpMetadata?.contentType ?? asset.contentType,
    },
  })
}

async function deleteAsset(request: Request, env: WorkerEnv): Promise<Response> {
  const id = deleteId(await readJson(request))
  const repository = new AssetRepository(env.DB)
  const asset = await repository.delete(id)
  if (asset === null) {
    return notFound()
  }

  await deleteObject(env.PREVIEWS, asset.objectKey)
  if (asset.itemId !== null) {
    await repository.clearItemImageKey(asset.itemId, asset.objectKey)
  }
  return Response.json({ ok: true })
}

export async function handleAssetsRequest(
  request: Request,
  env: WorkerEnv,
  id: string | null,
  action: string | null,
): Promise<Response> {
  try {
    if (id === null) {
      switch (request.method) {
        case "POST":
          return await uploadAsset(request, env)
        case "DELETE":
          return await deleteAsset(request, env)
        default:
          return methodNotAllowed()
      }
    }

    if (request.method === "GET" && action === "content") {
      return await contentResponse(env, id)
    }

    return notFound()
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }
    console.warn("asset_route_failed")
    throw error
  }
}
