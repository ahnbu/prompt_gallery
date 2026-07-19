import { submitJson } from "./api-client"
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
