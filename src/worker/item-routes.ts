import type { WorkerEnv } from "./index"
import { parseCreateItem, parseFavoriteItem, parsePatchItem, readJson } from "./item-input"
import { ItemRepository } from "./item-repository"
import { ApiError, errorResponse } from "./item-types"

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
            items: await repository.list({
              tagNames: parseTagFilter(request),
              favoriteOnly: parseFavoriteFilter(request),
            }),
          })
        case "POST": {
          const input = parseCreateItem(await readJson(request))
          return Response.json({ item: await repository.create(input) }, { status: 201 })
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
      return updatedItem === null ? itemNotFound() : Response.json({ item: updatedItem })
    }

    switch (request.method) {
      case "GET": {
        const item = await repository.get(id)
        return item === null ? itemNotFound() : Response.json({ item })
      }
      case "PATCH": {
        const item = await repository.get(id)
        if (item === null) {
          return itemNotFound()
        }

        const input = parsePatchItem(await readJson(request), item)
        const updatedItem = await repository.update(id, input)
        return updatedItem === null ? itemNotFound() : Response.json({ item: updatedItem })
      }
      case "DELETE":
        return (await repository.delete(id)) ? Response.json({ ok: true }) : itemNotFound()
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
