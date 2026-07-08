import { ITEM_TYPES, type Tag } from "./gallery-data"
import { type Draft, readType } from "./item-modal-model"

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
  readonly setDraft: (draft: Draft) => void
}) {
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
      ) : (
        <div className="readonly-field" data-qa="item-type-readonly">
          <span>유형</span>
          <strong>{labelForType(props.draft.type)}</strong>
        </div>
      )}
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
        태그
        <input
          list="item-modal-tags"
          onChange={(event) =>
            props.setDraft({ ...props.draft, tagsText: event.currentTarget.value })
          }
          placeholder="쉼표로 구분"
          value={props.draft.tagsText}
        />
      </label>
      <datalist id="item-modal-tags">
        {props.tags.map((tag) => (
          <option key={tag.id} value={tag.name} />
        ))}
      </datalist>
      {props.draft.type === ITEM_TYPES.IMAGE_PROMPT ? (
        <label>
          이미지 메타데이터
          <input
            onChange={(event) =>
              props.setDraft({ ...props.draft, imageKey: event.currentTarget.value })
            }
            placeholder="업로드는 Wave 3에서 연결"
            value={props.draft.imageKey}
          />
        </label>
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

function labelForType(value: Draft["type"]): string {
  return typeOptions.find((option) => option.value === value)?.label ?? "유형 선택"
}
