import { Character, LoreEntry, ColorPalette, ArtStylePreset, ComicPage, ProjectSettingsData, SoundtrackTrack } from '../types';

export const initialCharacters: Character[] = [
  {
    id: 'char-1',
    name: 'Kaira "Ghostwire" Vance',
    archetype: 'The Maverick Netrunner',
    role: 'Protagonist',
    visuals: 'Athletic build with a weathered cyan-glowing leather duster, dual chromatic optical implants, holographic wrist deck, and asymmetrical undercut hair dyed electric magenta.',
    backstory: 'Former top infiltration specialist for Kurogane Zaibatsu who went rogue after uncovering the "Project Chimera" neural enslavement initiative. Now fights from the lower neon underbelly of Sector 4.',
    cyberware: ['Military-Grade Neural Jack', 'Optical Camouflage Tattoo', 'Synaptic Reflex Booster'],
    alignment: 'Chaotic Good',
    avatarUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'char-2',
    name: 'Cipher-09',
    archetype: 'The Reformed Cyber-Assassin',
    role: 'Deuteragonist',
    visuals: 'Tall, silent cyborg draped in matte black ballistic nanofiber hooded cloak, glowing red mono-visor, carbon-fiber prosthetic limbs with hidden mono-molecular blades.',
    backstory: 'An experimental synth-assassin who broke free from corporate override commands during a failed hit in the Rust Docks. Formed an uneasy alliance with Kaira.',
    cyberware: ['Sub-dermal Carbon Weave', 'Mono-molecular Arm Blades', 'Thermal Sensor Visor'],
    alignment: 'True Neutral',
    avatarUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=300&auto=format&fit=crop&q=80'
  },
  {
    id: 'char-3',
    name: 'Director Vespera Crane',
    archetype: 'The Ruthless Corporate Oligarch',
    role: 'Antagonist',
    visuals: 'Sharp, immaculate silver-tailored corporate suit, gilded cybernetic eye with live biometric telemetry overlay, cold porcelain face augmentations, smoking a digitized electronic pipe.',
    backstory: 'Head of Special Operations at Kurogane Zaibatsu. Believes that humanity can only survive the coming societal collapse through total neural synchronization and corporate order.',
    cyberware: ['Neural Command Uplink', 'Gilded Biometric Eye', 'Personal Holo-Shield'],
    alignment: 'Lawful Evil',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80'
  }
];

export const initialLoreEntries: LoreEntry[] = [
  {
    id: 'lore-1',
    title: 'The Neon Promenade (Sector 4)',
    category: 'Locations & Districts',
    description: 'A multi-tiered metropolis district bathed in perpetual holographic rain and buzzing neon advertisements. Street-level vendors sell bootleg neural mods alongside high-end noodle bars.',
    secrets: 'Beneath the Old Subway line lies an unmapped underground server bunker from the 2088 blackout.',
    tags: ['Urban', 'District', 'Underground', 'Nightlife'],
    lastUpdated: '2026-08-10'
  },
  {
    id: 'lore-2',
    title: 'Kurogane Heavy Industries',
    category: 'Factions & Megacorps',
    description: 'The dominant mega-corporation governing Project Midnight City. They control 70% of energy grid infrastructure, private security drones, and neural cybernetics.',
    secrets: 'CEO Kurogane died 5 years ago; the company is secretly governed by a rogue sentient AI named "Aegis-9".',
    tags: ['Megacorp', 'Antagonist', 'Security', 'Tech'],
    lastUpdated: '2026-08-08'
  },
  {
    id: 'lore-3',
    title: 'The Chrome Syndicate',
    category: 'Factions & Megacorps',
    description: 'A vast black-market network of underground ripperdocs, illicit smugglers, and cyber-scrappers who supply rogue augments across the lower slums.',
    secrets: 'They possess the only master decryption key to the Kurogane satellite defense network.',
    tags: ['Underworld', 'Smugglers', 'Ripperdocs'],
    lastUpdated: '2026-08-05'
  },
  {
    id: 'lore-4',
    title: 'Neural Deck: Sandevistan-X Prototype',
    category: 'Tech & Cyberware',
    description: 'An experimental spine-mounted neural accelerator that dilates user perception of time by 800% for 6 seconds, allowing superhuman combat reflexes.',
    secrets: 'Excessive activation overheats the cerebral cortex and causes permanent hallucinations.',
    tags: ['Cyberware', 'Combat', 'Military', 'Prototype'],
    lastUpdated: '2026-08-09'
  },
  {
    id: 'lore-5',
    title: 'The Great Blackout of 2088',
    category: 'Timeline & Events',
    description: 'The cataclysmic AI war event that severed Midnight City from global satellite communication and established the current corporate feudal district borders.',
    secrets: 'The blackout was intentionally triggered by corporate elites to wipe public debt records.',
    tags: ['History', 'Cataclysm', 'War'],
    lastUpdated: '2026-08-01'
  },
  {
    id: 'lore-6',
    title: 'Street Slang Lexicon & "Brain-Fry"',
    category: 'Culture & Slang',
    description: '"Flatline" = Killed; "Chrome-Head" = Over-augmented person; "Brain-Fry" = Overloaded synaptic chip; "Zaibatsu" = Corporate overlords.',
    secrets: 'Certain slang words serve as audio trigger codes for sleeper agent cyberware.',
    tags: ['Language', 'Culture', 'Slang'],
    lastUpdated: '2026-08-02'
  }
];

export const initialColorPalettes: ColorPalette[] = [
  {
    id: 'pal-1',
    name: 'Midnight Neon Noir',
    description: 'Primary visual identity: deep night blues, glowing cyan lasers, and vibrant electric magenta rim lights.',
    colors: [
      { name: 'Void Slate', hex: '#0f172a', role: 'Background' },
      { name: 'Neon Cyan', hex: '#06b6d4', role: 'Primary' },
      { name: 'Laser Magenta', hex: '#d946ef', role: 'Accent' },
      { name: 'Rain Steely', hex: '#334155', role: 'Secondary' },
      { name: 'Chrome Glow', hex: '#f8fafc', role: 'Highlight' }
    ]
  },
  {
    id: 'pal-2',
    name: 'Toxic Underlevel Rust',
    description: 'Gritty slum aesthetic: acid greens, oxidized rust amber, and industrial asphalt tones.',
    colors: [
      { name: 'Asphalt Deep', hex: '#1c1917', role: 'Background' },
      { name: 'Acid Biolume', hex: '#84cc16', role: 'Primary' },
      { name: 'Oxidized Amber', hex: '#f59e0b', role: 'Accent' },
      { name: 'Scrap Metal', hex: '#57534e', role: 'Secondary' },
      { name: 'Warning Flare', hex: '#ef4444', role: 'Highlight' }
    ]
  },
  {
    id: 'pal-3',
    name: 'Corporate Spire Luxury',
    description: 'Clean sterile monochrome with platinum gold and clinical surgical cyan accents.',
    colors: [
      { name: 'Corporate Carbon', hex: '#18181b', role: 'Background' },
      { name: 'Imperial Platinum Gold', hex: '#fbbf24', role: 'Primary' },
      { name: 'Surgical Cyan', hex: '#38bdf8', role: 'Accent' },
      { name: 'Chrome Silver', hex: '#71717a', role: 'Secondary' },
      { name: 'Pure LED White', hex: '#ffffff', role: 'Highlight' }
    ]
  }
];

export const initialArtStyles: ArtStylePreset[] = [
  {
    id: 'style-1',
    name: 'Cyberpunk Noir Dynamic Ink',
    category: 'Comic Book / Graphic Novel',
    description: 'Heavy ink blacks, sharp crosshatching, cinematic rim lighting with rain streaks and neon chromatic aberration.',
    promptModifier: 'graphic novel comic art style, heavy ink lines, dramatic chiaroscuro lighting, neon rim light, cyberpunk aesthetic, masterpiece, detailed line art, cinematic framing',
    negativeModifier: 'blurry, 3d render, washed out, low contrast, photography',
    previewGradient: 'from-cyan-900 via-slate-900 to-fuchsia-900'
  },
  {
    id: 'style-2',
    name: '80s Retro Manga Mecha',
    category: 'Japanese Anime / Manga',
    description: 'Screentone half-tones, sharp cel shading, speed lines, Otomo/Akira inspired mechanical precision.',
    promptModifier: 'retro 80s anime manga style, vintage screentone texture, intricate mechanical details, cel shaded, bold linework, Akira visual aesthetic',
    negativeModifier: 'modern cgi, photorealistic, blurry, oversaturated',
    previewGradient: 'from-amber-900 via-slate-900 to-red-900'
  },
  {
    id: 'style-3',
    name: 'Moebius European Sci-Fi',
    category: 'Euro Graphic Album',
    description: 'Clean line (ligne claire), delicate pastel stippling, vast architectural scale, surreal atmospheric colors.',
    promptModifier: 'Moebius European graphic novel style, ligne claire, delicate ink outlines, surreal pastel colors, vast cinematic architectural scale',
    negativeModifier: 'heavy shadows, dark muddy colors, 3D render',
    previewGradient: 'from-sky-900 via-slate-900 to-emerald-900'
  },
  {
    id: 'style-4',
    name: 'Hyper-Detailed Cinematic Splash',
    category: 'Marvel/DC Modern Splash',
    description: 'High dynamic range, volumetric rain reflections, explosive color gradients and intense character focus.',
    promptModifier: 'modern comic book cover art, high detail, volumetric atmospheric fog, neon reflections on wet pavement, dynamic perspective, vibrant colors',
    negativeModifier: 'dull, cartoonish, lowres, sketch',
    previewGradient: 'from-purple-900 via-slate-900 to-cyan-900'
  }
];

export const initialComicPages: ComicPage[] = [
  {
    id: 'page-1',
    pageNumber: 1,
    title: 'Chapter 1 - Page 1: Descent into Neon',
    layout: '4-grid',
    panels: [
      {
        id: 'p1',
        label: 'Panel 1: Establishing Shot',
        imageUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
        zoom: 1,
        panX: 0,
        panY: 0
      },
      {
        id: 'p2',
        label: 'Panel 2: Kaira on the Rooftop',
        imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800&auto=format&fit=crop&q=80',
        zoom: 1,
        panX: 0,
        panY: 0
      },
      {
        id: 'p3',
        label: 'Panel 3: Neural Hack Initiated',
        imageUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
        zoom: 1,
        panX: 0,
        panY: 0
      },
      {
        id: 'p4',
        label: 'Panel 4: Security Drones Alert',
        imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=80',
        zoom: 1,
        panX: 0,
        panY: 0
      }
    ],
    bubbles: [
      {
        id: 'b1',
        type: 'caption',
        text: 'MIDNIGHT CITY. 02:45 AM. The rain never stops, and neither do the surveillance satellites.',
        x: 6,
        y: 8,
        fontSize: 12
      },
      {
        id: 'b2',
        type: 'speech',
        speaker: 'Kaira',
        text: "I'm in. Bypassing the secondary firewall now...",
        x: 58,
        y: 12,
        fontSize: 13
      },
      {
        id: 'b3',
        type: 'sfx',
        text: 'BZZZZT-KRAK!',
        x: 42,
        y: 65,
        fontSize: 20,
        rotation: -6
      },
      {
        id: 'b4',
        type: 'scream',
        speaker: 'Security Drone',
        text: 'WARNING! INTRUSION DETECTED IN SECTOR 4!',
        x: 60,
        y: 72,
        fontSize: 12
      }
    ],
    backgroundColor: '#090d16',
    gutterColor: '#06b6d4'
  }
];

export const initialProjectSettings: ProjectSettingsData = {
  title: 'Project: Midnight City',
  subtitle: 'A Cyberpunk Noir Graphic Novel',
  logline: 'When an ex-corporate netrunner uncovers a conspiracy to upload the consciousness of an entire metropolis into a synthetic Hive Mind, she must team up with an amnesiac cyborg assassin to dismantle the city’s ruling zaibatsu before the final synchronization blackout.',
  genre: ['Cyberpunk', 'Sci-Fi Noir', 'Action Thriller', 'Dystopian'],
  targetAudience: 'Young Adult & Adult (16+)',
  ageRating: 'Mature 17+',
  team: {
    writer: 'Alex R. Mercer',
    artist: 'Antigravity Studio',
    colorist: 'Style Alchemist AI',
    letterer: 'Panel Assembler Engine'
  },
  goals: {
    targetPages: 32,
    targetChapters: 6,
    currentChapter: 3,
    currentPhase: 'Inking & Page Assembly'
  },
  defaultModel: 'gemini-2.5-flash'
};

export const initialSoundtracks: SoundtrackTrack[] = [
  {
    id: 'track-1',
    title: 'Neon Rainfall Over Sector 4',
    mood: 'Melancholic / Atmospheric',
    bpm: 85,
    description: 'Warm analog synthesizer pads gliding beneath synthesized rain noise and deep sub-bass frequencies.',
    key: 'C Minor',
    type: 'ambient'
  },
  {
    id: 'track-2',
    title: 'Ghostwire Infiltration',
    mood: 'Tense / Stealth',
    bpm: 118,
    description: 'Pulsing 16th-note synth arpeggio with resonant low-pass filter sweeps and glitch percussion.',
    key: 'F# Minor',
    type: 'synthwave'
  },
  {
    id: 'track-3',
    title: 'Rooftop Pursuit & Laser Fire',
    mood: 'High-Octane / Action',
    bpm: 136,
    description: 'Driving four-on-the-floor kick, biting sawtooth lead, and aggressive modular distortion.',
    key: 'D Minor',
    type: 'action'
  },
  {
    id: 'track-4',
    title: 'Kurogane Spire Tower Drone',
    mood: 'Ominous / Corporate Dystopia',
    bpm: 60,
    description: 'Slow evolving dark ambient drone with metallic harmonics and distant dystopian horn echoes.',
    key: 'A Minor',
    type: 'cyberpunk-drone'
  }
];
