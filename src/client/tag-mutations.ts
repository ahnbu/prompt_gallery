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

class TagMutationError extends Error {}

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
    throw new TagMutationError(await errorMessage(response))
  }
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
