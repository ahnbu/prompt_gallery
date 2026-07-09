import { env } from "cloudflare:test"
import { beforeEach, describe, expect, it } from "vitest"
import { apiRequest, clearPreviewBucket } from "./asset-test-support"

async function createTag(name: string): Promise<string> {
  const response = await apiRequest("POST", "/api/tags", {
    name,
    color: "#3366cc",
    keywords: ["export"],
  })
  expect(response.status).toBe(201)
  const payload: unknown = await response.json()
  if (
    typeof payload !== "object" ||
    payload === null ||
    typeof Reflect.get(Reflect.get(payload, "tag") ?? {}, "id") !== "string"
  ) {
    throw new Error("Tag response did not include tag.id")
  }
  return Reflect.get(Reflect.get(payload, "tag") ?? {}, "id") as string
}

describe("export API", () => {
  beforeEach(async () => {
    await clearPreviewBucket()
    await env.DB.prepare("DELETE FROM assets").run()
    await env.DB.prepare("DELETE FROM workflow_steps").run()
    await env.DB.prepare("DELETE FROM workflows").run()
    await env.DB.prepare("DELETE FROM item_tags").run()
    await env.DB.prepare("DELETE FROM tag_keywords").run()
    await env.DB.prepare("DELETE FROM tags").run()
    await env.DB.prepare("DELETE FROM items").run()
  })

  it("returns a schema-versioned full export without public R2 object keys", async () => {
    const tagName = `export-${crypto.randomUUID()}`
    await createTag(tagName)
    const itemId = crypto.randomUUID()
    const assetId = crypto.randomUUID()
    const workflowId = crypto.randomUUID()
    const stepId = crypto.randomUUID()
    const objectKey = `previews/${assetId}.png`
    await env.DB.prepare(
      "INSERT INTO items (id, type, title, body, favorite, image_key) VALUES (?, ?, ?, ?, ?, ?)",
    )
      .bind(itemId, "image_prompt", "Export image prompt", "Export this prompt", 0, objectKey)
      .run()
    await env.DB.prepare(
      "INSERT INTO assets (id, item_id, object_key, filename, content_type, size_bytes, hash) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(assetId, itemId, objectKey, "preview.png", "image/png", 16, "hash")
      .run()
    await env.DB.prepare("INSERT INTO workflows (id, name, notes) VALUES (?, ?, ?)")
      .bind(workflowId, "Export workflow", null)
      .run()
    await env.DB.prepare(
      "INSERT INTO workflow_steps (id, workflow_id, position, kind, item_id) VALUES (?, ?, ?, ?, ?)",
    )
      .bind(stepId, workflowId, 1, "prompt", itemId)
      .run()

    const response = await apiRequest("GET", "/api/export")

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    expect(response.headers.get("content-disposition")).toContain("prompt-gallery-export.json")
    const payload: unknown = await response.json()
    expect(payload).toMatchObject({
      schemaVersion: 1,
      app: "prompt-gallery",
      items: [
        { id: itemId, title: "Export image prompt", contentUrl: `/api/assets/${assetId}/content` },
      ],
      tags: [{ name: tagName }],
      workflows: [{ name: "Export workflow", steps: [{ kind: "prompt", itemId, position: 1 }] }],
      assets: [{ id: assetId, contentUrl: `/api/assets/${assetId}/content` }],
    })
    expect(JSON.stringify(payload)).not.toContain(objectKey)
  })
})
