# Video Ad Studio

Estúdio local para organizar **ideias → variações → versões finais** e construir uma biblioteca reutilizável de motion, VFX, legendas, CTA e SFX. O primeiro setup usa JavaScript sem dependências externas para o Studio e o preview, com três backends: preview Canvas, edição FFmpeg e composição React/Remotion.

## Exemplo

Corte, ritmo e legendas sobre fala gravada — à esquerda o vídeo original (raw, 4min14), à direita a edição v1 (1min02) com cortes guiados pela transcrição e legendas queimadas, feita com o backend FFmpeg:

<table>
  <tr>
    <th>Original (raw)</th>
    <th>Editado (v1)</th>
  </tr>
  <tr>
    <td><video src="https://github.com/user-attachments/assets/cfc0e8fe-be36-426f-8ec2-4be274717905" controls width="300"></video></td>
    <td><video src="https://github.com/user-attachments/assets/51f5c96a-e5b6-46b4-b0aa-59d10a248e9a" controls width="300"></video></td>
  </tr>
</table>

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
| `packages/video/`        | Catálogo e renderer de preview por frame; exemplos de manifest e SFX procedurais. |
| `assets/sfx/`            | Sons originais versionados, com proveniência no catálogo.                         |
| `projects/`              | Índice de projetos que outros agentes podem atualizar e o Studio pode ler.        |
| `skills/`                | Skills de handoff por etapa (intake, ideação, geração, composição, QA) e práticas Remotion. |
| `scripts/dev-server.mjs` | Servidor local com allowlist de arquivos e endpoint de leitura de projetos.       |

## Estado atual

O Studio tem um projeto de demonstração e amostras de componentes; nenhuma campanha real ou versão final foi aprovada. O preview usa Canvas e os manifests são JSON exportáveis. Ainda faltam persistência editável compartilhada entre agentes, render final comprovadamente equivalente ao preview, fila de jobs, integração com geradores de vídeo e revisão de licenças/claims de cada campanha. A base foi organizada para acrescentar um renderer de produção sem tratar um mock de interface como anúncio pronto.

Para acrescentar componentes e projetos, siga [AGENTS.md](AGENTS.md) e [a documentação da biblioteca](packages/video/README.md). O inventário de [skills, ferramentas e lacunas](docs/tooling.md) indica o que já pode ser usado e o que falta para produção.

O [workflow do agente](WORKFLOW.md) liga intake, ideação, geração, composição, render e revisão. As [skills do repo](skills/) descrevem cada handoff. Crie um projeto com `npm run project:new -- campanha-01 "Nome da campanha"`.

## Edição com Remotion

O backend [Remotion](packages/remotion/README.md) está instalado com [componentes de motion](packages/remotion/COMPONENTS.md) reutilizáveis. Assets de marca (fontes, logos, footage) **não** acompanham o repositório: coloque em `packages/remotion/public/` apenas assets cuja licença permita redistribuição, registrando proveniência em `PROVENANCE.json` — veja o modelo em `packages/remotion/public/brand/vip/extraction.md`. Campanhas reais ficam fora do repositório; `projects/demo/` mostra a estrutura esperada de um projeto.
