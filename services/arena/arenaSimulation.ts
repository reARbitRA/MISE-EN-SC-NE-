import type {
  ArenaImageEditParams,
  ArenaImageGenerationParams,
  ArenaImageResult,
} from '../../types.ts';
import { arenaDimensionsForAspectRatio } from './arenaConfig.ts';

/**
 * Local Arena simulation engine.
 *
 * Runs entirely in the browser when no ARENA_API_KEY is configured so the
 * complete Frame Generator flow (generate → refine → variations → upscale →
 * edit → save to dashboard) stays functional offline. Results are clearly
 * labelled as simulations and rendered deterministically from the prompt hash.
 */

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** FNV-1a string hash — seeds the deterministic renderer. */
export function hashString(input: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('The image could not be loaded for processing.'));
    img.src = src;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) {
        break;
      }
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) {
    lines.push(current);
  }
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    lines[maxLines - 1] = `${lines[maxLines - 1].replace(/[\s,.;:]+$/, '')}…`;
  }
  return lines;
}

function drawSkyline(
  ctx: CanvasRenderingContext2D,
  width: number,
  horizonY: number,
  rng: () => number,
  front: boolean
): void {
  const maxH = front ? horizonY * 0.34 : horizonY * 0.2;
  const fill = front ? 'hsl(231, 42%, 5%)' : 'hsl(231, 36%, 10%)';
  let x = -30;
  while (x < width + 30) {
    const bw = (front ? 34 : 60) + rng() * (front ? 80 : 150);
    const bh = (0.35 + rng() * 0.65) * maxH;
    ctx.fillStyle = fill;
    ctx.fillRect(x, horizonY - bh, bw, bh);
    if (rng() < 0.22) {
      ctx.fillRect(x + bw / 2 - 1.5, horizonY - bh - bh * 0.18, 3, bh * 0.18);
    }
    if (front) {
      const cols = Math.max(1, Math.floor(bw / 14));
      const rows = Math.max(1, Math.floor(bh / 20));
      for (let cx = 0; cx < cols; cx += 1) {
        for (let cy = 0; cy < rows; cy += 1) {
          if (rng() < 0.18) {
            ctx.fillStyle = `hsla(${(rng() * 80 + 160) % 360}, 100%, 68%, ${0.25 + rng() * 0.55})`;
            ctx.fillRect(x + 5 + cx * 14, horizonY - bh + 8 + cy * 20, 5, 8);
          }
        }
      }
    }
    x += bw + 8 + rng() * 22;
  }
}

function drawSimulationScene(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rng: () => number,
  prompt: string,
  negativePrompt?: string
): void {
  const hue = Math.floor(rng() * 360);
  const horizonY = height * 0.78;

  // 1. Sky
  const sky = ctx.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, `hsl(${(hue + 250) % 360}, 55%, 5%)`);
  sky.addColorStop(0.45, `hsl(${(hue + 280) % 360}, 60%, 11%)`);
  sky.addColorStop(0.68, `hsl(${hue}, 80%, 26%)`);
  sky.addColorStop(0.775, `hsl(${(hue + 40) % 360}, 90%, 48%)`);
  sky.addColorStop(0.785, 'hsl(240, 35%, 4%)');
  sky.addColorStop(1, 'hsl(240, 40%, 3%)');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, height);

  // 2. Stars
  for (let i = 0; i < 140; i += 1) {
    const sy = rng() * horizonY * 0.6;
    ctx.fillStyle = `rgba(226, 232, 240, ${0.15 + rng() * 0.6})`;
    const starSize = rng() < 0.9 ? 1.5 : 2.5;
    ctx.fillRect(rng() * width, sy, starSize, starSize);
  }

  // 3. Retro sun with stripe cuts
  const sunR = Math.min(width, height) * 0.16;
  const sunX = width * (0.3 + rng() * 0.4);
  const sunY = horizonY - sunR * 0.35;
  const sunGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.1, sunX, sunY, sunR);
  sunGrad.addColorStop(0, `hsl(${(hue + 45) % 360}, 100%, 78%)`);
  sunGrad.addColorStop(0.6, `hsl(${(hue + 20) % 360}, 100%, 58%)`);
  sunGrad.addColorStop(1, `hsl(${hue}, 95%, 42%)`);
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'hsl(240, 35%, 4%)';
  for (let i = 0; i < 7; i += 1) {
    const stripeY = sunY - sunR * 0.1 + i * (sunR * 0.16);
    ctx.fillRect(sunX - sunR, stripeY, sunR * 2, sunR * 0.05 + i * (sunR * 0.012));
  }

  // 4. Skylines (back, then front)
  drawSkyline(ctx, width, horizonY, rng, false);
  drawSkyline(ctx, width, horizonY, rng, true);

  // 5. Neon perspective grid floor
  const vanishX = width / 2;
  ctx.lineWidth = Math.max(1.5, width / 700);
  for (let k = -12; k <= 12; k += 1) {
    ctx.strokeStyle = `hsla(${(hue + 160) % 360}, 100%, 60%, ${k % 3 === 0 ? 0.5 : 0.28})`;
    ctx.beginPath();
    ctx.moveTo(vanishX + k * (width / 9), height);
    ctx.lineTo(vanishX + k * 6, horizonY + 2);
    ctx.stroke();
  }
  const floorLines = 13;
  for (let t = 1; t <= floorLines; t += 1) {
    const y = horizonY + (height - horizonY) * Math.pow(t / floorLines, 2.1);
    ctx.strokeStyle = `hsla(${(hue + 160) % 360}, 100%, 62%, ${0.18 + (t / floorLines) * 0.4})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 6. Scanlines + vignette
  ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
  for (let y = 0; y < height; y += 4) {
    ctx.fillRect(0, y, width, 1);
  }
  const vignette = ctx.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.35, width / 2, height / 2, Math.max(width, height) * 0.75);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, width, height);

  // 7. Caption plate
  const pad = Math.round(width * 0.035);
  const plateW = width - pad * 2;
  const titleFont = Math.max(13, Math.round(width / 58));
  const bodyFont = Math.max(15, Math.round(width / 44));
  ctx.font = `bold ${titleFont}px monospace`;
  const title = 'ARENA ENGINE // LOCAL SIMULATION';
  const titleH = Math.round(titleFont * 1.6);
  ctx.font = `${bodyFont}px monospace`;
  const promptLines = wrapText(ctx, prompt, plateW - pad, 3);
  const plateH = pad + titleH + 8 + promptLines.length * Math.round(bodyFont * 1.5) + pad * 0.6;
  const plateY = height - plateH - pad;

  ctx.fillStyle = 'rgba(6, 10, 20, 0.78)';
  ctx.strokeStyle = 'rgba(103, 232, 249, 0.65)';
  ctx.lineWidth = Math.max(1, width / 900);
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(pad, plateY, plateW, plateH, 10);
  } else {
    ctx.rect(pad, plateY, plateW, plateH);
  }
  ctx.fill();
  ctx.stroke();

  ctx.font = `bold ${titleFont}px monospace`;
  ctx.fillStyle = 'rgba(103, 232, 249, 0.95)';
  ctx.fillText(title, pad + pad * 0.7, plateY + pad * 0.75 + titleFont);

  ctx.font = `${bodyFont}px monospace`;
  ctx.fillStyle = 'rgba(226, 232, 240, 0.92)';
  promptLines.forEach((line, index) => {
    ctx.fillText(line, pad + pad * 0.7, plateY + pad * 0.75 + titleH + 10 + index * bodyFont * 1.5);
  });

  if (negativePrompt) {
    ctx.font = `italic ${Math.max(11, titleFont - 2)}px monospace`;
    ctx.fillStyle = 'rgba(248, 113, 113, 0.8)';
    ctx.fillText(`negative: ${negativePrompt}`, pad + pad * 0.7, plateY + plateH - pad * 0.28);
  }
}

/** Simulated text-to-image generation (deterministic per prompt + seed). */
export async function simulateGenerateImage(params: ArenaImageGenerationParams): Promise<ArenaImageResult> {
  const { width, height } = arenaDimensionsForAspectRatio(params.aspectRatio ?? '1:1');
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D rendering is unavailable in this browser.');
  }
  const rng = mulberry32(hashString(`${params.prompt}|${params.negativePrompt ?? ''}|${params.seed ?? 0}`));
  drawSimulationScene(ctx, width, height, rng, params.prompt, params.negativePrompt);
  // Brief artificial latency so the loading state remains observable.
  await sleep(700 + Math.floor(rng() * 900));
  return { image: canvas.toDataURL('image/png'), mode: 'simulation', model: params.model };
}

/** Simulated 2x upscale via a high-quality canvas resample. */
export async function simulateUpscaleImage(params: { image: string; model: string }): Promise<ArenaImageResult> {
  const img = await loadImageElement(params.image);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth * 2;
  canvas.height = img.naturalHeight * 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D rendering is unavailable in this browser.');
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  await sleep(650);
  return { image: canvas.toDataURL('image/png'), mode: 'simulation', model: params.model };
}

/** Simulated generative edit: deterministic restyle driven by the edit prompt. */
export async function simulateEditImage(params: ArenaImageEditParams): Promise<ArenaImageResult> {
  const img = await loadImageElement(params.image);
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D rendering is unavailable in this browser.');
  }
  const rng = mulberry32(hashString(params.prompt));
  const hueShift = Math.floor(rng() * 360);

  ctx.filter = `hue-rotate(${hueShift}deg) saturate(${(1.15 + rng() * 0.5).toFixed(2)}) contrast(1.06)`;
  ctx.drawImage(img, 0, 0);
  ctx.filter = 'none';

  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = `hsla(${hueShift}, 90%, 55%, ${0.12 + rng() * 0.12})`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalCompositeOperation = 'source-over';

  const tagFont = Math.max(10, Math.round(canvas.width / 90));
  ctx.font = `bold ${tagFont}px monospace`;
  ctx.fillStyle = 'rgba(103, 232, 249, 0.85)';
  ctx.fillText(`SIM EDIT // ${params.prompt.slice(0, 40)}`, 12, canvas.height - 14);

  await sleep(650);
  return { image: canvas.toDataURL('image/png'), mode: 'simulation', model: params.model };
}

const ENHANCE_LIGHTING = [
  'dramatic rim lighting',
  'neon-soaked backlighting',
  'moody chiaroscuro lighting',
  'volumetric god rays cutting through haze',
  'golden hour glow with long shadows',
];
const ENHANCE_CAMERA = [
  'cinematic wide shot',
  'low-angle hero shot',
  'shallow depth of field, 85mm lens',
  'dynamic dutch angle composition',
  'over-the-shoulder framing',
];
const ENHANCE_DETAIL = [
  'intricate foreground detail',
  'atmospheric fog and depth layering',
  'hyper-detailed textures',
  'reflective wet surfaces',
  'billowing particulate in the air',
];
const ENHANCE_STYLE = [
  'cyberpunk concept art',
  'graphic novel splash page',
  'moody sci-fi illustration',
  'painterly concept art with bold brushwork',
];

/** Simulated prompt enhancement: heuristic, preserves the original subject. */
export function simulateEnhancePrompt(prompt: string): string {
  const rng = mulberry32(hashString(prompt));
  const pick = <T,>(items: T[]): T => items[Math.floor(rng() * items.length)];
  return [
    prompt.trim().replace(/[.,\s]+$/, ''),
    pick(ENHANCE_LIGHTING),
    pick(ENHANCE_CAMERA),
    pick(ENHANCE_DETAIL),
    pick(ENHANCE_STYLE),
  ].join(', ');
}
