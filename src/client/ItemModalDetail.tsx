import { ExternalLink, Link } from "lucide-react"
import { ImagePreviewField } from "./ImagePreviewField"
import type { Item } from "./gallery-data"

export function ItemModalDetail(props: {
  readonly item: Item
}) {
  const item = props.item
  const showBody = item.type === "prompt" || item.type === "image_prompt"
  return (
    <div className="detail-stack">
      {showBody && item.body !== null ? <p className="detail-body">{item.body}</p> : null}
      {item.type === "image_prompt" ? <ImagePreviewField item={item} readOnly /> : null}
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
      <div className="detail-divider" aria-hidden="true" />
      <footer className="detail-meta">
        <time dateTime={item.updatedAt}>{item.updatedAt.slice(0, 10)} 수정</time>
        {item.sourceUrl !== null ? (
          <a
            className="detail-link"
            data-qa="item-detail-source"
            href={item.sourceUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Link aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>출처 열기</span>
          </a>
        ) : null}
      </footer>
    </div>
  )
}
