import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { WorkflowDetail, WorkflowForm } from "./WorkflowModalFields"
import type { Item, WorkflowItem } from "./gallery-data"
import {
  type WorkflowDraft,
  defaultDraft,
  draftFromWorkflow,
  parseDraft,
} from "./workflow-modal-model"
import { createWorkflow, deleteWorkflow, updateWorkflow } from "./workflow-mutations"

export type WorkflowModalState =
  | { readonly kind: "add" }
  | { readonly kind: "detail"; readonly workflow: WorkflowItem }

type Mode = "detail" | "edit"

export function WorkflowModal(props: {
  readonly state: WorkflowModalState
  readonly items: readonly Item[]
  readonly onClose: () => void
  readonly onSaved: () => Promise<void>
  readonly onDeleted: () => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [mode, setMode] = useState<Mode>(props.state.kind === "add" ? "edit" : "detail")
  const [draft, setDraft] = useState<WorkflowDraft>(() =>
    props.state.kind === "add" ? defaultDraft() : draftFromWorkflow(props.state.workflow),
  )
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMode(props.state.kind === "add" ? "edit" : "detail")
    setDraft(props.state.kind === "add" ? defaultDraft() : draftFromWorkflow(props.state.workflow))
    setError(null)
    setConfirmDelete(false)
  }, [props.state])

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog === null) {
      return
    }

    const activeElement = document.activeElement
    returnFocusRef.current = activeElement instanceof HTMLElement ? activeElement : null
    if (!dialog.open) {
      dialog.showModal()
    }

    return () => {
      if (dialog.open) {
        dialog.close()
      }
      const focusTarget = returnFocusRef.current
      if (focusTarget?.isConnected) {
        focusTarget.focus()
      }
    }
  }, [])

  const title =
    props.state.kind === "add"
      ? "Workflow 추가"
      : mode === "edit"
        ? "Workflow 수정"
        : props.state.workflow.name

  async function save(): Promise<void> {
    const parsed = parseDraft(draft)
    if (parsed.kind === "invalid") {
      setError(parsed.message)
      return
    }

    setSaving(true)
    setError(null)
    try {
      if (props.state.kind === "add") {
        await createWorkflow(parsed.payload)
      } else {
        await updateWorkflow(props.state.workflow.id, parsed.payload)
      }
      await props.onSaved()
      props.onClose()
    } catch (saveError) {
      handleError(saveError, setError)
    } finally {
      setSaving(false)
    }
  }

  async function remove(): Promise<void> {
    if (props.state.kind !== "detail") {
      return
    }

    setSaving(true)
    setError(null)
    try {
      await deleteWorkflow(props.state.workflow.id)
      await props.onDeleted()
      props.onClose()
    } catch (deleteError) {
      handleError(deleteError, setError)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" data-qa="workflow-modal-backdrop">
      <dialog
        aria-labelledby="workflow-modal-title"
        aria-modal="true"
        className="item-modal"
        data-qa="workflow-modal"
        onCancel={(event) => {
          event.preventDefault()
          props.onClose()
        }}
        ref={dialogRef}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">{props.state.kind === "add" ? "New workflow" : "Workflow"}</p>
            <h2 id="workflow-modal-title">{title}</h2>
          </div>
          <button aria-label="닫기" className="icon-button" onClick={props.onClose} type="button">
            <X aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </header>

        {mode === "detail" && props.state.kind === "detail" ? (
          <WorkflowDetail items={props.items} workflow={props.state.workflow} />
        ) : (
          <WorkflowForm draft={draft} items={props.items} setDraft={setDraft} />
        )}

        {error !== null ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        {confirmDelete ? <p className="delete-warning">삭제하면 되돌릴 수 없습니다</p> : null}

        <footer className="modal-actions">
          {mode === "detail" && props.state.kind === "detail" ? (
            <>
              <div className="modal-action-group">
                <button
                  className="secondary-button"
                  disabled={saving}
                  onClick={() => setMode("edit")}
                  type="button"
                >
                  수정
                </button>
              </div>
              <div className="modal-action-group">
                {confirmDelete ? (
                  <button
                    className="secondary-button"
                    disabled={saving}
                    onClick={() => setConfirmDelete(false)}
                    type="button"
                  >
                    취소
                  </button>
                ) : null}
                <button
                  className="danger-button"
                  disabled={saving}
                  onClick={confirmDelete ? remove : () => setConfirmDelete(true)}
                  type="button"
                >
                  {confirmDelete ? "삭제 확인" : "삭제"}
                </button>
              </div>
            </>
          ) : (
            <>
              <button
                className="secondary-button"
                disabled={saving}
                onClick={props.onClose}
                type="button"
              >
                취소
              </button>
              <button className="primary-button" disabled={saving} onClick={save} type="button">
                저장
              </button>
            </>
          )}
        </footer>
      </dialog>
    </div>
  )
}

function handleError(error: unknown, setError: (message: string) => void): void {
  if (error instanceof Error) {
    setError(error.message)
    return
  }

  throw error
}
