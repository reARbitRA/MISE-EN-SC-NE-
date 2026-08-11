import React, { useState } from 'react';
import { ExportIcon } from '../icons/ExportIcon';
import { CopyIcon } from '../icons/CopyIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { CheckIcon } from '../icons/CheckIcon';
import {
  Character,
  LoreEntry,
  ColorPalette,
  ArtStylePreset,
  ComicPage,
  ProjectSettingsData,
} from '../../types';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface ExportProjectViewProps {
  settings: ProjectSettingsData;
  characters: Character[];
  loreEntries: LoreEntry[];
  colorPalettes: ColorPalette[];
  artStyles: ArtStylePreset[];
  comicPages: ComicPage[];
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

type ExportTab = 'bible' | 'script' | 'pitch' | 'characters' | 'json';

const ExportProjectView: React.FC<ExportProjectViewProps> = ({
  settings,
  characters,
  loreEntries,
  colorPalettes,
  artStyles,
  comicPages,
  addActivity,
}) => {
  const [activeTab, setActiveTab] = useState<ExportTab>('bible');
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Generate Master Bible Markdown
  const generateMasterBible = () => {
    let md = `# ${settings.title}\n`;
    md += `## ${settings.subtitle}\n\n`;
    md += `**Logline:** ${settings.logline}\n\n`;
    md += `**Genres:** ${settings.genre.join(', ')} | **Target Demographic:** ${settings.targetAudience} | **Rating:** ${settings.ageRating}\n\n`;
    md += `**Creative Team:** Writer: ${settings.team.writer}, Artist: ${settings.team.artist}, Colorist: ${settings.team.colorist}, Letterer: ${settings.team.letterer}\n\n`;
    md += `---\n\n`;

    md += `### 🎭 CHARACTER DOSSIERS\n\n`;
    characters.forEach((c) => {
      md += `#### ${c.name} (${c.role || 'Character'} - ${c.archetype})\n`;
      md += `**Alignment:** ${c.alignment || 'Unknown'}\n\n`;
      md += `**Visuals:** ${c.visuals}\n\n`;
      md += `**Backstory:** ${c.backstory}\n\n`;
      if (c.cyberware && c.cyberware.length > 0) {
        md += `**Cyberware / Augmentations:** ${c.cyberware.join(', ')}\n\n`;
      }
      md += `---\n\n`;
    });

    md += `### 🏙️ WORLDBUILDING & LORE BIBLE\n\n`;
    loreEntries.forEach((l) => {
      md += `#### [${l.category}] ${l.title}\n`;
      md += `**Tags:** ${l.tags.join(', ')}\n\n`;
      md += `${l.description}\n\n`;
      if (l.secrets) {
        md += `> **Classified Plot Secret:** ${l.secrets}\n\n`;
      }
      md += `---\n\n`;
    });

    md += `### 🎨 ART DIRECTION & COLOR GUIDE\n\n`;
    colorPalettes.forEach((pal) => {
      md += `**Palette: ${pal.name}** - ${pal.description}\n`;
      pal.colors.forEach((col) => {
        md += `- ${col.name} (\`${col.hex}\`): ${col.role}\n`;
      });
      md += `\n`;
    });

    return md;
  };

  // 2. Generate Comic Script Format
  const generateComicScript = () => {
    let script = `PROJECT: ${settings.title.toUpperCase()}\n`;
    script += `WRITTEN BY: ${settings.team.writer.toUpperCase()}\n`;
    script += `ART BY: ${settings.team.artist.toUpperCase()}\n\n`;
    script += `======================================================================\n\n`;

    comicPages.forEach((page) => {
      script += `PAGE ${page.pageNumber}: ${page.title.toUpperCase()}\n`;
      script += `Layout: ${page.layout.toUpperCase()}\n\n`;

      page.panels.forEach((p, idx) => {
        script += `PANEL ${idx + 1}\n`;
        script += `[Visual Shot]: ${p.label}\n\n`;
      });

      if (page.bubbles.length > 0) {
        script += `LETTERING & DIALOGUE:\n`;
        page.bubbles.forEach((b, bIdx) => {
          if (b.type === 'sfx') {
            script += `  (${bIdx + 1}) SFX: ${b.text}\n`;
          } else if (b.type === 'caption') {
            script += `  (${bIdx + 1}) CAPTION: ${b.text}\n`;
          } else {
            script += `  (${bIdx + 1}) ${b.speaker ? b.speaker.toUpperCase() : 'CHARACTER'}: "${b.text}"\n`;
          }
        });
      }

      script += `\n----------------------------------------------------------------------\n\n`;
    });

    return script;
  };

  // 3. Generate Executive Pitch One-Sheet
  const generatePitchDeck = () => {
    let pitch = `# EXECUTIVE PITCH ONE-SHEET: ${settings.title}\n\n`;
    pitch += `**Format:** Prestige Graphic Novel (${settings.goals.targetPages} Pages / ${settings.goals.targetChapters} Chapters)\n`;
    pitch += `**Comparable Titles:** Blade Runner 2049 meets Ghost in the Shell and Akira\n\n`;
    pitch += `### 📌 CORE LOGLINE\n${settings.logline}\n\n`;
    pitch += `### 🎯 TARGET AUDIENCE & THEMES\n`;
    pitch += `- **Demographic:** ${settings.targetAudience} (${settings.ageRating})\n`;
    pitch += `- **Core Themes:** The cost of transhumanism, corporate monopolization of memory, humanity vs synthetic sentience, rebellion against algorithmic destiny.\n\n`;
    pitch += `### ⚡ PROTAGONIST HOOK\n`;
    const lead = characters[0];
    if (lead) {
      pitch += `**${lead.name} (${lead.archetype}):** ${lead.backstory}\n\n`;
    }
    pitch += `### 🚀 PRODUCTION STATUS\n`;
    pitch += `- Current Phase: **${settings.goals.currentPhase}**\n`;
    pitch += `- Creative Team: ${settings.team.writer} (Writer), ${settings.team.artist} (Art Direction)\n`;

    return pitch;
  };

  // 4. Generate Character Dossiers Markdown
  const generateCharacterDossiers = () => {
    return JSON.stringify(characters, null, 2);
  };

  // 5. Generate Full State JSON
  const generateFullStateJson = () => {
    return JSON.stringify(
      {
        exportDate: new Date().toISOString(),
        settings,
        characters,
        loreEntries,
        colorPalettes,
        artStyles,
        comicPages,
      },
      null,
      2
    );
  };

  const getActiveContent = () => {
    switch (activeTab) {
      case 'bible':
        return { text: generateMasterBible(), filename: `${settings.title.toLowerCase().replace(/\s+/g, '_')}_master_bible.md`, type: 'text/markdown' };
      case 'script':
        return { text: generateComicScript(), filename: `${settings.title.toLowerCase().replace(/\s+/g, '_')}_script.txt`, type: 'text/plain' };
      case 'pitch':
        return { text: generatePitchDeck(), filename: `${settings.title.toLowerCase().replace(/\s+/g, '_')}_pitch_deck.md`, type: 'text/markdown' };
      case 'characters':
        return { text: generateCharacterDossiers(), filename: `${settings.title.toLowerCase().replace(/\s+/g, '_')}_characters.json`, type: 'application/json' };
      case 'json':
        return { text: generateFullStateJson(), filename: `${settings.title.toLowerCase().replace(/\s+/g, '_')}_complete_package.json`, type: 'application/json' };
    }
  };

  const currentOutput = getActiveContent();

  const handleCopy = () => {
    navigator.clipboard.writeText(currentOutput.text);
    setCopied(true);
    showToast('Copied content to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataUri = `data:${currentOutput.type};charset=utf-8,` + encodeURIComponent(currentOutput.text);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = currentOutput.filename;
    link.click();
    showToast(`Downloaded ${currentOutput.filename}!`);
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `exported ${currentOutput.filename}.`,
    });
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <ExportIcon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-4xl font-extrabold text-slate-100 tracking-tight">Export & Publishing Hub</h2>
          </div>
          <p className="mt-2 text-slate-400">
            Export production documents, comic scripts, pitch decks, character dossiers, and complete project archives.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-sm font-semibold transition-colors"
          >
            <CopyIcon className="w-4 h-4 text-cyan-400" />
            <span>{copied ? 'Copied!' : 'Copy to Clipboard'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-900/40 transition-all"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Download File</span>
          </button>
        </div>
      </div>

      {/* Notification */}
      {notification && (
        <div className="flex items-center gap-2 p-3 bg-emerald-950/70 border border-emerald-500/50 rounded-lg text-emerald-300 text-sm animate-fade-in">
          <CheckIcon className="w-5 h-5 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Export Format Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-slate-900/60 border border-slate-800 rounded-xl p-2">
        <button
          onClick={() => setActiveTab('bible')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'bible'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          📖 Master Project Bible (MD)
        </button>
        <button
          onClick={() => setActiveTab('script')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'script'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🎬 Industry Comic Script (TXT)
        </button>
        <button
          onClick={() => setActiveTab('pitch')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'pitch'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          📊 Executive Pitch Deck (MD)
        </button>
        <button
          onClick={() => setActiveTab('characters')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'characters'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          👤 Characters Dossiers (JSON)
        </button>
        <button
          onClick={() => setActiveTab('json')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'json'
              ? 'bg-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          📦 Full Project Package (JSON)
        </button>
      </div>

      {/* Live Preview Box */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-cyan-400 uppercase">Preview Target:</span>
            <span className="text-sm font-bold text-slate-200">{currentOutput.filename}</span>
          </div>
          <span className="text-xs text-slate-500 font-mono">
            {currentOutput.text.length} characters
          </span>
        </div>

        <pre className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-5 text-xs text-slate-300 font-mono leading-relaxed overflow-x-auto max-h-[600px] overflow-y-auto whitespace-pre-wrap select-text">
          {currentOutput.text}
        </pre>
      </div>
    </div>
  );
};

export default ExportProjectView;
