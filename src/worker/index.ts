export type WorkerEnv = {
  readonly ASSETS: Fetcher
  readonly DB: D1Database
  readonly PREVIEWS: R2Bucket
}

export function handleRequest(request: Request): Response {
  const url = new URL(request.url)

  if (url.pathname === "/api/health") {
    return Response.json({ ok: true })
  }

  return new Response("Not found", { status: 404 })
}

export default {
  fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname.startsWith("/api/")) {
      return handleRequest(request)
    }

    return env.ASSETS.fetch(request)
  },
} satisfies ExportedHandler<WorkerEnv>
