export const ITEM_TYPES = {
  PROMPT: "prompt",
  IMAGE_PROMPT: "image_prompt",
  REPO: "repo",
} as const

export type ItemType = (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES]

export type ItemTag = {
  readonly id: string
  readonly name: string
  readonly color: string
}

export type Item = {
  readonly id: string
  readonly type: ItemType
  readonly title: string
  readonly body: string | null
  readonly notes: string | null
  readonly githubUrl: string | null
  readonly imageKey: string | null
  readonly favorite: boolean
  readonly tags: readonly ItemTag[]
  readonly createdAt: string
  readonly updatedAt: string
}

export type Tag = {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly keywords: readonly string[]
  readonly itemCount: number
  readonly createdAt: string
  readonly updatedAt: string
}

export type WorkflowStep = {
  readonly id: string
  readonly kind: string
  readonly position: number
  readonly itemId: string | null
  readonly memo: string | null
  readonly url: string | null
}

export type WorkflowItem = {
  readonly id: string
  readonly name: string
  readonly notes: string | null
  readonly steps: readonly WorkflowStep[]
  readonly createdAt: string
  readonly updatedAt: string
}

export type GalleryData = {
  readonly items: readonly Item[]
  readonly tags: readonly Tag[]
  readonly workflows: readonly WorkflowItem[]
}

type JsonRecord = Readonly<Record<string, unknown>>

class GalleryDataError extends Error {}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function getField(record: JsonRecord, key: string): unknown {
  return Reflect.get(record, key)
}

function readString(record: JsonRecord, key: string): string {
  const value = getField(record, key)
  if (typeof value !== "string") {
    throw new GalleryDataError(`${key} must be a string.`)
  }

  return value
}

function readNullableString(record: JsonRecord, key: string): string | null {
  const value = getField(record, key)
  if (value === null) {
    return null
  }
  if (typeof value !== "string") {
    throw new GalleryDataError(`${key} must be a string or null.`)
  }

  return value
}

function readBoolean(record: JsonRecord, key: string): boolean {
  const value = getField(record, key)
  if (typeof value !== "boolean") {
    throw new GalleryDataError(`${key} must be a boolean.`)
  }

  return value
}

function readNumber(record: JsonRecord, key: string): number {
  const value = getField(record, key)
  if (typeof value !== "number") {
    throw new GalleryDataError(`${key} must be a number.`)
  }

  return value
}

function readArray(record: JsonRecord, key: string): readonly unknown[] {
  const value = getField(record, key)
  if (!Array.isArray(value)) {
    throw new GalleryDataError(`${key} must be an array.`)
  }

  return value
}

function requireRecord(value: unknown, name: string): JsonRecord {
  if (!isRecord(value)) {
    throw new GalleryDataError(`${name} must be an object.`)
  }

  return value
}

function parseItemType(value: unknown): ItemType {
  switch (value) {
    case ITEM_TYPES.PROMPT:
      return ITEM_TYPES.PROMPT
    case ITEM_TYPES.IMAGE_PROMPT:
      return ITEM_TYPES.IMAGE_PROMPT
    case ITEM_TYPES.REPO:
      return ITEM_TYPES.REPO
    default:
      throw new GalleryDataError("Unknown item type.")
  }
}

function parseItemTag(value: unknown): ItemTag {
  const record = requireRecord(value, "tag")
  return {
    id: readString(record, "id"),
    name: readString(record, "name"),
    color: readString(record, "color"),
  }
}

function parseItem(value: unknown): Item {
  const record = requireRecord(value, "item")
  return {
    id: readString(record, "id"),
    type: parseItemType(getField(record, "type")),
    title: readString(record, "title"),
    body: readNullableString(record, "body"),
    notes: readNullableString(record, "notes"),
    githubUrl: readNullableString(record, "githubUrl"),
    imageKey: readNullableString(record, "imageKey"),
    favorite: readBoolean(record, "favorite"),
    tags: readArray(record, "tags").map(parseItemTag),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  }
}

function parseTag(value: unknown): Tag {
  const record = requireRecord(value, "tag")
  return {
    id: readString(record, "id"),
    name: readString(record, "name"),
    color: readString(record, "color"),
    keywords: readArray(record, "keywords").map((keyword) => {
      if (typeof keyword !== "string") {
        throw new GalleryDataError("keyword must be a string.")
      }
      return keyword
    }),
    itemCount: readNumber(record, "itemCount"),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  }
}

function parseWorkflowStep(value: unknown): WorkflowStep {
  const record = requireRecord(value, "workflow step")
  const itemId = getField(record, "itemId")
  const memo = getField(record, "memo")
  const url = getField(record, "url")
  return {
    id: readString(record, "id"),
    kind: readString(record, "kind"),
    position: readNumber(record, "position"),
    itemId: typeof itemId === "string" ? itemId : null,
    memo: typeof memo === "string" ? memo : null,
    url: typeof url === "string" ? url : null,
  }
}

function parseWorkflow(value: unknown): WorkflowItem {
  const record = requireRecord(value, "workflow")
  return {
    id: readString(record, "id"),
    name: readString(record, "name"),
    notes: readNullableString(record, "notes"),
    steps: readArray(record, "steps").map(parseWorkflowStep),
    createdAt: readString(record, "createdAt"),
    updatedAt: readString(record, "updatedAt"),
  }
}

async function readJson(pathname: string, signal: AbortSignal): Promise<unknown> {
  const response = await fetch(pathname, { signal })
  if (!response.ok) {
    throw new GalleryDataError(`${pathname} returned ${response.status}.`)
  }

  return response.json()
}

export async function fetchGalleryData(signal: AbortSignal): Promise<GalleryData> {
  const [itemsPayload, tagsPayload, workflowsPayload] = await Promise.all([
    readJson("/api/items", signal),
    readJson("/api/tags", signal),
    readJson("/api/workflows", signal),
  ])
  const itemsRecord = requireRecord(itemsPayload, "items response")
  const tagsRecord = requireRecord(tagsPayload, "tags response")
  const workflowsRecord = requireRecord(workflowsPayload, "workflows response")

  return {
    items: readArray(itemsRecord, "items").map(parseItem),
    tags: readArray(tagsRecord, "tags").map(parseTag),
    workflows: readArray(workflowsRecord, "workflows").map(parseWorkflow),
  }
}
