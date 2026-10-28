# Skills do Video Ad Studio

Estas skills são versionadas com o repositório. `AGENTS.md` manda o agente carregar a skill pertinente e seguir `WORKFLOW.md`; não é preciso copiar instruções para cada prompt. Os nomes abaixo podem ser citados diretamente no pedido ao agente.

| Etapa      | Skill                                           | Entrega principal                                          |
| ---------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Fontes     | [video-ad-intake](video-ad-intake/SKILL.md)     | Inventário, transcrição, segmentos, frames e proveniência. |
| Ideias     | [video-ad-ideate](video-ad-ideate/SKILL.md)     | Conceitos rastreáveis em `ideas.json`.                     |
| Geração    | [video-ad-generate](video-ad-generate/SKILL.md) | Prompts, jobs (Magnific via MCP), custos e assets aceitos. |
| Composição | [video-ad-compose](video-ad-compose/SKILL.md)   | Escolha de backend, manifests, preview e export.           |
| Receita    | [video-ad-motion](video-ad-motion/SKILL.md)     | Talking head → anúncio com lettering atrás da cabeça (v5). |
| Revisão    | [video-ad-qa](video-ad-qa/SKILL.md)             | QA técnico/editorial e gate de versão final.               |
| Remotion   | [remotion-best-practices](remotion-best-practices/SKILL.md) | Cópia oficial das práticas Remotion, com [proveniência](remotion-best-practices/PROVENANCE.md). |

Para editar um vídeo de fala, o caminho curto é **intake → motion → qa**: transcrever, montar o manifest da receita e revisar. A receita reproduz o [exemplo do README](../README.md#exemplo) pelo backend [packages/motion](../packages/motion/README.md).

O conjunto deriva da pesquisa resumida em [docs/research](../docs/research/README.md); a pesquisa completa fica em `research/`, local e fora do Git. As skills descrevem o processo; não instalam modelos nem habilitam integrações externas por conta própria.
