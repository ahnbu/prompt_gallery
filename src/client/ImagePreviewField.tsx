import { Image, Trash2, Upload } from "lucide-react"
import { type DragEvent, useRef, useState } from "react"
import type { Item } from "./gallery-data"
import { deleteImageAsset, preparePreviewFile, uploadImageAsset } from "./image-assets"

type UploadStatus = "idle" | "uploading" | "removing"

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp"]

export function ImagePreviewField(props: {
  readonly item: Item | null
  readonly compact?: boolean
  readonly imageAssetId?: string | null
  readonly readOnly?: boolean
  readonly onDraftChange?: (assetId: string | null) => void
  readonly onChanged?: (itemId: string) => Promise<void>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const imageAssetId =
    props.imageAssetId === undefined ? (props.item?.imageAssetId ?? null) : props.imageAssetId
  const originalAssetId = props.item?.imageAssetId ?? null
  const hasImage = imageAssetId !== null
  const isDraftMode = props.onDraftChange !== undefined
  const canUploadTarget = props.item !== null || isDraftMode
  const canUpload = selectedFile !== null && status === "idle" && canUploadTarget
  const disabledReason =
    !canUploadTarget && props.readOnly !== true ? "항목 저장 후 이미지를 추가할 수 있습니다." : null

  async function uploadSelected(): Promise<void> {
    if (selectedFile === null || !canUploadTarget) {
      return
    }

    const boundItem = props.item
    setStatus("uploading")
    setProgress(5)
    setError(null)
    try {
      const preparedFile = await preparePreviewFile(selectedFile)
      const asset = await uploadImageAsset(
        props.onDraftChange === undefined && boundItem !== null
          ? { itemId: boundItem.id, file: preparedFile, onProgress: setProgress }
          : { file: preparedFile, onProgress: setProgress },
      )
      const previousDraftAssetId =
        props.onDraftChange !== undefined && imageAssetId !== originalAssetId ? imageAssetId : null
      setProgress(100)
      setSelectedFile(null)
      if (fileInputRef.current !== null) {
        fileInputRef.current.value = ""
      }
      if (props.onDraftChange === undefined) {
        if (boundItem !== null) {
          await props.onChanged?.(boundItem.id)
        }
      } else {
        props.onDraftChange(asset.id)
        if (previousDraftAssetId !== null) {
          await cleanupStagedAsset(previousDraftAssetId)
        }
      }
    } catch (uploadError) {
      handlePreviewError(uploadError, setError)
    } finally {
      setStatus("idle")
    }
  }

  const canDrop = canUploadTarget && props.compact !== true && props.readOnly !== true

  function handleDrop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    setDragging(false)
    if (!canDrop || status !== "idle") {
      return
    }
    const file = event.dataTransfer.files.item(0)
    if (file === null) {
      return
    }
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError("PNG, JPEG, WebP 이미지만 추가할 수 있습니다.")
      return
    }
    setError(null)
    setSelectedFile(file)
  }

  async function removeImage(): Promise<void> {
    if (props.item === null || imageAssetId === null) {
      return
    }

    setStatus("removing")
    setError(null)
    try {
      if (props.onDraftChange === undefined) {
        await deleteImageAsset(imageAssetId)
        await props.onChanged?.(props.item.id)
      } else {
        if (imageAssetId !== originalAssetId) {
          await deleteImageAsset(imageAssetId)
        }
        props.onDraftChange(null)
      }
    } catch (removeError) {
      handlePreviewError(removeError, setError)
    } finally {
      setStatus("idle")
    }
  }

  return (
    <div className={props.compact ? "image-preview compact" : "image-preview"}>
      <div
        className={dragging ? "image-preview-frame dragging" : "image-preview-frame"}
        data-qa="image-preview-frame"
        onDragLeave={canDrop ? () => setDragging(false) : undefined}
        onDragOver={
          canDrop
            ? (event) => {
                event.preventDefault()
                setDragging(true)
              }
            : undefined
        }
        onDrop={canDrop ? handleDrop : undefined}
      >
        {hasImage ? (
          <img
            alt={`${props.item?.title ?? "이미지 프롬프트"} 미리보기`}
            data-qa="image-preview-img"
            src={`/api/assets/${imageAssetId}/content`}
          />
        ) : (
          <div className="image-preview-empty" data-qa="image-preview-empty">
            <Image aria-hidden="true" size={props.compact ? 18 : 24} strokeWidth={1.7} />
            <span>{props.compact ? "이미지 없음" : "아직 연결된 이미지가 없습니다"}</span>
          </div>
        )}
      </div>
      {props.compact || props.readOnly === true ? null : (
        <div className="image-preview-controls">
          <label className="file-control">
            <span>파일 선택</span>
            <input
              accept="image/png,image/jpeg,image/webp"
              aria-label="이미지 파일 선택"
              data-qa="image-preview-file"
              disabled={!canUploadTarget || status !== "idle"}
              onChange={(event) => setSelectedFile(event.currentTarget.files?.item(0) ?? null)}
              ref={fileInputRef}
              type="file"
            />
          </label>
          <button
            className="secondary-button"
            data-qa="image-preview-upload"
            disabled={!canUpload}
            onClick={uploadSelected}
            type="button"
          >
            <Upload aria-hidden="true" size={15} strokeWidth={1.8} />
            <span>{hasImage ? "이미지 교체" : "이미지 업로드"}</span>
          </button>
          {hasImage ? (
            <button
              className="secondary-button danger"
              data-qa="image-preview-remove"
              disabled={status !== "idle"}
              onClick={removeImage}
              type="button"
            >
              <Trash2 aria-hidden="true" size={15} strokeWidth={1.8} />
              <span>이미지 제거</span>
            </button>
          ) : null}
          {selectedFile !== null ? <span className="file-name">{selectedFile.name}</span> : null}
          {disabledReason !== null ? <p className="preview-help">{disabledReason}</p> : null}
          {status === "uploading" ? (
            <output className="upload-progress" aria-live="polite">
              <progress max={100} value={progress} />
              <span>업로드 중 {progress}%</span>
            </output>
          ) : null}
          {status === "removing" ? (
            <output className="preview-help" aria-live="polite">
              이미지를 제거하는 중입니다.
            </output>
          ) : null}
          {error !== null ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}

function handlePreviewError(error: unknown, setError: (message: string) => void): void {
  if (error instanceof Error) {
    setError(error.message)
    return
  }
  throw error
}

async function cleanupStagedAsset(assetId: string): Promise<void> {
  try {
    await deleteImageAsset(assetId)
  } catch (error) {
    if (error instanceof Error) {
      console.warn("staged_asset_cleanup_failed", assetId)
      return
    }
    throw error
  }
}
