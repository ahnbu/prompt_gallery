import { Plus } from "lucide-react"
import { GalleryCard } from "./GalleryCard"
import type { Item, WorkflowItem } from "./gallery-data"
import { type CardEntry, entryId } from "./gallery-model"

type SectionAction = {
  readonly label: string
  readonly onClick: () => void
}

export function GalleryResults(props: {
  readonly allEntries: readonly CardEntry[]
  readonly filteredEntries: readonly CardEntry[]
  readonly onAddImagePrompt: () => void
  readonly onAddPrompt: () => void
  readonly onAddRepo: () => void
  readonly onAddWorkflow: () => void
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
  readonly showUnified: boolean
}) {
  return props.showUnified ? (
    <UnifiedList
      entries={props.filteredEntries}
      onFavoriteChange={props.onFavoriteChange}
      onOpenItem={props.onOpenItem}
      onOpenWorkflow={props.onOpenWorkflow}
    />
  ) : (
    <SectionedList
      entries={props.allEntries}
      onAddImagePrompt={props.onAddImagePrompt}
      onAddPrompt={props.onAddPrompt}
      onAddRepo={props.onAddRepo}
      onAddWorkflow={props.onAddWorkflow}
      onFavoriteChange={props.onFavoriteChange}
      onOpenItem={props.onOpenItem}
      onOpenWorkflow={props.onOpenWorkflow}
    />
  )
}

function UnifiedList(props: {
  readonly entries: readonly CardEntry[]
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
}) {
  return (
    <section className="content-panel" data-qa="unified-results" aria-label="검색 결과">
      <div className="section-heading">
        <h2>결과</h2>
        <span>{props.entries.length}개</span>
      </div>
      <CardGrid
        entries={props.entries}
        emptyLabel="조건에 맞는 항목이 없습니다"
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
        onOpenWorkflow={props.onOpenWorkflow}
      />
    </section>
  )
}

function SectionedList(props: {
  readonly entries: readonly CardEntry[]
  readonly onAddImagePrompt: () => void
  readonly onAddPrompt: () => void
  readonly onAddRepo: () => void
  readonly onAddWorkflow: () => void
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
}) {
  const promptEntries = props.entries.filter(
    (entry) => entry.kind === "item" && entry.item.type === "prompt",
  )
  const imageEntries = props.entries.filter(
    (entry) => entry.kind === "item" && entry.item.type === "image_prompt",
  )
  const workflowEntries = props.entries.filter((entry) => entry.kind === "workflow")
  const repoEntries = props.entries.filter(
    (entry) => entry.kind === "item" && entry.item.type === "repo",
  )

  return (
    <div className="section-stack">
      <GallerySection
        action={{ label: "프롬프트 추가", onClick: props.onAddPrompt }}
        qa="section-prompt"
        title="프롬프트"
        entries={promptEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
        onOpenWorkflow={props.onOpenWorkflow}
      />
      <GallerySection
        action={{ label: "이미지 프롬프트 추가", onClick: props.onAddImagePrompt }}
        qa="section-image_prompt"
        title="이미지 프롬프트"
        entries={imageEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
        onOpenWorkflow={props.onOpenWorkflow}
      />
      <GallerySection
        action={{ label: "Workflow 추가", onClick: props.onAddWorkflow }}
        qa="section-workflow"
        title="Workflow"
        entries={workflowEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
        onOpenWorkflow={props.onOpenWorkflow}
      />
      <GallerySection
        action={{ label: "레포 추가", onClick: props.onAddRepo }}
        qa="section-repo"
        title="레포"
        entries={repoEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
        onOpenWorkflow={props.onOpenWorkflow}
      />
    </div>
  )
}

function GallerySection(props: {
  readonly action: SectionAction
  readonly qa: string
  readonly title: string
  readonly entries: readonly CardEntry[]
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
}) {
  return (
    <section className="content-panel" data-qa={props.qa} aria-label={props.title}>
      <div className="section-heading">
        <div className="section-heading-main">
          <h2>{props.title}</h2>
          <span>{props.entries.length}개</span>
        </div>
        <button
          aria-label={props.action.label}
          className="section-add-button"
          onClick={props.action.onClick}
          title={props.action.label}
          type="button"
        >
          <Plus aria-hidden="true" size={16} strokeWidth={1.8} />
        </button>
      </div>
      <CardGrid
        entries={props.entries}
        emptyLabel="아직 항목이 없습니다"
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
        onOpenWorkflow={props.onOpenWorkflow}
      />
    </section>
  )
}

function CardGrid(props: {
  readonly entries: readonly CardEntry[]
  readonly emptyLabel: string
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly onOpenWorkflow: (workflow: WorkflowItem) => void
}) {
  if (props.entries.length === 0) {
    return <p className="empty-copy">{props.emptyLabel}</p>
  }

  const isImageOnly = props.entries.every(
    (entry) => entry.kind === "item" && entry.item.type === "image_prompt",
  )

  return (
    <div className={isImageOnly ? "card-grid image-masonry-grid" : "card-grid"}>
      {props.entries.map((entry) => (
        <GalleryCard
          entry={entry}
          key={`${entry.kind}:${entryId(entry)}`}
          onFavoriteChange={props.onFavoriteChange}
          onOpenItem={props.onOpenItem}
          onOpenWorkflow={props.onOpenWorkflow}
        />
      ))}
    </div>
  )
}
