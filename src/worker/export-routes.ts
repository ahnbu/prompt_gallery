import { AssetRepository } from "./asset-repository"
import type { Asset } from "./asset-types"
import type { WorkerEnv } from "./index"
import { ItemRepository } from "./item-repository"
import { itemResponse } from "./item-types"
import { TagRepository } from "./tag-repository"
import { WorkflowRepository } from "./workflow-repository"

type ExportAsset = {
  readonly id: string
  readonly itemId: string | null
  readonly filename: string
  readonly contentType: string
  readonly sizeBytes: number
  readonly hash: string | null
  readonly contentUrl: string
  readonly createdAt: string
  readonly updatedAt: string
}

function exportAsset(asset: Asset): ExportAsset {
  return {
    id: asset.id,
    itemId: asset.itemId,
    filename: asset.filename,
    contentType: asset.contentType,
    sizeBytes: asset.sizeBytes,
    hash: asset.hash,
    contentUrl: `/api/assets/${asset.id}/content`,
    createdAt: asset.createdAt,
    updatedAt: asset.updatedAt,
  }
}

export async function handleExportRequest(request: Request, env: WorkerEnv): Promise<Response> {
  if (request.method !== "GET") {
    return Response.json(
      { error: { code: "method_not_allowed", message: "Method not allowed." } },
      { status: 405 },
    )
  }

  const exportedAt = new Date().toISOString()
  const payload = {
    schemaVersion: 1,
    app: "prompt-gallery",
    exportedAt,
    items: (await new ItemRepository(env.DB).list()).map(itemResponse),
    tags: await new TagRepository(env.DB).list(),
    workflows: await new WorkflowRepository(env.DB).list(),
    assets: (await new AssetRepository(env.DB).list()).map(exportAsset),
  }

  return Response.json(payload, {
    headers: {
      "content-disposition": 'attachment; filename="prompt-gallery-export.json"',
    },
  })
}
