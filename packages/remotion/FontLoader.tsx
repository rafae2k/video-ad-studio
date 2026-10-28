import React, {useEffect, useState} from 'react';
import {cancelRender, continueRender, delayRender, staticFile} from 'remotion';

export const BRAND_BODY_FONT = 'Inter';
export const BRAND_DISPLAY_FONT = 'Creme Glacee';
export const BRAND_DISPLAY_STYLE: React.CSSProperties = {
  fontFamily: BRAND_DISPLAY_FONT,
  fontWeight: 400,
  fontStyle: 'normal',
  fontSynthesis: 'none',
};

let fontPromise: Promise<void> | undefined;

/** Loads the exact Creme Glacee and Inter WOFF2 files linked by nuture.com.br. */
export const loadBrandFonts = (): Promise<void> => {
  if (typeof document === 'undefined') return Promise.resolve();
  if (!fontPromise) {
    fontPromise = (async () => {
      const faces = [
        {family: BRAND_DISPLAY_FONT, file: 'CremeGlaceeInkBleed-Regular.woff2', weight: '400'},
        ...['400', '500', '700'].map((weight) => ({family: BRAND_BODY_FONT, file: `Inter-${weight}.woff2`, weight})),
      ];
      await Promise.all(faces.map(async ({family, file, weight}) => {
        const font = new FontFace(family, `url("${staticFile(`fonts/${file}`)}") format("woff2")`, {weight, style: 'normal'});
        const loaded = await font.load();
        (document.fonts as FontFaceSet & {add(face: FontFace): FontFaceSet}).add(loaded);
        await document.fonts.load(`${weight} 32px "${family}"`, 'Nuture ÁÇã');
      }));
    })();
  }
  return fontPromise;
};

/** Mount once inside the composition; Remotion waits for the real font. */
export const BrandFontLoader: React.FC = () => {
  const [handle] = useState(() => delayRender('Loading official Nuture Creme Glacee and Inter'));
  useEffect(() => {
    loadBrandFonts().then(() => continueRender(handle)).catch((error: unknown) => {
      cancelRender(error instanceof Error ? error : new Error(String(error)));
    });
  }, [handle]);
  return null;
};
