import {bundle} from '@remotion/bundler';
import {renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {access, mkdir, readFile, rm} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const option = (name) => {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${name} requires a value`);
  args.splice(index, 2);
  return value;
};
const compositionId = option('--composition') ?? 'DavidBlackV2';
const variant = option('--variant');
if (variant && !['type', 'split', 'benefits'].includes(variant)) throw new Error('Unknown variant; use type, split or benefits');
const frameText = option('--frame');
const stillPath = option('--still');
const manifestPath = path.resolve(option('--manifest') ?? path.join(here, 'public/edit.json'));
const browserExecutable = option('--browser');
if (args.length > 1 || args.some((arg) => arg.startsWith('--'))) throw new Error('Usage: node render-v2.mjs [output.mp4] [--manifest file.json] [--frame N --still output.png] [--browser executable] [--composition ID] [--variant type|split|benefits]');
const output = path.resolve(stillPath ?? args[0] ?? path.join(here, '../../storage/exports/david-pronunciamento/david-black-v2.mp4'));
try { await access(output); throw new Error(`Output already exists: ${output}`); }
catch (error) { if (error.code !== 'ENOENT') throw error; }
const frame = frameText === undefined ? undefined : Number(frameText);
if ((frame !== undefined) !== Boolean(stillPath) || (frame !== undefined && (!Number.isInteger(frame) || frame < 0))) throw new Error('Still mode requires --frame nonnegative integer and --still output.png');
const edit = JSON.parse(await readFile(manifestPath, 'utf8'));
const chosenVariant = variant ?? ({HookType: 'type', HookBenefits: 'benefits', DavidBlackV2: 'split'})[compositionId];
if (variant || (compositionId !== 'DavidBlackV2' && chosenVariant)) edit.variant = chosenVariant;
const inputProps = {edit};
await mkdir(path.dirname(output), {recursive: true});
const serveUrl = await bundle({entryPoint: path.join(here, 'index.ts'), publicDir: path.join(here, 'public')});
try {
  const composition = await selectComposition({serveUrl, id: compositionId, inputProps, browserExecutable});
  if (frame !== undefined) {
    if (frame >= composition.durationInFrames) throw new Error('Frame exceeds selected composition duration');
    await renderStill({serveUrl, composition, inputProps, frame, output, imageFormat: 'png', browserExecutable});
  } else {
    let lastProgress = -1;
    await renderMedia({
      serveUrl, composition, inputProps, outputLocation: output,
      codec: 'h264', audioCodec: 'aac', audioBitrate: '192k',
      crf: 19, pixelFormat: 'yuv420p', concurrency: 4,
      browserExecutable,
      ffmpegOverride: ({args}) => [...args.slice(0, -1), '-threads', '4', args.at(-1)],
      onProgress: ({progress}) => {
        const percent = Math.floor(progress * 100 / 10) * 10;
        if (percent !== lastProgress) {console.log(`Render ${percent}%`); lastProgress = percent;}
      },
    });
  }
  console.log(JSON.stringify({output, composition: composition.id, durationInFrames: composition.durationInFrames, fps: composition.fps, backend: 'remotion-4.0.536', status: 'draft'}));
} finally {
  await rm(serveUrl, {recursive: true, force: true});
}
