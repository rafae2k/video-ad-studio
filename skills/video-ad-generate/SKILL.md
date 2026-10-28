---
name: video-ad-generate
description: Preparar e acompanhar geração de imagens, takes curtos, voz ou avatar para anúncios do video-editor, com bible de consistência, keyframes aprovados, custo por tentativa e proveniência. Use quando uma ideia exigir mídia nova de IA.
---

# Gerar mídia para anúncios com controle de produção

Trate a geração como uma fonte versionada para edição. Leia `WORKFLOW.md`, o brief, a ideia e os assets do projeto. Escolha o fluxo apropriado ao pedido: UGC real com edição assistida (inclusive cutaways e stills de apoio para a receita [video-ad-motion](../video-ad-motion/SKILL.md)), avatar para fala, ou produto/ambiente com keyframe e image-to-video. O [resumo da pesquisa](../../docs/research/README.md) descreve os três fluxos; nenhum é uma integração instalada neste repo.

## Preparar antes de uma chamada paga

Registre para cada cena: objetivo, duração, proporção, asset de referência, quadro inicial/final se houver, ação única, câmera, luz, produto/rosto que deve permanecer idêntico, texto que será sobreposto depois e critério de rejeição. Fixe uma bible curta de invariantes (embalagem, cor, logo, rótulo, personagem, roupas, cenário) e use IDs/arquivos aprovados. Escreva um prompt de cena e uma lista de elementos que devem **ser verificados no resultado**, sem presumir que o modelo obedecerá a negações ou a números exatos de props.

Para fala, fixe roteiro e pronúncia antes de animar; faça um piloto no idioma real e confira boca, pausas e naturalidade. Voz ou rosto sintético requerem a permissão definida no brief ou no pedido atual. Mantenha captions, preços, números e CTA como camadas editáveis no manifest em vez de pedir ao modelo que os desenhe no vídeo. Para SKU com rótulo crítico, planeje compor packshot real/3D quando a geração não preservar a embalagem.

Template inicial de cena, ajustado à interface real do provedor:

```text
Cena: [ID], [duração] s, [proporção].
Referência aprovada: [asset ID / keyframe].
Invariantes: [produto/rosto/cor/roupa/cenário que precisam permanecer iguais].
Ação: [um sujeito] faz [uma ação observável]; câmera [um movimento simples].
Luz e estilo: [características verificáveis].
Composição: deixar espaço em [região] para texto editável posterior.
Aceitar somente se: [critérios visuais e de continuidade]; rejeitar se [defeitos críticos].
```

O último campo é um checklist de seleção, não uma promessa de que o modelo evitará defeitos. Preserve versão do prompt e do keyframe para comparar tentativas.

Anote provedor, modelo/versão, endpoint ou interface, parâmetros, seed quando disponível, custo estimado por tentativa, teto de gasto e autorização da chamada. Consulte preço e capacidade atuais na documentação oficial antes de orçar ou executar, pois mudam. O pedido atual ou autorização anterior pode abranger geração paga; uma API key em `.env`, sozinha, não a autoriza. O repo não possui adaptador de geração de vídeo; a geração acontece no provedor externo (ex.: Magnific via MCP, abaixo). Não represente um prompt ou job planejado como arquivo produzido pelo Studio.

## Magnific (Freepik) via MCP — caminho usado na v5

Os assets de IA do [exemplo do README](../../README.md#exemplo) vieram do conector MCP "Magnific / Freepik — Assets Generation", e não de código do repositório. Sem esse conector na sessão, não há geração; prepare os prompts e peça o arquivo.

1. `account_balance` e `simulate_cost` com os mesmos argumentos da chamada real. Registre o custo estimado e confira se a autorização cobre o total.
2. `video_models_list` / `images_models_list` quando o modelo da receita não estiver disponível.
3. `video_generate` ou `images_generate`, uma cena por chamada. Depois `creations_wait`, e em timeout `creations_get` do mesmo ID, sem reenviar.
4. Baixe para `storage/assets/ai-generated/<projeto>/`, calcule SHA-256, rode FFprobe e registre prompt, modelo, parâmetros, data e ID, como em [v5-surf.assets.json](../../packages/motion/examples/v5-surf.assets.json).

Parâmetros que funcionaram na receita [video-ad-motion](../video-ad-motion/SKILL.md):

- **Cutaway em vídeo:** `slug: bytedance-seedance-fast-2.0`, `duration: 5`, `aspectRatio: 9:16`, `resolution: 720p`, `withSoundEffects: false`. Sai a 24 fps, e o compositor usa ~1,5–2 s. O prompt descreve sujeito, ação, um movimento de câmera e o look, e termina em "no text, no logos". Exemplo: "Fit elderly man in his seventies with a short silver beard surfing a clean blue wave at golden hour … Smooth tracking shot from the side, realistic documentary look, no text, no logos."
- **Still de ingrediente:** `images_generate` com `aspectRatio: 9:16` e `count: 1` (1152×2048). O padrão é "Macro photograph of [ingrediente]: [forma] [ação], dark background, [luz], no text". O fundo escuro mantém o lettering legível e o compositor ainda aplica `dim`.
- **Embalagem real, nunca gerada.** Na v6, um packshot de IA deformou o logo e inventou microtexto no rótulo. Para produto, use still ou vídeo da marca.

## Gate e execução

Gere ou selecione primeiro stills/keyframes de direção e registre quais foram aprovados. Monte um animatic simples com tempo e fala para testar ritmo antes de multiplicar takes pagos. Quando o pedido já autorizar a produção e houver integração, submeta uma cena curta por job; salve ID, parâmetros, status e custo real. Se faltar apenas uma aprovação necessária do keyframe ou gasto, prepare o job concreto e continue as partes independentes. Faça retry somente do trecho reprovado e dentro do teto autorizado. Não use retry infinito nem replique custos após timeout; consulte o job existente.

Ao receber o arquivo, registre SHA-256, duração/dimensões/FPS, origem, direitos, modelo, prompt/versão e relação com a cena em `projects/<id>/assets.json` ou manifest de jobs do projeto. Compare o take em movimento com o keyframe aprovado: embalagem/logo/letras, mãos, contato, rosto, boca, continuidade, ação, enquadramento e áudio. Marque `accepted`, `rework` ou `rejected` com timestamp e motivo. Só `accepted` pode entrar no manifest da composição; a escolha editorial do take é humana quando afetar identidade, produto ou naturalidade.

## Handoff

Entregue arquivos gerados reais ou jobs pendentes identificados, custos por tentativa e acumulados, versões aceitas, prompts/refs e motivos de rejeição. `video-ad-compose` monta a timeline com os assets aprovados; `video-ad-qa` verifica o render final. O custo por vídeo aprovado inclui tentativas rejeitadas, áudio, render e trabalho humano. Não use preços de outubro de 2026 como tarifa permanente.
