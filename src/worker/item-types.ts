export const ITEM_TYPES = {
  PROMPT: "prompt",
  IMAGE_PROMPT: "image_prompt",
  REPO: "repo",
} as const

export type ItemType = (typeof ITEM_TYPES)[keyof typeof ITEM_TYPES]

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

export type ItemTag = {
  readonly id: string
  readonly name: string
  readonly color: string
}

export type ItemRow = {
  readonly id: string
  readonly type: ItemType
  readonly title: string
  readonly body: string | null
  readonly notes: string | null
  readonly github_url: string | null
  readonly image_key: string | null
  readonly favorite: number
  readonly created_at: string
  readonly updated_at: string
}

export type CreateItemInput = {
  readonly type: ItemType
  readonly title: string
  readonly body: string | null
  readonly notes: string | null
  readonly githubUrl: string | null
  readonly imageKey: string | null
  readonly favorite: boolean
  readonly tagNames: readonly string[] | null
}

export type PatchItemInput = {
  readonly title?: string | null
  readonly body?: string | null
  readonly notes?: string | null
  readonly githubUrl?: string | null
  readonly imageKey?: string | null
  readonly favorite?: boolean
  readonly tagNames?: readonly string[]
}

export type ApiErrorCode =
  | "invalid_json"
  | "invalid_item"
  | "invalid_workflow"
  | "invalid_tag"
  | "invalid_merge"
  | "not_found"
  | "tag_in_use"
  | "method_not_allowed"

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message)
    this.code = code
    this.status = status
  }
}

export function rowToItem(row: ItemRow): Item {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    body: row.body,
    notes: row.notes,
    githubUrl: row.github_url,
    imageKey: row.image_key,
    favorite: row.favorite === 1,
    tags: [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function isPromptLike(type: ItemType): boolean {
  return type === ITEM_TYPES.PROMPT || type === ITEM_TYPES.IMAGE_PROMPT
}

export function parseItemType(value: unknown): ItemType | null {
  switch (value) {
    case ITEM_TYPES.PROMPT:
      return ITEM_TYPES.PROMPT
    case ITEM_TYPES.IMAGE_PROMPT:
      return ITEM_TYPES.IMAGE_PROMPT
    case ITEM_TYPES.REPO:
      return ITEM_TYPES.REPO
    default:
      return null
  }
}

export function errorResponse(error: ApiError): Response {
  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
      },
    },
    { status: error.status },
  )
}
