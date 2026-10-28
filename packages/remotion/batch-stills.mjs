import {bundle} from '@remotion/bundler';
import {openBrowser, renderStill, selectComposition} from '@remotion/renderer';
import {access, mkdir, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const outputDir = path.resolve(process.argv[2] ?? path.join(root, 'projects/david-pronunciamento-black/reviews/v2-stills'));
const browserExecutable = process.argv[3] ?? process.env.REMOTION_BROWSER_EXECUTABLE ?? undefined;
const jobs = [
  {variant: 'type', frames: [0, 30, 65, 75, 195, 735, 930]},
  {variant: 'split', frames: [0, 30, 75, 85, 540]},
  {variant: 'benefits', frames: [0, 30, 75]},
];
await mkdir(outputDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'index.ts'), publicDir: path.join(here, 'public')});
let browser;
try {
  browser = await openBrowser('chrome', {browserExecutable});
  for (const job of jobs) {
    const edit = JSON.parse(await readFile(path.join(root, `projects/david-pronunciamento-black/edits/v2-${job.variant}.json`), 'utf8'));
    const inputProps = {edit};
    const composition = await selectComposition({serveUrl, id: 'DavidBlackV2', inputProps, puppeteerInstance: browser});
    for (const frame of job.frames) {
      const output = path.join(outputDir, `${job.variant}-${frame}.png`);
      try {await access(output); throw new Error(`Existing still: ${output}`);} catch(error) {if(error.code !== 'ENOENT') throw error;}
      await renderStill({serveUrl, composition, inputProps, frame, output, imageFormat: 'png', scale: 0.5, puppeteerInstance: browser});
      console.log(JSON.stringify({variant: job.variant, frame, output, scale: 0.5}));
    }
  }
} finally {
  if (browser) await browser.close({silent: true});
  await rm(serveUrl, {recursive: true, force: true});
}
