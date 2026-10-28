# Remotion — revisão atual V3

A composição atual é `CopyLockedV3.tsx`: `DavidV3Depth`, `DavidV3Split`, `DavidV3Paper`, 1080×1920, 30fps, 1833frames (61,1s). As três variam a abertura; corpo e voz são compartilhados. Os manifests estão em `projects/david-pronunciamento-black/edits/v3-*.json`. V1 e V2 foram rejeitadas; não são o copy atual.

V3 preserva o corpo do pronunciamento na ordem do Notion e usa o hook escrito como lettering, porque essa fala não existe no bruto. Não há voz sintética. `mastercopy-v3-map.json` documenta cada corte. O playback é 1×; cinco frames de pausa foram removidos em “da nossa história”. O falso início antes da frase do grupo VIP também saiu.

`public/mattes/david-intro` contém máscaras reais do Apple Vision; são imagens de luminância com canal alpha opaco. `RotoPerson` deve usar `mask-mode: luminance`. A abertura depth usa os primeiros90frames (fonte45–134), antes dos frames com vazamento relevante de peso verde junto à mão/cabeça. O restante volta ao footage integral por máscara circular. Essa limitação é específica deste take.

Os dois bitmaps novos têm proveniência em `public/generated/provenance.json`. O tool não expõe qual modelo de imagem executou; não atribuir a GPT-image-2.5. A embalagem real é sempre o asset oficial do site VIP.

## Histórico V2 — rejeitado por copy incompleto

# Remotion composition — David Black V2

Real React/Remotion composition, preview and export. Dependencies are isolated here and all Remotion packages are pinned to `4.0.536`. `AdComposition.tsx` exports the named `AdComposition` component, receiving `{edit}` props. `Root.tsx` registers `DavidBlackV2`, 1080×1920, 30 FPS, 918 frames (30.6 seconds), after the hook pacing revision. Animation should derive from Remotion frame time, without CSS animation clocks or randomness.

Local assets live in `public/`: `edit.json`, `source.mp4`, `hook-paced.mp4`, `sfx/*.wav`, `fonts/` and `brand/vip/`. Access media with `staticFile('source.mp4')` and `staticFile('sfx/pop.wav')`. Media files are ignored by the repository. Preserve their provenance and hashes in the project. The source must be original footage, without the V1 burned-in overlays.

```sh
npm install --prefix packages/remotion
npm --prefix packages/remotion run studio
node packages/remotion/render-v2.mjs storage/exports/PROJECT/v2-draft.mp4
```

Render a preview PNG through the same React composition:

```sh
node packages/remotion/render-v2.mjs --frame 90 --still /tmp/v2-frame90.png
```

Optional `--manifest /absolute/edit.json` passes another JSON as `{edit}` to both composition selection and render. Assets still resolve within this package's `public`. Optional `--browser /absolute/chrome-executable` uses an existing browser; otherwise Remotion handles browser discovery/download. You can also point `REMOTION_BROWSER_EXECUTABLE` at a browser binary in the environment.

Exports use H.264/AAC, yuv420p, CRF19, 192k audio, four concurrent rendering workers and four encoder threads. Existing outputs are refused. Full render progress prints in 10% increments. Output remains a draft until technical and audiovisual QA plus human approval; no `finals[]` entry is created. This Remotion composition is distinct from the repository's Canvas renderer; the shared Remotion composition is used for its own Studio preview and export.

Official implementation references: [Composition](https://www.remotion.dev/docs/composition), [bundler](https://www.remotion.dev/docs/bundler), [renderMedia](https://www.remotion.dev/docs/renderer/render-media), [renderStill](https://www.remotion.dev/docs/renderer/render-still).

Select another registered composition using `--composition HookType`, `--composition HookBenefits`, `--composition OfferReveal`, `--composition BenefitTickets` or `--composition VipPass`. `--variant type|split|benefits` explicitly overrides the edit variant; otherwise a supplied manifest keeps its variant for the main composition. HookType/HookBenefits select their corresponding variants.

`FontLoader.tsx` waits for local official Nuture font files: `BRAND_DISPLAY_FONT` is `Creme Glacee` (400 only), `BRAND_BODY_FONT` is `Inter` (400, 500, 700). Sources and SHA256 hashes are recorded in `public/fonts/PROVENANCE.json`; no runtime font CDN request is required.

Batch export reuses one bundle and browser, rendering variants sequentially with four workers:

```sh
node packages/remotion/batch-export.mjs david-pronunciamento-black split type benefits
python3 scripts/qa-remotion-exports.py david-pronunciamento-black
```

The batch expects `projects/<project>/edits/v2-<variant>.json` and writes `storage/exports/<project>/v2-<variant>.mp4`, refusing existing outputs. Technical QA writes `projects/<project>/reviews/v2-technical-qa.json` with full decode results, FFprobe fields, delivered-file loudness measurements, sizes and SHA256 hashes. Loudness analysis never changes the delivered audio. This report does not constitute human or audiovisual approval.
