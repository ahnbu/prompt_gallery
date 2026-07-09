type AssetUpload = {
  readonly id: string
  readonly contentUrl: string
}

class ImageAssetError extends Error {}

const MAX_IMAGE_EDGE = 1200
const OUTPUT_TYPE = "image/webp"
const OUTPUT_QUALITY = 0.88

export async function preparePreviewFile(file: File): Promise<File> {
  const image = await loadImage(file)
  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext("2d")
  if (context === null) {
    throw new ImageAssetError("이미지 처리 컨텍스트를 만들 수 없습니다.")
  }

  context.drawImage(image, 0, 0, width, height)
  const blob = await canvasBlob(canvas)
  return new File([blob], `${baseName(file.name)}.webp`, { type: OUTPUT_TYPE })
}

export async function uploadImageAsset(options: {
  readonly itemId?: string
  readonly file: File
  readonly onProgress: (progress: number) => void
}): Promise<AssetUpload> {
  const formData = new FormData()
  if (options.itemId !== undefined) {
    formData.set("itemId", options.itemId)
  }
  formData.set("file", options.file)

  const response = await xhrPost("/api/assets", formData, options.onProgress)
  return parseAssetUpload(response)
}

export async function deleteImageAsset(assetId: string): Promise<void> {
  const response = await fetch("/api/assets", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ id: assetId }),
  })
  if (!response.ok) {
    throw new ImageAssetError(await responseError(response))
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new ImageAssetError("이미지를 읽지 못했습니다."))
    }
    image.src = url
  })
}

function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob === null) {
          reject(new ImageAssetError("이미지 압축에 실패했습니다."))
          return
        }
        resolve(blob)
      },
      OUTPUT_TYPE,
      OUTPUT_QUALITY,
    )
  })
}

function xhrPost(
  pathname: string,
  body: FormData,
  onProgress: (progress: number) => void,
): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest()
    request.open("POST", pathname)
    request.responseType = "text"
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        onProgress(Math.round((event.loaded / event.total) * 100))
      }
    }
    request.onload = () => {
      if (request.status < 200 || request.status >= 300) {
        reject(new ImageAssetError(`이미지 업로드가 실패했습니다. (${request.status})`))
        return
      }
      try {
        resolve(JSON.parse(request.responseText))
      } catch (error) {
        if (error instanceof SyntaxError) {
          reject(new ImageAssetError("이미지 업로드 응답을 읽지 못했습니다."))
          return
        }
        reject(error)
      }
    }
    request.onerror = () => {
      reject(new ImageAssetError("이미지 업로드 요청이 실패했습니다."))
    }
    request.send(body)
  })
}

function parseAssetUpload(value: unknown): AssetUpload {
  if (typeof value !== "object" || value === null) {
    throw new ImageAssetError("이미지 업로드 응답이 올바르지 않습니다.")
  }
  const asset = Reflect.get(value, "asset")
  if (typeof asset !== "object" || asset === null) {
    throw new ImageAssetError("이미지 업로드 응답이 올바르지 않습니다.")
  }
  const id = Reflect.get(asset, "id")
  const contentUrl = Reflect.get(asset, "contentUrl")
  if (typeof id !== "string" || typeof contentUrl !== "string") {
    throw new ImageAssetError("이미지 업로드 응답에 필요한 값이 없습니다.")
  }
  return { id, contentUrl }
}

async function responseError(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json()
    if (typeof payload === "object" && payload !== null) {
      const error = Reflect.get(payload, "error")
      if (typeof error === "object" && error !== null) {
        const message = Reflect.get(error, "message")
        if (typeof message === "string") {
          return message
        }
      }
    }
  } catch (error) {
    if (!(error instanceof SyntaxError)) {
      throw error
    }
  }
  return `요청이 실패했습니다. (${response.status})`
}

function baseName(name: string): string {
  const dotIndex = name.lastIndexOf(".")
  return dotIndex > 0 ? name.slice(0, dotIndex) : name
}
