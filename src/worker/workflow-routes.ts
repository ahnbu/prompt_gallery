import type { WorkerEnv } from "./index"
import { readJson } from "./item-input"
import { ApiError, errorResponse } from "./item-types"
import { parseCreateWorkflow, parsePatchWorkflow } from "./workflow-input"
import { WorkflowRepository } from "./workflow-repository"

function methodNotAllowed(): Response {
  return errorResponse(new ApiError("method_not_allowed", "Method not allowed.", 405))
}

function workflowNotFound(): Response {
  return errorResponse(new ApiError("not_found", "Workflow not found.", 404))
}

export async function handleWorkflowsRequest(
  request: Request,
  env: WorkerEnv,
  id: string | null,
): Promise<Response> {
  try {
    const repository = new WorkflowRepository(env.DB)

    if (id === null) {
      switch (request.method) {
        case "GET":
          return Response.json({ workflows: await repository.list() })
        case "POST": {
          const input = parseCreateWorkflow(await readJson(request))
          return Response.json({ workflow: await repository.create(input) }, { status: 201 })
        }
        default:
          return methodNotAllowed()
      }
    }

    switch (request.method) {
      case "GET": {
        const workflow = await repository.get(id)
        return workflow === null ? workflowNotFound() : Response.json({ workflow })
      }
      case "PATCH": {
        const input = parsePatchWorkflow(await readJson(request))
        const workflow = await repository.update(id, input)
        return workflow === null ? workflowNotFound() : Response.json({ workflow })
      }
      case "DELETE":
        return (await repository.delete(id)) ? Response.json({ ok: true }) : workflowNotFound()
      default:
        return methodNotAllowed()
    }
  } catch (error) {
    if (error instanceof ApiError) {
      return errorResponse(error)
    }
    throw error
  }
}
