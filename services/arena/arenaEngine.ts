import type {
  ArenaImageEditParams,
  ArenaImageGenerationParams,
  ArenaImageResult,
  ArenaPromptEnhancementResult,
} from '../../types.ts';
import { getArenaEngineConfig, isArenaLiveMode } from './arenaConfig.ts';
import { arenaChatCompletionLive, arenaEditImageLive, arenaGenerateImageLive } from './arenaImageClient.ts';
import { simulateEditImage, simulateEnhancePrompt, simulateGenerateImage, simulateUpscaleImage } from './arenaSimulation.ts';

/** Snapshot of the engine's configuration, surfaced in the UI status line. */
export interface ArenaEngineStatus {
  mode: 'live' | 'simulation';
  baseUrl: string;
  hasApiKey: boolean;
  imageModel: string;
}

export function getArenaEngineStatus(): ArenaEngineStatus {
  const config = getArenaEngineConfig();
  return {
    mode: config.apiKey ? 'live' : 'simulation',
    baseUrl: config.baseUrl,
    hasApiKey: config.apiKey.length > 0,
    imageModel: config.imageModel,
  };
}

/** Instruction sent for upscaling (mirrors the legacy Gemini prompt for parity). */
const UPSCALE_INSTRUCTION =
  'Upscale this image to a higher resolution. Enhance the details, clarity, and sharpness without altering the content or style.';

/** System instruction for prompt enhancement (mirrors the legacy Gemini prompt). */
const ENHANCE_SYSTEM_INSTRUCTION =
  "You are an AI prompt engineer. Your task is to enhance the user's prompt for an image generator. Keep the original subject, but make it more vivid and artistic by adding details about lighting, environment, and composition. Suggest a compelling artistic style if one isn't specified. Return only the new prompt as a single line of text.";

/**
 * The Arena.ai image engine facade used by the Frame Generator.
 *
 * - Live mode (`ARENA_API_KEY` set): calls the OpenAI-compatible Arena Images
 *   API (`/images/generations`) and Chat API (`/chat/completions`).
 * - Simulation mode: deterministic local renderer so the app remains fully
 *   usable without credentials.
 *
 * All failures throw typed errors with user-friendly messages; callers are
 * expected to surface them through their existing error state.
 */
export const arenaEngine = {
  status: getArenaEngineStatus,

  async generateImage(params: ArenaImageGenerationParams): Promise<ArenaImageResult> {
    if (!isArenaLiveMode()) {
      return simulateGenerateImage(params);
    }
    return arenaGenerateImageLive(params);
  },

  async upscaleImage(params: { image: string; model: string }): Promise<ArenaImageResult> {
    if (!isArenaLiveMode()) {
      return simulateUpscaleImage(params);
    }
    return arenaEditImageLive({ ...params, prompt: UPSCALE_INSTRUCTION, strength: 0.9 });
  },

  async editImage(params: ArenaImageEditParams): Promise<ArenaImageResult> {
    if (!isArenaLiveMode()) {
      return simulateEditImage(params);
    }
    return arenaEditImageLive(params);
  },

  async enhancePrompt(params: { prompt: string }): Promise<ArenaPromptEnhancementResult> {
    if (!isArenaLiveMode()) {
      return { prompt: simulateEnhancePrompt(params.prompt), mode: 'simulation' };
    }
    const { textModel } = getArenaEngineConfig();
    const enhanced = await arenaChatCompletionLive({
      model: textModel,
      messages: [
        { role: 'system', content: ENHANCE_SYSTEM_INSTRUCTION },
        { role: 'user', content: `Original prompt: "${params.prompt}"` },
      ],
      temperature: 0.8,
      max_tokens: 300,
    });
    return { prompt: enhanced, mode: 'live' };
  },
};
