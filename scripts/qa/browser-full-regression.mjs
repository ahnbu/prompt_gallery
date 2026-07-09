export async function runFullRegression(baseUrl, output, scenarios) {
  const artifacts = []
  for (const [name, runner] of scenarios) {
    const scenarioOutput = output.replace(/\.md$/, `-${name}.md`)
    artifacts.push({ scenario: name, artifacts: await runner(baseUrl, scenarioOutput) })
  }
  return artifacts
}

export function renderFullRegressionEvidence(result) {
  const lines = [
    "# Final Browser Full Regression",
    "",
    `Scenario: ${result.scenario}`,
    `Base URL: ${result.baseUrl}`,
    `Local app started: ${result.started ? "yes" : "no"}`,
    `Result: ${result.ok ? "PASS" : "FAIL"}`,
  ]

  if (result.artifacts !== undefined) {
    lines.push("", "## Scenario Coverage")
    for (const group of result.artifacts) {
      lines.push(`- ${group.scenario}: PASS (${group.artifacts.length} artifacts)`)
      for (const artifact of group.artifacts) {
        lines.push(
          `  - ${artifact.viewport ?? "n/a"} ${artifact.state ?? "artifact"}: ${artifact.path} (${artifact.bytes ?? 0} bytes)`,
        )
      }
    }
  }
  if (result.error !== undefined) {
    lines.push("", "## Failure", result.error)
  }
  if (result.devLogs !== undefined) {
    lines.push(
      "",
      "## Dev Logs",
      `stdout: ${result.devLogs.stdoutPath}`,
      `stderr: ${result.devLogs.stderrPath}`,
    )
  }
  lines.push(
    "",
    "## Binary Observable",
    result.ok
      ? "Playwright drove gallery search, modal CRUD, copy/favorite, image preview, workflow/repo, tag management, and export download."
      : "Nonzero CLI exit with captured browser assertion failure.",
  )
  return `${lines.join("\n")}\n`
}
