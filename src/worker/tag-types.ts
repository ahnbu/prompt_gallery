export type Tag = {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly keywords: readonly string[]
  readonly itemCount: number
  readonly createdAt: string
  readonly updatedAt: string
}

export type TagRow = {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly created_at: string
  readonly updated_at: string
}

export type TagKeywordRow = {
  readonly keyword: string
}

export type ItemTagRow = {
  readonly item_id: string
  readonly id: string
  readonly name: string
  readonly color: string
  readonly source: TagSource
}

export type TagCountRow = {
  readonly count: number
}

export const TAG_SOURCES = {
  MANUAL: "manual",
  AUTO: "auto",
} as const

export type TagSource = (typeof TAG_SOURCES)[keyof typeof TAG_SOURCES]

export type CreateTagInput = {
  readonly name: string
  readonly color: string
  readonly keywords: readonly string[]
}

export type PatchTagInput = {
  readonly name?: string
  readonly color?: string
  readonly keywords?: readonly string[]
}

export type MergeTagsInput = {
  readonly sourceId: string
  readonly targetId: string
}

export function rowToTag(row: TagRow, keywords: readonly string[], itemCount: number): Tag {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    keywords,
    itemCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}
