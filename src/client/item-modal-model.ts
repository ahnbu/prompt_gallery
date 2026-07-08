import { ITEM_TYPES, type Item, type ItemType } from "./gallery-data"
import type { GalleryTab } from "./gallery-model"

export type ItemModalState =
  | { readonly kind: "add"; readonly defaultType: ItemType | null }
  | { readonly kind: "detail"; readonly item: Item }

export type Draft = {
  readonly type: ItemType | ""
  readonly title: string
  readonly body: string
  readonly notes: string
  readonly githubUrl: string
  readonly imageKey: string
  readonly tagsText: string
}

type ItemPayload = {
  readonly title: string | null
  readonly body: string | null
  readonly notes: string | null
  readonly githubUrl: string | null
  readonly imageKey: string | null
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
      imageKey: "",
      tagsText: "",
    }
  }

  return {
    type: state.item.type,
    title: state.item.title,
    body: state.item.body ?? "",
    notes: state.item.notes ?? "",
    githubUrl: state.item.githubUrl ?? "",
    imageKey: state.item.imageKey ?? "",
    tagsText: state.item.tags.map((tag) => tag.name).join(", "),
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
    imageKey: normalize(draft.imageKey),
    tags: tagNames(draft.tagsText),
  }
}

function normalize(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

function tagNames(value: string): readonly string[] {
  return value
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag.length > 0)
}

function assertNever(value: never): never {
  throw new Error(`Unexpected modal value: ${String(value)}`)
}
