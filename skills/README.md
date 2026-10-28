# Skills do Video Ad Studio

Estas skills são versionadas com o repositório. `AGENTS.md` manda o agente carregar a skill pertinente e seguir `WORKFLOW.md`; não é preciso copiar instruções para cada prompt. Os nomes abaixo podem ser citados diretamente no pedido ao agente.

| Etapa      | Skill                                           | Entrega principal                                          |
| ---------- | ----------------------------------------------- | ---------------------------------------------------------- |
| Fontes     | [video-ad-intake](video-ad-intake/SKILL.md)     | Inventário, transcrição, segmentos, frames e proveniência. |
| Ideias     | [video-ad-ideate](video-ad-ideate/SKILL.md)     | Conceitos rastreáveis em `ideas.json`.                     |
| Geração    | [video-ad-generate](video-ad-generate/SKILL.md) | Prompts, keyframes, jobs, custos e assets aceitos.         |
| Composição | [video-ad-compose](video-ad-compose/SKILL.md)   | Manifests de variantes, preview e preparação de export.    |
| Revisão    | [video-ad-qa](video-ad-qa/SKILL.md)             | QA técnico/editorial e gate de versão final.               |

O conjunto deriva da [pesquisa de anúncios](../research/ai-video-ads/README.md), da [pesquisa de edição](../research/ai-video-editing/README.md) e dos [16 vídeos analisados](../research/ai-video-editing/video-review/README.md). As skills descrevem o processo; não instalam modelos nem habilitam integrações externas. O renderer atual é Canvas. A [skill oficial Remotion](https://github.com/remotion-dev/skills) fica como candidata para quando houver código Remotion no projeto.
