export function DetailActions(props: {
  readonly confirmDelete: boolean
  readonly saving: boolean
  readonly onCancelDelete: () => void
  readonly onDelete: () => void
  readonly onEdit: () => void
  readonly onStartDelete: () => void
}) {
  return (
    <>
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
  readonly confirmDelete?: boolean
  readonly canDelete?: boolean
  readonly saving: boolean
  readonly onCancel: () => void | Promise<void>
  readonly onCancelDelete?: () => void
  readonly onDelete?: () => void
  readonly onSave: () => void
  readonly onStartDelete?: () => void
}) {
  return (
    <>
      {props.canDelete === true ? (
        props.confirmDelete === true ? (
          <button
            className="danger-button"
            disabled={props.saving}
            onClick={props.onDelete}
            type="button"
          >
            삭제 확인
          </button>
        ) : (
          <button className="danger-button" onClick={props.onStartDelete} type="button">
            삭제
          </button>
        )
      ) : null}
      <button className="secondary-button" onClick={props.onCancel} type="button">
        {props.confirmDelete === true ? "삭제 취소" : "취소"}
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
