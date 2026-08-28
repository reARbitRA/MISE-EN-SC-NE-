import type { ArenaAspectRatio, ArenaImageModel } from '../../types.ts';

/**
 * Configuration for the Arena.ai image engine.
 *
 * In the browser these values are injected at build time by Vite's `define`
 * (see `vite.config.ts`, sourced from `.env`). In Node scripts (e.g.
 * `scripts/verify-arena-config.ts`) they are read from the real environment.
 */
export interface ArenaEngineConfig {
  /** Bearer token. Live mode is enabled as soon as this is non-empty. */
  apiKey: string;
  /** Base URL of the OpenAI-compatible Arena image API (no trailing slash). */
  baseUrl: string;
  /** Primary (quality) image model id. */
  imageModel: string;
  /** Fast image model id, used for image-to-image edits and upscaling. */
  imageModelFast: string;
  /** Text model id used for prompt enhancement via `/chat/completions`. */
  textModel: string;
}

const DEFAULT_BASE_URL = 'https://api.arena.ai/v1';
const DEFAULT_IMAGE_MODEL = 'arena-image-001';
const DEFAULT_IMAGE_MODEL_FAST = 'arena-image-fast-001';
const DEFAULT_TEXT_MODEL = 'arena-text-flash';

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const readEnv = (name: string): string => (process.env[name] ?? '').trim();

export function getArenaEngineConfig(): ArenaEngineConfig {
  return {
    apiKey: readEnv('ARENA_API_KEY'),
    baseUrl: trimTrailingSlash(readEnv('ARENA_API_BASE_URL')) || DEFAULT_BASE_URL,
    imageModel: readEnv('ARENA_IMAGE_MODEL') || DEFAULT_IMAGE_MODEL,
    imageModelFast: readEnv('ARENA_IMAGE_MODEL_FAST') || DEFAULT_IMAGE_MODEL_FAST,
    textModel: readEnv('ARENA_TEXT_MODEL') || DEFAULT_TEXT_MODEL,
  };
}

/** True when a live Arena API key is configured. */
export function isArenaLiveMode(): boolean {
  return getArenaEngineConfig().apiKey.length > 0;
}

const FULL_CAPABILITIES = {
  negativePrompt: true,
  aspectRatio: true,
  refinement: true,
  imageToImage: true,
};

/**
 * The Arena image model catalog exposed in the Frame Generator's model picker.
 * Ids come from configuration so any OpenAI-compatible gateway can be used
 * without touching the UI.
 */
export const ARENA_IMAGE_MODELS: ArenaImageModel[] = [
  {
    id: getArenaEngineConfig().imageModel,
    name: 'Arena Vision',
    description: 'Highest quality generation.',
    capabilities: FULL_CAPABILITIES,
  },
  {
    id: getArenaEngineConfig().imageModelFast,
    name: 'Arena Flash',
    description: 'Fast generation & in-painting edits.',
    capabilities: FULL_CAPABILITIES,
  },
];

export const DEFAULT_ARENA_IMAGE_MODEL_ID: string = ARENA_IMAGE_MODELS[0].id;
export const ARENA_FAST_IMAGE_MODEL_ID: string = ARENA_IMAGE_MODELS[1].id;

/** Maps an aspect ratio onto the closest OpenAI-compatible `size` string. */
const ASPECT_RATIO_TO_SIZE: Record<ArenaAspectRatio, string> = {
  '1:1': '1024x1024',
  '16:9': '1792x1024',
  '9:16': '1024x1792',
  '4:3': '1344x1024',
  '3:4': '1024x1344',
};

export function arenaSizeForAspectRatio(aspectRatio: ArenaAspectRatio): string {
  return ASPECT_RATIO_TO_SIZE[aspectRatio] ?? '1024x1024';
}

/** Pixel dimensions used by the local simulation renderer for a given ratio. */
export function arenaDimensionsForAspectRatio(aspectRatio: ArenaAspectRatio): { width: number; height: number } {
  const [width, height] = arenaSizeForAspectRatio(aspectRatio)
    .split('x')
    .map((value) => Number.parseInt(value, 10));
  return { width, height };
}

export const ARENA_IMAGE_TIMEOUT_MS = 120_000;
export const ARENA_TEXT_TIMEOUT_MS = 45_000;
