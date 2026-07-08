import { ApiError, ITEM_TYPES } from "./item-types"
import {
  type CreateWorkflowInput,
  type CreateWorkflowStepInput,
  type PatchWorkflowInput,
  WORKFLOW_STEP_KINDS,
  type Workflow,
  type WorkflowRow,
  type WorkflowStepRow,
  rowToWorkflow,
  rowToWorkflowStep,
} from "./workflow-types"

type ItemReferenceRow = {
  readonly type: string
  readonly github_url: string | null
}

const SELECT_WORKFLOW = `
  SELECT id, name, notes, created_at, updated_at
  FROM workflows
`

const SELECT_WORKFLOW_STEP = `
  SELECT id, workflow_id, position, kind, item_id, memo, external_url, created_at, updated_at
  FROM workflow_steps
`

class WorkflowPersistenceError extends Error {}

function assertNeverStep(step: never): never {
  throw new WorkflowPersistenceError(`Unexpected workflow step kind: ${JSON.stringify(step)}`)
}

export class WorkflowRepository {
  readonly db: D1Database

  constructor(db: D1Database) {
    this.db = db
  }

  async list(): Promise<readonly Workflow[]> {
    const rows = await this.db
      .prepare(`${SELECT_WORKFLOW} ORDER BY updated_at DESC, created_at DESC, id DESC`)
      .all<WorkflowRow>()

    return Promise.all(rows.results.map((row) => this.workflowFromRow(row)))
  }

  async get(id: string): Promise<Workflow | null> {
    const row = await this.db
      .prepare(`${SELECT_WORKFLOW} WHERE id = ?`)
      .bind(id)
      .first<WorkflowRow>()
    return row === null ? null : this.workflowFromRow(row)
  }

  async create(input: CreateWorkflowInput): Promise<Workflow> {
    await this.validateStepReferences(input.steps)
    const id = crypto.randomUUID()
    await this.db
      .prepare("INSERT INTO workflows (id, name, notes) VALUES (?, ?, ?)")
      .bind(id, input.name, input.notes)
      .run()
    await this.replaceSteps(id, input.steps)

    const workflow = await this.get(id)
    if (workflow === null) {
      throw new WorkflowPersistenceError("Created workflow was not returned by D1.")
    }

    return workflow
  }

  async update(id: string, input: PatchWorkflowInput): Promise<Workflow | null> {
    const current = await this.get(id)
    if (current === null) {
      return null
    }
    if (input.steps !== undefined) {
      await this.validateStepReferences(input.steps)
    }

    const fields: string[] = []
    const values: (string | null)[] = []
    if (input.name !== undefined) {
      fields.push("name = ?")
      values.push(input.name)
    }
    if (input.notes !== undefined) {
      fields.push("notes = ?")
      values.push(input.notes)
    }
    if (fields.length > 0) {
      fields.push("updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')")
      values.push(id)
      await this.db
        .prepare(`UPDATE workflows SET ${fields.join(", ")} WHERE id = ?`)
        .bind(...values)
        .run()
    }
    if (input.steps !== undefined) {
      await this.replaceSteps(id, input.steps)
      await this.db
        .prepare(
          "UPDATE workflows SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?",
        )
        .bind(id)
        .run()
    }

    return this.get(id)
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.db.prepare("DELETE FROM workflows WHERE id = ?").bind(id).run()
    return result.meta.changes > 0
  }

  private async workflowFromRow(row: WorkflowRow): Promise<Workflow> {
    const steps = await this.db
      .prepare(`${SELECT_WORKFLOW_STEP} WHERE workflow_id = ? ORDER BY position ASC, id ASC`)
      .bind(row.id)
      .all<WorkflowStepRow>()

    return rowToWorkflow(row, steps.results.map(rowToWorkflowStep))
  }

  private async validateStepReferences(steps: readonly CreateWorkflowStepInput[]): Promise<void> {
    for (const step of steps) {
      switch (step.kind) {
        case WORKFLOW_STEP_KINDS.PROMPT:
          await this.requireItemReference(step.itemId, ITEM_TYPES.PROMPT)
          break
        case WORKFLOW_STEP_KINDS.REPO:
          await this.requireItemReference(step.itemId, ITEM_TYPES.REPO)
          break
        case WORKFLOW_STEP_KINDS.MEMO:
        case WORKFLOW_STEP_KINDS.LINK:
          break
        default:
          return assertNeverStep(step)
      }
    }
  }

  private async requireItemReference(id: string, type: string): Promise<void> {
    const item = await this.db
      .prepare("SELECT type, github_url FROM items WHERE id = ?")
      .bind(id)
      .first<ItemReferenceRow>()
    if (item === null || item.type !== type) {
      throw new ApiError("invalid_workflow", "Workflow step item reference is invalid.", 400)
    }
    if (type === ITEM_TYPES.REPO && item.github_url === null) {
      throw new ApiError("invalid_workflow", "Repo workflow steps require a GitHub URL item.", 400)
    }
  }

  private async replaceSteps(id: string, steps: readonly CreateWorkflowStepInput[]): Promise<void> {
    await this.db.prepare("DELETE FROM workflow_steps WHERE workflow_id = ?").bind(id).run()
    for (const step of steps) {
      await this.insertStep(id, step)
    }
  }

  private async insertStep(workflowId: string, step: CreateWorkflowStepInput): Promise<void> {
    const stepId = crypto.randomUUID()
    switch (step.kind) {
      case WORKFLOW_STEP_KINDS.PROMPT:
      case WORKFLOW_STEP_KINDS.REPO:
        await this.db
          .prepare(
            "INSERT INTO workflow_steps (id, workflow_id, position, kind, item_id) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(stepId, workflowId, step.position, step.kind, step.itemId)
          .run()
        break
      case WORKFLOW_STEP_KINDS.MEMO:
        await this.db
          .prepare(
            "INSERT INTO workflow_steps (id, workflow_id, position, kind, memo) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(stepId, workflowId, step.position, step.kind, step.memo)
          .run()
        break
      case WORKFLOW_STEP_KINDS.LINK:
        await this.db
          .prepare(
            "INSERT INTO workflow_steps (id, workflow_id, position, kind, external_url) VALUES (?, ?, ?, ?, ?)",
          )
          .bind(stepId, workflowId, step.position, step.kind, step.url)
          .run()
        break
      default:
        return assertNeverStep(step)
    }
  }
}
