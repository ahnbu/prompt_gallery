export const WORKFLOW_STEP_KINDS = {
  PROMPT: "prompt",
  REPO: "repo",
  MEMO: "memo",
  LINK: "link",
} as const

export type WorkflowStepKind = (typeof WORKFLOW_STEP_KINDS)[keyof typeof WORKFLOW_STEP_KINDS]

type WorkflowStepBase = {
  readonly id: string
  readonly position: number
  readonly createdAt: string
  readonly updatedAt: string
}

export type WorkflowStep =
  | (WorkflowStepBase & {
      readonly kind: typeof WORKFLOW_STEP_KINDS.PROMPT
      readonly itemId: string | null
    })
  | (WorkflowStepBase & {
      readonly kind: typeof WORKFLOW_STEP_KINDS.REPO
      readonly itemId: string | null
    })
  | (WorkflowStepBase & {
      readonly kind: typeof WORKFLOW_STEP_KINDS.MEMO
      readonly memo: string
    })
  | (WorkflowStepBase & {
      readonly kind: typeof WORKFLOW_STEP_KINDS.LINK
      readonly url: string
    })

export type Workflow = {
  readonly id: string
  readonly name: string
  readonly notes: string | null
  readonly steps: readonly WorkflowStep[]
  readonly createdAt: string
  readonly updatedAt: string
}

export type WorkflowRow = {
  readonly id: string
  readonly name: string
  readonly notes: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type WorkflowStepRow = {
  readonly id: string
  readonly workflow_id: string
  readonly position: number
  readonly kind: WorkflowStepKind
  readonly item_id: string | null
  readonly memo: string | null
  readonly external_url: string | null
  readonly created_at: string
  readonly updated_at: string
}

export type CreateWorkflowReferenceStepInput = {
  readonly kind: typeof WORKFLOW_STEP_KINDS.PROMPT | typeof WORKFLOW_STEP_KINDS.REPO
  readonly position: number
  readonly itemId: string
}

export type CreateWorkflowMemoStepInput = {
  readonly kind: typeof WORKFLOW_STEP_KINDS.MEMO
  readonly position: number
  readonly memo: string
}

export type CreateWorkflowLinkStepInput = {
  readonly kind: typeof WORKFLOW_STEP_KINDS.LINK
  readonly position: number
  readonly url: string
}

export type CreateWorkflowStepInput =
  | CreateWorkflowReferenceStepInput
  | CreateWorkflowMemoStepInput
  | CreateWorkflowLinkStepInput

export type CreateWorkflowInput = {
  readonly name: string
  readonly notes: string | null
  readonly steps: readonly CreateWorkflowStepInput[]
}

export type PatchWorkflowInput = {
  readonly name?: string
  readonly notes?: string | null
  readonly steps?: readonly CreateWorkflowStepInput[]
}

class WorkflowPersistenceError extends Error {}

function assertNever(value: never): never {
  throw new WorkflowPersistenceError(`Unexpected workflow step kind: ${String(value)}`)
}

function requireStepValue(value: string | null, field: string): string {
  if (value === null) {
    throw new WorkflowPersistenceError(`Workflow step row is missing ${field}.`)
  }

  return value
}

export function rowToWorkflow(row: WorkflowRow, steps: readonly WorkflowStep[]): Workflow {
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    steps,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function rowToWorkflowStep(row: WorkflowStepRow): WorkflowStep {
  const base = {
    id: row.id,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }

  switch (row.kind) {
    case WORKFLOW_STEP_KINDS.PROMPT:
      return {
        ...base,
        kind: WORKFLOW_STEP_KINDS.PROMPT,
        itemId: row.item_id,
      }
    case WORKFLOW_STEP_KINDS.REPO:
      return {
        ...base,
        kind: WORKFLOW_STEP_KINDS.REPO,
        itemId: row.item_id,
      }
    case WORKFLOW_STEP_KINDS.MEMO:
      return { ...base, kind: WORKFLOW_STEP_KINDS.MEMO, memo: requireStepValue(row.memo, "memo") }
    case WORKFLOW_STEP_KINDS.LINK:
      return {
        ...base,
        kind: WORKFLOW_STEP_KINDS.LINK,
        url: requireStepValue(row.external_url, "external_url"),
      }
    default:
      return assertNever(row.kind)
  }
}
