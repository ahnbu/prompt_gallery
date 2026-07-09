import { env } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { handleRequest } from "./index"

async function apiRequest(method: string, path: string, body?: object): Promise<Response> {
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

function tagNames(value: object): readonly string[] {
  return arrayField(value, "tags").map((tag) => stringField(objectField({ tag }, "tag"), "name"))
}

function tagSources(value: object, name: string): readonly string[] {
  const tag = arrayField(value, "tags")
    .map((entry) => objectField({ entry }, "entry"))
    .find((entry) => stringField(entry, "name") === name)
  if (tag === undefined) {
    return []
  }

  return arrayField(tag, "sources").map((source) => stringField({ source }, "source"))
}

async function getItem(id: string): Promise<object> {
  const response = await apiRequest("GET", `/api/items/${id}`)
  expect(response.status).toBe(200)

  return objectField(await response.json(), "item")
}

async function createTag(name: string, keywords: readonly string[] = []): Promise<string> {
  const response = await apiRequest("POST", "/api/tags", {
    name,
    color: "#3366cc",
    keywords,
  })
  expect(response.status).toBe(201)

  const payload: unknown = await response.json()
  return stringField(objectField(payload, "tag"), "id")
}

async function createPrompt(body: string, tags?: readonly string[]): Promise<object> {
  const payload = tags === undefined ? { type: "prompt", body } : { type: "prompt", body, tags }
  const response = await apiRequest("POST", "/api/items", payload)
  expect(response.status).toBe(201)

  return objectField(await response.json(), "item")
}

function itemTitles(value: unknown): readonly string[] {
  return arrayField(value, "items").map((item) =>
    stringField(objectField({ item }, "item"), "title"),
  )
}

describe("tags API", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM item_tags").run()
    await env.DB.prepare("DELETE FROM tag_keywords").run()
    await env.DB.prepare("DELETE FROM tags").run()
    await env.DB.prepare("DELETE FROM items").run()
  })

  it("returns only items containing every selected tag when listing with tags query", async () => {
    // Given: two tags and items that match one or both tags
    await createTag("research", ["research"])
    await createTag("slides", ["slides"])
    const both = await createPrompt("Research slides for AI workshop")
    await createPrompt("Research memo only")
    await createPrompt("Slides outline only")

    // When: items are filtered by both tag names
    const response = await apiRequest("GET", "/api/items?tags=research,slides")

    // Then: only the item joined to both tags is returned
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      items: [{ id: stringField(both, "id"), title: "Research slides for AI workshop" }],
    })
  })

  it("applies keyword tags automatically when an item is saved without manual tags", async () => {
    // Given: a tag with a keyword rule
    await createTag("research", ["market map"])

    // When: an item body contains the keyword
    const item = await createPrompt("Draft a market map for AI education")

    // Then: the matching tag is attached to the saved item
    expect(tagNames(item)).toEqual(["research"])
  })

  it("keeps automatic tags separate from manual tag edits", async () => {
    // Given: an automatic tag and a manually selected tag
    await createTag("research", ["research"])
    await createTag("slides")
    const item = await createPrompt("Research brief", ["slides"])
    const itemId = stringField(item, "id")

    // When: the item is updated to remove all manual tags
    const response = await apiRequest("PATCH", `/api/items/${itemId}`, {
      tags: [],
    })

    // Then: manual selection is cleared, but automatic rules still apply
    expect(response.status).toBe(200)
    const updated = objectField(await response.json(), "item")
    expect(tagNames(updated)).toEqual(["research"])
    expect(tagSources(updated, "research")).toEqual(["auto"])

    const persisted = await getItem(itemId)
    expect(tagNames(persisted)).toEqual(["research"])
    expect(tagSources(persisted, "research")).toEqual(["auto"])
  })

  it("returns one tag with both manual and automatic sources when both apply", async () => {
    // Given: a tag selected manually and matched by keyword
    await createTag("research", ["research"])

    // When: the item is saved with the tag and text containing the keyword
    const item = await createPrompt("Research brief", ["research"])

    // Then: the response keeps one chip and reports both assignment sources
    expect(tagNames(item)).toEqual(["research"])
    expect(tagSources(item, "research")).toEqual(["manual", "auto"])
  })

  it("rejects unknown manual tags on create without persisting the item", async () => {
    // Given: no tag named missing-tag exists
    const body = "Missing tag should not persist"

    // When: an item is created with an unknown manual tag
    const response = await apiRequest("POST", "/api/items", {
      type: "prompt",
      body,
      tags: ["missing-tag"],
    })
    const listResponse = await apiRequest("GET", "/api/items")
    const row = await env.DB.prepare("SELECT COUNT(*) AS count FROM items WHERE body = ?")
      .bind(body)
      .first<{ readonly count: number }>()

    // Then: the JSON error is returned and no item is visible or stored
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: { code: "invalid_item", message: "Unknown tag: missing-tag." },
    })
    expect(listResponse.status).toBe(200)
    expect(itemTitles(await listResponse.json())).not.toContain(body)
    expect(row?.count ?? 0).toBe(0)
  })

  it("rejects unknown manual tags on update without changing fields or tags", async () => {
    // Given: an item with a valid manual tag
    await createTag("research")
    const item = await createPrompt("Original body", ["research"])
    const itemId = stringField(item, "id")

    // When: the item is patched with an unknown manual tag and field changes
    const response = await apiRequest("PATCH", `/api/items/${itemId}`, {
      title: "Invalid patch title",
      notes: "Invalid patch note",
      tags: ["missing-tag"],
    })
    const getResponse = await apiRequest("GET", `/api/items/${itemId}`)

    // Then: the JSON error is returned and the original item remains intact
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: { code: "invalid_item", message: "Unknown tag: missing-tag." },
    })
    expect(getResponse.status).toBe(200)
    await expect(getResponse.json()).resolves.toMatchObject({
      item: {
        id: itemId,
        title: "Original body",
        notes: null,
        tags: [{ name: "research" }],
      },
    })
  })

  it("renames a tag and preserves its keywords", async () => {
    // Given: an existing tag with keyword rules
    const tagId = await createTag("research", ["scan"])

    // When: the tag is renamed
    const response = await apiRequest("PATCH", `/api/tags/${tagId}`, { name: "analysis" })

    // Then: the catalog returns the new name and existing keyword
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      tag: { id: tagId, name: "analysis", keywords: ["scan"] },
    })
  })

  it("replaces tag keywords through one API update path", async () => {
    // Given: an existing tag with old keyword rules
    const tagId = await createTag("research", ["old rule", "draft"])

    // When: the tag keyword list is replaced
    const response = await apiRequest("PATCH", `/api/tags/${tagId}`, {
      keywords: ["new rule"],
    })
    const oldMatch = await createPrompt("This text has the old rule")
    const newMatch = await createPrompt("This text has the new rule")

    // Then: only the replacement keyword remains observable
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      tag: { id: tagId, keywords: ["new rule"] },
    })
    expect(tagNames(oldMatch)).toEqual([])
    expect(tagNames(newMatch)).toEqual(["research"])
  })

  it("recomputes automatic assignments for existing items when keywords change", async () => {
    // Given: existing items before a keyword rule is changed
    const tagId = await createTag("research", ["old rule"])
    const oldMatch = await createPrompt("This text has the old rule")
    const newMatch = await createPrompt("This text has the new rule")
    const manual = await createPrompt("Manual research note", ["research"])

    // When: the rule is replaced
    const response = await apiRequest("PATCH", `/api/tags/${tagId}`, {
      keywords: ["new rule"],
    })

    // Then: automatic assignments are removed and added in bulk while manual tags remain
    expect(response.status).toBe(200)
    expect(tagNames(await getItem(stringField(oldMatch, "id")))).toEqual([])
    const newMatchAfter = await getItem(stringField(newMatch, "id"))
    expect(tagNames(newMatchAfter)).toEqual(["research"])
    expect(tagSources(newMatchAfter, "research")).toEqual(["auto"])
    const manualAfter = await getItem(stringField(manual, "id"))
    expect(tagNames(manualAfter)).toEqual(["research"])
    expect(tagSources(manualAfter, "research")).toEqual(["manual"])
  })

  it("protects tags from deletion while they are used by items", async () => {
    // Given: a tag currently assigned to an item
    const tagId = await createTag("research")
    await createPrompt("Manual research item", ["research"])

    // When: the tag is deleted
    const response = await apiRequest("DELETE", `/api/tags/${tagId}`)

    // Then: the API rejects deletion with a JSON conflict error
    expect(response.status).toBe(409)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "tag_in_use",
        message: "Tag cannot be deleted while it is assigned to items.",
      },
    })
  })

  it("merges a source tag into a target tag and moves item assignments", async () => {
    // Given: two tags assigned to different items
    const sourceId = await createTag("draft", ["draft"])
    const targetId = await createTag("research", ["research"])
    const sourceItem = await createPrompt("Draft notes")
    const targetItem = await createPrompt("Research notes")

    // When: the source tag is merged into the target tag
    const response = await apiRequest("POST", "/api/tags/merge", {
      sourceId,
      targetId,
    })
    const filtered = await apiRequest("GET", "/api/items?tags=research")
    const mergePayload: unknown = await response.json()
    const mergedTag = objectField(mergePayload, "tag")
    const keywords = arrayField(mergedTag, "keywords").map((keyword) =>
      stringField({ keyword }, "keyword"),
    )
    const filteredPayload: unknown = await filtered.json()
    const itemIds = arrayField(filteredPayload, "items").map((item) =>
      stringField(objectField({ item }, "item"), "id"),
    )

    // Then: source assignments move to the target tag and the source tag is removed
    expect(response.status).toBe(200)
    expect(mergedTag).toMatchObject({ id: targetId, name: "research" })
    expect(keywords).toEqual(["draft", "research"])
    expect(filtered.status).toBe(200)
    expect(itemIds).toEqual([stringField(targetItem, "id"), stringField(sourceItem, "id")])
  })
})
