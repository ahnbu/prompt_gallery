import { Tag as TagIcon } from "lucide-react"
import type { Tag } from "./gallery-data"
import type {
  ConfirmDeleteById,
  MergeTargetById,
  RowStatus,
  TagDraft,
} from "./tag-management-model"

export function TagManagementRow(props: {
  readonly tag: Tag
  readonly tags: readonly Tag[]
  readonly draft: TagDraft
  readonly rowBusy: boolean
  readonly mergeTargets: MergeTargetById
  readonly confirmDelete: ConfirmDeleteById
  readonly statuses: RowStatus
  readonly setDraft: (tagId: string, patch: Partial<TagDraft>) => void
  readonly setMergeTarget: (tagId: string, targetId: string) => void
  readonly onSave: (tag: Tag) => void
  readonly onMerge: (tag: Tag) => void
  readonly onDelete: (tag: Tag) => void
}) {
  const otherTags = props.tags.filter((candidate) => candidate.id !== props.tag.id)
  return (
    <section className="tag-management-row" data-qa="tag-management-row" data-tag-id={props.tag.id}>
      <div className="tag-management-row-heading">
        <span className="tag-color-dot" style={{ backgroundColor: props.draft.color }} />
        <strong data-qa="tag-row-name">{props.tag.name}</strong>
        <span>{props.tag.itemCount}개 항목</span>
      </div>
      <div className="tag-management-grid">
        <label>
          태그 이름
          <input
            aria-label="태그 이름"
            onChange={(event) => props.setDraft(props.tag.id, { name: event.currentTarget.value })}
            value={props.draft.name}
          />
        </label>
        <label>
          태그 색상
          <input
            aria-label="태그 색상"
            onChange={(event) => props.setDraft(props.tag.id, { color: event.currentTarget.value })}
            type="color"
            value={props.draft.color}
          />
        </label>
        <label className="tag-keyword-field">
          자동 태그 키워드
          <input
            aria-label="자동 태그 키워드"
            onChange={(event) =>
              props.setDraft(props.tag.id, { keywordsText: event.currentTarget.value })
            }
            placeholder="쉼표로 구분"
            value={props.draft.keywordsText}
          />
        </label>
        <label>
          병합 대상
          <select
            aria-label="병합 대상"
            disabled={otherTags.length === 0}
            onChange={(event) => props.setMergeTarget(props.tag.id, event.currentTarget.value)}
            value={props.mergeTargets.get(props.tag.id) ?? ""}
          >
            <option value="">선택</option>
            {otherTags.map((candidate) => (
              <option key={candidate.id} value={candidate.id}>
                {candidate.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <footer className="tag-management-actions">
        <button
          className="primary-button"
          data-qa="tag-save-button"
          disabled={props.rowBusy}
          onClick={() => props.onSave(props.tag)}
          type="button"
        >
          <TagIcon aria-hidden="true" size={15} strokeWidth={1.8} />
          저장
        </button>
        <button
          className="secondary-button"
          data-qa="tag-merge-button"
          disabled={props.rowBusy}
          onClick={() => props.onMerge(props.tag)}
          type="button"
        >
          병합
        </button>
        <button
          className="danger-button"
          data-qa="tag-delete-button"
          disabled={props.rowBusy}
          onClick={() => props.onDelete(props.tag)}
          type="button"
        >
          {props.confirmDelete.get(props.tag.id) === true ? "삭제 확인" : "삭제"}
        </button>
        {props.statuses.get(props.tag.id) !== undefined ? (
          <output className="tag-row-status">{props.statuses.get(props.tag.id)}</output>
        ) : null}
      </footer>
    </section>
  )
}
