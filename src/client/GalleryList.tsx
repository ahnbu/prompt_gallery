import { GalleryCard } from "./GalleryCard"
import type { Item } from "./gallery-data"
import { type CardEntry, entryId } from "./gallery-model"

export function GalleryResults(props: {
  readonly allEntries: readonly CardEntry[]
  readonly filteredEntries: readonly CardEntry[]
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
  readonly showUnified: boolean
}) {
  return props.showUnified ? (
    <UnifiedList
      entries={props.filteredEntries}
      onFavoriteChange={props.onFavoriteChange}
      onOpenItem={props.onOpenItem}
    />
  ) : (
    <SectionedList
      entries={props.allEntries}
      onFavoriteChange={props.onFavoriteChange}
      onOpenItem={props.onOpenItem}
    />
  )
}

function UnifiedList(props: {
  readonly entries: readonly CardEntry[]
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
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
      />
    </section>
  )
}

function SectionedList(props: {
  readonly entries: readonly CardEntry[]
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
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
        qa="section-prompt"
        title="프롬프트"
        entries={promptEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
      />
      <GallerySection
        qa="section-image_prompt"
        title="이미지 프롬프트"
        entries={imageEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
      />
      <GallerySection
        qa="section-workflow"
        title="Workflow"
        entries={workflowEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
      />
      <GallerySection
        qa="section-repo"
        title="레포"
        entries={repoEntries}
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
      />
    </div>
  )
}

function GallerySection(props: {
  readonly qa: string
  readonly title: string
  readonly entries: readonly CardEntry[]
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
}) {
  return (
    <section className="content-panel" data-qa={props.qa} aria-label={props.title}>
      <div className="section-heading">
        <h2>{props.title}</h2>
        <span>{props.entries.length}개</span>
      </div>
      <CardGrid
        entries={props.entries}
        emptyLabel="아직 항목이 없습니다"
        onFavoriteChange={props.onFavoriteChange}
        onOpenItem={props.onOpenItem}
      />
    </section>
  )
}

function CardGrid(props: {
  readonly entries: readonly CardEntry[]
  readonly emptyLabel: string
  readonly onFavoriteChange: (item: Item) => Promise<void>
  readonly onOpenItem: (item: Item) => void
}) {
  if (props.entries.length === 0) {
    return <p className="empty-copy">{props.emptyLabel}</p>
  }

  return (
    <div className="card-grid">
      {props.entries.map((entry) => (
        <GalleryCard
          entry={entry}
          key={`${entry.kind}:${entryId(entry)}`}
          onFavoriteChange={props.onFavoriteChange}
          onOpenItem={props.onOpenItem}
        />
      ))}
    </div>
  )
}
