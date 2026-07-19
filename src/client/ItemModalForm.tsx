import { ImagePreviewField } from "./ImagePreviewField"
import { TagChipsEditor } from "./TagChipsEditor"
import { ITEM_TYPES, type Tag } from "./gallery-data"
import type { Item } from "./gallery-data"
import { type Draft, readType } from "./item-modal-model"
import { automaticTagNames, tagNamesFromText, tagNamesToText } from "./tag-utils"

const typeOptions = [
  { value: ITEM_TYPES.PROMPT, label: "프롬프트" },
  { value: ITEM_TYPES.IMAGE_PROMPT, label: "이미지 프롬프트" },
  { value: ITEM_TYPES.REPO, label: "레포" },
] as const

export function ItemModalForm(props: {
  readonly draft: Draft
  readonly promptLike: boolean
  readonly repoLike: boolean
  readonly tags: readonly Tag[]
  readonly typeEditable: boolean
  readonly previewItem: Item | null
  readonly setDraft: (draft: Draft) => void
}) {
  const automaticTags = props.previewItem === null ? [] : automaticTagNames(props.previewItem.tags)
  const manualTags = tagNamesFromText(props.draft.tagsText)
  return (
    <div className="form-grid">
      {props.typeEditable ? (
        <label>
          유형
          <select
            data-qa="item-type-select"
            onChange={(event) =>
              props.setDraft({ ...props.draft, type: readType(event.currentTarget.value) })
            }
            value={props.draft.type}
          >
            <option value="">유형 선택</option>
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {props.promptLike ? (
        <label>
          본문
          <textarea
            onChange={(event) =>
              props.setDraft({ ...props.draft, body: event.currentTarget.value })
            }
            rows={7}
            value={props.draft.body}
          />
        </label>
      ) : null}
      <label>
        제목
        <input
          onChange={(event) => props.setDraft({ ...props.draft, title: event.currentTarget.value })}
          placeholder="비워두면 본문을 제목으로 사용"
          value={props.draft.title}
        />
      </label>
      {props.repoLike ? (
        <label>
          GitHub URL
          <input
            onChange={(event) =>
              props.setDraft({ ...props.draft, githubUrl: event.currentTarget.value })
            }
            placeholder="https://github.com/owner/repo"
            value={props.draft.githubUrl}
          />
        </label>
      ) : null}
      <label>
        출처 링크
        <input
          data-qa="item-source-url"
          onChange={(event) =>
            props.setDraft({ ...props.draft, sourceUrl: event.currentTarget.value })
          }
          placeholder="https://... (출처·소개 링크, 선택)"
          type="url"
          value={props.draft.sourceUrl}
        />
      </label>
      <div className="form-field">
        <span>태그</span>
        <TagChipsEditor
          automaticTags={automaticTags}
          availableTags={props.tags}
          manualTags={manualTags}
          onChange={(tags) => props.setDraft({ ...props.draft, tagsText: tagNamesToText(tags) })}
        />
      </div>
      {props.draft.type === ITEM_TYPES.IMAGE_PROMPT ? (
        <ImagePreviewField
          imageAssetId={props.draft.imageAssetId === undefined ? null : props.draft.imageAssetId}
          item={props.previewItem}
          onDraftChange={(imageAssetId) => props.setDraft({ ...props.draft, imageAssetId })}
        />
      ) : null}
      <label>
        메모
        <textarea
          onChange={(event) => props.setDraft({ ...props.draft, notes: event.currentTarget.value })}
          rows={4}
          value={props.draft.notes}
        />
      </label>
    </div>
  )
}
