/** Original, dependency-free timeline renderer. All time values are seconds. */
export const COMPONENTS = [
  "title",
  "caption",
  "cta",
  "stat",
  "annotation_circle",
  "progress",
  "photo_depth",
  "collage_kit",
];
export const EFFECTS = [
  "fade",
  "slide_up",
  "pop",
  "typewriter",
  "shake",
  "glow",
];
export const FORMATS = {
  "9:16": [1080, 1920],
  "4:5": [1080, 1350],
  "1:1": [1080, 1080],
  "16:9": [1920, 1080],
};
const clamp = (n, min = 0, max = 1) => Math.min(max, Math.max(min, n));
const ease = (n) => 1 - (1 - clamp(n)) ** 3;
export function validateProject(project) {
  const errors = [];
  if (!project || typeof project !== "object")
    return ["Project must be an object"];
  for (const key of ["width", "height", "fps"])
    if (!Number.isInteger(project[key]) || project[key] <= 0)
      errors.push(`${key} must be a positive integer`);
  if (!Number.isFinite(project.duration) || project.duration <= 0)
    errors.push("duration must be positive");
  if (!Array.isArray(project.layers))
    return [...errors, "layers must be an array"];
  const ids = new Set();
  project.layers.forEach((layer, i) => {
    const at = `layers[${i}]`;
    if (!layer || typeof layer !== "object") {
      errors.push(`${at} must be an object`);
      return;
    }
    if (!layer.id || ids.has(layer.id)) errors.push(`${at} needs a unique id`);
    ids.add(layer.id);
    if (!COMPONENTS.includes(layer.type))
      errors.push(`${at}: unknown component ${layer.type}`);
    if (
      !Number.isFinite(layer.start) ||
      layer.start < 0 ||
      !Number.isFinite(layer.duration) ||
      layer.duration <= 0 ||
      layer.start + layer.duration > project.duration + 1e-6
    )
      errors.push(`${at}: invalid time range`);
    if (layer.effect && !EFFECTS.includes(layer.effect))
      errors.push(`${at}: unknown effect`);
    for (const key of ["x", "y", "w", "h"])
      if (
        layer[key] !== undefined &&
        (!Number.isFinite(layer[key]) || layer[key] < 0 || layer[key] > 1)
      )
        errors.push(`${at}.${key} must be between 0 and 1`);
    if (
      layer.fontSize !== undefined &&
      (!Number.isFinite(layer.fontSize) || layer.fontSize <= 0)
    )
      errors.push(`${at}.fontSize must be positive`);
    if (
      layer.words !== undefined &&
      (!Array.isArray(layer.words) ||
        layer.words.some(
          (word) =>
            typeof word.text !== "string" ||
            !Number.isFinite(word.start) ||
            !Number.isFinite(word.end) ||
            word.start < 0 ||
            word.end <= word.start ||
            word.end > layer.duration,
        ))
    )
      errors.push(`${at}.words needs valid local timestamps`);
  });
  return errors;
}
export function activeLayers(project, time) {
  return project.layers.filter(
    (l) => time >= l.start && time < l.start + l.duration,
  );
}
export function animationState(layer, time) {
  const local = time - layer.start;
  const intro = ease(local / Math.min(0.45, layer.duration / 3));
  const outro = clamp(
    (layer.duration - local) / Math.min(0.2, layer.duration / 3),
  );
  return {
    local,
    progress: clamp(local / layer.duration),
    alpha: Math.min(intro, outro),
    intro,
  };
}
function rounded(ctx, x, y, w, h, r = 16) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2));
  ctx.fill();
}
function lines(ctx, text, maxWidth) {
  const result = [];
  let line = "";
  for (const word of String(text).split(/\s+/)) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(candidate).width > maxWidth) {
      result.push(line);
      line = word;
    } else line = candidate;
  }
  if (line) result.push(line);
  return result;
}
function textBlock(ctx, text, w, h, size, color, align = "center") {
  ctx.fillStyle = color;
  ctx.font = `800 ${size}px system-ui, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  let wrapped = lines(ctx, text, w * 0.9);
  while (
    (wrapped.length * size * 1.2 > h * 0.9 ||
      wrapped.some((line) => ctx.measureText(line).width > w * 0.9)) &&
    size > 10
  ) {
    size *= 0.9;
    ctx.font = `800 ${size}px system-ui, sans-serif`;
    wrapped = lines(ctx, text, w * 0.9);
  }
  wrapped.forEach((line, i) =>
    ctx.fillText(
      line,
      align === "left" ? -w * 0.45 : 0,
      (i - (wrapped.length - 1) / 2) * size * 1.2,
    ),
  );
}
/** Draw one frame onto a CanvasRenderingContext2D; assets maps IDs to decoded CanvasImageSource objects. */
export function renderFrame(ctx, project, time, assets = {}) {
  const { width: W, height: H } = project;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = project.background || "#101319";
  ctx.fillRect(0, 0, W, H);
  for (const layer of activeLayers(project, time)) {
    const s = animationState(layer, time);
    const w = (layer.w ?? 0.84) * W,
      h = (layer.h ?? 0.16) * H;
    const color = layer.color || "#ffffff",
      accent = layer.accent || project.accent || "#caff69";
    ctx.save();
    ctx.translate((layer.x ?? 0.5) * W, (layer.y ?? 0.5) * H);
    if (layer.effect === "fade") ctx.globalAlpha = s.alpha;
    if (layer.effect === "slide_up") {
      ctx.globalAlpha = s.alpha;
      ctx.translate(0, (1 - s.intro) * H * 0.06);
    }
    if (layer.effect === "pop") {
      ctx.globalAlpha = s.alpha;
      const scale = 0.7 + 0.3 * s.intro;
      ctx.scale(scale, scale);
    }
    if (layer.effect === "shake")
      ctx.translate(
        Math.sin(s.local * 53) * (1 - s.intro) * W * 0.015,
        Math.cos(s.local * 43) * (1 - s.intro) * H * 0.008,
      );
    if (layer.effect === "glow") {
      ctx.shadowColor = accent;
      ctx.shadowBlur = W * 0.025 * (0.6 + 0.4 * Math.sin(s.local * 4));
    }
    let text = layer.text || "";
    if (layer.effect === "typewriter")
      text = text.slice(
        0,
        Math.floor(
          text.length * clamp(s.local / Math.min(1.2, layer.duration * 0.6)),
        ),
      );
    switch (layer.type) {
      case "annotation_circle": {
        ctx.strokeStyle = accent;
        ctx.lineWidth = layer.strokeWidth || W * 0.008;
        ctx.lineCap = "round";
        ctx.beginPath();
        const reveal = clamp(s.local / 0.65),
          tick = Math.floor(s.local * 8);
        for (let i = 0; i <= 100 * reveal; i++) {
          const a = (i / 100) * Math.PI * 2 - 0.5;
          const jitter = 1 + 0.015 * Math.sin(i * 1.7 + tick);
          const x = ((Math.cos(a) * w) / 2) * jitter,
            y = ((Math.sin(a) * h) / 2) * jitter;
          i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        break;
      }
      case "progress":
        ctx.fillStyle = layer.background || "#ffffff25";
        rounded(ctx, -w / 2, -h / 2, w, h, h / 2);
        ctx.fillStyle = accent;
        if (s.progress > 0)
          rounded(ctx, -w / 2, -h / 2, w * s.progress, h, h / 2);
        break;
      case "photo_depth":
      case "collage_kit": {
        const image = assets[layer.assetId];
        ctx.beginPath();
        ctx.rect(-w / 2, -h / 2, w, h);
        ctx.clip();
        if (image) {
          const iw = image.naturalWidth || image.videoWidth || image.width,
            ih = image.naturalHeight || image.videoHeight || image.height;
          const zoom = 1 + (layer.zoom ?? 0.08) * s.progress,
            scale = Math.max(w / iw, h / ih) * zoom;
          ctx.translate(Math.sin(s.progress * Math.PI) * w * 0.015, 0);
          if (layer.type === "collage_kit")
            ctx.rotate(Math.sin(s.local * 2) * 0.025);
          ctx.drawImage(
            image,
            (-iw * scale) / 2,
            (-ih * scale) / 2,
            iw * scale,
            ih * scale,
          );
        } else {
          ctx.fillStyle = layer.background || "#273641";
          ctx.fillRect(-w / 2, -h / 2, w, h);
          textBlock(ctx, text || "Adicionar imagem", w, h, W * 0.045, color);
        }
        break;
      }
      case "caption": {
        if (layer.words?.length) {
          const current = layer.words.find(
            (word) => s.local >= word.start && s.local < word.end,
          );
          if (!current) break;
          text = current.text;
        }
        ctx.fillStyle = layer.background || "#000000b0";
        rounded(ctx, -w / 2, -h / 2, w, h, W * 0.02);
        textBlock(ctx, text, w, h, layer.fontSize || W * 0.065, color);
        break;
      }
      case "cta":
        ctx.fillStyle = layer.background || accent;
        rounded(ctx, -w / 2, -h / 2, w, h, W * 0.035);
        textBlock(
          ctx,
          text,
          w,
          h,
          layer.fontSize || W * 0.058,
          layer.color || "#111820",
        );
        break;
      case "stat":
        textBlock(
          ctx,
          text || String(Math.round((layer.value || 0) * ease(s.progress * 2))),
          w,
          h,
          layer.fontSize || W * 0.17,
          color,
        );
        break;
      default:
        textBlock(
          ctx,
          text,
          w,
          h,
          layer.fontSize || W * 0.08,
          color,
          layer.align,
        );
    }
    ctx.restore();
  }
  if (project.showSafeArea) {
    ctx.strokeStyle = "#ffffff70";
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    const safe = project.safeArea || {
      top: 0.14,
      bottom: 0.35,
      left: 0.06,
      right: 0.06,
    };
    ctx.strokeRect(
      W * safe.left,
      H * safe.top,
      W * (1 - safe.left - safe.right),
      H * (1 - safe.top - safe.bottom),
    );
  }
  ctx.restore();
}
export { synthesizeSfx, SFX } from "./sfx.js";
