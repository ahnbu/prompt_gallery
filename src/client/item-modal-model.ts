import { ITEM_TYPES, type Item, type ItemType } from "./gallery-data"
import type { GalleryTab } from "./gallery-model"
import { tagNamesFromText } from "./tag-utils"

export type ItemModalState =
  | { readonly kind: "add"; readonly defaultType: ItemType | null }
  | { readonly kind: "detail"; readonly item: Item }

export type Draft = {
  readonly type: ItemType | ""
  readonly title: string
  readonly body: string
  readonly notes: string
  readonly githubUrl: string
  readonly sourceUrl: string
  readonly imageAssetId: string | null | undefined
  readonly tagsText: string
}

type ItemPayload = {
  readonly title: string | null
  readonly body: string | null
  readonly notes: string | null
  readonly githubUrl: string | null
  readonly sourceUrl: string | null
  readonly imageAssetId?: string | null
  readonly tags: readonly string[]
}

export type ParsedDraft =
  | { readonly kind: "valid"; readonly type: ItemType; readonly payload: ItemPayload }
  | { readonly kind: "invalid"; readonly message: string }

export function defaultTypeForTab(tab: GalleryTab): ItemType | null {
  switch (tab) {
    case "prompt":
    case "image_prompt":
    case "repo":
      return tab
    case "all":
    case "favorite":
    case "workflow":
      return null
    default:
      return assertNever(tab)
  }
}

export function draftFromState(state: ItemModalState): Draft {
  if (state.kind === "add") {
    return {
      type: state.defaultType ?? "",
      title: "",
      body: "",
      notes: "",
      githubUrl: "",
      sourceUrl: "",
      imageAssetId: undefined,
      tagsText: "",
    }
  }

  return {
    type: state.item.type,
    title: state.item.title,
    body: state.item.body ?? "",
    notes: state.item.notes ?? "",
    githubUrl: state.item.githubUrl ?? "",
    sourceUrl: state.item.sourceUrl ?? "",
    imageAssetId: state.item.imageAssetId,
    tagsText: state.item.tags
      .filter((tag) => tag.sources.includes("manual"))
      .map((tag) => tag.name)
      .join(", "),
  }
}

export function parseDraft(draft: Draft): ParsedDraft {
  if (draft.type === "") {
    return { kind: "invalid", message: "유형을 선택하세요." }
  }
  if (isPromptLike(draft.type) && normalize(draft.body) === null) {
    return { kind: "invalid", message: "본문을 입력하세요." }
  }
  if (draft.type === ITEM_TYPES.REPO && normalize(draft.githubUrl) === null) {
    return { kind: "invalid", message: "GitHub URL을 입력하세요." }
  }

  return { kind: "valid", type: draft.type, payload: payloadFromDraft(draft) }
}

export function readType(value: string): ItemType | "" {
  switch (value) {
    case ITEM_TYPES.PROMPT:
    case ITEM_TYPES.IMAGE_PROMPT:
    case ITEM_TYPES.REPO:
      return value
    case "":
      return ""
    default:
      return ""
  }
}

export function isPromptLike(type: ItemType | ""): boolean {
  return type === ITEM_TYPES.PROMPT || type === ITEM_TYPES.IMAGE_PROMPT
}

function payloadFromDraft(draft: Draft): ItemPayload {
  return {
    title: normalize(draft.title),
    body: normalize(draft.body),
    notes: normalize(draft.notes),
    githubUrl: normalize(draft.githubUrl),
    sourceUrl: normalize(draft.sourceUrl),
    ...(draft.imageAssetId !== undefined ? { imageAssetId: draft.imageAssetId } : {}),
    tags: tagNamesFromText(draft.tagsText),
  }
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function assertNever(value: never): never {
  throw new Error(`Unexpected modal value: ${String(value)}`)
}
