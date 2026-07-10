import type { ItemTag } from "./gallery-data"

export function tagNamesFromText(value: string): readonly string[] {
  const names = new Set<string>()
  for (const tag of value.split(",")) {
    const normalized = tag.trim().toLowerCase()
    if (normalized.length > 0) {
      names.add(normalized)
    }
  }
  return [...names]
}

export function tagNamesToText(tags: readonly string[]): string {
  return tags.join(", ")
}

export function manualTagNames(tags: readonly ItemTag[]): readonly string[] {
  return tags.filter((tag) => tag.sources.includes("manual")).map((tag) => tag.name)
}

export function automaticTagNames(tags: readonly ItemTag[]): readonly string[] {
  return tags.filter((tag) => tag.sources.includes("auto")).map((tag) => tag.name)
}
