import { Plus, X } from "lucide-react"
import { useState } from "react"
import type { Tag } from "./gallery-data"

export function TagChipsEditor(props: {
  readonly availableTags: readonly Tag[]
  readonly automaticTags: readonly string[]
  readonly manualTags: readonly string[]
  readonly onChange: (tags: readonly string[]) => void
  readonly compact?: boolean
  readonly hiddenTagCount?: number
  readonly selectedTags?: readonly string[]
}) {
  const [adding, setAdding] = useState(false)
  const selectedNames = new Set(props.selectedTags ?? props.manualTags)
  const options = props.availableTags.filter((tag) => !selectedNames.has(tag.name))
  const canAdd = options.length > 0

  function removeTag(name: string): void {
    props.onChange(props.manualTags.filter((tag) => tag !== name))
  }

  function addTag(name: string): void {
    if (name.length === 0 || selectedNames.has(name)) {
      return
    }
    props.onChange([...props.manualTags, name])
    setAdding(false)
  }

  return (
    <div className={props.compact === true ? "tag-chip-editor compact" : "tag-chip-editor"}>
      <div className="card-tags editable-card-tags" aria-label="태그">
        {props.manualTags.map((tag) => (
          <button
            aria-label={`${tag} 태그 삭제`}
            className="card-tag editable-tag"
            data-qa="card-tag"
            key={tag}
            onClick={() => removeTag(tag)}
            type="button"
          >
            <span>{tag}</span>
            <X aria-hidden="true" size={12} strokeWidth={2} />
          </button>
        ))}
        {props.automaticTags.map((tag) => (
          <span className="card-tag readonly-tag" data-qa="card-tag" key={tag}>
            {tag}
          </span>
        ))}
        {props.hiddenTagCount !== undefined && props.hiddenTagCount > 0 ? (
          <span className="card-tag readonly-tag" data-qa="hidden-tag-count">
            +{props.hiddenTagCount}
          </span>
        ) : null}
      </div>
      {adding ? (
        <select
          aria-label="태그 추가"
          className="tag-add-select"
          data-qa="tag-add-select"
          onBlur={() => setAdding(false)}
          onChange={(event) => addTag(event.currentTarget.value)}
          value=""
        >
          <option value="">태그 선택</option>
          {options.map((tag) => (
            <option key={tag.id} value={tag.name}>
              {tag.name}
            </option>
          ))}
        </select>
      ) : (
        <button
          className="tag-add-button"
          data-qa="tag-add-button"
          disabled={!canAdd}
          onClick={() => setAdding(true)}
          type="button"
        >
          <Plus aria-hidden="true" size={13} strokeWidth={2} />
          <span>Tag</span>
        </button>
      )}
    </div>
  )
}
