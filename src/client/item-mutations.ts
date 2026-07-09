import type { ItemType } from "./gallery-data"

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

class ItemMutationError extends Error {}

async function errorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return `Request failed with ${response.status}.`
    }
    throw error
  }

  return `Request failed with ${response.status}.`
}

async function submitJson(pathname: string, init: RequestInit): Promise<void> {
  const response = await fetch(pathname, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  })
  if (!response.ok) {
    throw new ItemMutationError(await errorMessage(response))
  }
}

export async function createItem(input: CreateItemRequest): Promise<void> {
  await submitJson("/api/items", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateItem(id: string, input: PatchItemRequest): Promise<void> {
  await submitJson(`/api/items/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteItem(id: string): Promise<void> {
  await submitJson(`/api/items/${id}`, { method: "DELETE" })
}

export async function updateItemFavorite(id: string, favorite: boolean): Promise<void> {
  await submitJson(`/api/items/${id}/favorite`, {
    method: "POST",
    body: JSON.stringify({ favorite }),
  })
}
