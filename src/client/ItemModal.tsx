import { Check, Copy, Star, X } from "lucide-react"
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
  readonly onSaved: (updatedItem?: Item) => Promise<void>
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
    props.state.kind === "add" ? "새 항목" : mode === "edit" ? "편집" : props.state.item.title
  const detailItem = props.state.kind === "detail" ? props.state.item : null
  const favoriteLabel =
    detailItem?.favorite === true
      ? `${detailItem.title} 즐겨찾기 해제`
      : `${detailItem?.title ?? "항목"} 즐겨찾기 추가`

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
        await props.onSaved()
      } else {
        const updated = await updateItem(props.state.item.id, parsed.payload)
        await props.onSaved(updated)
      }
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
    setError(null)
    try {
      await props.onFavoriteChange(props.state.item)
    } catch (favoriteError) {
      handleError(favoriteError, setError)
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
          <div className="modal-title-block">
            <ModalTypeBadge type={draft.type} />
            <h2 id="item-modal-title">{title}</h2>
          </div>
          <div className="modal-header-actions">
            {mode === "detail" && detailItem !== null && canCopyItemBody(detailItem) ? (
              <button
                aria-label={`${detailItem.title} 본문 복사`}
                className="icon-button"
                data-qa="copy-body-button"
                onClick={() => void copyBody()}
                title="본문 복사"
                type="button"
              >
                {copyStatus === "copied" ? (
                  <Check aria-hidden="true" size={17} strokeWidth={1.8} />
                ) : (
                  <Copy aria-hidden="true" size={17} strokeWidth={1.8} />
                )}
              </button>
            ) : null}
            {mode === "detail" && detailItem !== null ? (
              <button
                aria-label={favoriteLabel}
                aria-pressed={detailItem.favorite}
                className={detailItem.favorite ? "icon-button active" : "icon-button"}
                data-qa="favorite-toggle"
                data-state={detailItem.favorite ? "favorite" : "not-favorite"}
                onClick={() => void toggleFavorite()}
                title={favoriteLabel}
                type="button"
              >
                <Star
                  aria-hidden="true"
                  fill={detailItem.favorite ? "currentColor" : "none"}
                  size={17}
                  strokeWidth={1.8}
                />
              </button>
            ) : null}
            <button
              aria-label="닫기"
              className="icon-button"
              onClick={() => void closeModal()}
              type="button"
            >
              <X aria-hidden="true" size={17} strokeWidth={1.8} />
            </button>
          </div>
        </header>
        {copyStatus === "failed" ? (
          <output className="copy-status modal-toast" data-qa="copy-status">
            복사 실패
          </output>
        ) : null}

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
              confirmDelete={confirmDelete}
              onCancelDelete={() => setConfirmDelete(false)}
              onDelete={remove}
              onEdit={() => {
                setConfirmDelete(false)
                setMode("edit")
              }}
              onStartDelete={() => setConfirmDelete(true)}
              saving={saving}
            />
          ) : (
            <EditActions
              canDelete={props.state.kind === "detail"}
              confirmDelete={confirmDelete}
              onCancel={confirmDelete ? () => setConfirmDelete(false) : closeModal}
              onDelete={remove}
              onSave={save}
              onStartDelete={() => setConfirmDelete(true)}
              saving={saving}
            />
          )}
        </footer>
      </dialog>
    </div>
  )
}

function ModalTypeBadge(props: { readonly type: Draft["type"] }) {
  switch (props.type) {
    case ITEM_TYPES.PROMPT:
      return <span className="type-badge prompt">프롬프트</span>
    case ITEM_TYPES.IMAGE_PROMPT:
      return <span className="type-badge image">이미지</span>
    case ITEM_TYPES.REPO:
      return <span className="type-badge repo">레포</span>
    case "":
      return <span className="type-badge neutral">새 항목</span>
    default:
      return assertNever(props.type)
  }
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

function assertNever(value: never): never {
  throw new Error(`Unexpected modal type: ${String(value)}`)
}
