import type { Tag } from "./gallery-data"

export type TagDraft = {
  readonly name: string
  readonly color: string
  readonly keywordsText: string
}

export type DraftById = ReadonlyMap<string, TagDraft>
export type ConfirmDeleteById = ReadonlyMap<string, boolean>
export type MergeTargetById = ReadonlyMap<string, string>
export type RowStatus = ReadonlyMap<string, string>

export function draftFromTag(tag: Tag): TagDraft {
  return {
    name: tag.name,
    color: tag.color,
    keywordsText: tag.keywords.join(", "),
  }
}

export function draftsFromTags(tags: readonly Tag[]): DraftById {
  return new Map(tags.map((tag) => [tag.id, draftFromTag(tag)]))
}

export function defaultMergeTargets(tags: readonly Tag[]): MergeTargetById {
  return new Map(
    tags.map((tag) => [tag.id, tags.find((candidate) => candidate.id !== tag.id)?.id ?? ""]),
  )
}

export function mergeTargetsFromTags(
  tags: readonly Tag[],
  current: MergeTargetById,
): MergeTargetById {
  const tagIds = new Set(tags.map((tag) => tag.id))
  return new Map(
    tags.map((tag) => {
      const currentTarget = current.get(tag.id)
      return [
        tag.id,
        currentTarget !== undefined && tagIds.has(currentTarget) && currentTarget !== tag.id
          ? currentTarget
          : (tags.find((candidate) => candidate.id !== tag.id)?.id ?? ""),
      ]
    }),
  )
}

export function keywordsFromText(value: string): readonly string[] {
  return value
    .split(",")
    .map((keyword) => keyword.trim())
    .filter((keyword) => keyword.length > 0)
}
