// Adapt versioned ideas for display without changing their source records.
const asText = (value) =>
  typeof value === "string"
    ? value
    : value == null
      ? ""
      : JSON.stringify(value);
export function normalizeWorkspaceIdeas(project) {
  return (project.ideas || []).map((idea) => ({
    id: `workspace:${project.id}:${idea.id}`,
    sourceId: idea.id,
    projectId: project.id,
    projectTitle: project.title || project.id,
    origin: "workspace",
    title: idea.title,
    status: idea.status === "approved" ? "approved" : "draft",
    sourceStatus: idea.status || "proposed",
    hook: asText(idea.hook || idea.hookHypothesis || idea.message),
    style:
      asText(idea.style || idea.visualDirection || idea.direction) ||
      "Direção a definir",
    duration:
      Number.isFinite(Number(idea.duration)) && Number(idea.duration) > 0
        ? Number(idea.duration)
        : null,
    note: asText(idea.note || idea.message),
    ref:
      asText(idea.source || idea.sources || idea.sourceSpan) ||
      "Ver ideia versionada",
    source: idea,
  }));
}
