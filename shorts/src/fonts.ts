// Fonts are bundled from npm (@fontsource), never fetched at render time, so a
// render looks the same in every session. All are open-licensed (SIL OFL).
import { loadFont } from '@remotion/fonts';

import anton400 from '@fontsource/anton/files/anton-latin-400-normal.woff2';
import archivoBlack400 from '@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff2';
import archivo500 from '@fontsource/archivo/files/archivo-latin-500-normal.woff2';
import archivo700 from '@fontsource/archivo/files/archivo-latin-700-normal.woff2';
import archivo800 from '@fontsource/archivo/files/archivo-latin-800-normal.woff2';
import bricolage500 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-500-normal.woff2';
import bricolage800 from '@fontsource/bricolage-grotesque/files/bricolage-grotesque-latin-800-normal.woff2';
import dmSans500 from '@fontsource/dm-sans/files/dm-sans-latin-500-normal.woff2';
import dmSans700 from '@fontsource/dm-sans/files/dm-sans-latin-700-normal.woff2';
import dmSans800 from '@fontsource/dm-sans/files/dm-sans-latin-800-normal.woff2';
import dmSerif400 from '@fontsource/dm-serif-display/files/dm-serif-display-latin-400-normal.woff2';
import fraunces900 from '@fontsource/fraunces/files/fraunces-latin-900-normal.woff2';
import inter500 from '@fontsource/inter/files/inter-latin-500-normal.woff2';
import inter700 from '@fontsource/inter/files/inter-latin-700-normal.woff2';
import inter800 from '@fontsource/inter/files/inter-latin-800-normal.woff2';
import mono500 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2';
import mono700 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-700-normal.woff2';
import mono800 from '@fontsource/jetbrains-mono/files/jetbrains-mono-latin-800-normal.woff2';
import grotesk500 from '@fontsource/space-grotesk/files/space-grotesk-latin-500-normal.woff2';
import grotesk700 from '@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2';
import syne800 from '@fontsource/syne/files/syne-latin-800-normal.woff2';

const FACES: [string, string, string][] = [
  ['Anton', '400', anton400],
  ['Archivo Black', '400', archivoBlack400],
  ['Archivo', '500', archivo500],
  ['Archivo', '700', archivo700],
  ['Archivo', '800', archivo800],
  ['Bricolage Grotesque', '500', bricolage500],
  ['Bricolage Grotesque', '800', bricolage800],
  ['DM Sans', '500', dmSans500],
  ['DM Sans', '700', dmSans700],
  ['DM Sans', '800', dmSans800],
  ['DM Serif Display', '400', dmSerif400],
  ['Fraunces', '900', fraunces900],
  ['Inter', '500', inter500],
  ['Inter', '700', inter700],
  ['Inter', '800', inter800],
  ['JetBrains Mono', '500', mono500],
  ['JetBrains Mono', '700', mono700],
  ['JetBrains Mono', '800', mono800],
  ['Space Grotesk', '500', grotesk500],
  ['Space Grotesk', '700', grotesk700],
  ['Syne', '800', syne800],
];

let loading: Promise<void> | null = null;

/** Loads every face once per browser tab. Rendering waits for it. */
export const loadFonts = (): Promise<void> => {
  if (!loading) {
    loading = Promise.all(FACES.map(([family, weight, url]) => loadFont({ family, weight, url, format: 'woff2' }))).then(() => undefined);
  }
  return loading;
};
