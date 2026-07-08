import { env } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { handleRequest } from "./index"

async function itemRequest(method: string, path: string, body?: object): Promise<Response> {
  const requestInit =
    body === undefined
      ? { method }
      : {
          method,
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }

  return handleRequest(new Request(`https://prompt-gallery.test${path}`, requestInit), env)
}

function readString(value: unknown, key: string): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined
  }

  const field = Reflect.get(value, key)
  return typeof field === "string" ? field : undefined
}

function readNestedString(value: unknown, parentKey: string, childKey: string): string | undefined {
  if (typeof value !== "object" || value === null) {
    return undefined
  }

  return readString(Reflect.get(value, parentKey), childKey)
}

async function createItem(body: object): Promise<string> {
  const response = await itemRequest("POST", "/api/items", body)
  expect(response.status).toBe(201)

  const payload: unknown = await response.json()
  const id = readNestedString(payload, "item", "id")
  if (id === undefined) {
    throw new Error("Created item response did not include item.id")
  }

  return id
}

describe("items API", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM items").run()
  })

  it("creates a prompt with fallback title when only body is supplied", async () => {
    // Given: a prompt body without an explicit title
    const body = { type: "prompt", body: "Draft a launch plan for the new workshop" }

    // When: the item is created through the Worker API
    const response = await itemRequest("POST", "/api/items", body)

    // Then: the prompt is persisted with a body-derived title
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      item: {
        type: "prompt",
        title: "Draft a launch plan for the new workshop",
        body: "Draft a launch plan for the new workshop",
        favorite: false,
      },
    })
  })

  it("rejects prompt-like items when body is missing", async () => {
    // Given: an image prompt request without body text
    const body = { type: "image_prompt", title: "Missing body" }

    // When: the request crosses the API boundary
    const response = await itemRequest("POST", "/api/items", body)

    // Then: a typed JSON error contract is returned
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_item",
        message: "Prompt and image prompt items require body.",
      },
    })
  })

  it("lists items latest-first by updated time", async () => {
    // Given: two stored items with deterministic updated timestamps
    const olderId = await createItem({ type: "prompt", body: "Older prompt" })
    const newerId = await createItem({
      type: "repo",
      title: "Newer repo",
      githubUrl: "https://github.com/example/repo",
    })
    await env.DB.prepare("UPDATE items SET updated_at = ? WHERE id = ?")
      .bind("2026-07-08T00:00:00.000Z", olderId)
      .run()
    await env.DB.prepare("UPDATE items SET updated_at = ? WHERE id = ?")
      .bind("2026-07-08T00:00:01.000Z", newerId)
      .run()

    // When: items are listed through the API
    const response = await itemRequest("GET", "/api/items")

    // Then: the newest updated item is first
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: newerId }, { id: olderId }],
    })
  })

  it("gets, updates, and deletes an item by id", async () => {
    // Given: a stored prompt item
    const id = await createItem({ type: "prompt", body: "Initial body", notes: "First note" })

    // When: the item is read, updated, and deleted through item routes
    const getResponse = await itemRequest("GET", `/api/items/${id}`)
    const patchResponse = await itemRequest("PATCH", `/api/items/${id}`, {
      title: "Updated title",
      notes: "Updated note",
      favorite: true,
      imageKey: "previews/item.webp",
    })
    const deleteResponse = await itemRequest("DELETE", `/api/items/${id}`)
    const missingResponse = await itemRequest("GET", `/api/items/${id}`)

    // Then: each route returns the expected JSON contract
    expect(getResponse.status).toBe(200)
    await expect(getResponse.json()).resolves.toMatchObject({
      item: { id, title: "Initial body", notes: "First note" },
    })
    expect(patchResponse.status).toBe(200)
    await expect(patchResponse.json()).resolves.toMatchObject({
      item: {
        id,
        title: "Updated title",
        notes: "Updated note",
        favorite: true,
        imageKey: "previews/item.webp",
      },
    })
    expect(deleteResponse.status).toBe(200)
    await expect(deleteResponse.json()).resolves.toEqual({ ok: true })
    expect(missingResponse.status).toBe(404)
    await expect(missingResponse.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Item not found.",
      },
    })
  })
})
