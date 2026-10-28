/** Original procedural sound design. PCM 16-bit mono WAV; deterministic seed. */
export const SFX = ["whoosh", "pop", "click", "impact", "riser", "chime"];
export function synthesizeSfx(
  id,
  {
    duration = id === "riser" ? 1.2 : 0.35,
    sampleRate = 44100,
    gain = 0.35,
    seed = 42,
  } = {},
) {
  if (!SFX.includes(id)) throw new Error(`Unknown SFX: ${id}`);
  if (!Number.isFinite(duration) || duration <= 0 || duration > 30)
    throw new Error("duration must be in (0, 30]");
  if (!Number.isInteger(sampleRate) || sampleRate < 8000 || sampleRate > 96000)
    throw new Error("sampleRate must be 8000–96000");
  if (!Number.isFinite(gain) || gain < 0 || gain > 1)
    throw new Error("gain must be between 0 and 1");
  const n = Math.ceil(duration * sampleRate),
    bytes = new Uint8Array(44 + n * 2),
    v = new DataView(bytes.buffer);
  const str = (offset, s) =>
    [...s].forEach((c, i) => v.setUint8(offset + i, c.charCodeAt(0)));
  str(0, "RIFF");
  v.setUint32(4, 36 + n * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 2, true);
  let state = seed >>> 0,
    filtered = 0;
  for (let i = 0; i < n; i++) {
    const t = i / sampleRate,
      p = i / Math.max(1, n - 1);
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    const noise = state / 2147483648 - 1;
    filtered = 0.82 * filtered + 0.18 * noise;
    let value;
    switch (id) {
      case "whoosh":
        value = filtered * 3 * Math.sin(Math.PI * p) ** 2;
        break;
      case "pop":
        value =
          Math.sin(2 * Math.PI * (500 * t - 450 * t * t)) * Math.exp(-p * 12);
        break;
      case "click":
        value =
          (noise * 0.6 + Math.sin(2 * Math.PI * 1800 * t) * 0.4) *
          Math.exp(-p * 45);
        break;
      case "impact":
        value =
          (Math.sin(2 * Math.PI * 65 * t) * 0.7 + filtered * 0.9) *
          Math.exp(-p * 7);
        break;
      case "riser":
        value =
          (Math.sin(2 * Math.PI * (180 * t + 700 * t * t)) * 0.35 + filtered) *
          Math.sin((Math.PI * p) / 2);
        break;
      case "chime":
        value =
          ((Math.sin(2 * Math.PI * 880 * t) +
            0.5 * Math.sin(2 * Math.PI * 1320 * t)) /
            1.5) *
          Math.exp(-p * 4);
        break;
    }
    const fade = Math.min(
      1,
      i / (sampleRate * 0.003),
      (n - 1 - i) / (sampleRate * 0.01),
    );
    v.setInt16(
      44 + i * 2,
      Math.round(Math.max(-1, Math.min(1, value * gain * fade)) * 32767),
      true,
    );
  }
  return bytes;
}
