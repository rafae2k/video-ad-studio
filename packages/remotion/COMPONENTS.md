# Componentes V3 atuais

`CopyLockedV3.tsx` adiciona `PaperWipe`, `TextReveal`, `PhysicalPhoto`, `RotoPerson`, `OpeningV3` e três collages de corpo. O catálogo registra defaults e origem. Os componentes V2 abaixo permanecem históricos e a campanha que os usou foi rejeitada.

```tsx
<BrandFontLoader />
<Sequence from={300} durationInFrames={90}>
  <PaperWipe duration={15}>
    <PhysicalPhoto src={staticFile('brand/vip/hero-kit-black.webp')} />
  </PaperWipe>
</Sequence>
```

`PaperWipe` e `TextReveal` aceitam children; a posição/layout fica no pai. `PhysicalPhoto` aceita src, startScale, endScale, rotation. Esses três padrões podem ser reaproveitados. `RotoPerson` ainda está acoplado ao David: máscara de luminância frame45+frameLocal, mesmo crop e mesmo tempo do vídeo. No take atual, restringir aos primeiros90frames de saída; depois há spill ligado à mão/cabeça. Não esticar uma máscara estática ou usar alpha opaco como transparência.

As cenas `NutritionCollage`, `OfferCollage` e `BenefitsCollage` contêm a mensagem da campanha. Reutilize a estrutura e substitua dados/assets; não trate como templates genéricos já aprovados. O copy é preservado no master e as variantes só alteram a apresentação da abertura. As fontes de referência e o que foi observado estão em v3-ref-frame-analysis (`projects/david-pronunciamento-black/reviews/v3-ref-frame-analysis.md`, local).

## Histórico V2

# Motion reutilizável — Remotion

O [catálogo](catalog.json) registra exports, defaults e limites dos componentes implementados em [AdComposition.tsx](AdComposition.tsx). O preview interativo e o export usam esse mesmo componente; a validação visual e técnica continua necessária. Não há equivalência automática com Canvas ou com os overlays Pillow da V1.

## Compor

Monte `BrandFontLoader` uma vez e envolva cada cena numa `Sequence`. Tempo da animação é local à sequência. `RevealLine` aceita texto, tamanho, cor e atraso em frames. `BenefitTickets` oferece `compact` para tela dividida, e `VipPass` oferece `endCard` para o fechamento. As cenas maiores ainda possuem copy/paleta da campanha David Black; ao reutilizar, trocar os campos no componente e revisar o conteúdo.

```tsx
<BrandFontLoader />
<Sequence from={443} durationInFrames={158}>
  <BenefitTickets compact={false} />
</Sequence>
```

O estado se calcula exclusivamente por frame (`useCurrentFrame`, `spring`, `interpolate`). Timestamps de fala vêm do JSON AssemblyAI já existente; nenhuma nova transcrição foi enviada. A montagem usa `cuts` no manifesto e a mídia original normalizada para H.264; as cenas desenham acima do vídeo sem interromper sua voz.

## Fonte e som

A Creme Glacee Ink Bleed Regular é o arquivo usado no site oficial Nuture, documentado em [PROVENANCE.json](public/fonts/PROVENANCE.json). Usar peso400 e não simular bold. Os SFX são arquivos procedurais originais do repositório. Paleta, logo, kit real e CTA vêm da [página VIP oficial](https://nuture.com.br/pages/captacao-black-friday-2026), com arquivos e proveniência em [brand/vip](public/brand/vip/extraction.md). Inter400/500/700 também é local. Sem música de terceiros, novos claims, desconto numérico ou produto gerado.

## Referências aplicadas

Zee (`research/ai-video-editing/video-review/videos/zeeuiux_1792132224_4009017648649136432_46983307566.md`, local): objetos e estados acompanham palavras. Edmund (`research/ai-video-editing/video-review/videos/edmund.tian_1791658525_4004393620950312149_2521262351.md`, local): alternância intencional entre speaker e inserts conceituais, mantendo voz contínua. O desenho é próprio; não incorporamos frames dessas referências no anúncio. A direção do projeto (`projects/david-pronunciamento-black/reviews/v2-art-direction.md`, local) detalha a análise e hipóteses; a entrega pode selecionar e adaptar essas propostas.

## Gate dos três segundos

Primeiro frame precisa comunicar assunto e ter hierarquia legível. Até3s deve haver transformação compreensível, com/sem som, sem esconder o rosto em split-screen. Esse é um checklist editorial, não uma medição de retenção. Compare vídeos exportados; não aprove movimento olhando apenas stills. Não marcar `finals[]` antes de revisão humana.
