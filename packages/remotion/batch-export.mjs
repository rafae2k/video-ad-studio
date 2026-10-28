import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, selectComposition} from '@remotion/renderer';
import {access, mkdir, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const project = process.argv[2] ?? 'david-pronunciamento-black';
const variants = process.argv.slice(3).length ? process.argv.slice(3) : ['split', 'type', 'benefits'];
if (!/^[a-z0-9-]+$/.test(project) || variants.some(v => !/^[a-z0-9-]+$/.test(v))) throw new Error('Invalid project or variant identifier');
const browserExecutable = process.env.REMOTION_BROWSER_EXECUTABLE ?? undefined;
const outputDir = path.join(root, 'storage/exports', project);
await mkdir(outputDir, {recursive: true});
const jobs = await Promise.all(variants.map(async variant => {
  const output = path.join(outputDir, `v2-${variant}.mp4`);
  try {await access(output); throw new Error(`Existing output: ${output}`);} catch(error) {if(error.code !== 'ENOENT') throw error;}
  const manifest = path.join(root, 'projects', project, 'edits', `v2-${variant}.json`);
  return {variant, output, edit: JSON.parse(await readFile(manifest, 'utf8'))};
}));
const serveUrl = await bundle({entryPoint: path.join(here, 'index.ts'), publicDir: path.join(here, 'public')});
let browser;
try {
  browser = await openBrowser('chrome', {browserExecutable});
  for (const job of jobs) {
    const inputProps = {edit: job.edit};
    const composition = await selectComposition({serveUrl, id: 'DavidBlackV2', inputProps, puppeteerInstance: browser});
    let lastProgress = -1;
    console.log(`Starting ${job.variant}`);
    await renderMedia({serveUrl, composition, inputProps, outputLocation: job.output, puppeteerInstance: browser,
      codec: 'h264', audioCodec: 'aac', audioBitrate: '192k', crf: 19, pixelFormat: 'yuv420p', concurrency: 4,
      ffmpegOverride: ({args}) => [...args.slice(0, -1), '-threads', '4', args.at(-1)],
      onProgress: ({progress}) => {const percent=Math.floor(progress*20)*5; if(percent!==lastProgress){console.log(`${job.variant}: ${percent}%`);lastProgress=percent;}},
    });
    console.log(JSON.stringify({variant: job.variant, output: job.output, durationInFrames: composition.durationInFrames, fps: composition.fps, backend: 'remotion-4.0.536', status: 'draft'}));
  }
} finally {
  if (browser) await browser.close({silent: true});
  await rm(serveUrl, {recursive: true, force: true});
}
