import type { Item } from "./gallery-data"

export function ItemModalDetail({ item }: { readonly item: Item }) {
  return (
    <div className="detail-stack">
      <p className="detail-body">{item.body ?? item.githubUrl ?? "본문 없음"}</p>
      {item.notes !== null ? <p className="detail-notes">{item.notes}</p> : null}
      {item.imageKey !== null ? (
        <p className="detail-notes">이미지 메타데이터: {item.imageKey}</p>
      ) : null}
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
