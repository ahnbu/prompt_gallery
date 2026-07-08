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
  const response = await apiRequest("POST", "/api/items", body)
  expect(response.status).toBe(201)

  const payload: unknown = await response.json()
  const id = readNestedString(payload, "item", "id")
  if (id === undefined) {
    throw new Error("Created item response did not include item.id")
  }

  return id
}

async function createWorkflow(body: object): Promise<string> {
  const response = await apiRequest("POST", "/api/workflows", body)
  expect(response.status).toBe(201)

  const payload: unknown = await response.json()
  const id = readNestedString(payload, "workflow", "id")
  if (id === undefined) {
    throw new Error("Created workflow response did not include workflow.id")
  }

  return id
}

describe("workflows API", () => {
  beforeEach(async () => {
    await env.DB.prepare("DELETE FROM workflow_steps").run()
    await env.DB.prepare("DELETE FROM workflows").run()
    await env.DB.prepare("DELETE FROM items").run()
  })

  it("creates a valid workflow with prompt, repo, memo, and link steps", async () => {
    // Given: stored prompt and repo items plus a four-step workflow request
    const promptId = await createItem({ type: "prompt", body: "Research prompt" })
    const repoId = await createItem({
      type: "repo",
      title: "Repo",
      githubUrl: "https://github.com/example/example",
    })
    const body = {
      name: "Research flow",
      steps: [
        { kind: "prompt", itemId: promptId, position: 1 },
        { kind: "repo", itemId: repoId, position: 2 },
        { kind: "memo", memo: "Check sources", position: 3 },
        { kind: "link", url: "https://example.com", position: 4 },
      ],
    }

    // When: the workflow is created through the Worker API
    const response = await apiRequest("POST", "/api/workflows", body)

    // Then: the workflow and all typed steps are returned
    expect(response.status).toBe(201)
    await expect(response.json()).resolves.toMatchObject({
      workflow: {
        name: "Research flow",
        steps: [
          { kind: "prompt", itemId: promptId, position: 1 },
          { kind: "repo", itemId: repoId, position: 2 },
          { kind: "memo", memo: "Check sources", position: 3 },
          { kind: "link", url: "https://example.com", position: 4 },
        ],
      },
    })
  })

  it("returns a workflow when a referenced prompt item was deleted", async () => {
    // Given: a workflow step referencing a prompt item that is later deleted
    const promptId = await createItem({ type: "prompt", body: "Temporary prompt" })
    const id = await createWorkflow({
      name: "Stale reference flow",
      steps: [
        { kind: "memo", memo: "Still readable", position: 2 },
        { kind: "prompt", itemId: promptId, position: 1 },
      ],
    })

    // When: the referenced item is deleted and the workflow is read back
    const deleteResponse = await apiRequest("DELETE", `/api/items/${promptId}`)
    const response = await apiRequest("GET", `/api/workflows/${id}`)

    // Then: the stale reference is represented explicitly instead of producing HTTP 500
    expect(deleteResponse.status).toBe(200)
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      workflow: {
        id,
        steps: [
          { kind: "prompt", itemId: null, position: 1 },
          { kind: "memo", memo: "Still readable", position: 2 },
        ],
      },
    })
  })

  it("rejects a workflow when name is missing", async () => {
    // Given: a workflow body without a usable name
    const body = { steps: [{ kind: "memo", memo: "Check sources", position: 1 }] }

    // When: the request crosses the workflow boundary
    const response = await apiRequest("POST", "/api/workflows", body)

    // Then: a JSON 400 error is returned
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_workflow",
        message: "Workflow name is required.",
      },
    })
  })

  it("rejects a workflow with zero steps", async () => {
    // Given: a named workflow with no steps
    const body = { name: "Empty flow", steps: [] }

    // When: the workflow is submitted
    const response = await apiRequest("POST", "/api/workflows", body)

    // Then: a JSON 400 error explains the step requirement
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_workflow",
        message: "Workflow requires at least one step.",
      },
    })
  })

  it("persists workflow steps ordered by position", async () => {
    // Given: a workflow request with unsorted step positions
    const id = await createWorkflow({
      name: "Ordered flow",
      steps: [
        { kind: "memo", memo: "Second", position: 2 },
        { kind: "memo", memo: "First", position: 1 },
      ],
    })

    // When: the workflow is read back
    const response = await apiRequest("GET", `/api/workflows/${id}`)

    // Then: steps are returned in numeric position order
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toMatchObject({
      workflow: {
        id,
        steps: [
          { kind: "memo", memo: "First", position: 1 },
          { kind: "memo", memo: "Second", position: 2 },
        ],
      },
    })
  })

  it("rejects repo items without a valid GitHub URL", async () => {
    // Given: a repo item request with a non-GitHub URL
    const body = { type: "repo", title: "Repo", githubUrl: "https://example.com/not-github" }

    // When: the item is submitted through the existing item API
    const response = await apiRequest("POST", "/api/items", body)

    // Then: the shared item error contract rejects it
    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toEqual({
      error: {
        code: "invalid_item",
        message: "Repo items require a valid GitHub URL.",
      },
    })
  })

  it("rejects invalid workflow step kinds and link URLs", async () => {
    // Given: malformed workflow steps
    const invalidKind = { name: "Bad kind", steps: [{ kind: "unknown", position: 1 }] }
    const invalidUrl = {
      name: "Bad link",
      steps: [{ kind: "link", url: "not-a-url", position: 1 }],
    }

    // When: each malformed request is submitted
    const kindResponse = await apiRequest("POST", "/api/workflows", invalidKind)
    const urlResponse = await apiRequest("POST", "/api/workflows", invalidUrl)

    // Then: both fail at the JSON API boundary
    expect(kindResponse.status).toBe(400)
    await expect(kindResponse.json()).resolves.toEqual({
      error: {
        code: "invalid_workflow",
        message: "Workflow step kind must be prompt, repo, memo, or link.",
      },
    })
    expect(urlResponse.status).toBe(400)
    await expect(urlResponse.json()).resolves.toEqual({
      error: {
        code: "invalid_workflow",
        message: "Link workflow steps require a valid URL.",
      },
    })
  })
})
