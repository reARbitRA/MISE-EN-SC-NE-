import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { StyleAlchemistIcon } from '../icons/StyleAlchemistIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { CheckIcon } from '../icons/CheckIcon';
import PromptForgeDock from '../promptforge/PromptForgeDock';
import { PlusIcon } from '../icons/PlusIcon';
import { ExportIcon } from '../icons/ExportIcon';
import { AlertIcon } from '../icons/AlertIcon';
import { ColorPalette, ArtStylePreset, ColorSwatch, View } from '../../types';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface StyleAlchemistViewProps {
  colorPalettes: ColorPalette[];
  setColorPalettes: React.Dispatch<React.SetStateAction<ColorPalette[]>>;
  artStyles: ArtStylePreset[];
  setArtStyles: React.Dispatch<React.SetStateAction<ArtStylePreset[]>>;
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
  onNavigate: (view: View) => void;
}

const LIGHTING_OPTIONS = [
  'Volumetric Neon Rim Light',
  'Dark Chiaroscuro Shadows',
  'Bioluminescent Holographic Glow',
  'Golden Hour Corporate Spire',
  'Toxic Acid Rain Reflections',
  'Harsh Surveillance Floodlight',
];

const CAMERA_ANGLES = [
  'Dynamic Low-Angle Hero Shot',
  'Cinematic Dutch Tilt Angle',
  'Wide Architectural Establishing Shot',
  'Intense Close-Up Portrait',
  'Over-the-Shoulder Infiltration POV',
  'High-Angle Drone Surveillance',
];

const MEDIUM_STYLES = [
  'Graphic Novel Heavy Inking with Screentone',
  'Vintage 80s Anime Cel Animation',
  'European Ligne Claire Comic Art',
  'Modern Marvel Dynamic Cover Art',
  'Digital Concept Painting with Atmospheric Fog',
];

const StyleAlchemistView: React.FC<StyleAlchemistViewProps> = ({
  colorPalettes,
  setColorPalettes,
  artStyles,
  setArtStyles,
  addActivity,
  onNavigate,
}) => {
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // AI Prompt Synthesizer
  const [rawIdea, setRawIdea] = useState('');
  const [selectedStylePreset, setSelectedStylePreset] = useState<string>(artStyles[0]?.name || 'Cyberpunk Noir Dynamic Ink');
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [generatedPromptVariations, setGeneratedPromptVariations] = useState<
    Array<{ title: string; prompt: string; camera: string; mood: string }>
  >([]);

  // AI Palette Generator
  const [paletteTheme, setPaletteTheme] = useState('');
  const [isGeneratingPalette, setIsGeneratingPalette] = useState(false);

  // Interactive Prompt Formula Builder
  const [subject, setSubject] = useState('Kaira Vance confronting corporate guards');
  const [setting, setSetting] = useState('Neon Promenade wet alleyway at 3 AM');
  const [selectedLighting, setSelectedLighting] = useState(LIGHTING_OPTIONS[0]);
  const [selectedCamera, setSelectedCamera] = useState(CAMERA_ANGLES[0]);
  const [selectedMedium, setSelectedMedium] = useState(MEDIUM_STYLES[0]);

  // Add Custom Palette modal/form
  const [isAddingPalette, setIsAddingPalette] = useState(false);
  const [newPaletteName, setNewPaletteName] = useState('');
  const [newPaletteDesc, setNewPaletteDesc] = useState('');
  const [newColors, setNewColors] = useState<ColorSwatch[]>([
    { name: 'Dark Base', hex: '#0f172a', role: 'Background' },
    { name: 'Primary Neon', hex: '#06b6d4', role: 'Primary' },
    { name: 'Accent Glow', hex: '#d946ef', role: 'Accent' },
    { name: 'Muted Steel', hex: '#475569', role: 'Secondary' },
    { name: 'White Hot', hex: '#ffffff', role: 'Highlight' },
  ]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`Copied ${label} to clipboard!`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const assembledFormulaPrompt = `${subject}, in ${setting}, ${selectedMedium}, ${selectedLighting}, ${selectedCamera}, highly detailed, masterwork comic art.`;

  const handleSynthesizePrompts = async () => {
    if (!rawIdea.trim()) {
      setError('Please provide a scene concept or character action to synthesize.');
      return;
    }
    setIsGeneratingPrompts(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const promptText = `You are a master comic book art director for 'Project: Midnight City' (a high-end cyberpunk noir graphic novel).
User Concept: "${rawIdea}".
Style Aesthetic Target: "${selectedStylePreset}".

Generate 3 distinct, production-ready image generation prompts for comic frames.
Include dynamic framing, precise cinematic lighting, color contrast notes, and inking details.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING, description: 'Short evocative title for the shot' },
                prompt: { type: Type.STRING, description: 'Complete, optimized generation prompt' },
                camera: { type: Type.STRING, description: 'Cinematic camera angle and lens' },
                mood: { type: Type.STRING, description: 'Atmosphere and lighting mood' },
              },
              required: ['title', 'prompt', 'camera', 'mood'],
            },
          },
        },
      });

      const variations = JSON.parse(response.text.trim());
      setGeneratedPromptVariations(variations);
      showToast('Generated 3 stylized comic prompt variations!');
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Style Alchemist AI',
        action: `formulated 3 stylized comic visual prompts for "${rawIdea.substring(0, 25)}...".`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate prompts with AI.');
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  const handleGenerateAiPalette = async () => {
    setIsGeneratingPalette(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const promptText = `Generate an evocative 5-color cyberpunk color palette for 'Project Midnight City'.
Theme / Mood: "${paletteTheme.trim() || 'Dystopian Underlevel Neon Rain'}".
Return a creative palette name, description, and exactly 5 colors with accurate Hex codes and roles (Background, Primary, Accent, Secondary, Highlight).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: 'Creative palette name' },
              description: { type: Type.STRING, description: 'Visual rationale and color psychology' },
              colors: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Color name' },
                    hex: { type: Type.STRING, description: 'Hex code starting with #' },
                    role: {
                      type: Type.STRING,
                      enum: ['Background', 'Primary', 'Accent', 'Secondary', 'Highlight'],
                    },
                  },
                  required: ['name', 'hex', 'role'],
                },
              },
            },
            required: ['name', 'description', 'colors'],
          },
        },
      });

      const parsed = JSON.parse(response.text.trim());
      const newPalette: ColorPalette = {
        id: `pal-ai-${Date.now()}`,
        name: parsed.name,
        description: parsed.description,
        colors: parsed.colors,
      };

      setColorPalettes((prev) => [newPalette, ...prev]);
      setPaletteTheme('');
      showToast(`Created AI Palette: "${newPalette.name}"`);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Style Alchemist AI',
        action: `synthesized color harmony palette "${newPalette.name}".`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate palette.');
    } finally {
      setIsGeneratingPalette(false);
    }
  };

  const handleCreateCustomPalette = () => {
    if (!newPaletteName.trim()) {
      setError('Please provide a palette name.');
      return;
    }
    const newPal: ColorPalette = {
      id: `pal-custom-${Date.now()}`,
      name: newPaletteName.trim(),
      description: newPaletteDesc.trim() || 'Custom user-created palette.',
      colors: newColors,
    };
    setColorPalettes((prev) => [newPal, ...prev]);
    setIsAddingPalette(false);
    setNewPaletteName('');
    setNewPaletteDesc('');
    showToast(`Saved custom palette "${newPal.name}"`);
  };

  const handleExportStyleBible = () => {
    let markdown = `# Project: Midnight City - Visual Style Guide & Bible\n\n`;
    markdown += `Generated on ${new Date().toLocaleDateString()}\n\n---\n\n`;

    markdown += `## 🎨 Color Palettes & Harmonies\n\n`;
    colorPalettes.forEach((pal) => {
      markdown += `### ${pal.name}\n${pal.description}\n\n| Color | Hex | Role |\n|---|---|---|\n`;
      pal.colors.forEach((c) => {
        markdown += `| ${c.name} | \`${c.hex}\` | ${c.role} |\n`;
      });
      markdown += `\n---\n\n`;
    });

    markdown += `## 🖌️ Art Direction & Inking Presets\n\n`;
    artStyles.forEach((style) => {
      markdown += `### ${style.name} (${style.category})\n${style.description}\n\n`;
      markdown += `**Prompt Modifier:**\n\`${style.promptModifier}\`\n\n`;
      if (style.negativeModifier) {
        markdown += `**Negative Modifier:**\n\`${style.negativeModifier}\`\n\n`;
      }
      markdown += `---\n\n`;
    });

    const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'project_midnight_city_style_guide.md';
    link.click();

    showToast('Exported Visual Style Guide (Markdown)');
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: 'exported the project Visual Style Guide.',
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <StyleAlchemistIcon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-4xl font-extrabold text-slate-100 tracking-tight">Style Alchemist</h2>
          </div>
          <p className="mt-2 text-slate-400">
            Art direction studio, color harmony alchemist, and comic style formula synthesizer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportStyleBible}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
          >
            <ExportIcon className="w-4 h-4 text-cyan-400" />
            <span>Export Style Guide</span>
          </button>
          <button
            onClick={() => onNavigate('Frame Generator')}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-900/40 transition-all"
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Open Frame Generator</span>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      {notification && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-lg text-emerald-300 text-sm animate-fade-in">
          <CheckIcon className="w-5 h-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-950/70 border border-red-500/50 rounded-lg text-red-300 text-sm">
          <AlertIcon className="w-5 h-5 text-red-400" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 1: AI Prompt Synthesizer */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-800/80 to-cyan-950/30 border border-cyan-500/30 rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-cyan-400" />
            <h3 className="text-lg font-bold text-slate-100">AI Comic Prompt Synthesizer</h3>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
            Smart Art Director
          </span>
        </div>
        <p className="text-sm text-slate-400">
          Turn any rough story beat into three fully optimized, production-grade image prompts tailored to the Project Midnight City art direction.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Rough Scene Idea / Character Action
            </label>
            <PromptForgeDock
              domain="style-scene"
              value={rawIdea}
              onApply={setRawIdea}
              hints={[`art direction: ${selectedStylePreset}`]}
            >
              <input
                type="text"
                value={rawIdea}
                onChange={(e) => setRawIdea(e.target.value)}
                placeholder="e.g. Kaira hacking a neon vending machine while rain pours on her jacket"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pr-9 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleSynthesizePrompts()}
              />
            </PromptForgeDock>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Art Style</label>
            <select
              value={selectedStylePreset}
              onChange={(e) => setSelectedStylePreset(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            >
              {artStyles.map((style) => (
                <option key={style.id} value={style.name}>
                  {style.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={handleSynthesizePrompts}
            disabled={isGeneratingPrompts || !rawIdea.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
          >
            {isGeneratingPrompts ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Synthesizing Prompts...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                <span>Synthesize 3 Comic Prompts</span>
              </>
            )}
          </button>
        </div>

        {/* Output Variations */}
        {generatedPromptVariations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-700/60">
            {generatedPromptVariations.map((v, i) => (
              <div
                key={i}
                className="bg-slate-900/80 border border-slate-700 rounded-lg p-4 flex flex-col justify-between hover:border-cyan-500/50 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                      Option {i + 1}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {v.camera}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mb-2">{v.title}</h4>
                  <p className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 font-mono leading-relaxed mb-3">
                    {v.prompt}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">Mood: {v.mood}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => copyToClipboard(v.prompt, `Option ${i + 1} prompt`)}
                    className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <CopyIcon className="w-3.5 h-3.5" />
                    <span>{copiedText === v.prompt ? 'Copied!' : 'Copy Prompt'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: Interactive Prompt Formula Builder */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <div>
          <h3 className="text-xl font-bold text-slate-100">Formula Studio: Comic Shot Constructor</h3>
          <p className="text-sm text-slate-400 mt-1">
            Build geometrically structured prompts by combining subject, setting, inking medium, lighting, and camera angle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Subject & Action</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Location & Setting</label>
            <input
              type="text"
              value={setting}
              onChange={(e) => setSetting(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Inking Medium</label>
            <select
              value={selectedMedium}
              onChange={(e) => setSelectedMedium(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500"
            >
              {MEDIUM_STYLES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Lighting Dynamics</label>
            <select
              value={selectedLighting}
              onChange={(e) => setSelectedLighting(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500"
            >
              {LIGHTING_OPTIONS.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Camera Framing</label>
            <select
              value={selectedCamera}
              onChange={(e) => setSelectedCamera(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:ring-2 focus:ring-cyan-500"
            >
              {CAMERA_ANGLES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Assembled Prompt Preview */}
        <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Live Assembled Formula</span>
            <button
              onClick={() => copyToClipboard(assembledFormulaPrompt, 'Formula Prompt')}
              className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold transition-all shadow"
            >
              <CopyIcon className="w-3.5 h-3.5" />
              <span>{copiedText === assembledFormulaPrompt ? 'Copied!' : 'Copy Formula'}</span>
            </button>
          </div>
          <p className="text-sm text-slate-200 font-mono leading-relaxed bg-slate-900/90 p-3 rounded-lg border border-slate-800">
            {assembledFormulaPrompt}
          </p>
        </div>
      </div>

      {/* SECTION 3: Art Style Presets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Art Style Modifiers</h3>
            <p className="text-sm text-slate-400">
              Curated aesthetic formulas defining line density, screentone shading, and chromatic texture.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {artStyles.map((style) => (
            <div
              key={style.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                      {style.category}
                    </span>
                    <h4 className="text-xl font-extrabold text-slate-100 mt-2">{style.name}</h4>
                  </div>
                </div>

                <p className="text-sm text-slate-300 mb-4 leading-relaxed">{style.description}</p>

                <div className="space-y-2 mb-4">
                  <div className="text-xs font-mono text-slate-300 bg-slate-950 p-3 rounded border border-slate-800 leading-relaxed">
                    <span className="text-cyan-400 font-bold">Modifier: </span>
                    {style.promptModifier}
                  </div>
                  {style.negativeModifier && (
                    <div className="text-xs font-mono text-slate-400 bg-slate-950/70 p-2.5 rounded border border-slate-800">
                      <span className="text-red-400 font-bold">Negative: </span>
                      {style.negativeModifier}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <button
                  onClick={() => copyToClipboard(style.promptModifier, `${style.name} modifier`)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>{copiedText === style.promptModifier ? 'Copied!' : 'Copy Style Modifier'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 4: Color Palettes & Harmonies */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-slate-100">Color Harmonies & Palettes</h3>
            <p className="text-sm text-slate-400">
              Project Midnight City palette specifications with hex values and lighting roles.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddingPalette((p) => !p)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <PlusIcon className="w-4 h-4" />
              <span>{isAddingPalette ? 'Cancel' : 'Custom Palette'}</span>
            </button>
          </div>
        </div>

        {/* AI Palette Generator Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 whitespace-nowrap">
            <SparklesIcon className="w-4 h-4" />
            <span>AI Palette Synthesizer:</span>
          </div>
          <PromptForgeDock domain="style-palette" value={paletteTheme} onApply={setPaletteTheme} className="flex-1 min-w-0">
            <input
              type="text"
              value={paletteTheme}
              onChange={(e) => setPaletteTheme(e.target.value)}
              placeholder="e.g. Acid Neon Monsoon, Underground Cyber-Bazaar, Corporate Boardroom"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 pr-9 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              onKeyDown={(e) => e.key === 'Enter' && handleGenerateAiPalette()}
            />
          </PromptForgeDock>
          <button
            onClick={handleGenerateAiPalette}
            disabled={isGeneratingPalette}
            className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50 whitespace-nowrap shadow"
          >
            {isGeneratingPalette ? 'Synthesizing...' : 'Generate Harmony'}
          </button>
        </div>

        {/* Add Custom Palette Form */}
        {isAddingPalette && (
          <div className="bg-slate-800/90 border border-cyan-500/40 rounded-xl p-6 space-y-4 shadow-xl">
            <h4 className="text-md font-bold text-cyan-300">Create Custom Palette</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                value={newPaletteName}
                onChange={(e) => setNewPaletteName(e.target.value)}
                placeholder="Palette Name (e.g. Slum Underpass)"
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
              />
              <input
                type="text"
                value={newPaletteDesc}
                onChange={(e) => setNewPaletteDesc(e.target.value)}
                placeholder="Short description / mood"
                className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-slate-200"
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {newColors.map((col, idx) => (
                <div key={idx} className="space-y-1 bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{col.role}</span>
                  <input
                    type="color"
                    value={col.hex}
                    onChange={(e) => {
                      const updated = [...newColors];
                      updated[idx].hex = e.target.value;
                      setNewColors(updated);
                    }}
                    className="w-full h-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={col.name}
                    onChange={(e) => {
                      const updated = [...newColors];
                      updated[idx].name = e.target.value;
                      setNewColors(updated);
                    }}
                    placeholder="Color Name"
                    className="w-full bg-slate-950 border border-slate-800 text-[11px] p-1 rounded text-slate-300"
                  />
                  <span className="text-[10px] font-mono text-cyan-400 block text-center">{col.hex}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAddingPalette(false)}
                className="px-4 py-1.5 bg-slate-700 text-slate-300 rounded text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomPalette}
                className="px-5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-bold"
              >
                Save Palette
              </button>
            </div>
          </div>
        )}

        {/* Palettes List */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {colorPalettes.map((palette) => (
            <div
              key={palette.id}
              className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
            >
              <div>
                <h4 className="text-lg font-bold text-slate-100">{palette.name}</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">{palette.description}</p>

                {/* Swatches strip */}
                <div className="grid grid-cols-5 h-16 rounded-lg overflow-hidden border border-slate-700/60 shadow-inner mb-4">
                  {palette.colors.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => copyToClipboard(color.hex, `${color.name} (${color.hex})`)}
                      style={{ backgroundColor: color.hex }}
                      className="group relative flex items-center justify-center transition-transform hover:scale-105 hover:z-10 focus:outline-none"
                      title={`${color.name}: ${color.hex} (${color.role})`}
                    >
                      <span className="opacity-0 group-hover:opacity-100 text-[10px] font-bold px-1 py-0.5 rounded bg-slate-900/90 text-white font-mono transition-opacity shadow">
                        {color.hex}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Color Legend */}
                <div className="space-y-1.5">
                  {palette.colors.map((color, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-xs py-0.5 px-2 rounded hover:bg-slate-800/60 cursor-pointer"
                      onClick={() => copyToClipboard(color.hex, `${color.name} (${color.hex})`)}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-slate-300 font-medium">{color.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-500 uppercase">{color.role}</span>
                        <span className="font-mono text-cyan-400 text-[11px]">{color.hex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => {
                    const allHex = palette.colors.map((c) => `${c.name}: ${c.hex}`).join(', ');
                    copyToClipboard(allHex, `${palette.name} all colors`);
                  }}
                  className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
                >
                  <CopyIcon className="w-3.5 h-3.5" />
                  <span>Copy All Hex Codes</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleAlchemistView;
