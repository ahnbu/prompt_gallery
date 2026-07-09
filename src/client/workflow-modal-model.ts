import type { Item, WorkflowItem, WorkflowStep, WorkflowStepKind } from "./gallery-data"
import type { WorkflowRequest, WorkflowStepRequest } from "./workflow-mutations"

export type StepDraft = {
  readonly clientId: string
  readonly kind: WorkflowStepKind
  readonly itemId: string
  readonly memo: string
  readonly url: string
}

export type WorkflowDraft = {
  readonly name: string
  readonly notes: string
  readonly steps: readonly StepDraft[]
}

export type ParsedWorkflowDraft =
  | { readonly kind: "valid"; readonly payload: WorkflowRequest }
  | { readonly kind: "invalid"; readonly message: string }

export const stepKindOptions: readonly {
  readonly value: WorkflowStepKind
  readonly label: string
}[] = [
  { value: "prompt", label: "프롬프트" },
  { value: "repo", label: "레포" },
  { value: "memo", label: "메모" },
  { value: "link", label: "링크" },
]

export function emptyStep(kind: WorkflowStepKind): StepDraft {
  return { clientId: crypto.randomUUID(), kind, itemId: "", memo: "", url: "" }
}

export function defaultDraft(): WorkflowDraft {
  return {
    name: "",
    notes: "",
    steps: [emptyStep("prompt"), emptyStep("repo"), emptyStep("memo"), emptyStep("link")],
  }
}

export function draftFromWorkflow(workflow: WorkflowItem): WorkflowDraft {
  return {
    name: workflow.name,
    notes: workflow.notes ?? "",
    steps: workflow.steps.map((step) => ({
      clientId: step.id,
      kind: step.kind,
      itemId: step.itemId ?? "",
      memo: step.memo ?? "",
      url: step.url ?? "",
    })),
  }
}

export function parseDraft(draft: WorkflowDraft): ParsedWorkflowDraft {
  const name = normalize(draft.name)
  if (name === null) {
    return { kind: "invalid", message: "Workflow 이름을 입력하세요." }
  }
  if (draft.steps.length === 0) {
    return { kind: "invalid", message: "Workflow step을 하나 이상 추가하세요." }
  }

  const steps: WorkflowStepRequest[] = []
  for (const [index, step] of draft.steps.entries()) {
    const position = index + 1
    switch (step.kind) {
      case "prompt":
      case "repo": {
        if (normalize(step.itemId) === null) {
          return { kind: "invalid", message: "Workflow 참조 항목을 선택하세요." }
        }
        steps.push({ kind: step.kind, position, itemId: step.itemId })
        break
      }
      case "memo": {
        const memo = normalize(step.memo)
        if (memo === null) {
          return { kind: "invalid", message: "Workflow 메모를 입력하세요." }
        }
        steps.push({ kind: step.kind, position, memo })
        break
      }
      case "link": {
        const url = normalize(step.url)
        if (url === null) {
          return { kind: "invalid", message: "Workflow 링크를 입력하세요." }
        }
        steps.push({ kind: step.kind, position, url })
        break
      }
      default:
        return assertNever(step.kind)
    }
  }

  return { kind: "valid", payload: { name, notes: normalize(draft.notes), steps } }
}

export function readStepKind(value: string): WorkflowStepKind {
  switch (value) {
    case "prompt":
    case "repo":
    case "memo":
    case "link":
      return value
    default:
      return "memo"
  }
}

export function stepLabel(kind: WorkflowStepKind): string {
  switch (kind) {
    case "prompt":
      return "프롬프트"
    case "repo":
      return "레포"
    case "memo":
      return "메모"
    case "link":
      return "링크"
    default:
      return assertNever(kind)
  }
}

export function stepText(step: WorkflowStep, items: readonly Item[]): string {
  switch (step.kind) {
    case "prompt":
    case "repo":
      return items.find((item) => item.id === step.itemId)?.title ?? "삭제된 항목"
    case "memo":
      return step.memo ?? ""
    case "link":
      return step.url ?? ""
    default:
      return assertNever(step.kind)
  }
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function assertNever(value: never): never {
  throw new Error(`Unexpected workflow modal value: ${String(value)}`)
}
