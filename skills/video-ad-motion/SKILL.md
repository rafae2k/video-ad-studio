---
name: video-ad-motion
description: Transformar um vídeo de fala (talking head vertical) em anúncio com a receita v5 — jump cuts pela transcrição, pessoa recortada e descida no quadro, lettering gigante atrás da cabeça, fundos trocados com assets da marca e mídia gerada por IA, legenda palavra a palavra, SFX e CTA — usando o backend packages/motion. Use quando pedirem "edita esse vídeo", "pace, motion, lettering", "texto atrás da cabeça" ou "faz como o exemplo do README".
---

# Receita v5: talking head → anúncio com lettering atrás da cabeça

O [exemplo do README](../../README.md#exemplo) é a referência de qualidade desta receita, e o [backend motion-matte-v1](../../packages/motion/README.md) a reproduz byte a byte. Siga `WORKFLOW.md` para gates e registros. Esta skill diz **como montar a peça**. A [skill de geração](../video-ad-generate/SKILL.md) cobre os assets de IA e a [de QA](../video-ad-qa/SKILL.md) a revisão.

## O que a peça precisa ter

A direção do pedido original foi: "o motion, o texto atrás da cabeça, movendo o principal pra baixo para o lettering em cima chamar atenção, usar os cortes, vídeos e assets gerados por IA". Uma edição só com cortes e legenda foi rejeitada ("cadê o pace, motion, lettering, rotoscopia"). Uma edição que copiava cartões de UI da referência também foi ("copiou elementos da referência").

- **Pessoa embaixo, palavra em cima.** O rosto desce de `faceY` (medido no bruto) para `destY` ≈ 0,53, e o terço de cima fica livre para o lettering, que passa **atrás** da cabeça.
- **Lettering gigante, eco literal da fala.** 1–3 linhas em caixa-alta, uma delas com marca-texto (`hl`). Uma entrada a cada 2–4 s, começando na palavra dita (`t0` = início da palavra no bruto). Use `slam` para palavra única e listas, e `rise` para frase. Nunca escreva claim que não foi falado.
- **Fundo muda com o assunto.** O padrão é `orig` (o próprio bruto desfocado). Use `dark` nas frases de ênfase e de oferta. Cutaway de IA em tela cheia (`full: true`, 1,5–2 s) quando a fala usa uma imagem mental ("atrasar o envelhecimento" → idoso surfando; "estresse oxidativo" → células). Use um still de IA por item quando a fala lista ingredientes (~1,2 s cada), e asset da marca (vídeo da LP, still, kit) na menção do produto e da oferta.
- **Pace de jump cut.** A melhor take de cada frase, corte em pausa > 0,2 s, corte no meio de frase longa com troca de zoom (1,0–1,4) e respiro apertado. Takes de demonstração de produto podem ficar `hold`.
- **Legenda embaixo, palavra a palavra.** Até 3 palavras, com a palavra-chave maior. **CTA** em botão na cor da marca a partir do "clica aqui".

### Não faça (lição v6/v7, 2026-10-28)

As versões v6 e v7 corrigiram defeitos medidos da v5, mas mudaram a linguagem. Na comparação lado a lado, a v5 foi escolhida como melhor. Para corrigir um defeito da v5, mexa no parâmetro da entrada afetada e preserve:

- O lettering gigante. Não encolha tudo para uma "zona segura" de 740 px; ajuste `cap` só na entrada que estoura.
- A legenda embaixo, em vez de pílula no topo.
- O corte no meio da frase com troca de zoom (não "1 beat por frase").
- A ausência de lower third de nome e cargo, exceto se a identidade do falante estiver confirmada.
- Poucos elementos por quadro: um lettering, um fundo e a legenda.

## Passo a passo

1. **Fonte e transcrição.** Bruto em `storage/sources/<id>/`. Transcreva só o áudio com `npm run transcribe -- --submit --input <bruto> --output-dir projects/<id>/intake/transcripts`. Essa chamada é paga: só envie com autorização, conforme a [skill de intake](../video-ad-intake/SKILL.md). Leia o `.txt` e use os tempos de `words[]` do `.json`.
2. **Escolha de takes.** Para cada frase do roteiro, pegue a take completa, sem tropeço, olhando para a câmera e com confiança alta no ASR. Registre `[início da 1ª palavra, fim da última, hold]` em `edl.takes`, em ordem. Fora do roteiro, fica fora. Não reordene o argumento nem corte o CTA.
3. **Correções de fala.** Coloque em `wordFixes` o que o ASR grafa errado (marca, ingrediente) e em `wordOverrides` uma palavra que ele perdeu dentro de um take.
4. **Medir `faceY`.** Extraia um quadro (`ffmpeg -ss 15 -i <bruto> -frames:v 1 /tmp/f.png`) e meça a altura do centro do rosto como fração (0,36 no exemplo).
5. **Plano visual.** Percorra a transcrição frase a frase e preencha `letters` e `plates` com tempos do bruto. Comece do [manifest de exemplo](../../packages/motion/examples/v5-surf.motion.json): ele tem 22 letterings e 15 plates em 57 s, uma densidade boa de referência. Liste os assets que faltam.
6. **Gerar assets.** Stills e clipes 9:16 sem texto, pela [skill de geração](../video-ad-generate/SKILL.md) (Magnific MCP). Salve em `storage/assets/ai-generated/<id>/` e registre hash, prompt e modelo como em [v5-surf.assets.json](../../packages/motion/examples/v5-surf.assets.json).
7. **Manifest.** Crie `projects/<id>/edits/<variante>.motion.json` com `status: draft`, `work: storage/work/<id>/<variante>` e `output: storage/exports/<id>/<variante>.mp4`. Para comparar, crie outra variante; não sobrescreva.
8. **Render.** Rode `npm run motion -- <manifest> edl`, depois `tighten`, e confira a duração impressa e os beats apertados (na v5, só 2 de 29 perderam respiro: 57,8 → 56,8 s). Depois `masks` e `plan`. Antes do render completo, faça `render --preview A-B` do hook (0–150) e de um trecho com cutaway. Por fim, `render`.
9. **Conferência rápida.** Faça uma contact sheet com `ffmpeg -i <out.mp4> -vf "fps=1/5,scale=180:320,tile=6x2" -frames:v 1 /tmp/sheet.png` e abra a imagem. Passe a checklist da seção seguinte, nos quadros e em movimento.
10. **Registro.** Acrescente em `projects/<id>/project.json` `variants[]: {id, name, manifestPath, videoPath: "/storage/exports/<id>/<arquivo>.mp4", status: "draft"}`. Entregue como draft. `finals[]` só após QA e aprovação humana.

## Checklist específica (defeitos medidos na v5)

- [ ] Legenda: nenhum grupo duplicado ou embaralhado (grupos > ~1000 px quebram). Nomes e ingredientes com a grafia certa.
- [ ] Lettering: barra de destaque e linhas longas dentro da margem; nada cortado ("POR DIA" na v5); cabelo sem encostar na última linha.
- [ ] Recorte: sem halo, sem fundo vazando entre braço e tronco ou em volta do produto na mão, sem mancha da sala no cabelo.
- [ ] Plates: sem flash de 1–2 quadros da sala entre plates; cutaway de IA sem logo ou texto deformado; clipe 24 fps sem trepidação incômoda.
- [ ] Fala: nenhuma sílaba comida no corte (na v5, o "co" de "coenzima" e o "s" de "antioxidantes"), sem clique na junção e sem respiro antes de lista.
- [ ] CTA e legenda sem cobrir mão, produto ou rosto. Último quadro sem blur.
- [ ] Copy: todo lettering foi dito no bruto; oferta e claims batem com o brief aprovado.

Corrija pelo manifest e re-renderize a variante nova; registre o antes e o depois. O backend não tem edição de máscara à mão. Se o vazamento persistir, troque o trecho por um plate `full` ou escolha outra take.
