# Guia para agentes neste repositório

Este repositório é um estúdio local para criar e revisar anúncios em vídeo. A pesquisa em `research/` é evidência e referência; não é um banco de peças liberadas para uso comercial.

Para pedidos de produção, siga [WORKFLOW.md](WORKFLOW.md). Carregue a skill específica da etapa: [intake](skills/video-ad-intake/SKILL.md), [ideação](skills/video-ad-ideate/SKILL.md), [geração](skills/video-ad-generate/SKILL.md), [composição](skills/video-ad-compose/SKILL.md) ou [QA](skills/video-ad-qa/SKILL.md). Para editar vídeo de fala (talking head) em anúncio com motion, use a receita [video-ad-motion](skills/video-ad-motion/SKILL.md): é a que gerou o exemplo do README e a referência de qualidade. Leia apenas a skill pertinente ao trabalho atual; não presuma que uma etapa posterior já ocorreu. Para composição React/Remotion, leia também [remotion-best-practices](skills/remotion-best-practices/SKILL.md) e as referências que ela indicar. A cópia oficial tem [origem e situação de licença registradas](skills/remotion-best-practices/PROVENANCE.md).

## Fonte de verdade

- `packages/video/catalog.json` descreve componentes, efeitos e SFX reutilizáveis. Mantenha IDs estáveis; aumente a versão ao mudar comportamento visual ou parâmetros.
- `packages/video/index.js` implementa o preview por frame. Um novo componente precisa de defaults no catálogo, exemplo de uso e teste de validação/tempo.
- `projects/<id>/project.json` cataloga trabalho do workspace. O Studio lê esses arquivos por `GET /api/projects`.
- `web/` contém a interface. Rascunhos no navegador são editáveis, mas só passam a integrar o repositório após exportação e revisão do JSON.
- `assets/sfx/` contém sons procedurais originais. Registre proveniência e licença no catálogo. Não copie samples de terceiros sem licença documentada.

## Backends disponíveis

- **Canvas:** `packages/video/index.js` + catálogo; preview de componentes. `encode-frames.js` codifica PNGs já capturados pelo mesmo `renderFrame`; não faz ingestão de footage/voz.
- **FFmpeg V1:** `scripts/render-footage.py` edita vídeo real e voz original com textos estáticos Pillow. Contrato próprio de cortes/cues; não executa componentes Canvas nem motion React.
- **Motion matte (`motion-matte-v1`):** `packages/motion/` (Python + RVM + FFmpeg). Talking head → jump cuts pela transcrição, pessoa recortada e descida, lettering atrás da cabeça, plates de marca/IA, legenda, SFX e CTA. Manifest `*.motion.json` com tempos em segundos do bruto. Reproduz byte a byte a v5 do exemplo; não é Remotion nem Canvas. Veja seu [README](packages/motion/README.md).
- **Remotion V2:** `packages/remotion/` instalado com dependências fixadas; composição React compartilhada por Studio e export. `render-v2.mjs` renderiza MP4 ou frame PNG. A existência do backend não prova que uma composição foi renderizada ou revisada. Veja seu [README](packages/remotion/README.md).

Escolha e registre explicitamente o backend por variante. Não passe manifest FFmpeg ao validador Canvas nem afirme paridade visual entre engines. Não anuncie uso de Remotion se o arquivo foi produzido por FFmpeg/Pillow. `public/` do Remotion deve conter apenas assets autorizados da composição; nunca copie configurações privadas para lá.

## Fluxo de criação

1. Registre brief, fontes, claims permitidos e assets com proveniência.
2. Proponha ideias vinculadas a um trecho ou objetivo e procure reutilização no catálogo antes de criar outro componente.
3. Crie variantes alterando campos explícitos do manifest; mantenha as anteriores para comparação.
4. Pré-visualize e revise copy, timing, cortes, produto, mãos, rosto, legendas, voz e zonas seguras antes de considerar render.
5. `finals[]` exige arquivo exportado, manifest de origem, revisão humana e checagem técnica. Preview ou projeto de exemplo nunca é final.

## Segurança e portabilidade

- Nunca imprima, copie para logs ou exponha `.env`. O servidor local só publica caminhos permitidos e escuta em `127.0.0.1`.
- `research/` inteiro é local e ignorado pelo Git (material de terceiros); o resumo público está em `docs/research/`. Brutos, transcrições, assets e exports ficam em `storage/` e em `projects/<id>/` fora do Git; só `projects/demo` é versionado. Originais em `research/ai-video-editing/source-videos/` são locais. A interface deve funcionar sem eles, usando screenshots ou estado vazio.
- Não confunda uma afirmação de vídeo patrocinado ou um mock de ferramenta com capacidade verificada. Preserve links e nível de confiança ao promover uma técnica para a biblioteca.
- Renderização determinística e export final ainda dependem de validação no mesmo motor usado no preview; não marque uma saída experimental como pipeline de produção.
