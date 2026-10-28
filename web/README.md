# Frame Creative Studio — interface local

Frontend sem dependências de build: HTML, CSS e JavaScript ES modules. Inicie pelo servidor seguro da raiz (`node scripts/dev-server.mjs`) e abra a URL impressa. Não use um servidor estático na raiz, pois ela contém configurações privadas.

## Fluxo

- **Ideias:** três conceitos demonstrativos, filtros, criação, edição e aprovação de conceito.
- **Variações:** manifests versionados dos projetos do workspace e rascunhos criados na interface. Preview Canvas usa `packages/video/index.js`; permite reprodução, scrub, duplicação com outra cor e export JSON. O preview é visual e não renderiza MP4.
- **Finais:** arquivos declarados em projetos e vídeos MP4/WebM importados na sessão; checklist humano para marcar como revisado. Importações não são enviadas ao servidor nem sobrevivem ao reload.
- **Referências:** 16 fontes locais, busca, filtros, player original, link para análise e criação de ideia inspirada na referência.
- **Fluxo:** seis etapas de produção e saídas esperadas.

## Dados

`references.json` liga os MP4s, screenshots e análises da pesquisa existente, sem duplicá-los. `GET /api/projects` deve retornar `{ projects: [...] }`, onde cada projeto pode ter `variants: [{name, manifestPath}]` e `finals: [{name, path, status}]`. A interface também aceita um array de manifests direto.

Rascunhos de ideias e variações usam `localStorage['frame-studio-v1']`. O botão de exportação no rodapé lateral salva esses rascunhos como JSON. A UI não escreve de volta nos arquivos do workspace; estes seguem como fonte versionada de verdade. Para publicar uma variação no projeto, exporte seu manifesto e acrescente-o ao `project.json` correspondente.

Texto inserido pelo usuário é escapado antes de aparecer no HTML. A interface usa fontes de sistema e funciona sem requisições externas.

## Validação

`node --check web/app.js` verifica a sintaxe. Faça a verificação funcional pelo servidor local: criar conceito, aprovar, reproduzir preview, exportar manifesto, abrir uma referência e revisar um vídeo importado. Não há etapa de instalação ou build.

### Ideias versionadas no mural

O endpoint inclui `ideas[]` de `projects/<id>/ideas.json` junto ao projeto. Aceita o documento `{schemaVersion, projectId, ideas: [...]}` e, por compatibilidade, um array direto. Ideias precisam de `id` e `title`; `hook`/`hookHypothesis`, mensagem, beats, CTA, direção, referências, claims, assets necessários e pendências são campos públicos de ideação. A API projeta apenas campos conhecidos, não lê `brief.json`, `assets.json` ou `approvals.json`, e recusa arquivos com links simbólicos. Esses documentos e `ideas.json` continuam bloqueados na rota estática.

No mural, **Arquivo · nome do projeto** identifica uma ideia versionada. O detalhe é somente leitura, preserva o status da fonte e exibe o caminho do arquivo. **Explorar como rascunho local** cria outra ideia no navegador, sem modificar ou aprovar a original. A cópia começa em rascunho e usa duração de 15 segundos se a fonte não especificar uma. Recarregue a página para buscar atualizações dos arquivos. Ideias locais continuam no navegador e na exportação de rascunhos; ideias versionadas permanecem no repositório.

Arquivo ausente equivale a nenhuma ideia; JSON inválido, projeto divergente ou link simbólico deixam o projeto visível com aviso de ideias indisponíveis. Um projeto inválido é omitido sem interromper os demais.

Verificação: `node --test scripts/dev-server.test.mjs web/workspace-ideas.test.mjs` cobre filtragem de campos, arquivos ausentes/inválidos, links simbólicos, rotas bloqueadas e adaptação sem mutação da fonte.

### MP4 draft em Variações

Uma entrada em `variants[]` pode informar `videoPath`, por exemplo:

```json
{
  "id": "v1-pronunciamento",
  "name": "Primeiro corte",
  "status": "draft",
  "manifestPath": "/projects/david-pronunciamento-black/variants/v1-pronunciamento.json",
  "videoPath": "/storage/exports/david-pronunciamento-black/v1-pronunciamento.mp4"
}
```

A interface aceita apenas MP4s na pasta de exportação do próprio projeto e verifica sua disponibilidade com HEAD antes de mostrar o player. O card permite reprodução com controles de áudio e download; **Assistir draft** abre um player maior. Não há autoplay nem aprovação automática. A existência de `videoPath` não cria ou altera `finals[]`.

O MP4 pode aparecer mesmo sem manifest disponível. Variações normais continuam com preview Canvas sem áudio. Quando o caminho é válido mas o render ainda não existe, o card informa a pendência; recarregue a página após finalizar a exportação. O Studio reproduz o áudio já contido no MP4, sem sintetizar ou remixar na interface.
