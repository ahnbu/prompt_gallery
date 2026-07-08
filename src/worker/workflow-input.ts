import { ApiError } from "./item-types"
import {
  type CreateWorkflowInput,
  type CreateWorkflowStepInput,
  type PatchWorkflowInput,
  WORKFLOW_STEP_KINDS,
  type WorkflowStepKind,
} from "./workflow-types"

function getField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined
  }

  return Reflect.get(value, key)
}

function readOptionalString(value: unknown, key: string): string | null | undefined {
  const field = getField(value, key)
  if (field === undefined) {
    return undefined
  }
  if (field === null) {
    return null
  }
  if (typeof field !== "string") {
    throw new ApiError("invalid_workflow", `${key} must be a string.`, 400)
  }

  const trimmed = field.trim()
  return trimmed.length === 0 ? null : trimmed
}

function readRequiredString(value: unknown, key: string, message: string): string {
  const field = readOptionalString(value, key)
  if (field === undefined || field === null) {
    throw new ApiError("invalid_workflow", message, 400)
  }

  return field
}

function readPosition(value: unknown): number {
  const field = getField(value, "position")
  if (typeof field !== "number" || !Number.isInteger(field) || field <= 0) {
    throw new ApiError(
      "invalid_workflow",
      "Workflow step position must be a positive integer.",
      400,
    )
  }

  return field
}

function parseWorkflowStepKind(value: unknown): WorkflowStepKind | null {
  switch (value) {
    case WORKFLOW_STEP_KINDS.PROMPT:
      return WORKFLOW_STEP_KINDS.PROMPT
    case WORKFLOW_STEP_KINDS.REPO:
      return WORKFLOW_STEP_KINDS.REPO
    case WORKFLOW_STEP_KINDS.MEMO:
      return WORKFLOW_STEP_KINDS.MEMO
    case WORKFLOW_STEP_KINDS.LINK:
      return WORKFLOW_STEP_KINDS.LINK
    default:
      return null
  }
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "https:" || url.protocol === "http:"
  } catch (error) {
    if (error instanceof TypeError) {
      return false
    }
    throw error
  }
}

function assertNever(value: never): never {
  throw new ApiError("invalid_workflow", `Unexpected workflow step kind: ${String(value)}`, 400)
}

function parseWorkflowStep(value: unknown): CreateWorkflowStepInput {
  const position = readPosition(value)
  const kind = parseWorkflowStepKind(getField(value, "kind"))

  switch (kind) {
    case WORKFLOW_STEP_KINDS.PROMPT:
      return {
        kind,
        position,
        itemId: readRequiredString(value, "itemId", "Prompt workflow steps require itemId."),
      }
    case WORKFLOW_STEP_KINDS.REPO:
      return {
        kind,
        position,
        itemId: readRequiredString(value, "itemId", "Repo workflow steps require itemId."),
      }
    case WORKFLOW_STEP_KINDS.MEMO:
      return {
        kind,
        position,
        memo: readRequiredString(value, "memo", "Memo workflow steps require memo text."),
      }
    case WORKFLOW_STEP_KINDS.LINK: {
      const url = readRequiredString(value, "url", "Link workflow steps require a valid URL.")
      if (!isValidUrl(url)) {
        throw new ApiError("invalid_workflow", "Link workflow steps require a valid URL.", 400)
      }
      return { kind, position, url }
    }
    case null:
      throw new ApiError(
        "invalid_workflow",
        "Workflow step kind must be prompt, repo, memo, or link.",
        400,
      )
    default:
      return assertNever(kind)
  }
}

function parseSteps(value: unknown): readonly CreateWorkflowStepInput[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError("invalid_workflow", "Workflow requires at least one step.", 400)
  }

  const steps = value.map(parseWorkflowStep)
  const positions = new Set<number>()
  for (const step of steps) {
    if (positions.has(step.position)) {
      throw new ApiError("invalid_workflow", "Workflow step positions must be unique.", 400)
    }
    positions.add(step.position)
  }

  return steps
}

export function parseCreateWorkflow(value: unknown): CreateWorkflowInput {
  return {
    name: readRequiredString(value, "name", "Workflow name is required."),
    notes: readOptionalString(value, "notes") ?? null,
    steps: parseSteps(getField(value, "steps")),
  }
}

export function parsePatchWorkflow(value: unknown): PatchWorkflowInput {
  const name = readOptionalString(value, "name")
  if (name === null) {
    throw new ApiError("invalid_workflow", "Workflow name is required.", 400)
  }

  const notes = readOptionalString(value, "notes")
  const rawSteps = getField(value, "steps")
  const patch = {
    ...(name !== undefined ? { name } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(rawSteps !== undefined ? { steps: parseSteps(rawSteps) } : {}),
  } satisfies PatchWorkflowInput

  if (Object.keys(patch).length === 0) {
    throw new ApiError(
      "invalid_workflow",
      "Patch body must include at least one supported field.",
      400,
    )
  }

  return patch
}
