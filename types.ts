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
