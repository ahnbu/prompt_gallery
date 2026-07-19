export class ApiRequestError extends Error {}

async function errorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json()
    if (
      typeof payload === "object" &&
      payload !== null &&
      "error" in payload &&
      typeof payload.error === "object" &&
      payload.error !== null &&
      "message" in payload.error &&
      typeof payload.error.message === "string"
    ) {
      return payload.error.message
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return `Request failed with ${response.status}.`
    }
    throw error
  }

  return `Request failed with ${response.status}.`
}

export async function submitJson(pathname: string, init: RequestInit): Promise<void> {
  const response = await fetch(pathname, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  })
  if (!response.ok) {
    throw new ApiRequestError(await errorMessage(response))
  }
}

export async function submitJsonForResult(pathname: string, init: RequestInit): Promise<unknown> {
  const response = await fetch(pathname, {
    ...init,
    headers: { "content-type": "application/json", ...init.headers },
  })
  if (!response.ok) {
    throw new ApiRequestError(await errorMessage(response))
  }

  return response.json()
}
