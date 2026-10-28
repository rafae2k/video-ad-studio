# Pesquisa: o que embasa a receita

A pesquisa completa fica em `research/`, **local e fora do Git**. Ela contém vídeos, telas e transcrições de criadores terceiros que não podem ser redistribuídos. Este resumo público guarda as conclusões que viraram processo neste repositório, com o nível de evidência de cada uma. Uma técnica observada em vídeo de terceiro não prova que a ferramenta dele funciona; só prova o que estava na tela.

## 1. O que a análise de referências ensinou (2026-10-18)

Foram analisados 16 clipes de criadores de edição com IA: 5 com fala, transcritos pela AssemblyAI, e 11 cartões animados sem fala. Os padrões que entraram no fluxo:

| Padrão observado | Onde está no repo |
| --- | --- |
| Uma transcrição com tempo por palavra é a base de tempo de cortes, legendas, motion e SFX. | `npm run transcribe` → `words[]` → [EDL do motion](../../packages/motion/README.md) |
| A edição em passes tipados: transcrição → recorte da pessoa → legendas → cenas de motion → som → export/QA, cada um com artefato próprio. | etapas `edl → tighten → masks → plan → render` |
| A legenda em grupos de 1–3 palavras, com papéis (palavra-chave, apoio). | grupos de até 3 palavras, palavra-chave maior |
| O texto e os gráficos como eventos estruturados, não desenhados dentro do vídeo gerado. | `letters[]`, `plates[]`, `cta` no manifest |
| As oportunidades de motion ligadas a um trecho da fala, propostas e aprovadas antes de virar componente. | [video-ad-ideate](../../skills/video-ad-ideate/SKILL.md), `ideas.json` |

A linguagem visual que inspirou a receita foi a de lettering atrás da cabeça, com sujeito recortado e transição por blur, de criadores como zeeuiux, Chris Moran e Edmund Tian. Essa é a **linguagem de movimento**, e não a interface deles: a versão que copiou os cartões de UI da referência foi rejeitada.

## 2. Pesquisa de pipeline e de ferramentas (2026-10-18/19)

- **Pipeline de anúncio.** Os casos de marca convergem em quadro aprovado → animação → inspeção → pós, com texto e CTA em camadas editáveis e embalagem real composta (não gerada) quando o rótulo importa. É inferência a partir de casos públicos.
- **Edição por agente.** O caminho recomendado é uma base editada com aprovação humana e variações como campos de dados renderizados por código (FFmpeg, Remotion ou API JSON). Nenhuma ferramenta GUI pesquisada oferece edição ponta a ponta por API.
- **Recorte da pessoa (testado neste repo).** O `rembg u2net_human_seg` (v2–v4) perdia a lata e o sachê na mão. O **RVM resnet50** (v5 em diante) ficou estável entre quadros e manteve os objetos segurados; a licença é GPL-3.0. MatAnyone 2 tem a melhor borda segundo a documentação, mas a licença é não comercial e exige máscara inicial (SAM 2). Não foi testado.
- **Animação de texto (não testado).** Para lettering em HTML/CSS, as opções com mais tração eram HyperFrames (HeyGen, Apache 2.0, GSAP → quadros) e Remotion (já em `packages/remotion`). O compositor Python bastou para a receita.
- **NullMotion (avaliado, não usado).** O editor web exige login e plano pago e não tem API nem MCP. O repositório `blixvip/NullMotion` só visualiza anúncios prontos. Nenhum dos dois faz texto atrás da pessoa.
- **Loudness.** Não há alvo oficial de Meta ou TikTok; −14 LUFS é convenção. A receita usa −15 LUFS / −1,5 dBTP.

## 3. Histórico do exemplo do README (Velho surfando, out/2026)

| Versão | O que tinha | Resultado |
| --- | --- | --- |
| v1 | FFmpeg V1: cortes pela transcrição + legenda estática | Rejeitada: "só colocou as legendas e cortou? cadê o pace, motion, lettering, rotoscopia" |
| v2 | Primeiro compositor: jump cuts, zoom, lettering atrás (rembg), tela dividida, legenda palavra a palavra | Intermediária |
| v3 | Estilo "timeline por camadas", com cartões de UI copiados da referência | Rejeitada: "copiou elementos da referência; o que eu queria era o motion, o texto atrás da cabeça, movendo o principal pra baixo" |
| v4 | Sujeito descido, lettering gigante atrás, plates de marca e IA (Magnific) | Base da linguagem final |
| **v5** | v4 + máscara RVM, aperto de respiro (o gap antes de "espirulina"), filtro de sopro na voz | **Escolhida como melhor (2026-10-28).** Reproduzida byte a byte por `packages/motion` |
| v6, v7 | Correções dos achados de revisão adversarial (visual e áudio): lettering limitado a 740 px, legenda em pílula no topo, 1 beat por frase, lower third, packshot | Rejeitadas frente à v5. Corrigiram medidas, mas perderam a linguagem |

**Lição:** a revisão adversarial mede defeitos reais (a lista está na [skill da receita](../../skills/video-ad-motion/SKILL.md#checklist-específica-defeitos-medidos-na-v5)), mas a correção não pode trocar a linguagem que fez a peça funcionar. Corrija o parâmetro da entrada afetada e compare lado a lado com a versão anterior antes de substituí-la.

## Onde está o material local

Com o checkout original, consulte `research/ai-video-ads/`, `research/ai-video-editing/` (inclui `video-review/` com as 16 análises) e `research/ai-video-production-lifecycle/` (ciclo em 9 fases e catálogos). As decisões de plataforma derivadas estão em [platform-learnings.md](../platform-learnings.md).
