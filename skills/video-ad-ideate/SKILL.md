---
name: video-ad-ideate
description: Transformar brief e referências analisadas em ideias rastreáveis para anúncios do video-editor. Use para propor hooks, roteiros curtos, direções visuais e oportunidades de componentes antes de criar variantes.
---

# Idear anúncios a partir de evidências

Produza ideias que um editor possa aceitar, descartar ou transformar em animatic. Siga `WORKFLOW.md` e leia `projects/<id>/brief.json`, `ideas.json`, as notas de intake pertinentes e `packages/video/catalog.json`. Se não houver projeto, use `npm run project:new -- <id> "Título" "Marca"` quando o pedido já fornecer um ID e título; caso contrário, proponha ideias exploratórias sem inventar produto, oferta, preço, depoimento ou claim.

## Separar fonte, hipótese e copy

Para cada conceito, anote o problema/mensagem do brief, o trecho que inspirou ritmo ou visual (`assetId`, `startMs`, `endMs` ou link de análise) e o que é apenas uma hipótese criativa. Um vídeo de creator pode ensinar uma técnica; o texto, imagem, pessoa e marca de terceiros não viram material da campanha. Transcrição automática é base de rascunho até conferência por escuta, sobretudo em nomes, números e negações.

Use um hook que caiba no tempo e uma progressão curta de cenas. Esboce fala ou texto por beat, com duração estimada, imagem requerida, elemento da biblioteca e CTA. Faça 2–3 direções quando a escolha entre elas for útil. Evite gerar combinações de hooks e CTAs sem um corpo que já faça sentido. Para produto sensível a rótulo, prefira foto/packshot aprovado e overlay editável; não planeje texto crítico desenhado por modelo de vídeo.

Quando a fonte é um vídeo de fala, a direção padrão (`exists`) é a receita [video-ad-motion](../video-ad-motion/SKILL.md): jump cuts, pessoa descida, lettering gigante atrás da cabeça e fundos que mudam com o assunto. Para cada beat, proponha a palavra do lettering (eco literal da fala), o tipo de fundo (`orig`, `dark`, still/clipe de IA, asset da marca) e o prompt de IA necessário. Antes de propor VFX novo, procure ID ou comportamento semelhante no catálogo. Distinga `exists` (executa no renderer), `candidate` (observado na pesquisa, ainda não implementado) e `external` (depende de editor/provedor). A interface mostra ideias em rascunho, mas seu `localStorage` não atualiza `ideas.json` automaticamente.

## Handoff em `ideas.json`

Preserve `schemaVersion`, `projectId` e registros existentes. Acrescente objetos em `ideas[]` com ID estável, título, status `proposed`, hipótese do hook, mensagem, beats com duração aproximada, CTA, formato, evidências de origem, IDs de claims aprovados quando existirem, direção visual, `reuseCandidateIds`, assets necessários e riscos/pendências. Campos adicionais podem seguir o contrato do projeto; não mude o schema silenciosamente. Marque placeholders como tal. Cada ideia deve permitir responder: **o que vem do brief, o que vimos na referência, e o que estamos propondo?**

Confira JSON válido e entregue um resumo comparável das direções, inclusive o que exige novo asset, geração paga ou trabalho humano. Ideia `proposed` pode virar preview `draft`; mude para `approved` somente após decisão humana registrada em `projects/<id>/approvals.json` com `targetId`, `decision`, `at`, `by` e notas. Aprovação da ideia não aprova automaticamente o vídeo final.

## Evidências úteis deste repo

- [Resumo da pesquisa](../../docs/research/README.md): padrão transcrição → oportunidades de motion → preview → módulo, e o histórico de qual direção foi aprovada ou rejeitada no exemplo do README.
- `research/ai-video-editing/video-review/README.md` e `research/ai-video-ads/README.md` (locais, fora do Git): análises por clipe; keyframes e animatic antes de vídeo caro, variações de hook/CTA com corpo comum e gates humanos. A recomendação é inferência da pesquisa, não benchmark deste produto.
