#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readFile, readdir, mkdtemp, writeFile, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { validateProject, SFX, synthesizeSfx } from "./index.js";
function run(command, args) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw new Error(`${command}: ${result.error?.message || result.stderr}`);
  return result.stdout;
}
/** Encode frame-000000.png onward captured using renderFrame; refuses incomplete sequences. */
export async function encodeFrames(project, framesDir, output) {
  const errors = validateProject(project);
  if (project.width % 2 || project.height % 2)
    errors.push("H.264 yuv420p requires even dimensions");
  const audio = project.audio || [];
  if (!Array.isArray(audio)) errors.push("audio must be an array");
  else
    for (const cue of audio)
      if (
        !cue ||
        !SFX.includes(cue.sfx) ||
        !Number.isFinite(cue.start) ||
        cue.start < 0 ||
        cue.start >= project.duration ||
        !Number.isFinite(cue.gain ?? 1) ||
        (cue.gain ?? 1) < 0 ||
        (cue.gain ?? 1) > 1
      )
        errors.push("Invalid audio cue");
  if (errors.length) throw new Error(errors.join("\n"));
  const count = Math.ceil(project.duration * project.fps),
    files = new Set(await readdir(framesDir));
  for (let i = 0; i < count; i++)
    if (!files.has(`frame-${String(i).padStart(6, "0")}.png`))
      throw new Error(`Missing frame ${i} of ${count}`);
  const temporary = await mkdtemp(join(tmpdir(), "video-sfx-"));
  try {
    const args = [
      "-hide_banner",
      "-loglevel",
      "error",
      "-n",
      "-framerate",
      String(project.fps),
      "-start_number",
      "0",
      "-i",
      join(resolve(framesDir), "frame-%06d.png"),
    ];
    args.push(
      "-f",
      "lavfi",
      "-i",
      `anullsrc=r=48000:cl=stereo:d=${project.duration}`,
    );
    for (let i = 0; i < audio.length; i++) {
      const path = join(temporary, `${i}.wav`);
      await writeFile(path, synthesizeSfx(audio[i].sfx));
      args.push("-i", path);
    }
    const filters = audio.map(
      (cue, i) =>
        `[${i + 2}:a]volume=${cue.gain ?? 1},adelay=${Math.round(cue.start * 1000)}:all=1[s${i}]`,
    );
    filters.push(
      `[1:a]${audio.map((_, i) => `[s${i}]`).join("")}amix=inputs=${audio.length + 1}:normalize=0,alimiter=limit=0.95:level=false:latency=true[a]`,
    );
    args.push(
      "-filter_complex",
      filters.join(";"),
      "-map",
      "0:v",
      "-map",
      "[a]",
      "-vf",
      `scale=${project.width}:${project.height}:flags=lanczos,setsar=1`,
      "-frames:v",
      String(count),
      "-t",
      String(project.duration),
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-movflags",
      "+faststart",
      resolve(output),
    );
    run("ffmpeg", args);
    const probe = JSON.parse(
      run("ffprobe", [
        "-v",
        "error",
        "-show_streams",
        "-show_format",
        "-of",
        "json",
        resolve(output),
      ]),
    );
    const video = probe.streams.find((s) => s.codec_type === "video");
    if (
      video.width !== project.width ||
      video.height !== project.height ||
      video.codec_name !== "h264"
    )
      throw new Error("Encoded video failed technical verification");
    return {
      output: resolve(output),
      frames: count,
      duration: Number(probe.format.duration),
      width: video.width,
      height: video.height,
      codec: video.codec_name,
      audio: probe.streams.find((s) => s.codec_type === "audio")?.codec_name,
    };
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const [projectPath, framesDir, output] = process.argv.slice(2);
  if (!projectPath || !framesDir || !output) {
    console.error(
      "Usage: node packages/video/encode-frames.js project.json frames-directory output.mp4",
    );
    process.exitCode = 1;
  } else
    try {
      console.log(
        JSON.stringify(
          await encodeFrames(
            JSON.parse(await readFile(projectPath, "utf8")),
            framesDir,
            output,
          ),
          null,
          2,
        ),
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 1;
    }
}
