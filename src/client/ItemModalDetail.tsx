import { ExternalLink } from "lucide-react"
import { ImagePreviewField } from "./ImagePreviewField"
import type { Item } from "./gallery-data"

export function ItemModalDetail(props: {
  readonly item: Item
}) {
  const item = props.item
  return (
    <div className="detail-stack">
      {item.type === "image_prompt" ? <ImagePreviewField item={item} readOnly /> : null}
      <p className="detail-body">{item.body ?? item.githubUrl ?? "본문 없음"}</p>
      {item.type === "repo" && item.githubUrl !== null ? (
        <a
          className="detail-link"
          data-qa="repo-detail-github"
          href={item.githubUrl}
          rel="noreferrer"
          target="_blank"
        >
          <ExternalLink aria-hidden="true" size={15} strokeWidth={1.8} />
          <span>GitHub 열기</span>
        </a>
      ) : null}
      {item.notes !== null ? <p className="detail-notes">{item.notes}</p> : null}
      {item.tags.length > 0 ? (
        <div className="card-tags" aria-label="태그">
          {item.tags.map((tag) => (
            <span className="card-tag" data-qa="card-tag" key={tag.id}>
              {tag.name}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}
