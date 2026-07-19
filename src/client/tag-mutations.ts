import { submitJson } from "./api-client"

type PatchTagRequest = {
  readonly name?: string
  readonly color?: string
  readonly keywords?: readonly string[]
}

type CreateTagRequest = {
  readonly name: string
  readonly color: string
  readonly keywords: readonly string[]
}

export async function updateTag(id: string, input: PatchTagRequest): Promise<void> {
  await submitJson(`/api/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function createTag(input: CreateTagRequest): Promise<void> {
  await submitJson("/api/tags", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function deleteTag(id: string): Promise<void> {
  await submitJson(`/api/tags/${id}`, { method: "DELETE" })
}

export async function mergeTags(sourceId: string, targetId: string): Promise<void> {
  await submitJson("/api/tags/merge", {
    method: "POST",
    body: JSON.stringify({ sourceId, targetId }),
  })
}
