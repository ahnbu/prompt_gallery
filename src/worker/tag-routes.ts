import type { WorkerEnv } from "./index"
import { readJson } from "./item-input"
import { ApiError, errorResponse } from "./item-types"
import { parseCreateTag, parseMergeTags, parsePatchTag } from "./tag-input"
import { TagRepository } from "./tag-repository"

function methodNotAllowed(): Response {
  return errorResponse(new ApiError("method_not_allowed", "Method not allowed.", 405))
}

function tagNotFound(): Response {
  return errorResponse(new ApiError("not_found", "Tag not found.", 404))
}

export async function handleTagsRequest(
  request: Request,
  env: WorkerEnv,
  id: string | null,
): Promise<Response> {
  try {
    const repository = new TagRepository(env.DB)

    if (id === "merge") {
      if (request.method !== "POST") {
        return methodNotAllowed()
      }

      return Response.json({ tag: await repository.merge(parseMergeTags(await readJson(request))) })
    }

    if (id === null) {
      switch (request.method) {
        case "GET":
          return Response.json({ tags: await repository.list() })
        case "POST":
          return Response.json(
            { tag: await repository.create(parseCreateTag(await readJson(request))) },
            { status: 201 },
          )
        default:
          return methodNotAllowed()
      }
    }

    switch (request.method) {
      case "PATCH": {
        const tag = await repository.update(id, parsePatchTag(await readJson(request)))
        return tag === null ? tagNotFound() : Response.json({ tag })
      }
      case "DELETE":
        return (await repository.delete(id)) ? Response.json({ ok: true }) : tagNotFound()
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
