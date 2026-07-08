import { env } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { handleRequest } from "./index"

type RequestBody = object | string

async function apiRequest(method: string, path: string, body?: RequestBody): Promise<Response> {
  const requestInit =
    body === undefined
      ? { method }
      : {
          method,
          headers: { "content-type": "application/json" },
          body: typeof body === "string" ? body : JSON.stringify(body),
        }

  return handleRequest(new Request(`https://prompt-gallery.test${path}`, requestInit), env)
}

function objectField(value: unknown, key: string): object {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Expected object while reading ${key}.`)
  }

  const field = Reflect.get(value, key)
  if (typeof field !== "object" || field === null || Array.isArray(field)) {
    throw new Error(`Expected ${key} to be an object.`)
  }

  return field
}

function arrayField(value: unknown, key: string): readonly unknown[] {
  if (typeof value !== "object" || value === null) {
    throw new Error(`Expected object while reading ${key}.`)
  }

  const field = Reflect.get(value, key)
  if (!Array.isArray(field)) {
    throw new Error(`Expected ${key} to be an array.`)
  }

  return field
}

function stringField(value: object, key: string): string {
  const field = Reflect.get(value, key)
  if (typeof field !== "string") {
    throw new Error(`Expected ${key} to be a string.`)
  }

  return field
}

async function createItem(body: object): Promise<string> {
  const response = await apiRequest("POST", "/api/items", body)
  expect(response.status).toBe(201)

  const payload: unknown = await response.json()
  return stringField(objectField(payload, "item"), "id")
}

function itemTitles(value: unknown): readonly string[] {
  return arrayField(value, "items").map((item) =>
    stringField(objectField({ item }, "item"), "title"),
  )
}

describe("favorites API", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM item_tags").run()
    await env.DB.prepare("DELETE FROM tags").run()
    await env.DB.prepare("DELETE FROM items").run()
  })

  it("toggles an item favorite on and off through the dedicated endpoint", async () => {
    // Given: a stored prompt item
    const itemId = await createItem({ type: "prompt", body: "Toggle favorite prompt" })

    // When: the item favorite flag is toggled on and then off
    const onResponse = await apiRequest("POST", `/api/items/${itemId}/favorite`, {
      favorite: true,
    })
    const offResponse = await apiRequest("POST", `/api/items/${itemId}/favorite`, {
      favorite: false,
    })

    // Then: each response returns the updated item state
    expect(onResponse.status).toBe(200)
    await expect(onResponse.json()).resolves.toMatchObject({
      item: { id: itemId, favorite: true },
    })
    expect(offResponse.status).toBe(200)
    await expect(offResponse.json()).resolves.toMatchObject({
      item: { id: itemId, favorite: false },
    })
  })

  it("lists favorite prompts, image prompts, and repos across all item types", async () => {
    // Given: favorite items across every supported item type plus one non-favorite item
    const promptId = await createItem({ type: "prompt", body: "Favorite prompt" })
    const imagePromptId = await createItem({ type: "image_prompt", body: "Favorite image prompt" })
    const repoId = await createItem({
      type: "repo",
      title: "Favorite repo",
      githubUrl: "https://github.com/example/favorite-repo",
    })
    await createItem({ type: "prompt", body: "Ordinary prompt" })
    await apiRequest("POST", `/api/items/${promptId}/favorite`, { favorite: true })
    await apiRequest("POST", `/api/items/${imagePromptId}/favorite`, { favorite: true })
    await apiRequest("POST", `/api/items/${repoId}/favorite`, { favorite: true })

    // When: the special favorite list filter is applied
    const response = await apiRequest("GET", "/api/items?favorite=true")

    // Then: only favorite items are returned, without treating favorite as an item type
    expect(response.status).toBe(200)
    expect(itemTitles(await response.json())).toEqual([
      "Favorite repo",
      "Favorite image prompt",
      "Favorite prompt",
    ])
  })

  it("returns a JSON 404 for an unknown favorite target", async () => {
    // Given: no item exists for the requested id
    const missingId = "missing-favorite-id"

    // When: favorite is toggled for the missing item
    const response = await apiRequest("POST", `/api/items/${missingId}/favorite`, {
      favorite: true,
    })

    // Then: the shared JSON not found contract is returned
    expect(response.status).toBe(404)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "not_found",
        message: "Item not found.",
      },
    })
  })

  it("rejects malformed favorite bodies with JSON 400 responses", async () => {
    // Given: a stored item and malformed favorite request bodies
    const itemId = await createItem({ type: "prompt", body: "Malformed favorite prompt" })

    // When: the endpoint receives an invalid field type and invalid JSON
    const invalidFieldResponse = await apiRequest("POST", `/api/items/${itemId}/favorite`, {
      favorite: "yes",
    })
    const invalidJsonResponse = await apiRequest("POST", `/api/items/${itemId}/favorite`, "{")

    // Then: both failures are reported as JSON 400 errors
    expect(invalidFieldResponse.status).toBe(400)
    await expect(invalidFieldResponse.json()).resolves.toEqual({
      error: {
        code: "invalid_item",
        message: "favorite must be a boolean.",
      },
    })
    expect(invalidJsonResponse.status).toBe(400)
    await expect(invalidJsonResponse.json()).resolves.toEqual({
      error: {
        code: "invalid_json",
        message: "Request body must be valid JSON.",
      },
    })
  })
})
