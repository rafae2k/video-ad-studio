---
name: video-ad-qa
description: Revisar previews e vídeos renderizados de anúncios neste estúdio local, registrar defeitos com timestamps e verificar condições para uma entrega final. Use na revisão de variantes, QA de export ou preparação de finals[]; não substitui criação de roteiro nem garante aprovação de plataforma.
---

# QA de anúncios em vídeo

Produza uma decisão rastreável sobre uma versão específica: correções necessárias, pronta para revisão humana ou final aprovada com evidência. Diferencie sempre o que foi medido, assistido, ouvido e ainda não verificado. Preserve a autorização e o escopo do pedido; uma revisão não autoriza publicar o anúncio ou contratar ferramentas.

## Contexto do repositório

Resolva os caminhos abaixo a partir da raiz do checkout, nunca do diretório pessoal do agente. Leia `AGENTS.md`, `WORKFLOW.md` quando presente, o `projects/<id>/project.json` e o manifest da variante. Use `brief.json`, `ideas.json`, `approvals.json` e `assets.json` do projeto quando existentes para recuperar claims permitidos, intenção, aprovações e proveniência; respeite o schema existente. Não leia `.env`.

- `packages/video/README.md`: contrato atual de tempo, safe area, assets, preview e encoder. A biblioteca Canvas não reproduz áudio; o encoder atual aceita SFX do catálogo e não monta voz/música externas. Não inferir recursos de uma pesquisa ou interface.
- `research/ai-video-editing/video-review/README.md`: evidência dos 16 clipes e suas limitações. Consulte a análise do clipe pertinente quando a revisão depender de uma técnica específica. Os cartões de marketing não comprovam implementação, áudio ou produtividade.
- `research/ai-video-ads/README.md`: gates de conceito, keyframe, animatic e render; produto/embalagem frequentemente exigem correção humana.

A pesquisa e os screenshots não constituem autorização para reutilizar vídeos, rostos, marcas, música ou texturas em uma campanha. Transcrições automáticas e SRTs completos são rascunhos até conferência por escuta.

## Defina o objeto da revisão

Identifique projeto, variante, versão do manifest e caminho real do artefato. Determine se o pedido é **preview**, **render experimental** ou **entrega final**. Registre duração e placement pretendidos, proporção, idioma e fonte aprovada das alegações. Use informações já fornecidas; peça apenas o dado ausente que impeça concluir a decisão. Continue os checks independentes enquanto o dado está pendente.

Em previews, use o renderer compartilhado `renderFrame` e o manifest correto. Confira início, fim, transições, picos dos efeitos e instantes associados a palavras/eventos. Uma imagem isolada não demonstra ritmo, sincronismo ou ausência de defeitos entre frames. Um preview sem áudio não recebe aprovação de áudio. Um arquivo ausente não pode ser certificado por nome, thumbnail ou registro em JSON.

## Revisão editorial, visual e sonora

Avalie o artefato em movimento e em tamanho de celular, complementando com frames nos trechos problemáticos. Para um final, assista à exportação completa, incluindo primeiro e último frame, e ouça a faixa entregue quando houver áudio. Se a ferramenta não permitir ouvir, registre áudio como não verificado; medição de volume não substitui escuta.

| Dimensão                | O que verificar e registrar                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Texto e claims          | Compare copy, números, legendas, gráficos e fala com fontes e claims aprovados. Preserve qualificadores e contexto; não converta um exemplo em promessa de resultado. Identifique texto sem fonte ou aprovação como pendência editorial. Se precisar avaliar uma alegação médica ou regra vigente, consulte fonte primária apropriada; não declare validade clínica por inspeção de vídeo. |
| Legendas                | Confira transcrição por escuta, nomes/números, palavra inicial/final, timestamps, segmentação e legibilidade. Grupos de 1–3 palavras são uma opção de linguagem da pesquisa, não exigência universal. Revise contraste, tempo de leitura, cortes de palavras e colisão com rosto/produto/CTA.                                                                                              |
| Ritmo e composição      | Hook legível, hierarquia clara, cortes sem frames pretos acidentais, CTA com tempo de leitura, motion que apoia a mensagem e ausência de guias de QA no render. Confira imagens/camadas ausentes, texto fora do frame e mudanças bruscas não intencionais.                                                                                                                                 |
| Produto e pessoas       | Compare embalagem, logo, rótulo, cor e proporções com o asset aprovado. Inspecione mãos, contato com produto, rosto, boca, olhar, continuidade e deformação entre frames. Revise naturalidade e autorização de identidade/voz sintéticas quando aplicável.                                                                                                                                 |
| Áudio                   | Ouça voz, pronúncia, pausas, trilha e SFX; confira alinhamento, inteligibilidade, clipping, cortes abruptos e balanço. Compare loudness/true peak com o alvo documentado do projeto ou entrega. `−14 LUFS` visto na pesquisa não é regra universal nem requisito Meta confirmado. Ausência de faixa pode ser intencional: compare com o brief.                                             |
| Placement               | Compare formato, duração e áreas seguras com o placement especificado e suas exigências atuais. Consulte especificação oficial quando a entrega depender dela, registrando URL e data. O `safeArea` padrão da biblioteca é guia local; não o certifique como universal para Reels, Stories ou Feed. Sem placement definido, reporte compatibilidade ainda não verificada.                  |
| Direitos e proveniência | Confira origem, titular/licença, autorização comercial, restrições e evidência aplicáveis a imagens, footage, logos, talento, voz, música, SFX e fontes. Não invente licença ausente. WAVs procedurais do projeto têm proveniência própria; isso não implica licença pública geral do repositório.                                                                                         |

## Checks técnicos do arquivo renderizado

Use FFprobe no arquivo existente, com caminho entre aspas. Este comando é um exemplo de leitura; substitua pelo caminho verificado:

```sh
ffprobe -v error -show_format -show_streams -of json "/caminho/real/entrega.mp4"
```

Compare o resultado com o manifest e o brief: container, codecs, dimensões, proporção, pixel format, duração, FPS efetivo/declarado e presença/configuração de áudio. O encoder local documenta H.264/yuv420p/AAC; não transforme esse default em requisito para todo destino. Trate frações de FPS corretamente. Explique diferença de duração compatível com arredondamento de um frame; não aceite truncamento significativo sem investigar.

Quando houver dúvida de integridade, decodifique o arquivo sem produzir uma nova entrega:

```sh
ffmpeg -v error -i "/caminho/real/entrega.mp4" -f null -
```

Para medir loudness/true peak quando aplicável, use análise, sem normalizar silenciosamente:

```sh
ffmpeg -hide_banner -i "/caminho/real/entrega.mp4" -vn -af ebur128=peak=true -f null -
```

Registre ferramenta/comando, resultado e limitações. Se FFprobe ou FFmpeg não estiver disponível, preserve a revisão visual e marque o check técnico pendente; não alegue validação nem instale ferramentas sem necessidade. Verifique que o render veio do manifest e motor declarados. No fluxo atual, capturar frames pelo relógio de reprodução (`requestAnimationFrame`) não demonstra export determinístico; a captura de produção deve usar `frame / fps` no mesmo renderer.

## Notas, correções e decisão

Salve a revisão junto ao projeto, usando sua convenção existente; na ausência dela, `projects/<id>/reviews/<variant>-<version>.md` é uma opção. Vincule o arquivo revisado, seu hash SHA-256, manifest de origem e, quando disponível, commit ou hash do manifest. Não exponha dados privados desnecessários no relatório.

Cada achado deve conter: timestamp ou intervalo, defeito observável, impacto, mudança solicitada e evidência disponível. Exemplo: `00:04.4–00:05.2 — card cobre o olho direito; mover acima do ombro e conferir a trajetória inteira`. Evite notas vagas como “melhorar qualidade”. Classifique como bloqueador da entrega, correção recomendada ou observação, proporcionalmente ao brief.

Se corrigir dentro do escopo autorizado, preserve a versão anterior, altere os parâmetros/cenas afetados e compare antes/depois. Repita os checks afetados e assista ao arquivo final montado; não repita testes sem motivo. Uma nova exportação altera o artefato aprovado: vincule a nova versão e obtenha a revisão humana correspondente antes de chamá-la de final.

## Gate de entrega e `finals[]`

`finals[]` em `projects/<id>/project.json` exige **arquivo exportado real, manifest de origem, revisão humana e checagem técnica**, conforme `AGENTS.md`. Não use essa lista como fila de mocks ou previews. Se faltar qualquer gate, mantenha a variante e o relatório de pendências sem criar uma entrada final.

Antes de atualizar:

1. Confirme que o arquivo existe, é reproduzível e corresponde ao hash e versão revisados; use caminho servido pela allowlist, neste fluxo `/storage/exports/<id>/...`. Um `blob:` do navegador é temporário e não serve como caminho durável de entrega.
2. Registre aprovação humana explícita para essa versão, com aprovador, data e evidência disponível, em `approvals.json` quando essa for a convenção do projeto. A solicitação de “revisar” não equivale à aprovação; não assuma que a aprovação de conceito aprova o MP4. Se a aprovação humana ainda não existe, entregue o relatório e o vídeo prontos para ela como último passo, explicando que este gate vem de `AGENTS.md`.
3. Preserve o schema e os registros existentes. A interface atual entende `id`, `name`, `path` e `status: "approved"` ou `"final"`; vincule manifest, relatório, hash e aprovação em campos já usados pelo projeto ou no relatório referenciado. Valide JSON após a edição e confira que a URL local resolve para o arquivo correto. Não publique externamente.

No retorno ao usuário, apresente decisão, principais bloqueios/correções, link do artefato/relatório e checks não executados. Não use “aprovado”, “pronto para veicular” ou “conforme a plataforma” quando isso extrapolar as verificações e a aprovação obtidas.
