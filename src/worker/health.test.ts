import { describe, expect, it } from "vitest"
import { handleRequest } from "./index"

describe("GET /api/health", () => {
  it("returns ok JSON when the health endpoint is requested", async () => {
    const request = new Request("https://prompt-gallery.test/api/health")

    const response = await handleRequest(request)

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })
  })
})
