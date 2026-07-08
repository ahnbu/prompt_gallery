import { ITEM_TYPES, type Item } from "./gallery-data"

export function canCopyItemBody(item: Item): boolean {
  return (
    item.body !== null && (item.type === ITEM_TYPES.PROMPT || item.type === ITEM_TYPES.IMAGE_PROMPT)
  )
}
