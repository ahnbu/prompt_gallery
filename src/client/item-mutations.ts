import { submitJson, submitJsonForResult } from "./api-client"
import { type Item, type ItemType, parseItemResponse } from "./gallery-data"

type CreateItemRequest = {
  readonly type: ItemType
  readonly title: string | null
  readonly body: string | null
  readonly notes: string | null
  readonly githubUrl: string | null
  readonly imageAssetId?: string | null
  readonly tags: readonly string[]
}

type PatchItemRequest = Omit<CreateItemRequest, "type">

export async function createItem(input: CreateItemRequest): Promise<void> {
  await submitJson("/api/items", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateItem(id: string, input: PatchItemRequest): Promise<Item> {
  const payload = await submitJsonForResult(`/api/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
  return parseItemResponse(payload)
}

export async function deleteItem(id: string): Promise<void> {
  await submitJson(`/api/items/${id}`, { method: "DELETE" })
}

export async function updateItemFavorite(id: string, favorite: boolean): Promise<Item> {
  const payload = await submitJsonForResult(`/api/items/${id}/favorite`, {
    method: "POST",
    body: JSON.stringify({ favorite }),
  })
  return parseItemResponse(payload)
}

export async function fetchItem(id: string): Promise<Item> {
  const payload = await submitJsonForResult(`/api/items/${id}`, { method: "GET" })
  return parseItemResponse(payload)
}
