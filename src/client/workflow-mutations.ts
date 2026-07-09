import type { WorkflowStepKind } from "./gallery-data"

export type WorkflowStepRequest = {
  readonly kind: WorkflowStepKind
  readonly position: number
  readonly itemId?: string
  readonly memo?: string
  readonly url?: string
}

export type WorkflowRequest = {
  readonly name: string
  readonly notes: string | null
  readonly steps: readonly WorkflowStepRequest[]
}

class WorkflowMutationError extends Error {}

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
    throw new WorkflowMutationError(await errorMessage(response))
  }
}

export async function createWorkflow(input: WorkflowRequest): Promise<void> {
  await submitJson("/api/workflows", {
    method: "POST",
    body: JSON.stringify(input),
  })
}

export async function updateWorkflow(id: string, input: WorkflowRequest): Promise<void> {
  await submitJson(`/api/workflows/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  })
}

export async function deleteWorkflow(id: string): Promise<void> {
  await submitJson(`/api/workflows/${id}`, { method: "DELETE" })
}
