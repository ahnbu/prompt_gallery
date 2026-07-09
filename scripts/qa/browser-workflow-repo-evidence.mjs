export function renderWorkflowRepoEvidence(result) {
  const lines = [
    "# Wave 3 Workflow Repo Browser QA",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Command: ${result.invocation ?? "pnpm qa:browser -- --scenario workflow-repo"}`,
    `Output: ${result.output ?? ".omo/evidence/wave-3-workflow-repo.md"}`,
    `Exit code: ${result.exitCode}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
    "",
    "## Assertions",
    "- Prompt fixture is available before workflow creation.",
    "- Repo item is created through the visible item modal.",
    "- Repo card and detail expose GitHub external links with target _blank.",
    "- Workflow is created through the visible workflow modal.",
    "- Workflow API validation errors are shown in the modal.",
    "- Prompt, repo, memo, and external link steps persist after reload in positions 1..4.",
    "- Task17 prompt, repo, and workflow fixtures are deleted through API cleanup.",
    "",
  ]

  if (result.previousEvidence !== undefined) {
    lines.push(
      "## Baseline RED",
      "Captured before implementation:",
      "",
      result.previousEvidence.trim(),
      "",
    )
  }

  if (!result.ok) {
    lines.push("## Failure", result.error ?? "Unknown failure", "")
  }

  if (Array.isArray(result.artifacts) && result.artifacts.length > 0) {
    lines.push("## Screenshots")
    for (const artifact of result.artifacts) {
      lines.push(
        `- ${artifact.viewport} ${artifact.state}: ${artifact.path} (${artifact.bytes} bytes)`,
      )
    }
    lines.push("")
  }

  if (result.devLogs !== undefined) {
    lines.push(
      "## Dev Logs",
      `stdout: ${result.devLogs.stdoutPath}`,
      `stderr: ${result.devLogs.stderrPath}`,
      "",
    )
  }

  lines.push(
    "## Binary Observable",
    result.ok
      ? "Playwright repo link, workflow validation, reload, ordered step DOM, API cleanup, and screenshot assertions passed."
      : "Scenario failed before all assertions completed.",
    "",
  )

  return `${lines.join("\n")}\n`
}
