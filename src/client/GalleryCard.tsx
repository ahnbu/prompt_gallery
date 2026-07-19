import { Check, Copy, ExternalLink, FileText, Github, Image, Star, Workflow } from "lucide-react"
import { useState } from "react"
import { ImagePreviewField } from "./ImagePreviewField"
import { TagChipsEditor } from "./TagChipsEditor"
import type { Item, ItemType, Tag, WorkflowItem } from "./gallery-data"
import { type CardEntry, assertNever, visibleTags } from "./gallery-model"
import { canCopyItemBody } from "./item-actions-model"
import { repoDisplayTitle } from "./repo-title"
import { automaticTagNames, manualTagNames } from "./tag-utils"

type CopyStatus = "idle" | "copied" | "failed"
type TagStatus = "idle" | "saving" | "saved" | "failed"

export function GalleryCard(props: {
  readonly entry: CardEntry
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onTagsChange: (item: Item, tags: readonly string[]) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
  readonly tags: readonly Tag[]
}) {
  switch (props.entry.kind) {
    case "item":
      return (
        <ItemCard
          availableTags={props.tags}
          item={props.entry.item}
          onFavoriteChange={props.onFavoriteChange}
          onTagsChange={props.onTagsChange}
          onOpenItem={props.onOpenItem}
        />
      )
    case "workflow":
      return <WorkflowCard onOpenWorkflow={props.onOpenWorkflow} workflow={props.entry.workflow} />
    default:
      return assertNever(props.entry)
  }
}

function ItemCard(props: {
  readonly availableTags: readonly Tag[]
  readonly item: Item
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onTagsChange: (item: Item, tags: readonly string[]) => Promise<void>
  readonly onOpenItem: (item: Item) => void
}) {
  const item = props.item
  const displayedTags = visibleTags(item.tags)
  const hiddenTagCount = item.tags.length - displayedTags.length
  const hiddenTags = item.tags.slice(displayedTags.length)
  const hiddenManualTags = manualTagNames(hiddenTags)
  const allManualTags = manualTagNames(item.tags)
  const manualTags = manualTagNames(displayedTags)
  const automaticTags = automaticTagNames(displayedTags)
  const preview = item.body ?? item.notes ?? item.githubUrl ?? ""
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")
  const [tagStatus, setTagStatus] = useState<TagStatus>("idle")
  const [favoriteFailed, setFavoriteFailed] = useState(false)
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

  async function changeTags(tags: readonly string[]): Promise<void> {
    setTagStatus("saving")
    try {
      await props.onTagsChange(item, tags)
      setTagStatus("saved")
    } catch (error) {
      if (error instanceof Error) {
        setTagStatus("failed")
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
          {favoriteFailed ? (
            <output className="copy-status card-toast" data-qa="favorite-status">
              즐겨찾기 실패
            </output>
          ) : null}
          {copyStatus !== "idle" ? (
            <output className="copy-status card-toast" data-qa="copy-status">
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
              {copyStatus === "copied" ? (
                <Check aria-hidden="true" size={16} strokeWidth={1.8} />
              ) : (
                <Copy aria-hidden="true" size={16} strokeWidth={1.8} />
              )}
            </button>
          ) : null}
          {item.type === "repo" && item.githubUrl !== null ? (
            <a
              aria-label={`${item.title} GitHub 열기`}
              className="star-indicator"
              data-qa="repo-card-github"
              href={item.githubUrl}
              onClick={(event) => event.stopPropagation()}
              rel="noreferrer"
              target="_blank"
              title="GitHub 열기"
            >
              <ExternalLink aria-hidden="true" size={16} strokeWidth={1.8} />
            </a>
          ) : null}
          <button
            aria-label={favoriteLabel}
            aria-pressed={item.favorite}
            className={item.favorite ? "star-indicator active" : "star-indicator"}
            data-qa="favorite-toggle"
            data-state={item.favorite ? "favorite" : "not-favorite"}
            onClick={async (event) => {
              event.stopPropagation()
              setFavoriteFailed(false)
              try {
                await props.onFavoriteChange(item)
              } catch {
                setFavoriteFailed(true)
              }
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
        <h3>{item.type === "repo" ? repoDisplayTitle(item.title, item.githubUrl) : item.title}</h3>
        {item.type === "image_prompt" ? <ImagePreviewField compact item={item} /> : null}
        <p className="card-preview">{preview}</p>
      </button>
      <TagChipsEditor
        automaticTags={automaticTags}
        availableTags={props.availableTags}
        compact
        hiddenTagCount={hiddenTagCount}
        manualTags={manualTags}
        onChange={(tags) => void changeTags([...tags, ...hiddenManualTags])}
        selectedTags={allManualTags}
      />
      {tagStatus !== "idle" ? (
        <footer className="card-footer card-status-footer">
          <output className="copy-status" data-qa="card-tag-status">
            {tagStatus === "saving" ? "저장 중" : tagStatus === "saved" ? "저장됨" : "저장 실패"}
          </output>
        </footer>
      ) : null}
    </article>
  )
}

function WorkflowCard(props: {
  readonly workflow: WorkflowItem
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
}) {
  const workflow = props.workflow
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle")

  async function copySteps(): Promise<void> {
    try {
      await navigator.clipboard.writeText(workflowStepsText(workflow))
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
    <article className="gallery-card" data-card-type="workflow" data-qa="gallery-card">
      <div className="card-topline">
        <span className="type-badge workflow" data-qa="type-badge" data-type="workflow">
          <Workflow aria-hidden="true" size={13} strokeWidth={1.8} />
          워크플로우
        </span>
        <div className="card-actions">
          {copyStatus !== "idle" ? (
            <output className="copy-status card-toast" data-qa="copy-status">
              {copyStatus === "copied" ? "복사됨" : "복사 실패"}
            </output>
          ) : null}
          <button
            aria-label={`${workflow.name} 스텝 복사`}
            className="star-indicator"
            data-qa="copy-workflow-button"
            onClick={copySteps}
            title="스텝 복사"
            type="button"
          >
            {copyStatus === "copied" ? (
              <Check aria-hidden="true" size={16} strokeWidth={1.8} />
            ) : (
              <Copy aria-hidden="true" size={16} strokeWidth={1.8} />
            )}
          </button>
        </div>
      </div>
      <button
        aria-label={`${workflow.name} 상세 열기`}
        className="card-open-button"
        data-qa="card-open"
        onClick={() => props.onOpenWorkflow(workflow)}
        type="button"
      >
        <h3>{workflow.name}</h3>
        <p className="card-preview">{workflow.notes ?? `${workflow.steps.length} steps`}</p>
      </button>
    </article>
  )
}

export function TypeBadge({ type }: { readonly type: ItemType }) {
  switch (type) {
    case "prompt":
      return (
        <span className="type-badge prompt" data-qa="type-badge" data-type="prompt">
          <FileText aria-hidden="true" size={13} strokeWidth={1.8} />
          프롬프트
        </span>
      )
    case "image_prompt":
      return (
        <span className="type-badge image" data-qa="type-badge" data-type="image_prompt">
          <Image aria-hidden="true" size={13} strokeWidth={1.8} />
          이미지
        </span>
      )
    case "repo":
      return (
        <span className="type-badge repo" data-qa="type-badge" data-type="repo">
          <Github aria-hidden="true" size={13} strokeWidth={1.8} />
          레포
        </span>
      )
    default:
      return assertNever(type)
  }
}

function workflowStepsText(workflow: WorkflowItem): string {
  return workflow.steps
    .map((step, index) => {
      const text = step.memo ?? step.url ?? step.itemId ?? step.kind
      return `${index + 1}. ${text}`
    })
    .join("\n")
}
