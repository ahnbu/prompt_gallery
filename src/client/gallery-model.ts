import type { GalleryData, Item, ItemTag, ItemType, WorkflowItem } from "./gallery-data"

export type GalleryTab = "favorite" | "all" | ItemType | "workflow"
export type CardEntry =
  | { readonly kind: "item"; readonly item: Item }
  | { readonly kind: "workflow"; readonly workflow: WorkflowItem }

type FilterRequest = {
  readonly activeTab: GalleryTab
  readonly entries: readonly CardEntry[]
  readonly searchText: string
  readonly selectedTags: readonly string[]
}

type UnifiedRequest = {
  readonly activeTab: GalleryTab
  readonly searchText: string
  readonly selectedTags: readonly string[]
}

export function assertNever(value: never): never {
  throw new Error(`Unexpected gallery value: ${String(value)}`)
}

export function entryId(entry: CardEntry): string {
  switch (entry.kind) {
    case "item":
      return entry.item.id
    case "workflow":
      return entry.workflow.id
    default:
      return assertNever(entry)
  }
}

function itemEntry(item: Item): CardEntry {
  return { kind: "item", item }
}

function workflowEntry(workflow: WorkflowItem): CardEntry {
  return { kind: "workflow", workflow }
}

function entryUpdatedAt(entry: CardEntry): string {
  switch (entry.kind) {
    case "item":
      return entry.item.updatedAt
    case "workflow":
      return entry.workflow.updatedAt
    default:
      return assertNever(entry)
  }
}

function entrySearchText(entry: CardEntry): string {
  switch (entry.kind) {
    case "item":
      return [
        entry.item.title,
        entry.item.body,
        entry.item.notes,
        entry.item.githubUrl,
        ...entry.item.tags.map((tag) => tag.name),
      ]
        .filter((value): value is string => value !== null)
        .join(" ")
        .toLowerCase()
    case "workflow":
      return [
        entry.workflow.name,
        entry.workflow.notes,
        ...entry.workflow.steps.map((step) => step.memo ?? step.url ?? step.itemId ?? ""),
      ]
        .filter((value): value is string => value !== null && value.length > 0)
        .join(" ")
        .toLowerCase()
    default:
      return assertNever(entry)
  }
}

function entryTags(entry: CardEntry): readonly ItemTag[] {
  switch (entry.kind) {
    case "item":
      return entry.item.tags
    case "workflow":
      return []
    default:
      return assertNever(entry)
  }
}

function matchesTab(entry: CardEntry, activeTab: GalleryTab): boolean {
  switch (activeTab) {
    case "all":
      return true
    case "favorite":
      return entry.kind === "item" && entry.item.favorite
    case "workflow":
      return entry.kind === "workflow"
    case "prompt":
    case "image_prompt":
    case "repo":
      return entry.kind === "item" && entry.item.type === activeTab
    default:
      return assertNever(activeTab)
  }
}

function matchesTags(entry: CardEntry, selectedTags: readonly string[]): boolean {
  if (selectedTags.length === 0) {
    return true
  }

  const names = new Set(entryTags(entry).map((tag) => tag.name))
  return selectedTags.every((tag) => names.has(tag))
}

function compareLatest(left: CardEntry, right: CardEntry): number {
  return entryUpdatedAt(right).localeCompare(entryUpdatedAt(left))
}

export function allCardEntries(data: GalleryData): readonly CardEntry[] {
  return [...data.items.map(itemEntry), ...data.workflows.map(workflowEntry)].sort(compareLatest)
}

export function filteredCardEntries(request: FilterRequest): readonly CardEntry[] {
  const query = request.searchText.trim().toLowerCase()
  return request.entries.filter(
    (entry) =>
      matchesTab(entry, request.activeTab) &&
      matchesTags(entry, request.selectedTags) &&
      (query.length === 0 || entrySearchText(entry).includes(query)),
  )
}

export function shouldShowUnifiedResults(request: UnifiedRequest): boolean {
  return (
    request.activeTab !== "all" ||
    request.searchText.trim().length > 0 ||
    request.selectedTags.length > 0
  )
}

export function visibleTags(tags: readonly ItemTag[]): readonly ItemTag[] {
  return tags.slice(0, 10)
}
