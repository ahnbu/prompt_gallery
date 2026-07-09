import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { DetailActions, EditActions } from "./ItemModalActions"
import { ItemModalDetail } from "./ItemModalDetail"
import { ItemModalForm } from "./ItemModalForm"
import { ITEM_TYPES, type Item, type Tag } from "./gallery-data"
import { deleteImageAsset } from "./image-assets"
import { canCopyItemBody } from "./item-actions-model"
import {
  type Draft,
  type ItemModalState,
  defaultTypeForTab,
  draftFromState,
  isPromptLike,
  parseDraft,
} from "./item-modal-model"
import { createItem, deleteItem, updateItem } from "./item-mutations"

type Mode = "detail" | "edit"
type CopyStatus = "idle" | "copied" | "failed"

export { defaultTypeForTab }
export type { ItemModalState }

export function ItemModal(props: {
  readonly state: ItemModalState
  readonly tags: readonly Tag[]
  readonly onClose: () => void
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onSaved: () => Promise<void>
  readonly onDeleted: () => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [mode, setMode] = useState<Mode>(props.state.kind === "add" ? "edit" : "detail")
  const [draft, setDraft] = useState<Draft>(() => draftFromState(props.state))
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    setMode(props.state.kind === "add" ? "edit" : "detail")
    setDraft(draftFromState(props.state))
    setError(null)
    setConfirmDelete(false)
    setCopyStatus("idle")
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
      ? "항목 추가"
      : mode === "edit"
        ? "항목 수정"
        : props.state.item.title
  const detailItem = props.state.kind === "detail" ? props.state.item : null

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
        await createItem({ type: parsed.type, ...parsed.payload })
      } else {
        await updateItem(props.state.item.id, parsed.payload)
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
      await deleteItem(props.state.item.id)
      await props.onDeleted()
      props.onClose()
    } catch (deleteError) {
      handleError(deleteError, setError)
    } finally {
      setSaving(false)
    }
  }

  async function copyBody(): Promise<void> {
    if (props.state.kind === "detail" && canCopyItemBody(props.state.item)) {
      try {
        await navigator.clipboard.writeText(props.state.item.body ?? "")
        setCopyStatus("copied")
      } catch (copyError) {
        if (copyError instanceof Error || copyError instanceof DOMException) {
          setCopyStatus("failed")
          return
        }
        throw copyError
      }
    }
  }

  async function toggleFavorite(): Promise<void> {
    if (props.state.kind !== "detail") {
      return
    }
    setSaving(true)
    setError(null)
    try {
      await props.onFavoriteChange(props.state.item)
    } catch (favoriteError) {
      handleError(favoriteError, setError)
    } finally {
      setSaving(false)
    }
  }

  async function closeModal(): Promise<void> {
    await cleanupCurrentStagedAsset(props.state, draft)
    props.onClose()
  }

  return (
    <div className="modal-backdrop" data-qa="item-modal-backdrop">
      <dialog
        aria-labelledby="item-modal-title"
        aria-modal="true"
        className="item-modal"
        data-qa="item-modal"
        onCancel={(event) => {
          event.preventDefault()
          void closeModal()
        }}
        onMouseDown={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect()
          const isInside =
            event.clientX >= bounds.left &&
            event.clientX <= bounds.right &&
            event.clientY >= bounds.top &&
            event.clientY <= bounds.bottom
          if (!isInside) {
            void closeModal()
          }
        }}
        ref={dialogRef}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">{props.state.kind === "add" ? "New item" : "Item detail"}</p>
            <h2 id="item-modal-title">{title}</h2>
          </div>
          <button
            aria-label="닫기"
            className="icon-button"
            onClick={() => void closeModal()}
            type="button"
          >
            <X aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </header>

        {mode === "detail" && props.state.kind === "detail" ? (
          <ItemModalDetail item={props.state.item} />
        ) : (
          <ItemModalForm
            draft={draft}
            promptLike={isPromptLike(draft.type)}
            previewItem={props.state.kind === "detail" ? props.state.item : null}
            repoLike={draft.type === ITEM_TYPES.REPO}
            setDraft={setDraft}
            tags={props.tags}
            typeEditable={props.state.kind === "add"}
          />
        )}

        {error !== null ? <p className="form-error">{error}</p> : null}
        {confirmDelete ? <p className="delete-warning">삭제하면 되돌릴 수 없습니다</p> : null}

        <footer className="modal-actions">
          {mode === "detail" && detailItem !== null ? (
            <DetailActions
              canCopyBody={canCopyItemBody(detailItem)}
              confirmDelete={confirmDelete}
              copyStatus={copyStatus}
              favorite={detailItem.favorite}
              itemTitle={detailItem.title}
              onCancelDelete={() => setConfirmDelete(false)}
              onCopyBody={copyBody}
              onDelete={remove}
              onEdit={() => setMode("edit")}
              onStartDelete={() => setConfirmDelete(true)}
              onToggleFavorite={toggleFavorite}
              saving={saving}
            />
          ) : (
            <EditActions onCancel={closeModal} onSave={save} saving={saving} />
          )}
        </footer>
      </dialog>
    </div>
  )
}

async function cleanupCurrentStagedAsset(state: ItemModalState, draft: Draft): Promise<void> {
  if (state.kind !== "detail") {
    return
  }
  if (draft.imageAssetId === undefined || draft.imageAssetId === null) {
    return
  }
  if (draft.imageAssetId === state.item.imageAssetId) {
    return
  }

  try {
    await deleteImageAsset(draft.imageAssetId)
  } catch (error) {
    if (error instanceof Error) {
      console.warn("staged_asset_cleanup_failed", draft.imageAssetId)
      return
    }
    throw error
  }
}

function handleError(error: unknown, setError: (message: string) => void): void {
  if (error instanceof Error) {
    setError(error.message)
    return
  }

  throw error
}
