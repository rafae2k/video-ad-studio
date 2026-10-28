# Skills e ferramentas

O caminho que já produz anúncio de ponta a ponta é **vídeo de fala → [backend motion](../packages/motion/README.md)**: transcrição AssemblyAI, EDL, máscara RVM, lettering, plates de marca e de IA, SFX e render. Ele reproduz byte a byte o [exemplo do README](../README.md#exemplo). As [skills locais](../skills/) guiam intake, ideação, geração, composição, a receita motion e QA conforme o [workflow](../WORKFLOW.md). Nenhuma substitui revisão editorial.

| Etapa | Disponível | Estado |
| --- | --- | --- |
| Transcrição | `npm run transcribe` (AssemblyAI, só áudio; dry run por padrão) | Usada nos brutos do exemplo. Texto precisa de escuta humana. Envio é pago e exige chave em `.env`. |
| Edição de fala com motion | `npm run motion` (`packages/motion`, Python 3.12 via `uv`, RVM, FFmpeg) | Reproduz a v5 byte a byte (sha256 conferido em 2026-10-28). ~5,5 min para 57 s num Mac Apple Silicon. |
| Mídia gerada | Magnific / Freepik via MCP (Seedance Fast 2.0, imagens 9:16) | Externo ao repo, depende do conector na sessão. Prompts e hashes do exemplo em `packages/motion/examples/v5-surf.assets.json`. |
| Cortes simples + texto estático | `scripts/render-footage.py` (FFmpeg/Pillow) | Funciona; sem motion. |
| Motion em React | `packages/remotion` (Remotion 4, dependências fixadas) | Instalado; composições de exemplo. Assets de marca não acompanham o repo. |
| Componentes e preview | `packages/video/` (Canvas), `web/` (Studio local) | Catálogo inicial em draft; preview sem áudio. |
| SFX | `assets/sfx/` (procedurais originais) | Usados pelos backends motion e Canvas. |
| Versões finais | `projects/*/project.json`, `storage/exports/`, aba Finais | `finals[]` só com arquivo, manifest, QA e aprovação humana. Nenhum anúncio real aprovado. |

## Lacunas antes de produção em volume

1. Ajuste de máscara à mão (halo, objeto na mão) no backend motion; hoje a saída é trocar a take ou cobrir com plate `full`.
2. Adaptador de geração no repo (fila, custo, retry); hoje a geração depende do MCP da sessão.
3. Persistir edições do navegador, notas e aprovações no projeto, com snapshot imutável para cada final.
4. Validação por placement (safe zones oficiais) e checagem automática dos defeitos conhecidos da receita (legenda larga, lettering fora da margem).
