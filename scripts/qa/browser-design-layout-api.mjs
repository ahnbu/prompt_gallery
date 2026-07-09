import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const rootDir = path.resolve(fileURLToPath(new URL("../..", import.meta.url)))
export const defaultOutput = path.join(
  rootDir,
  ".omo/evidence/ui-6-prompt-gallery-design-application.md",
)
export const fixturePrefix = "DesignQA "

export class DesignLayoutError extends Error {}

export function assert(condition, message) {
  if (!condition) {
    throw new DesignLayoutError(message)
  }
}

export function parseArgs(argv) {
  const args = new Map()
  const tokens = argv[0] === "--" ? argv.slice(1) : argv
  const allowed = new Set(["--base-url", "--output"])

  for (let index = 0; index < tokens.length; index += 1) {
    const key = tokens[index]
    const value = tokens[index + 1]
    if (!allowed.has(key)) {
      throw new DesignLayoutError(`Unknown argument: ${key}`)
    }
    if (value === undefined || value.startsWith("--")) {
      throw new DesignLayoutError(`Missing value for ${key}`)
    }
    args.set(key, value)
    index += 1
  }

  return args
}

export function resolvePath(value) {
  return path.resolve(rootDir, value)
}

export function relativePath(value) {
  return path.relative(rootDir, value).replaceAll(path.sep, "/")
}

export async function prepareOutput(output) {
  await mkdir(path.dirname(output), { recursive: true })
  try {
    return await readFile(output, "utf8")
  } catch (error) {
    if (error?.code === "ENOENT") {
      return undefined
    }
    throw error
  }
}

export async function writeEvidence(output, result, renderEvidence) {
  await writeFile(output, renderEvidence(result))
}

async function requestJson(baseUrl, method, pathname, body) {
  const response = await fetch(new URL(pathname, baseUrl), {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  })
  const bodyText = await response.text()
  const payload = bodyText.length > 0 ? JSON.parse(bodyText) : null
  if (!response.ok) {
    throw new DesignLayoutError(`${method} ${pathname} returned ${response.status}: ${bodyText}`)
  }
  return payload
}

export async function cleanupFixtures(baseUrl) {
  const workflowsPayload = await requestJson(baseUrl, "GET", "/api/workflows")
  for (const workflow of workflowsPayload.workflows) {
    if (typeof workflow.id === "string" && String(workflow.name).startsWith(fixturePrefix)) {
      await requestJson(baseUrl, "DELETE", `/api/workflows/${workflow.id}`)
    }
  }

  const itemsPayload = await requestJson(baseUrl, "GET", "/api/items")
  for (const item of itemsPayload.items) {
    if (typeof item.id === "string" && String(item.title).startsWith(fixturePrefix)) {
      await requestJson(baseUrl, "DELETE", `/api/items/${item.id}`)
    }
  }
}

async function createItem(baseUrl, item) {
  const payload = await requestJson(baseUrl, "POST", "/api/items", item)
  return payload.item
}

async function createWorkflow(baseUrl, workflow) {
  const payload = await requestJson(baseUrl, "POST", "/api/workflows", workflow)
  return payload.workflow
}

export async function seedFixtures(baseUrl) {
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  const prompts = []
  const repos = []
  const images = []
  const workflows = []

  for (let index = 1; index <= 4; index += 1) {
    prompts.push(
      await createItem(baseUrl, {
        type: "prompt",
        title: `${fixturePrefix}Prompt ${index} ${suffix}`,
        body: `Reusable prompt fixture ${index} for square card layout QA.`,
        tags: [],
      }),
    )
  }

  for (let index = 1; index <= 2; index += 1) {
    repos.push(
      await createItem(baseUrl, {
        type: "repo",
        title: `${fixturePrefix}Repo ${index} ${suffix}`,
        githubUrl: `https://github.com/example/design-layout-${index}`,
        tags: [],
      }),
    )
  }

  const imageSpecs = [
    { key: "wide", title: `${fixturePrefix}Image Wide ${suffix}`, width: 1200, height: 640 },
    { key: "square", title: `${fixturePrefix}Image Square ${suffix}`, width: 900, height: 900 },
    { key: "tall", title: `${fixturePrefix}Image Tall ${suffix}`, width: 640, height: 1240 },
  ]
  for (const spec of imageSpecs) {
    const item = await createItem(baseUrl, {
      type: "image_prompt",
      title: spec.title,
      body: `Image prompt ${spec.key} fixture for masonry layout QA.`,
      tags: [],
    })
    images.push({ ...spec, id: item.id })
  }

  for (let index = 1; index <= 2; index += 1) {
    workflows.push(
      await createWorkflow(baseUrl, {
        name: `${fixturePrefix}Workflow ${index} ${suffix}`,
        notes: `Workflow fixture ${index} for square card layout QA.`,
        steps: [{ kind: "memo", memo: `Step ${index}`, position: 1 }],
      }),
    )
  }

  return {
    suffix,
    prompts: prompts.map((item) => item.title),
    repos: repos.map((item) => item.title),
    workflows: workflows.map((workflow) => workflow.name),
    images,
  }
}
