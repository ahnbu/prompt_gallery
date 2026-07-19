import type { Item } from "./gallery-data"

export function copyableText(item: Item): string | null {
  const parts: string[] = []
  if (item.body !== null) {
    parts.push(item.body)
  }
  if (item.githubUrl !== null) {
    parts.push(item.githubUrl)
  }
  if (parts.length === 0) {
    return null
  }
  return parts.join("\n\n")
}
