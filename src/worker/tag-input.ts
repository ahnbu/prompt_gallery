import { ApiError } from "./item-types"
import type { CreateTagInput, MergeTagsInput, PatchTagInput } from "./tag-types"

const DEFAULT_TAG_COLOR = "#64748b"
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/

function getField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined
  }

  return Reflect.get(value, key)
}

function normalizeTagName(name: string): string {
  return name.trim().toLowerCase()
}

function readRequiredString(
  value: unknown,
  key: string,
  code: "invalid_tag" | "invalid_merge",
): string {
  const field = getField(value, key)
  if (typeof field !== "string") {
    throw new ApiError(code, `${key} must be a string.`, 400)
  }

  const trimmed = field.trim()
  if (trimmed.length === 0) {
    throw new ApiError(code, `${key} must not be empty.`, 400)
  }

  return trimmed
}

function readOptionalString(
  value: unknown,
  key: string,
  code: "invalid_tag" | "invalid_merge",
): string | undefined {
  const field = getField(value, key)
  if (field === undefined) {
    return undefined
  }
  if (typeof field !== "string") {
    throw new ApiError(code, `${key} must be a string.`, 400)
  }

  const trimmed = field.trim()
  if (trimmed.length === 0) {
    throw new ApiError(code, `${key} must not be empty.`, 400)
  }

  return trimmed
}

function readKeywords(value: unknown): readonly string[] | undefined {
  const field = getField(value, "keywords")
  if (field === undefined) {
    return undefined
  }
  if (!Array.isArray(field)) {
    throw new ApiError("invalid_tag", "keywords must be an array of strings.", 400)
  }

  const keywords = new Set<string>()
  for (const entry of field) {
    if (typeof entry !== "string") {
      throw new ApiError("invalid_tag", "keywords must be an array of strings.", 400)
    }
    const normalized = entry.trim().toLowerCase()
    if (normalized.length > 0) {
      keywords.add(normalized)
    }
  }

  return [...keywords]
}

function parseColor(value: string): string {
  if (!COLOR_PATTERN.test(value)) {
    throw new ApiError("invalid_tag", "color must be a hex color like #3366cc.", 400)
  }

  return value.toLowerCase()
}

export function parseCreateTag(value: unknown): CreateTagInput {
  const color = readOptionalString(value, "color", "invalid_tag") ?? DEFAULT_TAG_COLOR

  return {
    name: normalizeTagName(readRequiredString(value, "name", "invalid_tag")),
    color: parseColor(color),
    keywords: readKeywords(value) ?? [],
  }
}

export function parsePatchTag(value: unknown): PatchTagInput {
  const name = readOptionalString(value, "name", "invalid_tag")
  const color = readOptionalString(value, "color", "invalid_tag")
  const keywords = readKeywords(value)
  const patch = {
    ...(name !== undefined ? { name: normalizeTagName(name) } : {}),
    ...(color !== undefined ? { color: parseColor(color) } : {}),
    ...(keywords !== undefined ? { keywords } : {}),
  } satisfies PatchTagInput

  if (Object.keys(patch).length === 0) {
    throw new ApiError("invalid_tag", "Patch body must include name, color, or keywords.", 400)
  }

  return patch
}

export function parseMergeTags(value: unknown): MergeTagsInput {
  const sourceId = readRequiredString(value, "sourceId", "invalid_merge")
  const targetId = readRequiredString(value, "targetId", "invalid_merge")
  if (sourceId === targetId) {
    throw new ApiError("invalid_merge", "sourceId and targetId must be different.", 400)
  }

  return { sourceId, targetId }
}
