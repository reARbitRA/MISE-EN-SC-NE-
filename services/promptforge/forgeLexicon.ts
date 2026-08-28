import type { PromptForgeDomain } from '../../types.ts';

/**
 * PROMPTFORGE craft lexicon.
 *
 * Every domain is described as a set of *craft dimensions*. Each dimension
 * carries: detection keywords (is it already covered by the draft?), an
 * optional clarifying question with suggestion chips, and an enrichment pool
 * of specific, non-generic clauses. The forge only fills gaps — it never
 * stacks filler on top of what the author already wrote.
 */

export type ForgeFieldFormat = 'comma' | 'prose' | 'bubble' | 'logline';

export interface ForgeDimension {
  id: string;
  label: string;
  keywords: string[];
  question?: string;
  why?: string;
  suggestions: string[];
  /** Clause pool for comma-stream domains. */
  clauses?: string[];
  /** Sentence pool for prose domains. */
  proseLines?: string[];
}

export interface ForgeDomainProfile {
  label: string;
  format: ForgeFieldFormat;
  /** Live-mode specialist instruction appended to the constitution. */
  specialist: string;
  dimensions: ForgeDimension[];
}

const IMAGE_PROMPT_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'optics',
    label: 'camera & optics',
    keywords: ['lens', 'mm', 'anamorphic', 'bokeh', 'focus', 'shot', 'close-up', 'wide', 'angle', 'camera', 'framing', 'perspective', 'overhead', 'panorama'],
    question: 'Where do you want the camera?',
    why: 'Locks the optical voice of the frame.',
    suggestions: ['35mm anamorphic, shallow focus', 'wide establishing shot, deep focus', 'low-angle hero shot', 'over-the-shoulder, 85mm compression'],
    clauses: [
      'shot on 35mm anamorphic with shallow focus',
      'low-angle wide shot, deep focus',
      '85mm portrait compression, subject isolated in bokeh',
      'dutch-tilt medium shot with foreground occlusion',
      'overhead god-shot with strong perspective lines',
      'macro foreground detail framing the subject',
    ],
  },
  {
    id: 'lighting',
    label: 'lighting design',
    keywords: ['light', 'lighting', 'lit', 'neon', 'glow', 'backlight', 'rim', 'shadow', 'chiaroscuro', 'sunlight', 'moonlight', 'lamp', 'luminous', 'flare'],
    question: 'What is doing the lighting?',
    why: 'Light is the cheapest drama you can buy.',
    suggestions: ['single practical source, hard falloff', 'neon signage as key, magenta on cyan', 'overcast ambient, soft shadows', 'shaft of light through slats'],
    clauses: [
      'lit by a single practical source with hard falloff',
      'neon signage as key light, magenta against cyan rim',
      'sodium-vapor street glow washing the background',
      'hard chiaroscuro, half the subject lost in shadow',
      'backlit silhouette with atmospheric halation',
      'light shafts cutting through dust and steam',
    ],
  },
  {
    id: 'atmosphere',
    label: 'atmosphere',
    keywords: ['rain', 'fog', 'mist', 'smoke', 'steam', 'dust', 'haze', 'snow', 'storm', 'downpour'],
    question: 'What is in the air?',
    why: 'Weather is a silent character.',
    suggestions: ['heavy rain, wet reflective surfaces', 'low fog hugging the street', 'steam venting from grates', 'air thick with dust motes'],
    clauses: [
      'heavy rain slicking every surface into mirrors',
      'low fog swallowing the far end of the street',
      'steam venting through sidewalk grates',
      'air dense with drifting ash and particulate',
      'heat shimmer distorting the background planes',
    ],
  },
  {
    id: 'palette',
    label: 'palette logic',
    keywords: ['color', 'colour', 'palette', 'tone', 'hue', 'monochrome', 'pastel', 'saturated', 'muted', 'teal', 'orange', 'magenta', 'cyan', 'sepia', 'grade'],
    question: 'What color story fits?',
    why: 'A palette is a mood, argued in wavelengths.',
    suggestions: ['teal shadows, sodium-orange highlights', 'desaturated with one loud accent', 'monochrome plus a single red element', 'oversaturated neon on wet asphalt'],
    clauses: [
      'teal-shadowed palette with sodium-orange practicals',
      'desaturated grays pierced by one saturated accent',
      'oversaturated neon against wet-asphalt blacks',
      'muted sepia grade with cyan shadows',
    ],
  },
  {
    id: 'composition',
    label: 'composition',
    keywords: ['composition', 'centered', 'thirds', 'negative space', 'symmetrical', 'foreground', 'background', 'layered', 'frame', 'leading lines'],
    question: 'How should the eye move?',
    why: 'Composition decides what the reader feels first.',
    suggestions: ['layered fore/mid/background', 'off-center subject, heavy negative space', 'symmetrical framing', 'leading lines to the subject'],
    clauses: [
      'three depth planes: foreground silhouette, midground action, background signage',
      'subject off-center with heavy negative space',
      'frame-within-frame through a doorway',
      'leading lines converging on the subject',
    ],
  },
  {
    id: 'material',
    label: 'material specificity',
    keywords: ['chrome', 'leather', 'rust', 'concrete', 'glass', 'plastic', 'fabric', 'metal', 'wet', 'worn', 'steel', 'polymer'],
    question: 'What are the surfaces made of?',
    why: 'Named materials render better than adjectives.',
    suggestions: ['worn chrome and cracked leather', 'rain-beaded glass, rusted steel', 'oil-stained concrete'],
    clauses: [
      'materials read clearly: worn chrome, cracked synth-leather, rain-beaded glass',
      'surface wear tells history — rust seams, scratched polymer, oil stains',
      'matte concrete dusted with fine grit against polished accents',
    ],
  },
];

const IMAGE_NEGATIVE_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'optics-artifacts',
    label: 'optical artifacts',
    keywords: ['blur', 'blurry', 'focus', 'flare', 'grain', 'noise', 'compression', 'jpeg', 'smear'],
    question: 'Which optics failures hurt you most?',
    why: 'Targets the exact optical crimes.',
    suggestions: ['blur and smear', 'grain and noise', 'lens flare spam'],
    clauses: ['blurry regions and motion smear', 'heavy noise and grain', 'lens flare spam', 'compression artifacts'],
  },
  {
    id: 'anatomy',
    label: 'anatomy failures',
    keywords: ['anatomy', 'hands', 'fingers', 'face', 'deformed', 'extra', 'limbs', 'eyes', 'teeth', 'joints'],
    question: 'Any anatomy failures to block?',
    why: 'The classic weak points of image models.',
    suggestions: ['hands and fingers', 'eyes and faces', 'limbs and joints'],
    clauses: ['extra or fused fingers', 'asymmetric eyes', 'broken joint articulation', 'melted facial features', 'duplicated limbs'],
  },
  {
    id: 'text-artifacts',
    label: 'text artifacts',
    keywords: ['text', 'watermark', 'signature', 'logo', 'caption', 'letters', 'lettering', 'label'],
    question: 'Block stray text and watermarks?',
    why: 'Models love inventing gibberish signage.',
    suggestions: ['gibberish text', 'watermarks and logos', 'fake UI overlays'],
    clauses: ['stray text and gibberish lettering', 'watermarks, signatures, platform logos', 'fake UI overlays and captions'],
  },
  {
    id: 'render-artifacts',
    label: 'render artifacts',
    keywords: ['render', 'poly', 'mesh', 'texture', 'artifact', 'glitch', 'unfinished', 'muddy'],
    question: 'Which rendering flaws?',
    why: 'Keeps the ink clean.',
    suggestions: ['muddy textures', 'unfinished lines', 'clipping geometry'],
    clauses: ['unfinished line work', 'muddy textures', 'clipping geometry', 'floating debris meshes'],
  },
  {
    id: 'style-violation',
    label: 'style violations',
    keywords: ['style', 'cartoon', 'photo', '3d', 'anime', 'realism', 'realistic', 'cgi'],
    question: 'What style must NOT leak in?',
    why: 'Guards the intended art direction.',
    suggestions: ['no 3D render gloss', 'no photo-realism bleed', 'no cartoon flatness'],
    clauses: ['style bleed into cartoon flatness', 'unwanted glossy 3D render look', 'photographic skin textures breaking the inked style'],
  },
];

const IMAGE_VARIATION_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'preservation',
    label: 'preservation clause',
    keywords: ['keep', 'preserve', 'unchanged', 'same', 'only', 'leave', 'don'],
    question: 'What must NOT change?',
    why: 'A precise edit states its own boundaries.',
    suggestions: ['keep everything else unchanged', 'only touch the subject', 'keep lighting and framing locked'],
    clauses: ['preserve all other elements, lighting and framing exactly', 'apply only to the targeted region, blend edges naturally'],
  },
  {
    id: 'spatial-anchor',
    label: 'spatial anchor',
    keywords: ['left', 'right', 'top', 'bottom', 'behind', 'foreground', 'background', 'edge', 'center', 'above', 'below'],
    question: 'Where in the frame?',
    why: 'Anchors the edit so the model cannot wander.',
    suggestions: ['left third of frame', 'behind the subject', 'upper background'],
    clauses: ['anchored to the left third of the frame', 'in the background plane behind the subject', 'along the upper edge of the frame'],
  },
  {
    id: 'precision',
    label: 'edit precision',
    keywords: ['add', 'remove', 'replace', 'recolor', 'extend', 'move', 'change', 'swap', 'adjust'],
    question: 'Replace, extend, or recolor?',
    why: 'One precise verb beats three vague ones.',
    suggestions: ['replace only', 'extend, match perspective', 'recolor, keep material'],
    clauses: ['single precise change, no cascading edits', 'match existing perspective, lighting and grain'],
  },
];

const CHARACTER_VISUAL_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'silhouette',
    label: 'silhouette readability',
    keywords: ['silhouette', 'outline', 'shape', 'tall', 'slim', 'bulky', 'hunched', 'lean', 'broad'],
    question: 'How do they read in pure silhouette?',
    why: 'Comic characters must be recognizable as a black shape.',
    suggestions: ['tall, coat flaring at the hem', 'compact and coiled', 'broad frame, squared shoulders'],
    clauses: [
      'silhouette readable in one glance: tall, long coat flaring at the hem',
      'compact coiled stance, weight on the front foot',
      'broad squared frame that fills a doorway',
    ],
  },
  {
    id: 'wardrobe',
    label: 'wardrobe logic',
    keywords: ['wardrobe', 'clothing', 'jacket', 'coat', 'armor', 'outfit', 'dressed', 'wearing', 'boots', 'gloves', 'hood'],
    question: 'What are they wearing, and why?',
    why: 'Costume is biography you can see.',
    suggestions: ['utilitarian layers with one indulgent piece', 'corporate shell over street clothes', 'patched utility wear'],
    clauses: [
      'utilitarian layers with one indulgent piece — a silk scarf under scavenged armor',
      'corporate shell worn over street clothes, badge turned face-down',
      'patched utility wear, every repair a different decade',
    ],
  },
  {
    id: 'wear',
    label: 'wear & damage',
    keywords: ['scar', 'scarred', 'worn', 'damaged', 'weathered', 'patched', 'burn', 'cyberware', 'implant', 'prosthetic', 'chrome'],
    question: 'What has life done to their body?',
    why: 'Damage history makes a face memorable.',
    suggestions: ['old burn scar along the jaw', 'mismatched prosthetic arm', 'chrome port behind the ear'],
    clauses: [
      'an old burn scar pulling the left side of the jaw',
      'mismatched prosthetic arm, third-party replacement, wrong skin tone',
      'chrome data ports scarring behind the ear like track marks',
    ],
  },
  {
    id: 'chromatic-identity',
    label: 'chromatic identity',
    keywords: ['color', 'accent', 'highlights', 'neon', 'hair', 'dyed', 'eyes'],
    question: 'What is their signature color?',
    why: 'One repeatable color makes them findable on any page.',
    suggestions: ['one acid-green accent', 'shock-white hair', 'red optic glow'],
    clauses: [
      'one acid-green accent recurring across wardrobe and cyberware',
      'shock-white hair against otherwise muted tones',
      'faint red optic glow that answers their mood',
    ],
  },
];

const CHARACTER_BACKSTORY_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'wound',
    label: 'the wound',
    keywords: ['wound', 'origin', 'past', 'lost', 'failed', 'betrayed', 'accident', 'childhood', 'war'],
    question: 'What is the event they never recovered from?',
    why: 'A backstory is a scar with a date.',
    suggestions: ['a job that killed the crew but spared them', 'a family debt they inherited', 'the experiment they survived'],
    proseLines: [
      'The job that killed their crew left them alive, and they have been paying interest on that ever since.',
      'They inherited a debt that was never theirs, and honor is the only currency they kept.',
    ],
  },
  {
    id: 'want-need',
    label: 'want vs. need',
    keywords: ['want', 'need', 'goal', 'dream', 'desire', 'hope', 'seek'],
    question: 'What do they want — and what do they actually need?',
    why: 'The gap between the two is the whole character.',
    suggestions: ['wants revenge, needs to be forgiven', 'wants out of the city, needs a reason to stay', 'wants to be untouchable, needs one person who can touch them'],
    proseLines: [
      'What they want is written on their knuckles; what they need is the one thing they refuse to ask for.',
      'The plan gets them out of the city. Nothing in the plan explains what they would do after.',
    ],
  },
  {
    id: 'contradiction',
    label: 'the contradiction',
    keywords: ['but', 'however', 'contradiction', 'hate', 'love', 'protect', 'destroy', 'yet'],
    question: 'What is their defining contradiction?',
    why: 'Flat characters have one truth; round ones have two that fight.',
    suggestions: ['burns the world, keeps its key', 'protects strangers, robs their employer', 'preaches detachment, collects strays'],
    proseLines: [
      'They want to burn the city that made them and still keep its key on a chain.',
      'They preach detachment and keep feeding strays in the corridor outside their door.',
    ],
  },
  {
    id: 'grudge',
    label: 'the active grudge',
    keywords: ['grudge', 'enemy', 'rival', 'against', 'hate', 'corp', 'corporate', 'gang', 'vendetta'],
    question: 'Who wronged them — and is that person still breathing?',
    why: 'A grudge gives scenes somewhere to go.',
    suggestions: ['the exec who signed the order', 'the partner who sold them out', 'the gang that took the district'],
    proseLines: [
      'The exec who signed the order still rides the same glass elevator, and they have memorized the schedule.',
      'The partner who sold them out runs a noodle stand three blocks down, which is either cowardice or an apology.',
    ],
  },
];

const LORE_DESCRIPTION_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'sensory',
    label: 'sensory texture',
    keywords: ['smell', 'sound', 'taste', 'texture', 'hum', 'reek', 'echo', 'noise', 'light'],
    question: 'What do the senses report here?',
    why: 'Readers remember places through their skin.',
    suggestions: ['ozone and frying protein', 'wet concrete and machine oil', 'the hum of failing transformers'],
    proseLines: [
      'The air tastes of ozone and frying protein, and the floor hums just below hearing.',
      'It always sounds like rain here even when the sky is dry — coolant dripping off the mezzanine.',
    ],
  },
  {
    id: 'economy',
    label: 'function & economy',
    keywords: ['trade', 'market', 'work', 'workers', 'economy', 'sells', 'buy', 'business', 'traffic'],
    question: 'What changes hands here?',
    why: 'Every memorable place has a job.',
    suggestions: ['grey-market firmware', 'clean identities, dirty money', 'grief, by the hour'],
    proseLines: [
      'What changes hands here is grey-market firmware, and the warranty is your fingers.',
      'The real product is clean identities; the noodle counter is how you wait your turn.',
    ],
  },
  {
    id: 'law',
    label: 'one concrete law',
    keywords: ['law', 'rule', 'custom', 'code', 'forbidden', 'taboo', 'allowed', 'curfew'],
    question: 'What is the one rule everyone knows?',
    why: 'A single law makes a place feel governed.',
    suggestions: ['no chrome past the door', 'violence is billed, not banned', 'everyone owes the house one favor'],
    proseLines: [
      'One law is posted nowhere and known by everyone: no chrome past the inner door.',
      'Violence is not banned here — it is billed, and the tariff is posted nightly.',
    ],
  },
];

const LORE_SECRET_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'mechanism',
    label: 'the hidden mechanism',
    keywords: ['secret', 'hidden', 'actually', 'really', 'truth', 'beneath', 'behind', 'front'],
    question: 'What is really going on underneath?',
    why: 'A secret needs machinery, not just a label.',
    suggestions: ['the chapel fronts a data morgue', 'the water is filtered memory', 'the owner died years ago'],
    proseLines: [
      'Underneath, the whole floor is a data morgue — the chapel is just the filing system.',
      'The filtration plant does clean the water; it also skims something else out of it.',
    ],
  },
  {
    id: 'benefactor',
    label: 'who profits',
    keywords: ['profit', 'benefit', 'who', 'corp', 'owner', 'control', 'runs', 'funds'],
    question: 'Who quietly profits from this?',
    why: 'Follow the money to the next plot arc.',
    suggestions: ['a corp audit division', 'the gang council', 'the protagonist’s old employer'],
    proseLines: [
      'The quiet beneficiary is a corp audit division that uses the black market as an unlisted lab.',
      'The gang council knows, and taxes it, which is why nothing has ever been shut down.',
    ],
  },
  {
    id: 'trigger',
    label: 'the scene trigger',
    keywords: ['trigger', 'happen', 'if', 'when', 'discover', 'found', 'exposed'],
    question: 'What event could expose it all in one scene?',
    why: 'Secrets exist to be fired like a gun.',
    suggestions: ['a routine inspection', 'a debt collector goes missing', 'the archive floods'],
    proseLines: [
      'It all unravels the day a routine inspection is scheduled two hours early.',
      'The trigger is already loaded: a debt collector went missing upstairs last week.',
    ],
  },
];

const STYLE_PALETTE_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'hue-roles',
    label: 'hue roles',
    keywords: ['dominant', 'primary', 'secondary', 'accent', 'background', 'shadow', 'highlight'],
    question: 'Which hue owns the frame?',
    why: 'A palette needs a hierarchy, not a crowd.',
    suggestions: ['indigo dominant, rust secondary', 'near-black base, single acid accent', 'duotone cyan and magenta'],
    clauses: [
      'indigo dominant with rust secondaries and bone highlights',
      'near-black base carrying a single acid accent',
      'duotone logic: cyan architecture, magenta organic',
    ],
  },
  {
    id: 'temperature',
    label: 'temperature strategy',
    keywords: ['warm', 'cool', 'cold', 'temperature', 'contrast', ' undertone'],
    question: 'Warm against cool, or one temperature ruling?',
    why: 'Temperature is how a palette argues.',
    suggestions: ['cool world, warm faces', 'heat everywhere, relief nowhere', 'cold base, one warm source'],
    clauses: [
      'cool world with warm skin tones kept alive against it',
      'cold base palette with one warm practical light source',
      'heat-soaked palette, no cool relief anywhere in frame',
    ],
  },
  {
    id: 'material-light',
    label: 'justifying light',
    keywords: ['neon', 'sodium', 'led', 'sunlight', 'screen', 'glow', 'lamp', 'monitor'],
    question: 'What emits the light that justifies these hues?',
    why: 'Palettes anchored to light sources feel inevitable.',
    suggestions: ['sodium streetlamps', 'server-rack LEDs', 'dying ad signage'],
    clauses: [
      'hues justified by sodium-vapor street furniture',
      'every accent traceable to a screen or a sign',
      'palette lit by dying advertising signage, colors half burnt out',
    ],
  },
];

const SOUNDTRACK_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'instrumentation',
    label: 'instrumentation',
    keywords: ['synth', 'guitar', 'drum', 'bass', 'piano', 'strings', 'brass', 'instrument', 'choir', 'flute', 'sax'],
    question: 'What is playing?',
    why: 'Name the instruments and the track half-exists.',
    suggestions: ['detuned analog synth and fretless bass', 'prepared piano over drones', 'taiko and broken orchestra'],
    proseLines: [
      'Instrumentation: detuned analog synth pads, fretless bass, and one battered drum machine running hot.',
      'Instrumentation: prepared piano over low brass drones, percussion limited to metal and skin.',
    ],
  },
  {
    id: 'energy-curve',
    label: 'energy curve',
    keywords: ['build', 'crescendo', 'drop', 'climax', 'slow', 'fast', 'quiet', 'loud', 'builds', 'fades'],
    question: 'How does the energy move across the cue?',
    why: 'A cue needs a shape, not a level.',
    suggestions: ['starts near-silent, ends at full cry', 'one long held breath, no release', 'stutters upward in three waves'],
    proseLines: [
      'Energy curve: near-silent open, two false builds, full cry at the final third.',
      'Energy curve: one long held breath with the percussion tightening like a fist — no release.',
    ],
  },
  {
    id: 'signature-sound',
    label: 'signature sound',
    keywords: ['hook', 'signature', 'motif', 'solo', 'lead', 'voice', 'sample'],
    question: 'What is the one sound the reader will remember?',
    why: 'One hook beats a wall of texture.',
    suggestions: ['a corrupted vocal sample', 'one bell hit per bar', 'a leaking air hose keeping time'],
    proseLines: [
      'Signature sound: a corrupted vocal sample that surfaces once per section, always mid-word.',
      'Signature sound: a single bell hit per bar, tuned slightly wrong on purpose.',
    ],
  },
];

const DIALOGUE_SCENE_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'want',
    label: 'who wants what',
    keywords: ['wants', 'needs', 'asks', 'demands', 'argues', 'confronts', 'tries'],
    question: 'In this beat, who wants what from whom?',
    why: 'Dialogue without a want is decoration.',
    suggestions: ['Kaira wants the code, Cipher wants her gone', 'both want the same exit', 'one wants the truth, one wants out'],
    proseLines: [
      'Stakes of the beat: one wants the code, the other wants them gone before the drones arrive.',
      'Both want the same exit, which is exactly why neither can take it.',
    ],
  },
  {
    id: 'turn',
    label: 'the turn',
    keywords: ['turns', 'reveals', 'changes', 'shifts', 'escalates', 'until', 'then', 'betrays', 'realizes'],
    question: 'Where does the conversation turn?',
    why: 'A scene is a machine for one turn.',
    suggestions: ['mid-scene reveal flips who has leverage', 'the plea becomes a threat', 'the quiet answer lands harder than the shout'],
    proseLines: [
      'The turn: a mid-scene reveal flips who holds the leverage without anyone raising their voice.',
      'The turn: the plea becomes a threat in exactly one sentence.',
    ],
  },
  {
    id: 'sfx',
    label: 'sound design',
    keywords: ['gunfire', 'sfx', 'explosion', 'thunder', 'crash', 'alarm', 'silence', 'rain', 'drone'],
    question: 'One sound effect opportunity?',
    why: 'Letterers need ammo.',
    suggestions: ['a fuse tripping somewhere off-panel', 'the drone rotor whine arriving late', 'total silence after the gunshot'],
    proseLines: [
      'SFX opportunity: a fuse trips somewhere off-panel two beats before anything happens.',
      'SFX opportunity: total silence for one panel after the gunshot — the letterer’s favorite page.',
    ],
  },
];

const STORY_LOGLINE_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'stakes',
    label: 'stakes & clock',
    keywords: ['before', 'deadline', 'must', 'or else', 'stakes', 'save', 'stop', 'race'],
    question: 'What happens if they fail — and by when?',
    why: 'A logline without stakes is a setting.',
    suggestions: ['before the district is demolished', 'or her sister’s debt is sold', 'before the last train out'],
    proseLines: [
      'If they fail, the district is demolished with the archives still inside.',
      'The deadline is not negotiable: her sister’s debt gets sold at midnight.',
    ],
  },
  {
    id: 'irony',
    label: 'the ironic bind',
    keywords: ['only', 'but', 'forced', 'must', 'hate', 'was', 'former', 'once'],
    question: 'What is the cruel irony of the bind?',
    why: 'Irony is what makes a premise feel inevitable.',
    suggestions: ['needs the person she betrayed', 'must protect what she came to destroy', 'the cure requires the disease'],
    proseLines: [
      'The cruel bind: success requires the exact person she burned to get here.',
      'The cruel bind: to protect what she came to destroy, she has to become its best defender.',
    ],
  },
];

const BUBBLE_DIMENSIONS: ForgeDimension[] = [
  {
    id: 'voice',
    label: 'voice preservation',
    keywords: [],
    question: 'Anything about their voice to keep absolutely intact?',
    why: 'The forge tightens rhythm — never vocabulary that carries identity.',
    suggestions: ['keep my exact wording', 'keep the slang, cut the rest'],
    clauses: [],
    proseLines: [],
  },
];

export const FORGE_DOMAIN_PROFILES: Record<PromptForgeDomain, ForgeDomainProfile> = {
  'image-prompt': {
    label: 'FRAME PROMPT',
    format: 'comma',
    specialist:
      'You refine text-to-image prompts for cinematic cyberpunk comic frames. Weave in — only where missing — lens and optics, lighting design, atmosphere, palette logic, composition and material specifics. Output is a comma-separated clause stream, most important clauses first, no full sentences.',
    dimensions: IMAGE_PROMPT_DIMENSIONS,
  },
  'image-negative': {
    label: 'NEGATIVE PROMPT',
    format: 'comma',
    specialist:
      'You refine negative prompts: a dense, comma-separated list of things to exclude. Organize into families — optical artifacts, anatomical failures, text artifacts, rendering artifacts, style violations — using precise artifact vocabulary. Lowercase, no sentences, no explanations.',
    dimensions: IMAGE_NEGATIVE_DIMENSIONS,
  },
  'image-variation': {
    label: 'EDIT INSTRUCTION',
    format: 'comma',
    specialist:
      'You refine image-to-image edit instructions into precise directives: one unambiguous action verb, a spatial anchor for where, and an explicit preservation clause for what must not change. Comma-separated fragments, verb first.',
    dimensions: IMAGE_VARIATION_DIMENSIONS,
  },
  'character-visual': {
    label: 'VISUAL PROFILE',
    format: 'comma',
    specialist:
      'You refine a comic character’s visual identity brief: silhouette readability, wardrobe logic, wear and damage history, chromatic identity, one signature detail. Concrete, drawable nouns only — nothing psychological that a camera cannot see. Comma-separated clause stream.',
    dimensions: CHARACTER_VISUAL_DIMENSIONS,
  },
  'character-backstory': {
    label: 'OPERATIONAL HISTORY',
    format: 'prose',
    specialist:
      'You refine a character backstory and motivation into structured prose: the wound (a dated event, not a summary), want versus need, the defining contradiction, an active grudge, and a current hook the story can fire. Concrete events with names and prices. 3–6 sentences.',
    dimensions: CHARACTER_BACKSTORY_DIMENSIONS,
  },
  'lore-description': {
    label: 'WORLD ENTRY',
    format: 'prose',
    specialist:
      'You refine a worldbuilding entry into prose a reader can feel: sensory texture, the local economy of what changes hands, one concrete law or custom, and public perception versus reality. Specific nouns, no travel-brochure adjectives. 3–5 sentences.',
    dimensions: LORE_DESCRIPTION_DIMENSIONS,
  },
  'lore-secret': {
    label: 'CLASSIFIED HOOK',
    format: 'prose',
    specialist:
      'You refine a classified plot hook: the hidden mechanism of the secret, who profits from it staying hidden, the cost of discovery, and one trigger event a writer can fire in a scene. Treat it like a heist briefing. 2–4 sentences.',
    dimensions: LORE_SECRET_DIMENSIONS,
  },
  'style-scene': {
    label: 'SCENE SYNTHESIS',
    format: 'comma',
    specialist:
      'You refine rough scene ideas into production-grade image prompts for this studio’s art direction. Weave in only missing dimensions: optics, lighting, atmosphere, palette, composition, materials. Comma-separated clause stream, most important first.',
    dimensions: IMAGE_PROMPT_DIMENSIONS,
  },
  'style-palette': {
    label: 'PALETTE THEME',
    format: 'comma',
    specialist:
      'You refine a color palette theme into a working palette brief: hue hierarchy with roles, temperature strategy, one accent rule, and the light sources that justify the hues. Comma-separated clauses.',
    dimensions: STYLE_PALETTE_DIMENSIONS,
  },
  'soundtrack-score': {
    label: 'SCORE BRIEF',
    format: 'prose',
    specialist:
      'You refine a scene description into a music brief: instrumentation with era and texture, tempo feel in BPM terms, the energy curve across the cue, production grain, and one signature sound. Prose, 2–4 sentences.',
    dimensions: SOUNDTRACK_DIMENSIONS,
  },
  'dialogue-scene': {
    label: 'PANEL SCRIPT BEAT',
    format: 'prose',
    specialist:
      'You refine a panel-scene description into a letterable beat: who wants what from whom, the single turn of the scene, spatial anchors that give balloons room, and one sound-effect opportunity. Prose, 2–4 sentences.',
    dimensions: DIALOGUE_SCENE_DIMENSIONS,
  },
  'dialogue-bubble': {
    label: 'BALLOON TEXT',
    format: 'bubble',
    specialist:
      'You refine comic balloon text. Preserve the character’s exact voice and most characterful word choices; tighten to balloon economy — speech balloons breathe best under fifteen words, captions run present tense, whispers end on ellipses, screams in caps. Never add narration inside a speech balloon. Output only the balloon text.',
    dimensions: BUBBLE_DIMENSIONS,
  },
  'story-logline': {
    label: 'LOGLINE',
    format: 'logline',
    specialist:
      'You refine a story logline: an adjective-laden protagonist, the inciting conflict, the stakes with a clock, and one cruel irony. ONE sentence, under 45 words, present tense. If the draft is already close, perfect its rhythm — never bloat it.',
    dimensions: STORY_LOGLINE_DIMENSIONS,
  },
};

/** Cliché padding the engine itself must never add (the author’s own words are theirs to keep). */
export const FORGE_BANNED_CLICHES: string[] = [
  'masterpiece',
  'trending on artstation',
  '8k',
  'ultra detailed',
  'ultra-detailed',
  'highly detailed',
  'best quality',
  'epic',
  'stunning',
  'gorgeous',
  'amazing',
  'award winning',
  'award-winning',
  'breathtaking',
];

/** Words too common to count as protectable core terms. */
export const FORGE_STOPWORDS: Set<string> = new Set([
  'the', 'and', 'with', 'that', 'this', 'from', 'into', 'onto', 'over', 'under', 'about', 'after', 'before',
  'while', 'very', 'just', 'like', 'some', 'them', 'they', 'their', 'there', 'here', 'have', 'has', 'had',
  'will', 'would', 'could', 'should', 'been', 'being', 'were', 'which', 'when', 'what', 'where', 'your',
  'scene', 'character', 'image', 'prompt', 'style', 'something', 'anything', 'everything', 'someone',
  'against', 'between', 'through', 'during', 'because', 'without', 'within', 'along', 'across', 'around',
]);

/** All detection keywords across a domain’s dimensions (engine vocabulary, not protectable terms). */
export function forgeDomainVocabulary(dimensions: ForgeDimension[]): Set<string> {
  const vocabulary = new Set<string>();
  for (const dimension of dimensions) {
    for (const keyword of dimension.keywords) vocabulary.add(keyword);
  }
  return vocabulary;
}

export function getForgeDomainProfile(domain: PromptForgeDomain): ForgeDomainProfile {
  return FORGE_DOMAIN_PROFILES[domain];
}
