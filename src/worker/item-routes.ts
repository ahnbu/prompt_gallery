import { deleteAssetObjectAndMetadata } from "./asset-routes"
import type { WorkerEnv } from "./index"
import { parseCreateItem, parseFavoriteItem, parsePatchItem, readJson } from "./item-input"
import { ItemRepository } from "./item-repository"
import { ApiError, errorResponse, itemResponse } from "./item-types"

function methodNotAllowed(): Response {
  return errorResponse(new ApiError("method_not_allowed", "Method not allowed.", 405))
}

function itemNotFound(): Response {
  return errorResponse(new ApiError("not_found", "Item not found.", 404))
}

function parseTagFilter(request: Request): readonly string[] {
  const rawTags = new URL(request.url).searchParams.get("tags")
  if (rawTags === null) {
    return []
  }

  const tags = new Set<string>()
  for (const tag of rawTags.split(",")) {
    const normalized = tag.trim().toLowerCase()
    if (normalized.length > 0) {
      tags.add(normalized)
    }
  }

  return [...tags]
}

function parseFavoriteFilter(request: Request): boolean {
  return new URL(request.url).searchParams.get("favorite") === "true"
}

export async function handleItemsRequest(
  request: Request,
  env: WorkerEnv,
  id: string | null,
  action: string | null,
): Promise<Response> {
  try {
    const repository = new ItemRepository(env.DB)

    if (id === null) {
      switch (request.method) {
        case "GET":
          return Response.json({
            items: (
              await repository.list({
                tagNames: parseTagFilter(request),
                favoriteOnly: parseFavoriteFilter(request),
              })
            ).map(itemResponse),
          })
        case "POST": {
          const input = parseCreateItem(await readJson(request))
          return Response.json(
            { item: itemResponse(await repository.create(input)) },
            { status: 201 },
          )
        }
        default:
          return methodNotAllowed()
      }
    }

    if (action !== null) {
      if (action !== "favorite") {
        return itemNotFound()
      }
      if (request.method !== "POST") {
        return methodNotAllowed()
      }

      const item = await repository.get(id)
      if (item === null) {
        return itemNotFound()
      }

      const favorite = parseFavoriteItem(await readJson(request))
      const updatedItem = await repository.updateFavorite(id, favorite)
      return updatedItem === null
        ? itemNotFound()
        : Response.json({ item: itemResponse(updatedItem) })
    }

    switch (request.method) {
      case "GET": {
        const item = await repository.get(id)
        return item === null ? itemNotFound() : Response.json({ item: itemResponse(item) })
      }
      case "PATCH": {
        const item = await repository.get(id)
        if (item === null) {
          return itemNotFound()
        }

        const input = parsePatchItem(await readJson(request), item)
        const updatedItem = await repository.update(id, input)
        if (
          updatedItem !== null &&
          input.imageAssetId !== undefined &&
          item.imageKey !== updatedItem.imageKey
        ) {
          await deleteAssetObjectAndMetadata(env.DB, env.PREVIEWS, item.imageKey)
        }
        return updatedItem === null
          ? itemNotFound()
          : Response.json({ item: itemResponse(updatedItem) })
      }
      case "DELETE": {
        const item = await repository.get(id)
        if (item === null) {
          return itemNotFound()
        }
        const deleted = await repository.delete(id)
        if (!deleted) {
          return itemNotFound()
        }
        await deleteAssetObjectAndMetadata(env.DB, env.PREVIEWS, item.imageKey)
        return Response.json({ ok: true })
      }
      default:
        return methodNotAllowed()
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }
    throw error
  }
}
