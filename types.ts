export type View = 
  | 'Nexus' 
  | 'Storyflow' 
  | 'Characters' 
  | 'Lore Keeper' 
  | 'Style Alchemist' 
  | 'Frame Generator' 
  | 'Panel Assembler' 
  | 'Soundtrack Composer' 
  | 'Project Settings' 
  | 'Export Project';

export interface ActivityItemProps {
  imgSrc: string;
  userName: string;
  action: string;
  time: string;
}

export interface Character {
  id: string;
  name: string;
  archetype: string;
  visuals: string;
  backstory: string;
  role?: 'Protagonist' | 'Antagonist' | 'Deuteragonist' | 'Supporting' | 'Anti-Hero';
  cyberware?: string[];
  alignment?: string;
  avatarUrl?: string;
}

export type LoreCategory = 
  | 'Locations & Districts' 
  | 'Factions & Megacorps' 
  | 'Tech & Cyberware' 
  | 'Timeline & Events' 
  | 'Culture & Slang';

export interface LoreEntry {
  id: string;
  title: string;
  category: LoreCategory;
  description: string;
  secrets: string;
  tags: string[];
  lastUpdated: string;
}

export interface ColorSwatch {
  name: string;
  hex: string;
  role: 'Primary' | 'Secondary' | 'Accent' | 'Background' | 'Highlight';
}

export interface ColorPalette {
  id: string;
  name: string;
  description: string;
  colors: ColorSwatch[];
}

export interface ArtStylePreset {
  id: string;
  name: string;
  category: string;
  description: string;
  promptModifier: string;
  negativeModifier?: string;
  previewGradient: string;
}

export type PanelLayoutType = '4-grid' | '6-dynamic' | '3-tier' | '5-manga' | 'splash-inset';

export interface ComicBubble {
  id: string;
  type: 'speech' | 'thought' | 'whisper' | 'scream' | 'caption' | 'sfx';
  text: string;
  speaker?: string;
  x: number; // percentage 0 - 100
  y: number; // percentage 0 - 100
  fontSize?: number;
  rotation?: number;
}

export interface ComicPanelSlot {
  id: string;
  label: string;
  imageUrl: string | null;
  aspect?: string;
  zoom?: number;
  panX?: number;
  panY?: number;
}

export interface ComicPage {
  id: string;
  pageNumber: number;
  title: string;
  layout: PanelLayoutType;
  panels: ComicPanelSlot[];
  bubbles: ComicBubble[];
  backgroundColor?: string;
  gutterColor?: string;
}

export interface ProjectSettingsData {
  title: string;
  subtitle: string;
  logline: string;
  genre: string[];
  targetAudience: string;
  ageRating: string;
  team: {
    writer: string;
    artist: string;
    colorist: string;
    letterer: string;
  };
  goals: {
    targetPages: number;
    targetChapters: number;
    currentChapter: number;
    currentPhase: string;
  };
  defaultModel: string;
}

export interface SoundtrackTrack {
  id: string;
  title: string;
  mood: string;
  bpm: number;
  description: string;
  key: string;
  type: 'synthwave' | 'ambient' | 'action' | 'cyberpunk-drone';
}

// ==========================================================================
// Arena.ai Image Engine
// OpenAI-compatible Images contract used by the Frame Generator view.
// ==========================================================================

/** Aspect ratios accepted by the Arena image generation request. */
export type ArenaAspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

/** Capability flags describing what a given Arena image model supports. */
export interface ArenaModelCapabilities {
  /** The model honours a separate negative prompt. */
  negativePrompt: boolean;
  /** The model honours aspect ratio / size control. */
  aspectRatio: boolean;
  /** The model can re-run the active prompt (Refine / Variations). */
  refinement: boolean;
  /** The model supports image-to-image operations (generative edit / upscale). */
  imageToImage: boolean;
}

/** A model entry in the Arena image model catalog (drives the model picker UI). */
export interface ArenaImageModel {
  id: string;
  name: string;
  description: string;
  capabilities: ArenaModelCapabilities;
}

/** Parameters for a text-to-image generation through the Arena engine. */
export interface ArenaImageGenerationParams {
  model: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio?: ArenaAspectRatio;
  /** Optional seed. Vary it to request a different variation of the same prompt. */
  seed?: number;
}

/** Parameters for image-to-image operations (generative edit / upscale). */
export interface ArenaImageEditParams {
  model: string;
  /** Source image as a data URL. */
  image: string;
  prompt: string;
  /** 0–1: how strongly the source image should be preserved. */
  strength?: number;
}

/**
 * Normalized result returned by the Arena engine regardless of mode.
 * `image` is a data URL (or, if a provider insists on remote URLs and it
 * cannot be inlined, the remote URL itself) — either way it maps directly
 * onto the plain string image sources used by `recentFrames`,
 * `ComicPanelSlot.imageUrl` and the Frame Generator's edit history.
 */
export interface ArenaImageResult {
  image: string;
  /** Whether the result came from the live Arena API or the local simulation fallback. */
  mode: 'live' | 'simulation';
  model: string;
  revisedPrompt?: string;
}

/** Result of the AI prompt-enhancement helper. */
export interface ArenaPromptEnhancementResult {
  prompt: string;
  mode: 'live' | 'simulation';
}

/** Arena Images API request body (OpenAI-compatible `/images/generations`). */
export interface ArenaImageApiRequest {
  model: string;
  prompt: string;
  negative_prompt?: string;
  n: number;
  /** Pixel size derived from the requested aspect ratio, e.g. "1792x1024". */
  size?: string;
  response_format: 'b64_json' | 'url';
  seed?: number;
  /** Data URL of the source image for image-to-image workflows. */
  image?: string;
  strength?: number;
}

/** A single generated image inside an Arena Images API response. */
export interface ArenaImageApiImageData {
  b64_json?: string;
  url?: string;
  revised_prompt?: string;
}

/** Error body embedded in Arena API error responses. */
export interface ArenaApiErrorBody {
  message?: string;
  type?: string;
  code?: string;
}

/** Arena Images API response body. */
export interface ArenaImageApiResponse {
  created?: number;
  data?: ArenaImageApiImageData[];
  error?: ArenaApiErrorBody;
}

/** Arena chat API message (OpenAI-compatible `/chat/completions`). */
export interface ArenaChatApiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/** Arena chat API request body. */
export interface ArenaChatApiRequest {
  model: string;
  messages: ArenaChatApiMessage[];
  temperature?: number;
  max_tokens?: number;
}

/** Arena chat API response body. */
export interface ArenaChatApiResponse {
  choices?: { message?: { content?: string }; finish_reason?: string }[];
  error?: ArenaApiErrorBody;
}

// ==========================================================================
// PROMPTFORGE — the studio-wide prompt refinement engine
// ==========================================================================

/** Authoring domains the engine understands (one per kind of writing field). */
export type PromptForgeDomain =
  | 'image-prompt'
  | 'image-negative'
  | 'image-variation'
  | 'character-visual'
  | 'character-backstory'
  | 'lore-description'
  | 'lore-secret'
  | 'style-scene'
  | 'style-palette'
  | 'soundtrack-score'
  | 'dialogue-scene'
  | 'dialogue-bubble'
  | 'story-logline';

/** How hard the forge leans into enrichment. */
export type PromptForgeIntensity = 'polish' | 'amplify' | 'overdrive';

/** One clarifying question the engine asks before forging. */
export interface PromptForgeQuestion {
  id: string;
  text: string;
  why: string;
  suggestions: string[];
}

/** Deterministic read of a rough draft. */
export interface PromptForgeAnalysis {
  wordCount: number;
  coveredDimensions: string[];
  missingDimensions: string[];
  coreTerms: string[];
}

/** A single line in the "what changed" review. */
export interface PromptForgeChangeNote {
  label: string;
  detail: string;
}

/** Verdict of the term-preservation guardian. */
export interface PromptForgeGuardian {
  preservedTerms: string[];
  droppedTerms: string[];
}

/** Final forged output, regardless of engine mode. */
export interface PromptForgeResult {
  text: string;
  mode: 'live' | 'local';
  intensity: PromptForgeIntensity;
  changeNotes: PromptForgeChangeNote[];
  guardian: PromptForgeGuardian;
  /** Set when a live attempt failed and the local forge took over. */
  notice?: string;
}
