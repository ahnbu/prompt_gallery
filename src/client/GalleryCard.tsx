import { Copy, Star } from "lucide-react"
import { useState } from "react"
import type { Item, ItemTag, ItemType, WorkflowItem } from "./gallery-data"
import { type CardEntry, assertNever, visibleTags } from "./gallery-model"
import { canCopyItemBody } from "./item-actions-model"

type CopyStatus = "idle" | "copied" | "failed"

export function GalleryCard(props: {
  readonly entry: CardEntry
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
}) {
  switch (props.entry.kind) {
    case "item":
      return (
        <ItemCard
          item={props.entry.item}
          onFavoriteChange={props.onFavoriteChange}
          onOpenItem={props.onOpenItem}
        />
      )
    case "workflow":
      return <WorkflowCard workflow={props.entry.workflow} />
    default:
      return assertNever(props.entry)
  }
}

function ItemCard(props: {
  readonly item: Item
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
}) {
  const item = props.item
  const tags = visibleTags(item.tags)
  const hiddenTagCount = item.tags.length - tags.length
  const preview = item.body ?? item.notes ?? item.githubUrl ?? ""
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")
  const favoriteLabel = item.favorite
    ? `${item.title} 즐겨찾기 해제`
    : `${item.title} 즐겨찾기 추가`

  async function copyBody(): Promise<void> {
    if (item.body === null) {
      return
    }

    try {
      await navigator.clipboard.writeText(item.body)
      setCopyStatus("copied")
    } catch (error) {
      if (error instanceof Error || error instanceof DOMException) {
        setCopyStatus("failed")
        return
      }
      throw error
    }
  }

  return (
    <article className="gallery-card" data-card-type={item.type} data-qa="gallery-card">
      <div className="card-topline">
        <TypeBadge type={item.type} />
        <div className="card-actions">
          {copyStatus !== "idle" ? (
            <output className="copy-status" data-qa="copy-status">
              {copyStatus === "copied" ? "복사됨" : "복사 실패"}
            </output>
          ) : null}
          {canCopyItemBody(item) ? (
            <button
              aria-label={`${item.title} 본문 복사`}
              className="star-indicator"
              data-qa="copy-body-button"
              onClick={copyBody}
              title="본문 복사"
              type="button"
            >
              <Copy aria-hidden="true" size={16} strokeWidth={1.8} />
            </button>
          ) : null}
          <button
            aria-label={favoriteLabel}
            aria-pressed={item.favorite}
            className={item.favorite ? "star-indicator active" : "star-indicator"}
            data-qa="favorite-toggle"
            data-state={item.favorite ? "favorite" : "not-favorite"}
            onClick={async (event) => {
              event.stopPropagation()
              await props.onFavoriteChange(item)
            }}
            title={favoriteLabel}
            type="button"
          >
            <Star
              aria-hidden="true"
              fill={item.favorite ? "currentColor" : "none"}
              size={16}
              strokeWidth={1.8}
            />
          </button>
        </div>
      </div>
      <button
        aria-label={`${item.title} 상세 열기`}
        className="card-open-button"
        data-qa="card-open"
        onClick={() => props.onOpenItem(item)}
        type="button"
      >
        <h3>{item.title}</h3>
        <p className="card-preview">{preview}</p>
      </button>
      <TagList hiddenTagCount={hiddenTagCount} tags={tags} />
      <footer className="card-footer">
        <time dateTime={item.updatedAt}>{item.updatedAt.slice(0, 10)}</time>
        {item.type === "repo" && item.githubUrl !== null ? (
          <a
            href={item.githubUrl}
            onClick={(event) => event.stopPropagation()}
            rel="noreferrer"
            target="_blank"
          >
            GitHub 열기
          </a>
        ) : null}
      </footer>
    </article>
  )
}

function WorkflowCard({ workflow }: { readonly workflow: WorkflowItem }) {
  return (
    <article className="gallery-card" data-card-type="workflow" data-qa="gallery-card">
      <div className="card-topline">
        <span className="type-badge workflow" data-qa="type-badge" data-type="workflow">
          Workflow
        </span>
      </div>
      <h3>{workflow.name}</h3>
      <p className="card-preview">{workflow.notes ?? `${workflow.steps.length} steps`}</p>
      <footer className="card-footer">
        <time dateTime={workflow.updatedAt}>{workflow.updatedAt.slice(0, 10)}</time>
      </footer>
    </article>
  )
}

function TypeBadge({ type }: { readonly type: ItemType }) {
  switch (type) {
    case "prompt":
      return (
        <span className="type-badge prompt" data-qa="type-badge" data-type="prompt">
          프롬프트
        </span>
      )
    case "image_prompt":
      return (
        <span className="type-badge image" data-qa="type-badge" data-type="image_prompt">
          이미지
        </span>
      )
    case "repo":
      return (
        <span className="type-badge repo" data-qa="type-badge" data-type="repo">
          레포
        </span>
      )
    default:
      return assertNever(type)
  }
}

function TagList(props: { readonly tags: readonly ItemTag[]; readonly hiddenTagCount: number }) {
  if (props.tags.length === 0) {
    return null
  }

  return (
    <div className="card-tags" aria-label="태그">
      {props.tags.map((tag) => (
        <span className="card-tag" data-qa="card-tag" key={tag.id}>
          {tag.name}
        </span>
      ))}
      {props.hiddenTagCount > 0 ? (
        <span className="card-tag" data-qa="hidden-tag-count">
          +{props.hiddenTagCount}
        </span>
      ) : null}
    </div>
  )
}
