# motion-matte-v1 — talking head com lettering atrás da pessoa

Backend Python que transforma um vídeo de fala (selfie, câmera frontal, vertical) em anúncio com jump cuts, pessoa recortada e descida no quadro, lettering gigante **atrás da cabeça**, fundos trocados (escuro, bruto desfocado, imagens e vídeos gerados por IA, assets da marca), legenda palavra a palavra, SFX e CTA. É o motor do [exemplo do README](../../README.md#exemplo).

Não é Remotion nem Canvas. Tudo é Pillow/OpenCV/NumPy por quadro, máscara RVM e FFmpeg. Não declare paridade com os outros backends.

## Reprodutibilidade verificada

Em 2026-10-28, `npm run motion -- packages/motion/examples/v5-surf.motion.json all` partiu do bruto `IMG_1615.mov` e da transcrição AssemblyAI e gerou um MP4 **byte a byte idêntico** à v5 original (`sha256 a89ced5b…aa54346`, PSNR infinito em todos os 1703 quadros). O EDL intermediário e o EDL apertado também bateram campo a campo com os arquivos da v5. Tempo total: ~5,5 min num Mac Apple Silicon (máscaras em `mps`).

Essa prova vale para a mesma fonte, transcrição, assets, fontes e versões de [requirements.txt](requirements.txt). O bruto, a transcrição e os assets ficam em `storage/` e `projects/`, fora do Git; quem clona o repositório reproduz o **processo** com o próprio material.

## Etapas

| Etapa | Comando | Lê | Escreve em `work/` |
| --- | --- | --- | --- |
| 1. EDL | `edl` | transcrição `words[]` + `edl.takes` | `edl.json`: beats e grupos de legenda |
| 2. Aperto | `tighten` | áudio do bruto | `edl-tight.json`: respiro e silêncio cortados |
| 3. Máscaras | `masks` | quadros dos beats | `masks_rvm.npy` (total × 960 × 540) |
| 4. Plano | `plan` | `plates`, `letters`, `props`, `cta`, `sfxExtra` | `motion_plan.json`: tempos do bruto → frames |
| 5. Render | `render` | tudo acima | `m_video.mp4`, `m_audio.wav`, `m_final.mp4` → `output` |

```sh
npm run motion -- projects/<id>/edits/<variante>.motion.json all
npm run motion -- projects/<id>/edits/<variante>.motion.json render --preview 0-150   # 5 s em storage/work
npm run motion:test
```

Rode as etapas separadas ao iterar: mudar lettering ou plates pede só `plan` + `render`. Mudar `takes`, `zooms`, `wordFixes` ou `speeds` pede tudo desde `edl`, inclusive `masks`, porque os quadros de saída mudam. `render` recusa sobrescrever `output`; crie outra variante ou use `--force` conscientemente.

Requisitos: `uv`, FFmpeg/FFprobe no PATH e as fontes do manifest. A primeira execução de `masks` baixa os pesos do RVM pelo `torch.hub`.

## O que cada etapa faz

**EDL.** Cada take `[início, fim, hold]` (segundos do bruto) vira beats. Pausa > 0,2 s entre palavras corta; trecho > 2,6 s ganha um corte extra no meio, na maior folga entre palavras, sem remover tempo. O zoom troca a cada take ou a cada ≥ 1,5 s, seguindo `zooms`; o primeiro beat usa 1,15. Cada troca de zoom marca `punch` (soco de escala) e `whoosh`. `hold: true` mantém o take inteiro, com zoom 1,0, e o protege do aperto. As legendas saem da transcrição em grupos de até 3 palavras, com `wordFixes` (ASR → grafia correta) e `wordOverrides` para trechos que o ASR errou.

**Aperto.** Pelo envelope RMS (janelas de 20 ms, limiar = p95 − 24 dB), corta respiro > 0,10 s no início e silêncio > 0,25 s no fim de cada beat. `speeds` acelera beats específicos (`{"índice": 1.15}`), com `atempo` no áudio.

**Máscaras.** RVM resnet50 a 540×960, estado recorrente reiniciado por beat, blur de 1 px. É o "chroma key" sem tela verde.

**Render, por quadro, de trás para frente:**

1. Plate de fundo ativo: `dark` (tinta + brilho na cor de destaque), `orig` (o próprio bruto desfocado), `image` ou `video`, com zoom lento, `dim` e degradê escuro no topo.
2. Lettering na fonte display, centrado em `y` (padrão 0,26 da altura), com entrada `rise`, `slam` ou `slide`, linha a linha (3 frames de atraso), e `hl` = índice da linha com marca-texto.
3. Props `layer: back`.
4. Pessoa: escala por beat, descida até `destY` (o rosto em `faceY` do bruto vai para `destY` da saída), sombra suave, máscara por cima. Plates `full: true` cobrem a pessoa (cutaway).
5. Props `layer: front`, blur de transição na entrada/saída de plates > 24 frames, contraste 1,07, vinheta e grão (seed fixa).
6. Legenda em 0,80 da altura (palavra mais longa maior, na fonte display) e botão de CTA a partir de `cta.t`.

**Áudio.** Voz original com filtro de sopro e expansor de respiração, cortada por beat com fade de 6 ms, mais SFX procedurais de [assets/sfx](../../assets/sfx/): whoosh em troca de zoom e de plate, pop em cada lettering, chime no CTA e `sfxExtra`. Loudnorm −15 LUFS / −1,5 dBTP, AAC 48 kHz. `outputSmall` gera uma cópia 720×1280 em dois passes, abaixo de `maxMB`.

## Manifest (`*.motion.json`)

Caminhos relativos resolvem a partir da raiz do repositório. Tempos de `plates`, `letters`, `props`, `cta` e `sfxExtra` são **segundos do bruto**, lidos direto da transcrição, e não da saída. Um tempo dentro de um trecho cortado cai no início do beat seguinte. Exemplo completo: [examples/v5-surf.motion.json](examples/v5-surf.motion.json).

| Campo | Conteúdo |
| --- | --- |
| `backend`, `status` | `"motion-matte-v1"`, `"draft"` |
| `source`, `transcript` | bruto e JSON AssemblyAI (`words[]` com `start`/`end` em ms) |
| `work`, `output`, `outputSmall?` | intermediários; MP4 final; cópia comprimida `{path, maxMB}` |
| `edl` | `takes`, `zooms`, `wordFixes?`, `wordOverrides?` (`{from, to, words:[[s,e,texto]]}`), `speeds?` |
| `layout` | `faceY` (altura do rosto no bruto, 0–1), `destY` (para onde ele desce), `defaultPlate` |
| `brand` | `accent`, `cream`, `ink` (RGB) e `fonts.display` / `fonts.sans` |
| `captions.properNouns` | grafia de nomes na legenda (`{"nuture": "Nuture"}`) |
| `plates[]` | `t0`, `t1`, `kind`, `file?`, `dim?`, `zoom?`, `pan?`, `ss?` (início do clipe), `full?` |
| `letters[]` | `lines` (1–3), `t0`, `t1`, `anim`, `hl?`, `color?` (`cream`/`lime` = cor de destaque), `cap?` (px), `y?` |
| `props[]` | PNG com alfa: `file`, `t0`, `t1`, `x`, `y`, `w` (fração da largura), `layer`, `rot0?`, `rot?` |
| `cta`, `sfxExtra[]` | `{text, t}`; `{name, t, vol}` com nomes de `assets/sfx` |

As fontes do exemplo são Creme Glacee Ink Bleed (fonte da marca, **não distribuída aqui**) e SF Pro do macOS. Em outro sistema, aponte `brand.fonts` ou as variáveis `MOTION_DISPLAY_FONT` / `MOTION_SANS_FONT` para fontes licenciadas. A display deve ter caixa-alta forte, porque o lettering é sempre em maiúsculas.

Proveniência dos assets do exemplo, com hash, prompt e modelo de cada imagem e vídeo gerado por IA: [examples/v5-surf.assets.json](examples/v5-surf.assets.json).

## Limites conhecidos (medidos na v5)

A revisão da v5 achou estes defeitos. A receita os reproduz junto com o resultado; corrija no manifest, sem trocar a linguagem visual (ver [a skill](../../skills/video-ad-motion/SKILL.md)):

- Grupos de legenda com mais de ~1000 px aparecem duplicados ou embaralhados. Encurte palavras do grupo ou quebre com `wordOverrides`.
- Lettering de borda a borda: barra de destaque e "POR DIA" encostam ou saem da margem. Use `cap` por entrada.
- Borda da máscara com halo e fundo vazando entre braço e tronco ou em volta da lata na mão.
- Flashes de 1–2 quadros do fundo `orig` quando um plate termina antes do beat. Alinhe `t1` ao fim do beat.
- Clipes de IA a 24 fps trepidam a 30 fps. Pré-converta se incomodar.
- Lettering, legenda e CTA não desviam de mãos e produto: confira os quadros onde há gesto.

## Licenças

O código deste pacote segue a licença do repositório. RVM (PeterL1n/RobustVideoMatting) é GPL-3.0 e é baixado em tempo de execução, não vendorizado. Confirme se o seu uso comercial é compatível. Fontes, footage, assets de marca e mídia gerada continuam com a licença e os termos de cada origem.
