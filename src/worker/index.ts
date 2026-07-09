import { handleAssetsRequest } from "./asset-routes"
import { handleItemsRequest } from "./item-routes"
import { handleTagsRequest } from "./tag-routes"
import { handleWorkflowsRequest } from "./workflow-routes"

export type WorkerEnv = {
  readonly ASSETS: Fetcher
  readonly DB: D1Database
  readonly PREVIEWS: R2Bucket
}

export function handleRequest(request: Request, env?: WorkerEnv): Response | Promise<Response> {
  const url = new URL(request.url)
  const pathParts = url.pathname.split("/").filter((part) => part.length > 0)

  if (url.pathname === "/api/health") {
    return Response.json({ ok: true })
  }

  if (pathParts[0] === "api" && pathParts[1] === "items" && pathParts.length <= 4) {
    if (env === undefined) {
      return Response.json(
        { error: { code: "server_error", message: "Worker environment is unavailable." } },
        { status: 500 },
      )
    }
    return handleItemsRequest(request, env, pathParts[2] ?? null, pathParts[3] ?? null)
  }

  if (pathParts[0] === "api" && pathParts[1] === "assets" && pathParts.length <= 4) {
    if (env === undefined) {
      return Response.json(
        { error: { code: "server_error", message: "Worker environment is unavailable." } },
        { status: 500 },
      )
    }
    return handleAssetsRequest(request, env, pathParts[2] ?? null, pathParts[3] ?? null)
  }

  if (pathParts[0] === "api" && pathParts[1] === "tags" && pathParts.length <= 3) {
    if (env === undefined) {
      return Response.json(
        { error: { code: "server_error", message: "Worker environment is unavailable." } },
        { status: 500 },
      )
    }
    return handleTagsRequest(request, env, pathParts[2] ?? null)
  }

  if (pathParts[0] === "api" && pathParts[1] === "workflows" && pathParts.length <= 3) {
    if (env === undefined) {
      return Response.json(
        { error: { code: "server_error", message: "Worker environment is unavailable." } },
        { status: 500 },
      )
    }
    return handleWorkflowsRequest(request, env, pathParts[2] ?? null)
  }

  return new Response("Not found", { status: 404 })
}

export default {
  fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith("/api/")) {
      return handleRequest(request, env)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<WorkerEnv>
