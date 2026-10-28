import {bundle} from '@remotion/bundler';
import {openBrowser, renderMedia, renderStill, selectComposition} from '@remotion/renderer';
import {mkdir, readFile, rm, access, writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,'../..');
const mode=process.argv[2]??'stills';
if(!['stills','proofs','full'].includes(mode))throw new Error('Usage: node render-v3.mjs stills|proofs|full [output-directory]');
const outputDir=path.resolve(process.argv[3]??path.join(root,mode==='full'?'storage/exports/david-pronunciamento-black/v3':'projects/david-pronunciamento-black/reviews/v3-'+mode));
const browserExecutable=process.env.REMOTION_BROWSER_EXECUTABLE??undefined;
const variants=['depth','split','paper'];
const selection=process.argv[4]?.split(':');
if(selection&&(!variants.includes(selection[0])||!selection[1]))throw new Error('Still selection must be variant:frame,frame');
const run=(cmd,args)=>new Promise((resolve,reject)=>{const p=spawn(cmd,args,{stdio:'inherit'});p.once('error',reject);p.once('exit',code=>code===0?resolve():reject(new Error(`${cmd} exited ${code}`)));});
const absent=async file=>{try{await access(file);throw new Error(`Refusing existing output: ${file}`);}catch(e){if(e.code!=='ENOENT')throw e;}};
await mkdir(outputDir,{recursive:true});
const serveUrl=await bundle({entryPoint:path.join(here,'index.ts'),publicDir:path.join(here,'public')});
let browser;
const sourceSha256=createHash('sha256').update(await readFile(path.join(here,'CopyLockedV3.tsx'))).digest('hex');
try{
 browser=await openBrowser('chrome',{browserExecutable});
 const configs={};
 for(const variant of variants)configs[variant]=await selectComposition({serveUrl,id:`DavidV3${variant[0].toUpperCase()+variant.slice(1)}`,inputProps:{variant},puppeteerInstance:browser});
 const render=async(variant,frameRange,file,scale=1)=>{
  await absent(file);let last=-1;
  await renderMedia({serveUrl,composition:configs[variant],inputProps:{variant},puppeteerInstance:browser,frameRange,outputLocation:file,scale,concurrency:4,codec:'h264',audioCodec:'aac',audioBitrate:'192k',pixelFormat:'yuv420p',crf:17,
   ffmpegOverride:({args})=>[...args.slice(0,-1),'-threads','4',args.at(-1)],
   onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==last){console.log(`${path.basename(file)}: ${n}%`);last=n;}}});
  console.log(`Ready: ${file}`);
 };
 if(mode==='stills'){
  for(const variant of variants){
   if(selection&&selection[0]!==variant)continue;
   const frames=selection?selection[1].split(',').map(Number):[...(variant==='depth'?[0]:[]),30,65,110,...(variant==='depth'?[450,630,930,960,1150,1670,1770]:[])];
   for(const frame of frames){const output=path.join(outputDir,`${variant}-${frame}.png`);await absent(output);await renderStill({serveUrl,composition:configs[variant],inputProps:{variant},puppeteerInstance:browser,frame,output,imageFormat:'png',scale:.5});console.log(output);}
  }
 }else if(mode==='proofs'){
  for(const variant of variants)await render(variant,[0,179],path.join(outputDir,`${variant}-opening.mp4`),2/3);
 }else{
  const chunks=path.join(outputDir,'chunks');await mkdir(chunks,{recursive:true});
  const tail=path.join(chunks,'shared-tail.mp4');await render('depth',[180,1832],tail);
  for(const variant of variants){
   const intro=path.join(chunks,`${variant}-intro.mp4`);await render(variant,[0,179],intro);
   const output=path.join(outputDir,`v3-${variant}.mp4`);await absent(output);
   // Trim AAC padding and reset both segments; preserve precisely 180+1653 frames.
   await run('ffmpeg',['-hide_banner','-loglevel','warning','-nostdin','-n','-threads','4','-i',intro,'-threads','4','-i',tail,'-filter_complex_threads','4','-filter_complex','[0:v]trim=end_frame=180,setpts=PTS-STARTPTS[v0];[0:a]apad,atrim=duration=6,asetpts=PTS-STARTPTS[a0];[1:v]trim=end_frame=1653,setpts=PTS-STARTPTS[v1];[1:a]apad,atrim=duration=55.1,asetpts=PTS-STARTPTS[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]','-map','[v]','-map','[a]','-t','61.1','-c:v','libx264','-threads','4','-preset','fast','-crf','17','-pix_fmt','yuv420p','-c:a','aac','-b:a','192k','-movflags','+faststart',output]);
   console.log(`Ready: ${output}`);
  }
 }
 await writeFile(path.join(outputDir,'render-metadata.json'),JSON.stringify({mode,sourceSha256,composition:'CopyLockedV3',variants,durationInFrames:1833,fps:30,source:'mastercopy-v3.mp4',status:'draft',sharedTail:mode==='full'?[180,1832]:null},null,2)+'\n');
}finally{if(browser)await browser.close({silent:true});await rm(serveUrl,{recursive:true,force:true});}
