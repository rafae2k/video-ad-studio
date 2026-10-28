---
name: video-ad-intake
description: Inventariar e analisar vídeos de referência e footage para anúncios, com transcrição, segmentos visuais, proveniência e handoff estruturado para criação e edição neste repo.
---

# Intake de vídeo

Transforme mídia recebida em evidências consultáveis e assets identificados. Preserve a diferença entre uma referência de linguagem visual e footage disponível para usar no anúncio. Não trate a análise como aprovação de copy, licença de uso ou seleção final de take.

## Localizar e inventariar

Resolva os caminhos abaixo a partir da raiz do repo, não do diretório corrente. Procure análises existentes pelo nome, ID e hash antes de repetir extração ou transcrição. Preserve os originais e registre um ID estável, SHA-256, caminho/URL de origem, tipo, tamanho, duração, dimensões, FPS e presença de áudio com FFprobe. Marque o papel: `reference`, `source_footage` ou `brand_asset`.

Registre origem declarada, autor quando conhecido e situação de direitos (`owned`, `licensed`, `reference_only`, `unknown`), com evidência quando disponível. Arquivo fornecido ou publicamente acessível não comprova permissão de reutilização. Não invente atribuição ou licença. Referências podem orientar técnica sem copiar música, imagem ou depoimento para a peça final.

## Seleção de material nunca editado

Se o pedido exigir material nunca editado, aplique esta auditoria à seleção dos brutos.

Leia o card completo e discussões, incluindo resolvidas quando disponíveis. Identifique cada bruto por file ID e SHA-256 quando o arquivo estiver disponível; ID de pasta, título e filename isolados não comprovam identidade. Busque duplicatas por título, tema, filename e identificadores, e cruze os arquivos com versões/entregas no Frame.io e links de finais registrados. Distingua mesmo roteiro de mesmo arquivo: uma regravação ou um mashup podem ter histórico diferente. Registre quais fontes foram realmente consultadas e lacunas de acesso/cobertura.

Registre no relatório de intake uma classificação por candidato:

- `no_delivery_found`: nenhuma entrega encontrada nas fontes consultadas; não significa que ninguém editou.
- `confirmed_unedited`: evidência afirmativa vinculada ao bruto confirma que ainda não foi editado, sem evidência conflitante nas duplicatas/entregas verificadas. Cite fonte, data e alcance da confirmação.
- `excluded_existing_edit`: edição existente identificada e ligada ao bruto; cite o arquivo/versão e a correspondência que fundamenta a exclusão.

Registre também `workInProgress: unknown | not_started | in_progress`, com evidência. `Edição v1`, v1 vazio ou ausência de comentários não resolvem o estado do trabalho em andamento. Se faltarem file IDs, hashes ou acesso a entregas, preserve a lacuna e não promova `no_delivery_found` a `confirmed_unedited`. Prossiga com a pesquisa dos demais candidatos para satisfazer a restrição real do usuário; esta auditoria não cria aprovação adicional nem se aplica a pedidos que permitem reeditar material.

## Ouvir e transcrever

- Se houver fala, reutilize uma transcrição existente vinculada à mesma fonte ou use o helper `npm run transcribe` ([scripts/transcribe-assemblyai.py](../../scripts/transcribe-assemblyai.py)) com `--output-dir projects/<id>/intake/transcripts`. O `words[]` do JSON é a entrada direta do [backend motion](../../packages/motion/README.md). Leia seu `--help` e implementação relevante antes de executá-lo; modelos e opções podem mudar.
- O helper faz dry run por padrão. `--prepare-only` extrai áudio local; `--submit` envia **apenas áudio** e pode gerar cobrança. Use `--submit` quando a autorização existente abranger o serviço e os arquivos atuais. Se não abranger, prepare localmente, continue a inspeção visual e peça somente a autorização faltante. A existência de chave não autoriza envio. Não envie o vídeo inteiro para obter transcrição.
- Passe `--input` com arquivos explícitos e `--output-dir` do intake atual. O helper usa o nome-base para saídas: processe fontes de nomes iguais em diretórios separados. Nunca mostre a chave de `.env`.
- Preserve JSON bruto com palavras e timestamps em milissegundos, texto e SRT. Registre provider/model, ID do job e condição de revisão. Em timeout, retome o job salvo; não dispare outra transcrição paga como retry automático.
- Compare a cobertura final do SRT com as últimas palavras do JSON. Este repo observou palavras finais omitidas no SRT do provider; preserve o original e identifique qualquer versão reparada como derivada. Escute trechos com nomes, números, negações ou baixa confiança antes de usá-los em copy. Se não houve escuta, declare transcrição automática não revisada.
- Stream de áudio não significa fala: diferencie fala, música, efeitos, silêncio e conteúdo ininteligível. Para fonte sem fala, registre essa condição; não force uma transcrição.

## Inspecionar por segmentos

Extraia keyframes locais com FFmpeg: abertura, mudanças de cena/assunto, demonstração do efeito e encerramento. Use contact sheet para localizar eventos e abra frames em resolução suficiente para confirmar texto e detalhes. Ajuste a amostragem ao vídeo; três frames não bastam para demonstrar continuidade de uma animação.

Divida a análise em intervalos `startMs`/`endMs`. Para cada intervalo, descreva sujeito, composição, texto, corte/movimento, relação com fala e áudio, e o que pode ser reaproveitado como técnica. Se a conclusão depende de movimento, examine frames adjacentes ou reproduza o trecho; um still não prova easing, tracking ou sincronização.

Separe explicitamente:

- **Observado:** aparece nos frames ou foi ouvido; cite arquivo e timestamp.
- **Alegado:** afirmação do narrador, overlay, legenda ou fornecedor; atribua a quem disse.
- **Inferido:** interpretação ou proposta nossa a partir das evidências; explique a ligação.
- **Não verificado:** código, prompt, API, autoria por IA, custos, throughput ou qualidade fora do trecho recebido.

Uma gravação de interface prova o que está visível, não que o backend funciona. Uma montagem “antes/depois” não prova qual modelo a criou. Não transforme declarações de saúde, números ou depoimentos da referência em fatos aprovados para o anúncio.

## Salvar e entregar

Leia `WORKFLOW.md` e o schema existente do projeto quando disponíveis. Grave evidências em `projects/<project-id>/intake/` e vincule as notas aos IDs de `assets.json` conforme o contrato local; não altere `finals[]` nem marque uma versão como aprovada. Não preencha marca, produto ou claims com suposições. Para o relatório de intake, use esta estrutura mínima, adaptando os campos ao contrato existente:

```text
schemaVersion: 1
assets[]: id, role, sourcePath, sourceUrl?, sha256, mediaMetadata,
          provenance, rightsStatus, rightsEvidence?
transcripts[]: assetId, rawJsonPath, textPath, srtPath?, provider?,
               model?, jobId?, reviewStatus, language?, coverageNotes
segments[]: id, assetId, startMs, endMs, framePaths[], transcriptSpan?,
            observations[], attributedClaims[], inferences[], unknowns[]
reuseCandidates[]: id, segmentIds[], technique, existingComponentId?,
                   suggestedInputs, limitations, status: proposed
```

Cada entrada de evidência deve permitir chegar ao frame, trecho ou documento que a suporta. Use referências relativas dentro do artefato quando possível. Não inclua credenciais, URLs temporárias de upload nem tokens em manifests compartilhados. Preserve IDs e timestamps de origem ao relacionar transcrição e cenas; não rebaseie silenciosamente um corte para tempo zero.

Para um projeto, prefira `projects/<project-id>/intake/`; para estudo de referências sem projeto, siga a organização existente em `research/ai-video-editing/video-review/` (`videos/`, `screenshots/`, `transcripts/`), que é local e fica fora do Git porque contém material de terceiros. Produza um resumo legível por vídeo e o manifest estruturado. Vincule os arquivos existentes em vez de duplicar mídia pesada. Não use vídeos de terceiros da pesquisa como assets demonstrativos de um anúncio exportável sem evidência de direitos.

O handoff deve informar: fontes analisadas, cobertura visual/sonora real, padrões reutilizáveis, candidatos já existentes na biblioteca, lacunas que afetam o próximo passo e caminhos dos artefatos. A análise termina com sugestões rastreáveis; escolha editorial e geração seguem o pedido atual do usuário.

## Contexto do repo

Consulte apenas quando necessário. O [resumo público](../../docs/research/README.md) sempre está disponível; os caminhos `research/` abaixo existem só no checkout original:

- `research/ai-video-editing/video-review/README.md`: índice de referências já analisadas.
- `research/ai-video-editing/video-review/videos/joshuablatch_1791893532_4005694180745129840_6733619072.md`: oportunidade vinculada à transcrição e busca de reutilização no catálogo.
- `research/ai-video-editing/workflows/02-remotion-ffmpeg.md`: handoff de fontes para cenas e componentes.

Esses documentos registram observações e propostas; seus exemplos não são prova de recursos já implementados nem autorização permanente para chamadas externas.
