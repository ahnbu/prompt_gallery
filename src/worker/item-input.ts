import {
  ApiError,
  type CreateItemInput,
  ITEM_TYPES,
  type Item,
  type PatchItemInput,
  isPromptLike,
  parseItemType,
} from "./item-types"

const TITLE_LIMIT = 80

type CreateTitleParts = {
  readonly type: CreateItemInput["type"]
  readonly title: string | null
  readonly body: string | null
  readonly githubUrl: string | null
}

function getField(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) {
    return undefined
  }

  return Reflect.get(value, key)
}

function readOptionalString(value: unknown, key: string): string | null | undefined {
  const field = getField(value, key)
  if (field === undefined) {
    return undefined
  }
  if (field === null) {
    return null
  }
  if (typeof field !== "string") {
    throw new ApiError("invalid_item", `${key} must be a string.`, 400)
  }

  const trimmed = field.trim()
  return trimmed.length === 0 ? null : trimmed
}

function readOptionalBoolean(value: unknown, key: string): boolean | undefined {
  const field = getField(value, key)
  if (field === undefined) {
    return undefined
  }
  if (typeof field !== "boolean") {
    throw new ApiError("invalid_item", `${key} must be a boolean.`, 400)
  }

  return field
}

function readOptionalNullableId(value: unknown, key: string): string | null | undefined {
  const field = getField(value, key)
  if (field === undefined) {
    return undefined
  }
  if (field === null) {
    return null
  }
  if (typeof field !== "string" || field.trim().length === 0) {
    throw new ApiError("invalid_item", `${key} must be a non-empty string or null.`, 400)
  }

  return field.trim()
}

function isValidGitHubUrl(value: string): boolean {
  try {
    const url = new URL(value)
    const pathParts = url.pathname.split("/").filter((part) => part.length > 0)
    return url.protocol === "https:" && url.hostname === "github.com" && pathParts.length >= 2
  } catch (error) {
    if (error instanceof TypeError) {
      return false
    }
    throw error
  }
}

function requireGitHubUrl(value: string | null): string {
  if (value === null || !isValidGitHubUrl(value)) {
    throw new ApiError("invalid_item", "Repo items require a valid GitHub URL.", 400)
  }

  return value
}

function readOptionalTags(value: unknown): readonly string[] | null | undefined {
  const field = getField(value, "tags")
  if (field === undefined) {
    return undefined
  }
  if (!Array.isArray(field)) {
    throw new ApiError("invalid_item", "tags must be an array of tag names.", 400)
  }

  const names = new Set<string>()
  for (const entry of field) {
    if (typeof entry !== "string") {
      throw new ApiError("invalid_item", "tags must be an array of tag names.", 400)
    }
    const normalized = entry.trim().toLowerCase()
    if (normalized.length > 0) {
      names.add(normalized)
    }
  }

  return [...names]
}

function bodyTitle(body: string): string {
  const compact = body.trim().replace(/\s+/g, " ")
  return compact.length > TITLE_LIMIT ? `${compact.slice(0, TITLE_LIMIT - 1)}...` : compact
}

function deriveCreateTitle(parts: CreateTitleParts): string {
  if (parts.title !== null) {
    return parts.title
  }
  if (isPromptLike(parts.type) && parts.body !== null) {
    return bodyTitle(parts.body)
  }
  if (parts.type === ITEM_TYPES.REPO && parts.githubUrl !== null) {
    return parts.githubUrl
  }

  return "Untitled repo"
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new ApiError("invalid_json", "Request body must be valid JSON.", 400)
    }
    throw error
  }
}

export function parseFavoriteItem(value: unknown): boolean {
  const favorite = readOptionalBoolean(value, "favorite")
  if (favorite === undefined) {
    throw new ApiError("invalid_item", "favorite must be a boolean.", 400)
  }

  return favorite
}

export function parseCreateItem(value: unknown): CreateItemInput {
  const type = parseItemType(getField(value, "type"))
  if (type === null) {
    throw new ApiError("invalid_item", "Item type must be prompt, image_prompt, or repo.", 400)
  }

  const body = readOptionalString(value, "body") ?? null
  if (isPromptLike(type) && body === null) {
    throw new ApiError("invalid_item", "Prompt and image prompt items require body.", 400)
  }

  const githubUrl = readOptionalString(value, "githubUrl") ?? null
  if (type === ITEM_TYPES.REPO) {
    requireGitHubUrl(githubUrl)
  }
  const title = deriveCreateTitle({
    type,
    title: readOptionalString(value, "title") ?? null,
    body,
    githubUrl,
  })

  return {
    type,
    title,
    body,
    notes: readOptionalString(value, "notes") ?? null,
    githubUrl,
    favorite: readOptionalBoolean(value, "favorite") ?? false,
    tagNames: readOptionalTags(value) ?? null,
  }
}

export function parsePatchItem(value: unknown, current: Item): PatchItemInput {
  const title = readOptionalString(value, "title")
  const body = readOptionalString(value, "body")
  const notes = readOptionalString(value, "notes")
  const githubUrl = readOptionalString(value, "githubUrl")
  const favorite = readOptionalBoolean(value, "favorite")
  const tagNames = readOptionalTags(value)
  const imageAssetId = readOptionalNullableId(value, "imageAssetId")

  if (isPromptLike(current.type) && body === null) {
    throw new ApiError("invalid_item", "Prompt and image prompt items require body.", 400)
  }
  if (current.type === ITEM_TYPES.REPO && githubUrl !== undefined) {
    requireGitHubUrl(githubUrl)
  }

  const patch = {
    ...(title !== undefined ? { title } : {}),
    ...(body !== undefined ? { body } : {}),
    ...(notes !== undefined ? { notes } : {}),
    ...(githubUrl !== undefined ? { githubUrl } : {}),
    ...(favorite !== undefined ? { favorite } : {}),
    ...(tagNames !== undefined ? { tagNames: tagNames ?? [] } : {}),
    ...(imageAssetId !== undefined ? { imageAssetId } : {}),
  } satisfies PatchItemInput

  if (Object.keys(patch).length === 0) {
    throw new ApiError("invalid_item", "Patch body must include at least one supported field.", 400)
  }

  if (patch.title === null) {
    const effectiveBody = patch.body ?? current.body
    if (isPromptLike(current.type) && effectiveBody !== null) {
      return { ...patch, title: bodyTitle(effectiveBody) }
    }
    return { ...patch, title: current.githubUrl ?? "Untitled repo" }
  }

  return patch
}
