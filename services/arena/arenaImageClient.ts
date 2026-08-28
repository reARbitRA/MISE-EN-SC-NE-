import type {
  ArenaChatApiRequest,
  ArenaChatApiResponse,
  ArenaImageApiRequest,
  ArenaImageApiResponse,
  ArenaImageEditParams,
  ArenaImageGenerationParams,
  ArenaImageResult,
} from '../../types.ts';
import { ARENA_IMAGE_TIMEOUT_MS, ARENA_TEXT_TIMEOUT_MS, arenaSizeForAspectRatio, getArenaEngineConfig } from './arenaConfig.ts';

/** Typed error thrown for every Arena API failure (never crash the UI). */
export class ArenaApiError extends Error {
  readonly status?: number;
  readonly code?: string;

  constructor(message: string, options?: { status?: number; code?: string; cause?: unknown }) {
    super(message);
    this.name = 'ArenaApiError';
    this.status = options?.status;
    this.code = options?.code;
    if (options?.cause !== undefined) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }
}

interface ArenaRequestOptions {
  path: string;
  body: ArenaImageApiRequest | ArenaChatApiRequest;
  timeoutMs: number;
}

async function arenaFetch({ path, body, timeoutMs }: ArenaRequestOptions): Promise<Response> {
  const { apiKey, baseUrl } = getArenaEngineConfig();
  if (!apiKey) {
    throw new ArenaApiError('ARENA_API_KEY is not configured. Add it to your .env file to enable live generation.', {
      code: 'missing_api_key',
    });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ArenaApiError('The Arena request timed out. Try again or use a smaller size.', {
        code: 'timeout',
      });
    }
    throw new ArenaApiError(
      'Could not reach the Arena API. Verify ARENA_API_BASE_URL and your network connection.',
      { code: 'network_error', cause: e }
    );
  } finally {
    clearTimeout(timer);
  }
}

/** Reads a failed response into a friendly, typed ArenaApiError. */
async function toArenaApiError(res: Response): Promise<ArenaApiError> {
  let providerMessage = '';
  try {
    const raw = await res.text();
    if (raw) {
      try {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          const maybe = parsed as { error?: { message?: string }; message?: string };
          providerMessage = maybe.error?.message ?? maybe.message ?? '';
        }
      } catch {
        providerMessage = raw.slice(0, 300);
      }
    }
  } catch {
    // Body already consumed — fall through to the status-based message.
  }

  const suffix = providerMessage ? ` ${providerMessage}` : '';
  switch (true) {
    case res.status === 401 || res.status === 403:
      return new ArenaApiError(`Authentication with the Arena API failed (${res.status}). Check your ARENA_API_KEY.${suffix}`, {
        status: res.status,
        code: 'auth',
      });
    case res.status === 404:
      return new ArenaApiError(`The Arena API endpoint or model was not found (${res.status}). Verify ARENA_API_BASE_URL and the model id.${suffix}`, {
        status: res.status,
        code: 'not_found',
      });
    case res.status === 429:
      return new ArenaApiError(`Arena API rate limit reached (${res.status}). Wait a moment and try again.${suffix}`, {
        status: res.status,
        code: 'rate_limited',
      });
    case res.status >= 500:
      return new ArenaApiError(`The Arena API had a server error (${res.status}). Try again shortly.${suffix}`, {
        status: res.status,
        code: 'server',
      });
    default:
      return new ArenaApiError(`Arena API request failed (${res.status}).${suffix}`, {
        status: res.status,
        code: 'http',
      });
  }
}

async function parseJsonResponse<T>(res: Response, context: string): Promise<T> {
  let raw = '';
  try {
    raw = await res.text();
    return JSON.parse(raw) as T;
  } catch (e) {
    throw new ArenaApiError(`The Arena API returned a malformed response${context ? ` (${context})` : ''}.`, {
      code: 'malformed_response',
      cause: e,
    });
  }
}

/** Sniffs the image MIME type from base64 magic bytes so data URLs stay valid. */
function base64ToDataUrl(base64: string): string {
  const head = base64.slice(0, 5);
  let mime = 'image/png';
  if (head.startsWith('iVBOR')) mime = 'image/png';
  else if (head.startsWith('/9j/')) mime = 'image/jpeg';
  else if (head.startsWith('R0lGO')) mime = 'image/gif';
  return `data:${mime};base64,${base64}`;
}

/** Inlines a remote image URL into a data URL so downstream storage stays uniform. */
async function urlToDataUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const blob = await res.blob();
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = '';
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
      binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE));
    }
    return `data:${blob.type || 'image/png'};base64,${btoa(binary)}`;
  } catch (e) {
    console.warn('[arena] Could not inline the remote image URL; using it directly instead.', e);
    return url;
  }
}

function buildGenerationBody(params: ArenaImageGenerationParams): ArenaImageApiRequest {
  const body: ArenaImageApiRequest = {
    model: params.model,
    prompt: params.prompt,
    n: 1,
    response_format: 'b64_json',
  };
  if (params.negativePrompt) {
    body.negative_prompt = params.negativePrompt;
  }
  if (params.aspectRatio) {
    body.size = arenaSizeForAspectRatio(params.aspectRatio);
  }
  if (typeof params.seed === 'number' && Number.isFinite(params.seed)) {
    body.seed = params.seed;
  }
  return body;
}

async function readImageResult(res: Response, model: string): Promise<ArenaImageResult> {
  const payload = await parseJsonResponse<ArenaImageApiResponse>(res, 'images/generations');
  const item = payload.data?.[0];
  if (item?.b64_json) {
    return {
      image: base64ToDataUrl(item.b64_json),
      mode: 'live',
      model,
      revisedPrompt: item.revised_prompt,
    };
  }
  if (item?.url) {
    return {
      image: await urlToDataUrl(item.url),
      mode: 'live',
      model,
      revisedPrompt: item.revised_prompt,
    };
  }
  throw new ArenaApiError(
    payload.error?.message ?? 'The Arena API returned no image for this prompt. Try rephrasing it.',
    { code: 'empty_response' }
  );
}

/** Text-to-image generation against the live Arena Images API. */
export async function arenaGenerateImageLive(params: ArenaImageGenerationParams): Promise<ArenaImageResult> {
  const res = await arenaFetch({
    path: '/images/generations',
    body: buildGenerationBody(params),
    timeoutMs: ARENA_IMAGE_TIMEOUT_MS,
  });
  if (!res.ok) {
    throw await toArenaApiError(res);
  }
  return readImageResult(res, params.model);
}

/** Image-to-image (generative edit / upscale) against the live Arena Images API. */
export async function arenaEditImageLive(params: ArenaImageEditParams): Promise<ArenaImageResult> {
  const body: ArenaImageApiRequest = {
    model: params.model,
    prompt: params.prompt,
    n: 1,
    response_format: 'b64_json',
    image: params.image,
  };
  if (typeof params.strength === 'number' && Number.isFinite(params.strength)) {
    body.strength = params.strength;
  }
  const res = await arenaFetch({
    path: '/images/generations',
    body,
    timeoutMs: ARENA_IMAGE_TIMEOUT_MS,
  });
  if (!res.ok) {
    throw await toArenaApiError(res);
  }
  return readImageResult(res, params.model);
}

/** Chat completion against the live Arena API (used for prompt enhancement). */
export async function arenaChatCompletionLive(request: ArenaChatApiRequest): Promise<string> {
  const res = await arenaFetch({
    path: '/chat/completions',
    body: request,
    timeoutMs: ARENA_TEXT_TIMEOUT_MS,
  });
  if (!res.ok) {
    throw await toArenaApiError(res);
  }
  const payload = await parseJsonResponse<ArenaChatApiResponse>(res, 'chat/completions');
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new ArenaApiError(payload.error?.message ?? 'The Arena API returned no text.', {
      code: 'empty_response',
    });
  }
  return content;
}
