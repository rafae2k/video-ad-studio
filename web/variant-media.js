// Draft playback is limited to the owning project's served export folder.
export function draftVideoPath(projectId, value) {
  if (typeof projectId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(projectId))
    return null;
  if (typeof value !== "string") return null;
  const prefix = `/storage/exports/${projectId}/`;
  if (!value.startsWith(prefix)) return null;
  const filename = value.slice(prefix.length);
  return /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.mp4$/i.test(filename) ? value : null;
}
