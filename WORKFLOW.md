# Workflow do agente para anúncios em vídeo

Este é o caminho operacional do repositório, baseado nas [pesquisas de criação](research/ai-video-ads/README.md), [edição](research/ai-video-editing/README.md) e na [análise dos 16 vídeos](research/ai-video-editing/video-review/README.md). Ele descreve saídas verificáveis. Uma referência de creator inspira técnica; não vira asset comercial ou claim aprovado automaticamente.

## 0. Abrir um projeto e fixar o brief

Use `npm run project:new -- <id> "Título" "Marca"` para criar `projects/<id>/`. Sem marca definida, omita o terceiro argumento. O comando não sobrescreve projetos existentes. Preencha `brief.json` com produto, público, objetivo, formatos, duração, volume, orçamento, restrições de rosto/voz sintéticos e claims permitidos. Deixe campos desconhecidos como `null` e anote a premissa; não invente dados de produto. O `project.json` é o índice lido pelo Studio.

**Saída:** `project.json` e `brief.json` versionáveis. **Gate:** humanos aprovam oferta, claims, identidade e restrições que vão orientar peças reais. Ideação exploratória pode avançar com placeholders explícitos.

## 1. Ingerir fontes e registrar evidência

Use [video-ad-intake](skills/video-ad-intake/SKILL.md) quando receber vídeos, imagens, áudio ou referências. Gere ID/hash, metadados FFprobe, transcrição de fala com timestamps quando couber, segmentos e frames representativos. Relacione cada observação ao trecho/arquivo. Diferencie o que aparece no material, o que o creator alega e o que inferimos. Registre direitos e proveniência em `assets.json`; mantenha originais fora do Git quando forem pesados ou de terceiros.

Quando o usuário pedir material **nunca editado**, audite o card, suas discussões, a identidade do bruto (file ID/hash), duplicatas e entregas no Frame.io antes de selecioná-lo como tal. `Edição v1` ou campo v1 vazio não comprovam ineditismo. Registre `no_delivery_found`, `confirmed_unedited` ou `excluded_existing_edit`, com evidências e situação do trabalho em andamento (inclusive `unknown`), conforme a skill de intake. Aplique essa seleção somente quando ela fizer parte da restrição do pedido.

**Saída:** `projects/<id>/intake/` com manifest e notas; `assets.json` atualizado. **Gate:** status de direito desconhecido ou `reference_only` impede uso do asset no anúncio final, mas não impede estudo da técnica.

## 2. Gerar oportunidades e ideias

Use [video-ad-ideate](skills/video-ad-ideate/SKILL.md). Leia o brief, os trechos transcritos e o [catálogo](packages/video/catalog.json). Para cada oportunidade, registre em `ideas.json`: `id`, hipótese do hook, mensagem, faixa de fonte/transcrição, claim IDs, direção visual, `reuseCandidateIds`, formato, assets necessários e status `proposed`. Busque um componente existente antes de propor VFX novo. Faça 2–3 direções quando isso ajudar a decidir, não como quota. As ideias versionadas aparecem em **Ideias** após recarregar o Studio, com detalhe somente leitura; rascunhos do navegador precisam ser exportados para entrar no repositório.

**Saída:** ideias rastreáveis e direções estáticas ou animatic simples. **Gate:** uma ideia só recebe `approved` em `ideas.json` após decisão humana registrada em `approvals.json` (`targetId`, `decision`, `at`, `by`, `notes`). Sem aprovação, pode haver preview marcado `draft`, mas não produção em lote.

## 3. Compor variantes reutilizáveis

**Copy antes do ritmo:** quando o pedido é ajustar pace, marque o texto aprovado como bloqueado e compare cada frase com a transcrição. Reduza pausas e falsas partidas sem suprimir argumentos, reorderar o corpo ou abreviar o CTA. Registre fonte→saída por frame. Se uma fala do roteiro não existe no bruto, registre a lacuna e apresente a solução visual explicitamente; não fabrique voz nem descreva lettering como fala gravada. Compare as variantes com o mesmo master de áudio, salvo pedido de mudar o texto.

Use [video-ad-compose](skills/video-ad-compose/SKILL.md). Crie `projects/<id>/variants/<variant-id>.json` com backend explícito. Para Canvas, siga o contrato de `packages/video/README.md`: dimensões, FPS, duração, layers, textos, timing, component IDs e cues SFX. FFmpeg V1 usa cortes/captions/overlays de `scripts/render-footage.md`. Remotion V2 usa composição React em `packages/remotion/`, com dados editáveis passados como `{edit}` e mídia local autorizada em `public/`; leia a skill oficial local `skills/remotion-best-practices/SKILL.md`. A variação deve dizer o que mudou em relação à anterior (hook, CTA, formato, ritmo, legenda, idioma ou visual), mantendo o corpo comum quando aprovado. Insira o `manifestPath` em `project.json` para aparecer em **Variações**.

Valide JSON, timeline e assets referenciados. Use `validateProject()` apenas para manifests Canvas. Para FFmpeg use `--validate-only` e reveja o export; para Remotion valide TypeScript, abra a composição no Remotion Studio e compare frames/export da mesma composição. Assista em tamanho de celular, incluindo zonas de interface. As legendas partem de transcrição revisada; mantenha texto e timing como dados, não como texto gerado dentro do vídeo de IA.

**Saída:** manifests válidos, dois ou mais candidatos comparáveis quando solicitados e notas de revisão por variante. **Gate:** humano escolhe takes, ritmo, produto mostrado e direção visual. O catálogo atual é `draft`; não confunda preview de componente com qualidade de produção comprovada.

## 4. Produzir mídia e renderizar

**Footage real:** o [renderer FFmpeg/Pillow](scripts/render-footage.md) monta cortes, mantém a voz original e aplica legendas/headline/CTA de um manifest em `projects/<id>/edits/`. O MP4 aparece em Variações por `videoPath`, como draft com player e áudio. É um backend independente do Canvas; não prometa equivalência entre os dois contratos. A primeira aplicação está em `projects/david-pronunciamento-black/`.

Use [video-ad-generate](skills/video-ad-generate/SKILL.md) quando a ideia exigir imagem, footage, voz ou avatar novos. Primeiro fixe prompt, referências, autorização de rosto/voz, provedor e custo esperado. O repositório **não tem adaptador de geração de vídeo**; registre um job externo e importe o arquivo com hash/proveniência, sem fingir que foi gerado pelo Studio. Gere SFX originais com `node packages/video/generate-sfx.js` se necessário.

O manifest da etapa 3 pode começar como animatic com placeholders. Depois da seleção dos arquivos gerados, volte ao manifest para trocar os placeholders pelos assets reais e revisar a peça em movimento.

Há três caminhos de export, com contratos distintos:

1. **Canvas:** `node packages/video/encode-frames.js <manifest> <frames-dir> <output.mp4>` codifica PNGs capturados com `renderFrame` e verifica H.264/AAC. Sem essa sequência não há MP4; este caminho não mistura narração externa.
2. **FFmpeg V1:** `scripts/render-footage.py` concatena cortes de fonte real, preserva voz, normaliza áudio e queima texto Pillow. É um backend de edição independente, com texto estático; não demonstra motion graphics React ou paridade Canvas.
3. **Remotion V2:** `node packages/remotion/render-v2.mjs <output.mp4>` renderiza a composição React registrada, usando o mesmo componente do preview Remotion Studio. `--frame N --still <frame.png>` permite inspecionar frames pelo mesmo motor. Dependências oficiais estão instaladas em `packages/remotion`; o README documenta mídia local, props e limites. Use source original, sem legendas queimadas de versões anteriores.

Registre backend, manifest, componentes/código de origem, mídia utilizada e resultado efetivamente observado. MP4 exportado não é automaticamente uma versão final. Nenhum caminho autoriza afirmar paridade com os demais ou produção em volume validada.

**Saída:** MP4 real em `storage/exports/<id>/` quando render concluído e conferido; caso contrário, preview/manifest identificado como intermediário.

## 5. Revisar e registrar versões finais

Use [video-ad-qa](skills/video-ad-qa/SKILL.md). Verifique com FFprobe codec, dimensões, FPS, duração e streams; depois assista e escute o arquivo inteiro. Revise copy/claims, nomes e números, legibilidade móvel, produto, anatomia, recortes, lip-sync, voz, música/SFX, safe zones do placement escolhido e direitos de cada asset. Uma legenda SRT automática não é prova de revisão. Registre defeitos com tempo e mudança pedida; re-renderize apenas cenas afetadas quando possível, mas assista ao export completo novamente.

Somente após o arquivo existir e a revisão humana estar registrada em `approvals.json`, acrescente a `project.json` uma entrada `finals[]` com `id`, `variantId`, `name`, `path`, `manifestPath`, `snapshotHash`, `status`, `reviewedAt` e referência à aprovação. `path` deve apontar para `/storage/exports/<id>/<arquivo>.mp4`. Não mude silenciosamente o manifest associado a um final anterior; crie outra versão.

**Saída:** versão final reproduzível na aba **Versões finais**, com trilha de decisão. O Studio também aceita upload temporário para revisão, mas esse arquivo não persiste no projeto após recarregar a página.

## Responsabilidade de agente e pessoa

| Etapa     | Agente/código                                                        | Pessoa                                                     |
| --------- | -------------------------------------------------------------------- | ---------------------------------------------------------- |
| Intake    | Inventário, hash, transcrição preliminar, keyframes, notas com fonte | Corrigir fala ambígua; confirmar direitos e uso pretendido |
| Ideias    | Propor hooks/direções e buscar componentes já existentes             | Aprovar mensagem, claim, oferta e direção                  |
| Variações | Gerar manifests, preview, cortes e cues parametrizados               | Escolher takes, timing, produto e qualidade visual         |
| Export    | Executar job disponível e checagem técnica                           | Assistir/escutar a peça inteira no contexto do placement   |
| Final     | Registrar artefatos, snapshot e histórico                            | Aprovar entrega e pedir alterações quando necessário       |

Não bloqueie trabalho reversível por campos ainda desconhecidos: avance com rascunhos marcados. Não faça chamada paga ou externa nova por mera existência de credencial; use a autorização do pedido atual e das instruções anteriores. Pare antes de transformar rascunho ou render não revisado em versão final.
