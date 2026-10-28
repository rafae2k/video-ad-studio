# Aprendizados para a plataforma de anúncios em vídeo

Síntese da pesquisa de 19/10/2026 em [research/ai-video-production-lifecycle/](../research/ai-video-production-lifecycle/README.md). Cada item diz de onde vem e quanto confiar. **Inferência** = conclusão minha ou dos agentes a partir das fontes, não afirmação delas. Nada aqui foi implementado ou testado no repo.

## Princípios de desenho

1. **Gates humanos onde há julgamento.** Todas as fases têm uma lista "IA faz" e outra "humano decide" em [ciclo.md](../research/ai-video-production-lifecycle/ciclo.md). O humano decide: qual dor a marca pode prometer, quais conceitos são realmente diferentes, cada claim, ritmo e gosto, qual take é a melhor, o que matar e o que escalar, e a aprovação da versão exata do arquivo. Combina com a regra de `finals[]` do [AGENTS.md](../AGENTS.md). *Confiança: média — síntese dos agentes.*
2. **Hierarquia de decisão do corte vira checklist de QA.** Murch, *In the Blink of an Eye*: emoção 51%, história 23%, ritmo 10%, eye-trace 7% (li o trecho original). Não substitui olhar humano. *Confiança: alta para a fonte; aplicar a anúncio curto é inferência.*
3. **Funil de variantes.** Baxter e Sixel triam o material em etapas e entregam ao diretor 2 ou 3 caminhos montados (entrevistas lidas). É o desenho natural de "variantes" por manifest. *Inferência para a plataforma.*
4. **Os primeiros segundos pesam mais.** MrBeast (guia vazado, verificado pela Business Insider), Colin & Samir, TikTok Creative Codes e Hormozi convergem em: promessa igual à abertura, e refazer o hook antes do resto. Resultados são autodeclarados. *Confiança: média.*
5. **Hook trocável sobre corpo fixo.** Dara Denney, Ben Heath e a Motion testam hooks diferentes sobre o mesmo corpo. Encaixa em lote com Remotion, mas o agrupamento de anúncios parecidos pela Meta vem de observação de gestores, não de documento da Meta. *Confiança: média/baixa.*
6. **Brief em beats, não em roteiro corrido.** Cinco guias de UGC convergem: travar mensagem, claims e hook, e liberar as palavras do creator. São guias de agências com interesse comercial. *Confiança: média.*
7. **IA gera muito e descarta muito.** PJ Ace relata 3–4 cortes bons a cada 20 gerações; Rory Flynn, 33 imagens finais para ~400 ruins; o Apogee modela ~US$44 por vídeo entregável. São relatos pequenos, parte autodeclarada. A plataforma precisa de log de prompts, teto de custo e orçamento de descarte. *Confiança: média.*
8. **Template com controles expostos.** Adobe MOGRT e ukramedia expõem controles, CSV e dropdowns de tema, que mapeiam quase 1:1 para um manifest. *Confiança: média; mapeamento é inferência.*

## Decisões em aberto (precisam de você)

- **Fórmula de hold rate.** Ao menos 4 fórmulas em uso (Motion 15 s ÷ 3 s; Igor Fortaleza 75% ÷ impressões; Alan Melnick ThruPlay ÷ 3 s; TikTok 6 s). Escolher uma e documentar. Benchmarks de hook (25–40%) também divergem.
- **Método de teste.** ABO por lote, direto na campanha principal, ou sem orçamento de teste. Prazos de decisão vão de 72 h a 81 dias. Critério de matar e escalar: definir **antes** do teste; não achei fonte com critério numérico confiável.
- **Backend por variante.** Canvas, FFmpeg V1 ou Remotion V2, registrado conforme o AGENTS.md. A pesquisa recomenda Remotion para lote, mas a licença paga para equipe de 4+ pessoas ($25 por assento/mês) e o render determinístico ainda precisam de validação no repo.
- **Matting.** RVM é GPL, MatAnyone é S-Lab não comercial, HyperFrames é Apache-2.0. Licença decide qual entra num produto.

## Travas de compliance para o gerador (suplemento no Brasil)

Mapa de risco, não parecer jurídico. **Confirme a versão vigente de cada regra.**

- Técnicas comuns de direct response que conflitam: antes e depois, claim de emagrecimento, sono ou ansiedade, pergunta de dor ligada a condição de saúde, prova de resultado em prazo. Fontes: política de saúde e de atributos pessoais da Meta; Anvisa (propaganda enganosa); FTC. *Confiança: média; li os textos oficiais citados pelos agentes, mas a aplicação ao caso exige revisão humana.*
- Meta: suplemento só para público 18+. TikTok Shop proíbe avatar de IA no papel de médico ou nutricionista para promover produto. Rótulo de conteúdo gerado por IA existe em Meta e TikTok. *Confiança: média (política oficial, mas muda).*
- Anvisa e CONAR: as fontes são a RDC 243 e o Código CONAR 2025. Havia revisões recentes que não confirmei se já valem. *Confiança baixa para vigência.*
- Música: Epidemic Creator e Artlist Social não cobrem anúncio pago; Meta Reels não aceita música licenciada do app (achado por cópia da página, não pelo domínio oficial); TikTok tem a Commercial Music Library. *Confiança: baixa/média.*
- Voz clonada: ElevenLabs exige consentimento e plano pago para uso comercial. Registrar consentimento por voz. *Confiança: média (política do provedor).*
- Avatar de IA hiper-realista e produto na mão são os pontos mais fracos: o post da Mojo relata "taxa de falha de 80%" no caso, e 0,2 s de atraso no lip-sync derrubou o CTR em 68%. Fonte única, autorrelato de empresa. *Confiança: baixa/média.*

## Números que NÃO devem ser tratados como fato

- "385 anunciantes" na amostra da Motion e "≥35% hook, ≥20% hold": não achei nas fontes citadas. Retirados.
- -14 LUFS para YouTube, TikTok e Reels: convenção, não regra de plataforma (só o Spotify publica).
- "95% do gasto em 2–3 anúncios": observação de gestores, não dado da Meta.
- Preços de ferramentas mudam; só entraram os que vi em página oficial no dia.

## Próximos passos sugeridos (não executados)

1. Escolher a fórmula de hold rate e o critério de teste e registrar em `WORKFLOW.md`.
2. Transformar as listas "IA faz / humano decide" em gates do `WORKFLOW.md` e nas skills de etapa.
3. Mapear quais das técnicas "automatizável: sim" já existem no catálogo `packages/video/catalog.json` e quais faltam, antes de criar componente novo.
4. Validar, num brief real, a trava de compliance com revisão humana.
