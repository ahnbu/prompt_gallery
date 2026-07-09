import { Plus, Trash2 } from "lucide-react"
import { ITEM_TYPES, type Item, type WorkflowItem } from "./gallery-data"
import {
  type StepDraft,
  type WorkflowDraft,
  emptyStep,
  readStepKind,
  stepKindOptions,
  stepLabel,
  stepText,
} from "./workflow-modal-model"

export function WorkflowDetail(props: {
  readonly workflow: WorkflowItem
  readonly items: readonly Item[]
}) {
  return (
    <div className="detail-stack">
      {props.workflow.notes !== null ? (
        <p className="detail-notes">{props.workflow.notes}</p>
      ) : null}
      <ol className="workflow-steps" data-qa="workflow-steps">
        {props.workflow.steps.map((step) => (
          <li data-kind={step.kind} data-qa="workflow-step" key={step.id}>
            <span className="workflow-step-position">{step.position}</span>
            <strong>{stepLabel(step.kind)}</strong>
            <span>{stepText(step, props.items)}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export function WorkflowForm(props: {
  readonly draft: WorkflowDraft
  readonly items: readonly Item[]
  readonly setDraft: (draft: WorkflowDraft) => void
}) {
  const promptItems = props.items.filter((item) => item.type === ITEM_TYPES.PROMPT)
  const repoItems = props.items.filter((item) => item.type === ITEM_TYPES.REPO)

  function updateStep(index: number, step: StepDraft): void {
    props.setDraft({
      ...props.draft,
      steps: props.draft.steps.map((current, currentIndex) =>
        currentIndex === index ? step : current,
      ),
    })
  }

  function removeStep(index: number): void {
    props.setDraft({
      ...props.draft,
      steps: props.draft.steps.filter((_, currentIndex) => currentIndex !== index),
    })
  }

  return (
    <div className="form-grid">
      <label>
        이름
        <input
          onChange={(event) => props.setDraft({ ...props.draft, name: event.currentTarget.value })}
          value={props.draft.name}
        />
      </label>
      <label>
        메모
        <textarea
          onChange={(event) => props.setDraft({ ...props.draft, notes: event.currentTarget.value })}
          rows={3}
          value={props.draft.notes}
        />
      </label>
      <div className="workflow-step-editor" data-qa="workflow-step-editor">
        <div className="section-heading">
          <h3>Steps</h3>
          <button
            className="secondary-button"
            onClick={() =>
              props.setDraft({ ...props.draft, steps: [...props.draft.steps, emptyStep("memo")] })
            }
            type="button"
          >
            <Plus aria-hidden="true" size={16} strokeWidth={1.8} />
            <span>Step 추가</span>
          </button>
        </div>
        {props.draft.steps.map((step, index) => (
          <div className="workflow-step-row" data-qa="workflow-step-row" key={step.clientId}>
            <label>
              유형
              <select
                aria-label={`Step ${index + 1} 유형`}
                onChange={(event) => {
                  const next = emptyStep(readStepKind(event.currentTarget.value))
                  updateStep(index, { ...next, clientId: step.clientId })
                }}
                value={step.kind}
              >
                {stepKindOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <StepValueField
              index={index}
              promptItems={promptItems}
              repoItems={repoItems}
              step={step}
              updateStep={(nextStep) => updateStep(index, nextStep)}
            />
            <button
              aria-label={`Step ${index + 1} 삭제`}
              className="icon-button"
              onClick={() => removeStep(index)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={16} strokeWidth={1.8} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepValueField(props: {
  readonly index: number
  readonly step: StepDraft
  readonly promptItems: readonly Item[]
  readonly repoItems: readonly Item[]
  readonly updateStep: (step: StepDraft) => void
}) {
  switch (props.step.kind) {
    case "prompt":
    case "repo": {
      const options = props.step.kind === "prompt" ? props.promptItems : props.repoItems
      return (
        <label>
          참조
          <select
            aria-label={`Step ${props.index + 1} 참조`}
            onChange={(event) =>
              props.updateStep({ ...props.step, itemId: event.currentTarget.value })
            }
            value={props.step.itemId}
          >
            <option value="">선택</option>
            {options.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
      )
    }
    case "memo":
      return (
        <label>
          메모
          <input
            aria-label={`Step ${props.index + 1} 메모`}
            onChange={(event) =>
              props.updateStep({ ...props.step, memo: event.currentTarget.value })
            }
            value={props.step.memo}
          />
        </label>
      )
    case "link":
      return (
        <label>
          링크
          <input
            aria-label={`Step ${props.index + 1} 링크`}
            onChange={(event) =>
              props.updateStep({ ...props.step, url: event.currentTarget.value })
            }
            placeholder="https://example.com"
            type="url"
            value={props.step.url}
          />
        </label>
      )
    default:
      return assertNever(props.step.kind)
  }
}

function assertNever(value: never): never {
  throw new Error(`Unexpected workflow form value: ${String(value)}`)
}
