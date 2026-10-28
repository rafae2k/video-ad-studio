# Video Ad Studio

Estúdio local para organizar **ideias → variações → versões finais** e construir uma biblioteca reutilizável de motion, VFX, legendas, CTA e SFX. O Studio e o preview são JavaScript sem dependências externas. A edição tem quatro backends: **motion sobre vídeo de fala** (Python + RVM, o do exemplo abaixo), preview Canvas, cortes FFmpeg e composição React/Remotion.

## Exemplo

Fala gravada transformada em anúncio — à esquerda o vídeo original (raw, 4min14), à direita a edição v5 (57 s): cortes guiados pela transcrição, recorte da pessoa (máscaras RVM) com fundo trocado e letreiros atrás dela, clipes gerados por IA, packshot e CTA. Feita com o backend [`packages/motion`](packages/motion/README.md) (Pillow/OpenCV/NumPy + FFmpeg), não com Remotion; é um draft, não uma peça final aprovada.

<table>
  <tr>
    <th>Original (raw)</th>
    <th>Editado (v5)</th>
  </tr>
  <tr>
    <td><video src="https://github.com/user-attachments/assets/cfc0e8fe-be36-426f-8ec2-4be274717905" controls width="300"></video></td>
    <td><video src="https://github.com/user-attachments/assets/f5cd2ba1-9474-4a02-8df2-fd8719f955c8" controls width="300"></video></td>
  </tr>
</table>

### Reproduzir com o seu vídeo

O repo refaz essa edição a partir do bruto: o render do [manifest da v5](packages/motion/examples/v5-surf.motion.json) sai **byte a byte igual** ao vídeo acima. O bruto, a transcrição e os assets da marca não são publicados, então com o seu material o caminho é:

```sh
npm run transcribe -- --submit --input storage/sources/<id>/take.mov --output-dir projects/<id>/intake/transcripts
cp packages/motion/examples/v5-surf.motion.json projects/<id>/edits/v1.motion.json   # takes, lettering, fundos
npm run motion -- projects/<id>/edits/v1.motion.json all
```

Requisitos: Node.js, FFmpeg/FFprobe, [`uv`](https://docs.astral.sh/uv/), uma chave AssemblyAI em `.env` (só para transcrever) e uma fonte display licenciada. A receita completa, com regras de lettering, fundos e pace, prompts de IA (Magnific) e checklist de QA, está na skill [video-ad-motion](skills/video-ad-motion/SKILL.md). Um agente com este repo pode segui-la: peça "edita esse vídeo como o exemplo do README".

## Iniciar

Requisitos já presentes nesta máquina: Node.js e FFmpeg/FFprobe. Rode:

```sh
npm run dev
```

Abra o endereço local impresso pelo comando. O servidor atende somente em `127.0.0.1` e limita os caminhos publicados; não sirva a raiz do repositório com um servidor estático genérico, pois existe um `.env` local.

Para verificar o servidor, a interface e a biblioteca:

```sh
npm run check
```

## Organização

| Caminho                  | Função                                                                            |
| ------------------------ | --------------------------------------------------------------------------------- |
| `web/`                   | Interface local para ideação, variações, finais e referências.                    |
| `packages/motion/`       | Backend motion-matte: talking head → anúncio com lettering atrás da pessoa.     |
| `packages/video/`        | Catálogo e renderer de preview por frame; exemplos de manifest e SFX procedurais. |
| `assets/sfx/`            | Sons originais versionados, com proveniência no catálogo.                         |
| `projects/`              | Índice de projetos que outros agentes podem atualizar e o Studio pode ler.        |
| `skills/`                | Skills por etapa (intake, ideação, geração, composição, QA), a receita motion e práticas Remotion. |
| `docs/`                  | Ferramentas, aprendizados e o [resumo da pesquisa](docs/research/README.md).      |
| `scripts/`               | Servidor local, transcrição AssemblyAI, renderer FFmpeg V1 e utilitários.         |

## Estado atual

O backend motion edita vídeo de fala de ponta a ponta e reproduz o exemplo acima. Ele ainda não tem ajuste de máscara à mão, e a revisão da v5 registrou defeitos conhecidos, listados no [README do pacote](packages/motion/README.md#limites-conhecidos-medidos-na-v5). O Studio tem um projeto de demonstração e amostras de componentes Canvas. Nenhuma campanha real ou versão final foi aprovada. Ainda faltam persistência editável compartilhada entre agentes, adaptador de geração de vídeo no repo (hoje via MCP), fila de jobs e revisão de licenças/claims de cada campanha.

Para acrescentar componentes e projetos, siga [AGENTS.md](AGENTS.md) e [a documentação da biblioteca](packages/video/README.md). O inventário de [skills, ferramentas e lacunas](docs/tooling.md) indica o que já pode ser usado e o que falta para produção.

O [workflow do agente](WORKFLOW.md) liga intake, ideação, geração, composição, render e revisão. As [skills do repo](skills/) descrevem cada handoff. Crie um projeto com `npm run project:new -- campanha-01 "Nome da campanha"`.

## Edição com Remotion

O backend [Remotion](packages/remotion/README.md) está instalado com [componentes de motion](packages/remotion/COMPONENTS.md) reutilizáveis. Assets de marca (fontes, logos, footage) **não** acompanham o repositório: coloque em `packages/remotion/public/` apenas assets cuja licença permita redistribuição, registrando proveniência em `PROVENANCE.json` — veja o modelo em `packages/remotion/public/brand/vip/extraction.md`. Campanhas reais ficam fora do repositório; `projects/demo/` mostra a estrutura esperada de um projeto.
