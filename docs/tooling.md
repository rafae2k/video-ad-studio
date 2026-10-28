# Skills e ferramentas para iniciar

**Sim, o setup local pode começar com o que já existe.** Node.js, FFmpeg e FFprobe estão instalados; o script de transcrição AssemblyAI e a chave local já funcionaram nos cinco vídeos com áudio da pesquisa. As cinco [skills locais](../skills/) guiam intake, ideação, geração, composição e QA conforme o [workflow](../WORKFLOW.md). `imagegen` e `prompt-architect` podem apoiar geração de stills e prompts quando um brief real existir. Nenhuma dessas skills substitui revisão editorial ou o renderer final.

| Etapa                | Disponível agora                                                                         | Estado no repositório                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Transcrição          | AssemblyAI via `research/ai-video-editing/video-review/scripts/transcribe_assemblyai.py` | Executada em cinco clipes; texto precisa de revisão humana.                                        |
| Ideação e referência | 16 análises visuais locais e interface `web/`                                            | Navegação, criação de rascunhos e leitura de ideias versionadas em `projects/<id>/ideas.json`.     |
| Motion, VFX e SFX    | `packages/video/`, `assets/sfx/`                                                         | Catálogo inicial de componentes e sons originais; todos em estado draft.                           |
| Preview              | Canvas no navegador                                                                      | Usa o mesmo `renderFrame` para os dois manifests do projeto demo.                                  |
| Codificação          | FFmpeg/FFprobe e `encode-frames.js`                                                      | PNG sequencial → MP4 H.264/AAC testado; captura automatizada do Canvas ainda ausente.              |
| Versões finais       | `projects/*/project.json`, `storage/exports/`, aba Finais                                | Aceita entradas de workspace e arquivos importados para revisão; nenhum anúncio real foi aprovado. |

## Lacunas antes de produção em volume

1. Integrar captura determinística de frames e narração/música no export, ou adotar Remotion Player + renderer compartilhado. Remotion ainda não está instalado; a [skill oficial Remotion](https://github.com/remotion-dev/skills) é candidata quando esse renderer entrar no projeto.
2. Persistir edições do navegador, notas e aprovações no projeto, com snapshots imutáveis para cada final. Ideias escritas por agentes em `ideas.json` já aparecem no Studio em leitura; rascunhos do navegador ainda ficam no `localStorage` até exportação.
3. Criar adaptadores de geração de imagem/vídeo, ingestão com hashes e direitos, fila de render e validação por placement. Nenhum botão da interface afirma executar essas integrações.

As skills locais já codificam a rotina do agente por etapa. São instruções versionadas neste repo, carregadas por `AGENTS.md`, não integração automática com serviços externos. A biblioteca Canvas e o export ainda têm as limitações acima.
