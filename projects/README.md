# Projects

Each project lives in `projects/<id>/`. Use `npm run project:new -- <id> "Title" ["Brand"]` to create `project.json`, `brief.json`, `ideas.json`, `assets.json` and `approvals.json` without replacing an existing project. The local Studio reads the project catalog and selected public fields from `ideas.json` through `GET /api/projects`; agents can update the files, then reload the browser to inspect them. The browser can export draft JSON, but importing a reviewed draft into the repository remains an explicit file edit. Raw source footage and rendered MP4s are not committed by default. See [WORKFLOW.md](../WORKFLOW.md) for statuses and gates.

Use `status: "demo"` for examples. Save versioned timeline manifests under `projects/<id>/variants/`; the local server serves only that project subfolder, not private `brief.json` or approval records. Reserve `finals[]` for a real rendered file with a reviewed output path, source manifest and review status. Put local output files under `storage/exports/<project-id>/` so the Studio can play them at `/storage/exports/<project-id>/<file>.mp4`. `storage/` is ignored by Git; back up approved masters separately. A UI preview or an unreviewed draft is not a final ad.

Minimal catalog contract:

```json
{
  "id": "project-id",
  "title": "Project title",
  "brand": "Brand",
  "status": "demo",
  "updatedAt": "2026-10-18",
  "description": "Short description",
  "variants": [
    {
      "id": "v1",
      "name": "Variant",
      "manifestPath": "/projects/project-id/variants/v1.json",
      "status": "draft"
    }
  ],
  "finals": []
}
```
