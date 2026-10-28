# Biblioteca audiovisual local

Código original, sem dependências de runtime ou assets de terceiros. Implementa preview Canvas determinístico e codificação FFmpeg dos frames capturados desse preview. O catálogo está em `catalog.json`; exemplos em `examples/demo.json` e `examples/demo-variant.json`.

## Preview

```js
import {renderFrame, validateProject} from './packages/video/index.js';
const errors = validateProject(project);
if (errors.length) throw new Error(errors.join('\n'));
canvas.width = project.width;
canvas.height = project.height;
renderFrame(canvas.getContext('2d'), project, frame / project.fps, decodedAssets);
```

`decodedAssets` mapeia `assetId` para `HTMLImageElement`, canvas ou outro `CanvasImageSource` já decodificado. Imagens externas exigem CORS para capturar frames. Aguarde imagens e fontes antes de renderizar. O renderer não faz fetch, geração de IA, reprodução nem captura de áudio.

## Contrato de timeline v1

- Projeto: `id`, `schemaVersion: 1`, `width`, `height`, `fps` inteiros; `duration` em segundos; `background` e `accent` como cores CSS; `layers` em ordem de composição.
- Layer: `id` único, `type`, `start`, `duration`, `text`. Intervalo `[start, start + duration)`; o último frame exclusivo não é desenhado.
- `x`, `y`: centro da camada em coordenadas normalizadas, 0–1. `w`, `h`: frações de largura/altura do frame. Padrões: `.5`, `.5`, `.84`, `.16`.
- Estilo: `color`, `accent`, `background`, `fontSize` em pixels, `align` (`center`/`left`), `effect` opcional.
- `caption.words`: lista `{text,start,end}` em segundos locais à camada, com intervalo final exclusivo. Mostra um bloco por vez; o bloco pode conter mais de uma palavra. Sem essa lista, mostra `text` estático.
- `photo_depth`/`collage_kit`: `assetId`, `zoom` (padrão `.08`). O primeiro implementa zoom + deslocamento 2D; não infere depth map, não separa planos nem gera parallax 3D. O segundo anima uma imagem pronta; montagem com múltiplos recortes usa múltiplas layers.
- `stat`: `text` estático, ou `value` numérico para contagem. Não inventa nem verifica dados.
- `audio`: cues `{sfx,start,gain}` de sons do catálogo. Preview visual não os toca; a interface precisa tocar os WAVs no relógio da timeline.
- `showSafeArea`: guia de composição opcional. `safeArea: {top,bottom,left,right}` normalizado. Padrão vertical `.14/.35/.06/.06` apenas como guia local; verificar placement final. Não ativar a guia no export.

Componentes: `title`, `caption`, `cta`, `stat`, `annotation_circle`, `progress`, `photo_depth`, `collage_kit`.
Animações: `fade`, `slide_up`, `pop`, `typewriter`, `shake`, `glow`. São efeitos de camada, não transições de clipes.
Sons: `whoosh`, `pop`, `click`, `impact`, `riser`, `chime`. São PCM mono de 44.1 kHz, sintetizados deterministicamente. Volume e adequação devem ser ouvidos na edição.

## Export

Capture frames **usando o mesmo `renderFrame`**, em `frame-000000.png` até `ceil(duration * fps) - 1`. Para o frame N, use exatamente `N / fps`; não dependa de `requestAnimationFrame` nem do relógio da máquina. O módulo não inclui automação headless de navegador nem adapter Remotion.

```sh
node packages/video/encode-frames.js project.json /path/to/frames output.mp4
```

Requer `ffmpeg` com libx264/AAC e `ffprobe` no PATH. Produz H.264, yuv420p, AAC estéreo 192 kbps e faststart, com resolução e FPS do projeto. Recusa sequência incompleta e arquivo de saída existente. Gera WAVs temporários para cues e verifica codec/resolução após o encode. Frames externos são redimensionados à dimensão declarada: a captura deve usar o tamanho do projeto para evitar distorção. Não aceita narração/música externa nesta versão.

A composição pode ser adaptada a Remotion depois; o JSON usa tipos simples e segundos explícitos. Não há dependência nem uso atual de Remotion. A duração que não cai em frame inteiro pode arredondar na codificação; use durações múltiplas de `1/fps` quando a contagem precisa ser exata.

## Verificação e proveniência

```sh
node --test packages/video/test/*.test.js
node packages/video/generate-sfx.js
```

Os testes verificam fronteiras temporais, busca determinística, validação e cabeçalhos/silêncio/limites dos WAVs. O encoder foi exercitado com seis frames sintéticos de 320×480, 30 fps e um cue de áudio; FFprobe confirmou 0,2 s de H.264/AAC. Esse teste comprova a codificação, não a captura do Canvas no navegador.

Todo código e todos os WAVs foram criados neste projeto. Nenhum screenshot, vídeo de referência, sample, logo ou música da pesquisa foi incorporado à biblioteca. Não existe licença de terceiros a repassar para esses WAVs. O projeto ainda não declara licença pública geral: não presumir MIT/CC0 para redistribuição do repositório. Assets importados pelo usuário mantêm seus próprios direitos e precisam de registro de origem.
