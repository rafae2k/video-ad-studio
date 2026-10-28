import { mkdir, writeFile } from "node:fs/promises";
import { SFX, synthesizeSfx } from "./sfx.js";
const dir = new URL("../../assets/sfx/", import.meta.url);
await mkdir(dir, { recursive: true });
for (const id of SFX)
  await writeFile(new URL(`${id}.wav`, dir), synthesizeSfx(id));
console.log(`Generated ${SFX.length} original WAV files in assets/sfx/`);
