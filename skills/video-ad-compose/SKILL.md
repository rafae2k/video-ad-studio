---
name: video-ad-compose
description: Transformar uma ideia de anúncio aprovada em manifests e variações no video-editor, reutilizando a biblioteca local, validando timing, preview e preparação para export. Use para compor ou revisar anúncios deste repositório; não gera vídeos por IA nem publica campanhas.
---

# Compor anúncios com a biblioteca local

Entregue composições editáveis e reproduzíveis, usando o que o repositório executa hoje. Trabalhe a partir da ideia, copy e assets aprovados ou fornecidos no pedido. Autorização para editar já permite preparar manifests e previews; não peça outra aprovação para essas etapas. Quando faltar uma decisão criativa indispensável, avance nas partes independentes e registre a pendência.

## Consultar antes de compor

- [Catálogo](../../packages/video/catalog.json): componentes, presets, efeitos e SFX disponíveis. Procure reutilização antes de criar outro componente.
- [Contrato e limites do renderer](../../packages/video/README.md) e [implementação](../../packages/video/index.js): leia os campos relevantes à composição. A implementação define a capacidade real.
- [Exemplo vertical](../../packages/video/examples/demo.json) e [variação quadrada](../../packages/video/examples/demo-variant.json): use como ponto de partida, sem preservar copy ou identidade fictícia por acidente.
- [Registro dos projetos](../../projects/README.md) e [interface](../../web/README.md): para expor versões salvas no Studio.
- Para justificar o workflow, consulte [workflow de composição](../../research/ai-video-ads/workflows/05-agente-animatic-remotion.md) e [review das referências](../../research/ai-video-editing/video-review/README.md). Uma técnica observada num vídeo não prova que existe no renderer local.

## Escolher o backend da variante

O repositório contém três backends distintos. Registre a escolha e não converta silenciosamente contratos:

- Canvas e `encode-frames.js`: contrato de layers abaixo, componentes do catálogo e captura prévia pelo `renderFrame`.
- FFmpeg V1 em `scripts/render-footage.py`: fonte real, cortes e voz, captions/overlays estáticos via Pillow. Veja `scripts/render-footage.md`; `--validate-only` valida a timeline específica.
- Remotion V2 em `packages/remotion`: React motion, footage e áudio na mesma composição usada pelo Remotion Studio e pelo render. Leia `../remotion-best-practices/SKILL.md` e referências pertinentes; consulte `packages/remotion/README.md`. A skill oficial foi vendorizada com proveniência em `../remotion-best-practices/PROVENANCE.md`.

Para Remotion, mantenha dados editáveis em JSON e componha cortes/captions/gráficos com tempo derivado de frames. Use `staticFile()` apenas para mídia autorizada copiada a `packages/remotion/public/`. O renderer recebe `{edit}` e executa o componente React, não os componentes Canvas. Valide TypeScript, abra a composição no Remotion Studio, inspecione frames e revise o MP4. Nunca anuncie “feito em Remotion” para um export FFmpeg/Pillow.

Os contratos e comandos Canvas nas seções seguintes continuam válidos **apenas para Canvas**. Um backend instalado não comprova uso, resultado visual ou prontidão para produção.

## Montar a composição

Registre o mínimo necessário: objetivo, hook, corpo, CTA, formato, duração, assets selecionados e fatos permitidos. Não invente preço, resultado, estatística ou depoimento para preencher uma camada. Use placeholders identificados quando o pedido permitir um rascunho; não apresente esse rascunho como anúncio aprovado.

Escolha os componentes pelo trabalho visual: título para hook, `caption` para fala revisada, `cta` para ação, `stat` para dado fornecido, `annotation_circle` para ênfase, `photo_depth`/`collage_kit` para imagens prontas. `photo_depth` é zoom/deslocamento 2D, sem depth map; `collage_kit` move uma imagem, não recorta nem gera material. Os efeitos são animações de camada, não transições de vídeo.

Consulte `brief.json`, `ideas.json`, `approvals.json` e `assets.json` do projeto quando presentes, preservando seus formatos e registros. Vincule a composição ao ID da ideia de origem e à evidência de aprovação existente; não marque uma ideia como aprovada por inferência. Se a ideia ainda não foi aprovada e o usuário pediu exploração, mantenha todos os artefatos explicitamente como `draft`, sem promovê-los ao fluxo de produção.

Crie um manifest JSON por variação sob `projects/<id>/variants/<variant-id>.json`. Use um ID estável e nome que explique a hipótese criativa. Troque hook, CTA, cor ou formato conforme o pedido; preserve os campos do corpo aprovado quando a comparação exigir isso. Não produza uma matriz combinatória maior que o escopo solicitado.

Invariantes do contrato:

- `width`, `height`, `fps` são inteiros positivos; dimensões devem ser pares para o encoder H.264. Tempo é expresso em segundos. Prefira pontos de corte em múltiplos de `1/fps`.
- Cada layer tem `id` único, `type`, `start` e `duration`; intervalo `[start, start + duration)`, contido na duração do projeto. A ordem de `layers` define a sobreposição.
- `x` e `y` são o **centro** em frações de 0 a 1; `w` e `h` são frações do frame. `fontSize` é em pixels. Reavalie layout por formato, pois apenas mudar resolução não assegura legibilidade.
- `caption.words` usa `{text,start,end}` com timestamps locais à layer. Mostra um bloco por vez; não há transcrição automática. Para usar timestamps globais da fala, subtraia `layer.start` uma única vez.
- Imagens precisam de `assetId` e de um mapa de imagens já decodificadas passado a `renderFrame`. A UI atual chama o renderer sem esse mapa: manifests com imagem mostram placeholder até existir um carregador. Não declare o asset incorporado só por inserir seu ID.
- `audio` aceita cues `{sfx,start,gain}` dos IDs do catálogo. `gain` entre 0 e 1, cue dentro da timeline. O encoder sintetiza esses sons; preview Canvas e preview atual da UI são **sem áudio**. Narração/música externa não está implementada no encoder.

Use o [manifest de assets](../../assets/manifest.json) para proveniência dos SFX originais. Para mídia importada, registre caminho, origem e direitos conhecidos no material do projeto. Não transforme os vídeos de referência em assets de anúncio sem autorização de uso.

## Validar e disponibilizar para revisão

Execute da raiz do repositório, substituindo o caminho do manifesto:

```sh
node --input-type=module - projects/meu-projeto/variants/variante.json <<'JS'
import {readFile} from 'node:fs/promises';
import {validateProject} from './packages/video/index.js';
const project = JSON.parse(await readFile(process.argv[2], 'utf8'));
const errors = validateProject(project);
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Timeline válida');
}
JS
```

Corrija os erros antes do preview. Essa validação não prova composição visual, existência de imagens, veracidade da copy nem áudio correto; confira esses pontos conforme os elementos usados.

Acrescente a versão em `projects/<id>/project.json`, em `variants: [{id,name,manifestPath,status:"draft"}]`, usando `manifestPath` como URL local, por exemplo `/projects/meu-projeto/variants/variante.json`. Preserve versões existentes. Rode `npm run dev`, use a URL impressa pelo servidor e abra **Variações**. Use o servidor do projeto: um servidor estático na raiz pode expor configurações privadas.

Revise frames de entrada, centro e saída dos beats, limites de texto, sobreposição, CTA e adaptação ao formato. O frame inicial de uma entrada com fade/pop pode ser transparente por intenção; inspecione também alguns frames depois. Registre quais variantes e trechos foram vistos. Se não houver navegador disponível, entregue o manifest validado e identifique o preview visual como pendente.

Rascunhos feitos na UI ficam em localStorage e podem ser exportados como JSON. Para preservá-los no projeto, salve o JSON no workspace e atualize `project.json`; a UI não faz essa gravação automaticamente. Não coloque um preview ou manifest em `finals[]` como se fosse vídeo renderizado.

## Preparar ou executar export

Para edição de footage real com voz original, há também o backend independente [render-footage.py](../../scripts/render-footage.py), documentado em [render-footage.md](../../scripts/render-footage.md). Use um manifest próprio em `projects/<id>/edits/` com cortes de origem, legendas e overlays nos tempos da saída. Este caminho exporta MP4 com FFmpeg/Pillow; não usa o contrato Canvas nem comprova paridade com `renderFrame`. A interface aceita `variants[].videoPath` em `/storage/exports/<id>/<arquivo>.mp4` para revisão com áudio e download. Mantenha `status: draft` e não use `finals[]` antes da revisão humana. As limitações de captura abaixo continuam válidas para o backend Canvas.

Para variantes Canvas, o repositório oferece [encode-frames.js](../../packages/video/encode-frames.js), que recebe uma sequência PNG **já capturada**. O caminho Canvas não tem captura headless automática. A composição Remotion instalada em `packages/remotion` constitui outro backend, com seu próprio preview e export. Se os PNGs não existem, entregue o manifest e indique a captura como etapa pendente; não prometa MP4 fim a fim.

Quando houver mecanismo de captura disponível e dentro do pedido, use a mesma função `renderFrame(ctx, project, frame / project.fps, decodedAssets)` em cada frame. Aguarde fontes e imagens, use resolução do projeto, desative `showSafeArea` e não dependa de tempo real. Capture `ceil(duration * fps)` PNGs consecutivos, de `frame-000000.png` em diante. Assets externos precisam permitir captura por CORS.

Com os frames disponíveis:

```sh
node packages/video/encode-frames.js projects/meu-projeto/variants/variante.json /caminho/dos/frames storage/exports/meu-projeto/variante.mp4
```

Crie o diretório de saída se necessário. O comando exige FFmpeg/FFprobe no PATH, recusa frames faltantes e saída já existente, adiciona os cues SFX e verifica codec/resolução. Use outro nome para uma nova revisão. Depois, confira duração, formato, texto, cortes e áudio no vídeo real. O sucesso do encoder não substitui essa inspeção. Entregue o MP4 para `video-ad-qa`; essa etapa registra `finals[]` somente depois dos gates do `WORKFLOW.md`.

Entregue os caminhos dos manifests, diferenças entre variantes, validações realizadas e estado concreto: manifest, preview, frames ou MP4. Destaque apenas pendências que impeçam o uso solicitado, como imagem ainda não carregada, áudio externo não suportado ou captura ausente.

### Export Remotion V2

Com composição e mídia disponíveis, rode da raiz:

```sh
npm --prefix packages/remotion run check
npm --prefix packages/remotion run studio
node packages/remotion/render-v2.mjs --frame 90 --still /tmp/variante-frame90.png
node packages/remotion/render-v2.mjs storage/exports/meu-projeto/variante-remotion.mp4
```

Use nomes novos por revisão; o script recusa sobrescrita. O comando de frame usa o mesmo componente do vídeo. Passe o resultado real ao QA e preserve a distinção entre preview, render concluído, revisão técnica e aprovação humana. Não acrescente `finals[]` nesta etapa.
