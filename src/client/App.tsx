import { Download, Plus, Search, Tags } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { GalleryResults } from "./GalleryList"
import { ItemModal, type ItemModalState, defaultTypeForTab } from "./ItemModal"
import { TagManagementModal } from "./TagManagementModal"
import { WorkflowModal, type WorkflowModalState } from "./WorkflowModal"
import { downloadExport } from "./export-data"
import {
  type GalleryData,
  ITEM_TYPES,
  type Item,
  type ItemTag,
  type ItemType,
  type WorkflowItem,
  fetchGalleryData,
} from "./gallery-data"
import {
  type GalleryTab,
  allCardEntries,
  filteredCardEntries,
  shouldShowUnifiedResults,
} from "./gallery-model"
import { tabs } from "./gallery-tabs"
import { updateItem, updateItemFavorite } from "./item-mutations"

type GalleryStatus = "loading" | "ready" | "error"

const emptyData: GalleryData = { items: [], tags: [], workflows: [] }

export function App() {
  const [galleryData, setGalleryData] = useState<GalleryData>(emptyData)
  const [status, setStatus] = useState<GalleryStatus>("loading")
  const [activeTab, setActiveTab] = useState<GalleryTab>("all")
  const [searchText, setSearchText] = useState("")
  const [selectedTags, setSelectedTags] = useState<readonly string[]>([])
  const [modalState, setModalState] = useState<ItemModalState | null>(null)
  const [workflowModalState, setWorkflowModalState] = useState<WorkflowModalState | null>(null)
  const [tagManagementOpen, setTagManagementOpen] = useState(false)
  const [exportStatus, setExportStatus] = useState<"idle" | "failed">("idle")
  const tagRequestSeq = useRef<Map<string, number>>(new Map())

  function nextTagRequestId(itemId: string): number {
    const next = (tagRequestSeq.current.get(itemId) ?? 0) + 1
    tagRequestSeq.current.set(itemId, next)
    return next
  }

  function isLatestTagRequest(itemId: string, requestId: number): boolean {
    return tagRequestSeq.current.get(itemId) === requestId
  }

  useEffect(() => {
    const controller = new AbortController()
    setStatus("loading")
    fetchGalleryData(controller.signal).then(
      (data) => {
        setGalleryData(data)
        setStatus("ready")
      },
      () => {
        if (!controller.signal.aborted) {
          setStatus("error")
        }
      },
    )

    return () => {
      controller.abort()
    }
  }, [])

  const allEntries = useMemo(() => allCardEntries(galleryData), [galleryData])
  const filteredEntries = filteredCardEntries({
    activeTab,
    entries: allEntries,
    searchText,
    selectedTags,
  })
  const showUnified = shouldShowUnifiedResults({ activeTab, searchText, selectedTags })

  function toggleTag(name: string): void {
    setSelectedTags((current) =>
      current.includes(name) ? current.filter((tag) => tag !== name) : [...current, name],
    )
  }

  async function refreshGalleryData(): Promise<GalleryData> {
    setStatus("loading")
    const data = await fetchGalleryData(new AbortController().signal)
    setGalleryData(data)
    setStatus("ready")
    return data
  }

  async function refreshAfterMutation(): Promise<void> {
    await refreshGalleryData()
  }

  async function refreshAfterItemSave(updatedItem?: Item): Promise<void> {
    if (updatedItem !== undefined) {
      replaceItemInState(updatedItem)
      return
    }
    await refreshGalleryData()
  }

  function replaceItemInState(updated: Item): void {
    setGalleryData((current) => ({
      ...current,
      items: current.items.map((candidate) => (candidate.id === updated.id ? updated : candidate)),
    }))
    setModalState((current) =>
      current?.kind === "detail" && current.item.id === updated.id
        ? { kind: "detail", item: updated }
        : current,
    )
  }

  function applyItemPatch(itemId: string, patch: Partial<Item>): void {
    setGalleryData((current) => ({
      ...current,
      items: current.items.map((candidate) =>
        candidate.id === itemId ? { ...candidate, ...patch } : candidate,
      ),
    }))
    setModalState((current) =>
      current?.kind === "detail" && current.item.id === itemId
        ? { kind: "detail", item: { ...current.item, ...patch } }
        : current,
    )
  }

  async function toggleFavorite(item: Item): Promise<void> {
    const nextFavorite = !item.favorite
    applyItemPatch(item.id, { favorite: nextFavorite })
    try {
      const updated = await updateItemFavorite(item.id, nextFavorite)
      replaceItemInState(updated)
    } catch (error) {
      applyItemPatch(item.id, { favorite: item.favorite })
      throw error
    }
  }

  function optimisticTagsFor(item: Item, tagNames: readonly string[]): readonly ItemTag[] {
    const existing = new Map(item.tags.map((tag) => [tag.name, tag]))
    return tagNames.map((name) => {
      const known = existing.get(name)
      if (known !== undefined) {
        return known
      }
      const definition = galleryData.tags.find((tag) => tag.name === name)
      return {
        id: definition?.id ?? `pending:${name}`,
        name,
        color: definition?.color ?? "var(--surface-control)",
        sources: ["manual"] as const,
      }
    })
  }

  async function changeTags(item: Item, tags: readonly string[]): Promise<void> {
    const requestId = nextTagRequestId(item.id)
    const previousTags = item.tags
    applyItemPatch(item.id, { tags: optimisticTagsFor(item, tags) })
    try {
      const updated = await updateItem(item.id, {
        title: item.title,
        body: item.body,
        notes: item.notes,
        githubUrl: item.githubUrl,
        imageAssetId: item.imageAssetId,
        tags,
      })
      if (isLatestTagRequest(item.id, requestId)) {
        replaceItemInState(updated)
      }
    } catch (error) {
      if (isLatestTagRequest(item.id, requestId)) {
        applyItemPatch(item.id, { tags: previousTags })
        throw error
      }
    }
  }

  function openAddModal(): void {
    if (activeTab === "workflow") {
      openAddWorkflowModal()
      return
    }
    openAddItemModal(defaultTypeForTab(activeTab))
  }

  function openAddItemModal(defaultType: ItemType | null): void {
    setModalState({ kind: "add", defaultType })
  }

  function openAddWorkflowModal(): void {
    setWorkflowModalState({ kind: "add" })
  }

  function openDetailModal(item: Item): void {
    setModalState({ kind: "detail", item })
  }

  function openWorkflowModal(workflow: WorkflowItem): void {
    setWorkflowModalState({ kind: "detail", workflow })
  }

  async function exportGallery(): Promise<void> {
    setExportStatus("idle")
    try {
      await downloadExport()
    } catch (error) {
      if (error instanceof Error) {
        setExportStatus("failed")
        return
      }
      throw error
    }
  }

  return (
    <main className="app-shell" aria-labelledby="app-title">
      <header className="topbar">
        <div className="title-block brand-lockup">
          <img aria-hidden="true" className="brand-favicon" src="/favicon.svg" alt="" />
          <h1 id="app-title">Prompt Gallery</h1>
        </div>
        <div className="topbar-actions">
          <button
            aria-label="추가"
            className="primary-button topbar-primary-action"
            onClick={openAddModal}
            type="button"
          >
            <Plus aria-hidden="true" size={17} strokeWidth={1.8} />
            <span>추가</span>
          </button>
          <button
            aria-label="태그 관리"
            className="ghost-button"
            onClick={() => setTagManagementOpen(true)}
            type="button"
          >
            <Tags aria-hidden="true" size={17} strokeWidth={1.8} />
            <span>태그 관리</span>
          </button>
          <button
            aria-label="내보내기"
            className="ghost-button"
            onClick={() => void exportGallery()}
            type="button"
          >
            <Download aria-hidden="true" size={17} strokeWidth={1.8} />
            <span>내보내기</span>
          </button>
        </div>
        <label className="search-control">
          <Search aria-hidden="true" size={16} strokeWidth={1.8} />
          <input
            aria-label="통합검색"
            onChange={(event) => setSearchText(event.currentTarget.value)}
            placeholder="검색어, 본문, 메모, 태그"
            type="search"
            value={searchText}
          />
        </label>
      </header>

      <nav className="tabbar" aria-label="Prompt Gallery sections">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = tab.value === activeTab

          return (
            <button
              aria-current={active ? "page" : undefined}
              aria-label={tab.label}
              className={active ? "tab-button active" : "tab-button"}
              data-tab-tone={tab.tone}
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              title={tab.label}
              type="button"
            >
              <Icon aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>{tab.shortLabel}</span>
            </button>
          )
        })}
      </nav>
      {exportStatus === "failed" ? (
        <p className="form-error">내보내기 파일을 만들지 못했습니다</p>
      ) : null}

      <section className="tag-filter" aria-label="태그 필터">
        {galleryData.tags.map((tag) => {
          const selected = selectedTags.includes(tag.name)
          return (
            <button
              aria-pressed={selected}
              className={selected ? "tag-chip selected" : "tag-chip"}
              key={tag.id}
              onClick={() => toggleTag(tag.name)}
              title={tag.name}
              type="button"
            >
              {tag.name}
            </button>
          )
        })}
      </section>

      {status === "loading" ? <section className="content-panel">불러오는 중</section> : null}
      {status === "error" ? (
        <section className="content-panel">데이터를 불러오지 못했습니다</section>
      ) : null}
      {status === "ready" ? (
        <GalleryResults
          allEntries={allEntries}
          filteredEntries={filteredEntries}
          onAddImagePrompt={() => openAddItemModal(ITEM_TYPES.IMAGE_PROMPT)}
          onAddPrompt={() => openAddItemModal(ITEM_TYPES.PROMPT)}
          onAddRepo={() => openAddItemModal(ITEM_TYPES.REPO)}
          onAddWorkflow={openAddWorkflowModal}
          onFavoriteChange={toggleFavorite}
          onTagsChange={changeTags}
          onOpenItem={openDetailModal}
          onOpenWorkflow={openWorkflowModal}
          showUnified={showUnified}
          tags={galleryData.tags}
        />
      ) : null}
      {modalState !== null ? (
        <ItemModal
          onClose={() => setModalState(null)}
          onDeleted={refreshAfterMutation}
          onFavoriteChange={toggleFavorite}
          onSaved={refreshAfterItemSave}
          state={modalState}
          tags={galleryData.tags}
        />
      ) : null}
      {workflowModalState !== null ? (
        <WorkflowModal
          items={galleryData.items}
          onClose={() => setWorkflowModalState(null)}
          onDeleted={refreshAfterMutation}
          onSaved={refreshAfterMutation}
          state={workflowModalState}
        />
      ) : null}
      {tagManagementOpen ? (
        <TagManagementModal
          onChanged={refreshAfterMutation}
          onClose={() => setTagManagementOpen(false)}
          tags={galleryData.tags}
        />
      ) : null}
    </main>
  )
}
