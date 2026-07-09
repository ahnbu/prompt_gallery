import { useState } from "react"
import type { RowStatus, TagDraft } from "./tag-management-model"
import { keywordsFromText } from "./tag-management-model"
import { createTag } from "./tag-mutations"

export const NEW_TAG_ID = "__new-tag__"

export function TagCreateRow(props: {
  readonly busy: boolean
  readonly statuses: RowStatus
  readonly onBusyChange: (busyId: string | null) => void
  readonly onChanged: () => Promise<void>
  readonly setRowStatus: (tagId: string, message: string) => void
  readonly handleError: (error: unknown, setMessage: (message: string) => void) => void
}) {
  const [newDraft, setNewDraft] = useState<TagDraft>({
    name: "",
    color: "#64748b",
    keywordsText: "",
  })

  async function create(): Promise<void> {
    if (newDraft.name.trim().length === 0) {
      props.setRowStatus(NEW_TAG_ID, "태그 이름을 입력하세요")
      return
    }

    props.onBusyChange(NEW_TAG_ID)
    try {
      await createTag({
        name: newDraft.name,
        color: newDraft.color,
        keywords: keywordsFromText(newDraft.keywordsText),
      })
      setNewDraft({ name: "", color: "#64748b", keywordsText: "" })
      await props.onChanged()
      props.setRowStatus(NEW_TAG_ID, "생성됨")
    } catch (error) {
      props.handleError(error, (message) => props.setRowStatus(NEW_TAG_ID, message))
    } finally {
      props.onBusyChange(null)
    }
  }

  return (
    <section className="tag-management-row" data-qa="tag-create-row">
      <div className="tag-management-row-heading">
        <span className="tag-color-dot" style={{ backgroundColor: newDraft.color }} />
        <strong data-qa="tag-row-name">새 태그</strong>
      </div>
      <div className="tag-management-grid tag-create-grid">
        <label>
          태그 이름
          <input
            aria-label="새 태그 이름"
            data-qa="tag-create-name"
            onChange={(event) => setNewDraft({ ...newDraft, name: event.currentTarget.value })}
            value={newDraft.name}
          />
        </label>
        <label>
          태그 색상
          <input
            aria-label="새 태그 색상"
            data-qa="tag-create-color"
            onChange={(event) => setNewDraft({ ...newDraft, color: event.currentTarget.value })}
            type="color"
            value={newDraft.color}
          />
        </label>
        <label className="tag-keyword-field">
          자동 태그 키워드
          <input
            aria-label="새 자동 태그 키워드"
            data-qa="tag-create-keywords"
            onChange={(event) =>
              setNewDraft({ ...newDraft, keywordsText: event.currentTarget.value })
            }
            placeholder="쉼표로 구분"
            value={newDraft.keywordsText}
          />
        </label>
        <div className="tag-create-actions">
          <button
            className="primary-button"
            data-qa="tag-create-button"
            disabled={props.busy}
            onClick={() => void create()}
            type="button"
          >
            생성
          </button>
          {props.statuses.get(NEW_TAG_ID) !== undefined ? (
            <output className="tag-row-status">{props.statuses.get(NEW_TAG_ID)}</output>
          ) : null}
        </div>
      </div>
    </section>
  )
}
