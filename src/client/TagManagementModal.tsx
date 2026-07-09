import { X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { TagManagementRow } from "./TagManagementRow"
import type { Tag } from "./gallery-data"
import {
  type ConfirmDeleteById,
  type DraftById,
  type MergeTargetById,
  type RowStatus,
  type TagDraft,
  defaultMergeTargets,
  draftFromTag,
  draftsFromTags,
  keywordsFromText,
  mergeTargetsFromTags,
} from "./tag-management-model"
import { deleteTag, mergeTags, updateTag } from "./tag-mutations"

export function TagManagementModal(props: {
  readonly tags: readonly Tag[]
  readonly onClose: () => void
  readonly onChanged: () => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)
  const [drafts, setDrafts] = useState<DraftById>(() => draftsFromTags(props.tags))
  const [mergeTargets, setMergeTargets] = useState<MergeTargetById>(() =>
    defaultMergeTargets(props.tags),
  )
  const [confirmDelete, setConfirmDelete] = useState<ConfirmDeleteById>(new Map())
  const [statuses, setStatuses] = useState<RowStatus>(new Map())
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    setDrafts(draftsFromTags(props.tags))
    setMergeTargets((current) => mergeTargetsFromTags(props.tags, current))
    setConfirmDelete(new Map())
  }, [props.tags])

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

  function setDraft(tagId: string, patch: Partial<TagDraft>): void {
    setDrafts((current) => {
      const currentDraft = current.get(tagId)
      if (currentDraft === undefined) {
        return current
      }
      const next = new Map(current)
      next.set(tagId, { ...currentDraft, ...patch })
      return next
    })
  }

  function setRowStatus(tagId: string, message: string): void {
    setStatuses((current) => {
      const next = new Map(current)
      next.set(tagId, message)
      return next
    })
  }

  function setMergeTarget(tagId: string, targetId: string): void {
    setMergeTargets((current) => new Map(current).set(tagId, targetId))
  }

  async function save(tag: Tag): Promise<void> {
    const draft = drafts.get(tag.id)
    if (draft === undefined) {
      return
    }

    setBusyId(tag.id)
    try {
      await updateTag(tag.id, {
        name: draft.name,
        color: draft.color,
        keywords: keywordsFromText(draft.keywordsText),
      })
      await props.onChanged()
      setRowStatus(tag.id, "저장됨")
    } catch (error) {
      handleError(error, (message) => setRowStatus(tag.id, message))
    } finally {
      setBusyId(null)
    }
  }

  async function merge(tag: Tag): Promise<void> {
    const targetId = mergeTargets.get(tag.id)
    if (targetId === undefined || targetId.length === 0) {
      setRowStatus(tag.id, "병합 대상을 선택하세요")
      return
    }

    setBusyId(tag.id)
    try {
      await mergeTags(tag.id, targetId)
      await props.onChanged()
      setRowStatus(targetId, "병합됨")
    } catch (error) {
      handleError(error, (message) => setRowStatus(tag.id, message))
    } finally {
      setBusyId(null)
    }
  }

  async function remove(tag: Tag): Promise<void> {
    if (confirmDelete.get(tag.id) !== true) {
      setConfirmDelete((current) => new Map(current).set(tag.id, true))
      return
    }

    setBusyId(tag.id)
    try {
      await deleteTag(tag.id)
      await props.onChanged()
    } catch (error) {
      handleError(error, (message) => setRowStatus(tag.id, message))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="modal-backdrop" data-qa="tag-management-backdrop">
      <dialog
        aria-labelledby="tag-management-title"
        aria-modal="true"
        className="item-modal tag-management-modal"
        data-qa="tag-management-modal"
        onCancel={(event) => {
          event.preventDefault()
          props.onClose()
        }}
        ref={dialogRef}
      >
        <header className="modal-header">
          <div>
            <p className="eyebrow">Tags</p>
            <h2 id="tag-management-title">태그 관리</h2>
          </div>
          <button aria-label="닫기" className="icon-button" onClick={props.onClose} type="button">
            <X aria-hidden="true" size={17} strokeWidth={1.8} />
          </button>
        </header>

        <p className="tag-management-help">
          자동 태그 키워드는 새 항목을 저장할 때 제목, 본문, 메모, URL에 포함된 단어를 보고 태그를
          붙입니다.
        </p>

        <div className="tag-management-list">
          {props.tags.length === 0 ? (
            <section className="content-panel">관리할 태그가 없습니다</section>
          ) : (
            props.tags.map((tag) => {
              const draft = drafts.get(tag.id) ?? draftFromTag(tag)
              return (
                <TagManagementRow
                  confirmDelete={confirmDelete}
                  draft={draft}
                  key={tag.id}
                  mergeTargets={mergeTargets}
                  onDelete={(target) => void remove(target)}
                  onMerge={(target) => void merge(target)}
                  onSave={(target) => void save(target)}
                  rowBusy={busyId === tag.id}
                  setDraft={setDraft}
                  setMergeTarget={setMergeTarget}
                  statuses={statuses}
                  tag={tag}
                  tags={props.tags}
                />
              )
            })
          )}
        </div>
      </dialog>
    </div>
  )
}

function handleError(error: unknown, setMessage: (message: string) => void): void {
  if (error instanceof Error) {
    setMessage(error.message)
    return
  }
  throw error
}
