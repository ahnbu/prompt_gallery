import { Copy, Star } from "lucide-react"

export function DetailActions(props: {
  readonly canCopyBody: boolean
  readonly confirmDelete: boolean
  readonly copyStatus: "idle" | "copied" | "failed"
  readonly favorite: boolean
  readonly itemTitle: string
  readonly saving: boolean
  readonly onCancelDelete: () => void
  readonly onCopyBody: () => Promise<void>
  readonly onDelete: () => void
  readonly onEdit: () => void
  readonly onStartDelete: () => void
  readonly onToggleFavorite: () => Promise<void>
}) {
  const favoriteLabel = props.favorite
    ? `${props.itemTitle} 즐겨찾기 해제`
    : `${props.itemTitle} 즐겨찾기 추가`

  return (
    <>
      <div className="modal-action-group">
        {props.canCopyBody ? (
          <>
            <button
              aria-label={`${props.itemTitle} 본문 복사`}
              className="secondary-button"
              data-qa="copy-body-button"
              onClick={props.onCopyBody}
              type="button"
            >
              <Copy aria-hidden="true" size={16} strokeWidth={1.8} />
              <span>본문 복사</span>
            </button>
            {props.copyStatus !== "idle" ? (
              <output className="copy-status" data-qa="copy-status">
                {props.copyStatus === "copied" ? "복사됨" : "복사 실패"}
              </output>
            ) : null}
          </>
        ) : null}
        <button
          aria-label={favoriteLabel}
          aria-pressed={props.favorite}
          className="secondary-button"
          data-qa="favorite-toggle"
          data-state={props.favorite ? "favorite" : "not-favorite"}
          disabled={props.saving}
          onClick={props.onToggleFavorite}
          type="button"
        >
          <Star
            aria-hidden="true"
            fill={props.favorite ? "currentColor" : "none"}
            size={16}
            strokeWidth={1.8}
          />
          <span>{props.favorite ? "즐겨찾기 해제" : "즐겨찾기"}</span>
        </button>
      </div>
      <div className="modal-action-group">
        <button className="secondary-button" onClick={props.onEdit} type="button">
          수정
        </button>
        {props.confirmDelete ? (
          <>
            <button className="secondary-button" onClick={props.onCancelDelete} type="button">
              취소
            </button>
            <button
              className="danger-button"
              disabled={props.saving}
              onClick={props.onDelete}
              type="button"
            >
              삭제 확인
            </button>
          </>
        ) : (
          <button className="danger-button" onClick={props.onStartDelete} type="button">
            삭제
          </button>
        )}
      </div>
    </>
  )
}

export function EditActions(props: {
  readonly saving: boolean
  readonly onCancel: () => void | Promise<void>
  readonly onSave: () => void
}) {
  return (
    <>
      <button className="secondary-button" onClick={props.onCancel} type="button">
        취소
      </button>
      <button
        className="primary-button"
        disabled={props.saving}
        onClick={props.onSave}
        type="button"
      >
        저장
      </button>
    </>
  )
}
