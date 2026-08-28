import React, { useState } from 'react';
import { SettingsIcon } from '../icons/SettingsIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { ExportIcon } from '../icons/ExportIcon';
import { LoadIcon } from '../icons/LoadIcon';
import { CheckIcon } from '../icons/CheckIcon';
import PromptForgeDock from '../promptforge/PromptForgeDock';
import { AlertIcon } from '../icons/AlertIcon';
import { ResetIcon } from '../icons/ResetIcon';
import {
  ProjectSettingsData,
  Character,
  LoreEntry,
  ColorPalette,
  ArtStylePreset,
  ComicPage,
  SoundtrackTrack,
} from '../../types';
import {
  initialCharacters,
  initialLoreEntries,
  initialColorPalettes,
  initialArtStyles,
  initialComicPages,
  initialProjectSettings,
  initialSoundtracks,
} from '../../data/initialProjectData';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface ProjectSettingsViewProps {
  settings: ProjectSettingsData;
  setSettings: React.Dispatch<React.SetStateAction<ProjectSettingsData>>;
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  loreEntries: LoreEntry[];
  setLoreEntries: React.Dispatch<React.SetStateAction<LoreEntry[]>>;
  colorPalettes: ColorPalette[];
  setColorPalettes: React.Dispatch<React.SetStateAction<ColorPalette[]>>;
  artStyles: ArtStylePreset[];
  setArtStyles: React.Dispatch<React.SetStateAction<ArtStylePreset[]>>;
  comicPages: ComicPage[];
  setComicPages: React.Dispatch<React.SetStateAction<ComicPage[]>>;
  soundtracks: SoundtrackTrack[];
  setSoundtracks: React.Dispatch<React.SetStateAction<SoundtrackTrack[]>>;
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

const PHASES = [
  'Pre-Production & Worldbuilding',
  'Scripting & Plot Graphing',
  'Storyboard & Thumbnails',
  'Frame Generation & Inking',
  'Panel Assembly & Lettering',
  'Post-Production & Publishing',
];

const ProjectSettingsView: React.FC<ProjectSettingsViewProps> = ({
  settings,
  setSettings,
  characters,
  setCharacters,
  loreEntries,
  setLoreEntries,
  colorPalettes,
  setColorPalettes,
  artStyles,
  setArtStyles,
  comicPages,
  setComicPages,
  soundtracks,
  setSoundtracks,
  addActivity,
}) => {
  const [formData, setFormData] = useState<ProjectSettingsData>(settings);
  const [genreInput, setGenreInput] = useState(settings.genre.join(', '));
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSave = () => {
    if (!formData.title.trim()) {
      setError('Project title cannot be empty.');
      return;
    }

    const updatedGenres = genreInput.split(',').map((g) => g.trim()).filter(Boolean);
    const updated = {
      ...formData,
      genre: updatedGenres.length > 0 ? updatedGenres : ['Cyberpunk'],
    };

    setSettings(updated);
    setError(null);
    showToast('Project settings saved successfully!');
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `updated project settings for "${updated.title}".`,
    });
  };

  const handleExportFullBackup = () => {
    const fullBackup = {
      exportDate: new Date().toISOString(),
      version: '1.0.0',
      settings: formData,
      characters,
      loreEntries,
      colorPalettes,
      artStyles,
      comicPages,
      soundtracks,
    };

    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `project_${formData.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_backup.json`;
    link.click();

    showToast('Full project backup archive downloaded (JSON)!');
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: 'exported a complete Project Backup Archive.',
    });
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.settings && json.characters) {
          if (json.settings) {
            setSettings(json.settings);
            setFormData(json.settings);
            setGenreInput(json.settings.genre?.join(', ') || '');
          }
          if (json.characters) setCharacters(json.characters);
          if (json.loreEntries) setLoreEntries(json.loreEntries);
          if (json.colorPalettes) setColorPalettes(json.colorPalettes);
          if (json.artStyles) setArtStyles(json.artStyles);
          if (json.comicPages) setComicPages(json.comicPages);
          if (json.soundtracks) setSoundtracks(json.soundtracks);

          showToast('Project successfully restored from backup archive!');
          addActivity({
            imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
            userName: 'You',
            action: 'restored project state from a backup file.',
          });
        } else {
          setError('Invalid backup archive structure.');
        }
      } catch (err) {
        console.error(err);
        setError('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToDemo = () => {
    if (window.confirm('Reset all project data to the demo defaults for Project Midnight City?')) {
      setSettings(initialProjectSettings);
      setFormData(initialProjectSettings);
      setGenreInput(initialProjectSettings.genre.join(', '));
      setCharacters(initialCharacters);
      setLoreEntries(initialLoreEntries);
      setColorPalettes(initialColorPalettes);
      setArtStyles(initialArtStyles);
      setComicPages(initialComicPages);
      setSoundtracks(initialSoundtracks);

      showToast('Reset project data to standard demo state.');
      addActivity({
        imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
        userName: 'You',
        action: 'reset the project to default demo configuration.',
      });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-cyan-400" />
            <h2 className="text-4xl font-extrabold text-slate-100 tracking-tight">Project Settings</h2>
          </div>
          <p className="mt-2 text-slate-400">
            Configure project metadata, production goals, creative credits, and manage full-state backups.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold shadow-lg shadow-cyan-900/40 transition-all"
          >
            <SaveIcon className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Section 1: Core Project Metadata */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
          Graphic Novel Metadata
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Project Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Subtitle / Series Line</label>
            <input
              type="text"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Story Logline & Hook</label>
          <PromptForgeDock
            domain="story-logline"
            value={formData.logline}
            onApply={(next) => setFormData({ ...formData, logline: next })}
            hints={[formData.title, formData.subtitle]}
          >
            <textarea
              value={formData.logline}
              onChange={(e) => setFormData({ ...formData, logline: e.target.value })}
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 pr-9 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500 resize-y"
            />
          </PromptForgeDock>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Genres (Comma separated)</label>
            <input
              type="text"
              value={genreInput}
              onChange={(e) => setGenreInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Demographic</label>
            <input
              type="text"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Age Rating</label>
            <select
              value={formData.ageRating}
              onChange={(e) => setFormData({ ...formData, ageRating: e.target.value })}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-cyan-500"
            >
              <option value="All Ages">All Ages</option>
              <option value="Teen (13+)">Teen (13+)</option>
              <option value="Mature 17+">Mature 17+</option>
              <option value="Adults Only (18+)">Adults Only (18+)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section 2: Creative Team Credits */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">Creative Team & Credits</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Writer / Author</label>
            <input
              type="text"
              value={formData.team.writer}
              onChange={(e) =>
                setFormData({ ...formData, team: { ...formData.team, writer: e.target.value } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Lead Artist / Penciler</label>
            <input
              type="text"
              value={formData.team.artist}
              onChange={(e) =>
                setFormData({ ...formData, team: { ...formData.team, artist: e.target.value } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Colorist</label>
            <input
              type="text"
              value={formData.team.colorist}
              onChange={(e) =>
                setFormData({ ...formData, team: { ...formData.team, colorist: e.target.value } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Letterer / Editor</label>
            <input
              type="text"
              value={formData.team.letterer}
              onChange={(e) =>
                setFormData({ ...formData, team: { ...formData.team, letterer: e.target.value } })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Production Goals & Milestones */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
          Production Goals & Milestones
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Pages</label>
            <input
              type="number"
              value={formData.goals.targetPages}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  goals: { ...formData.goals, targetPages: Number(e.target.value) },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Chapters</label>
            <input
              type="number"
              value={formData.goals.targetChapters}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  goals: { ...formData.goals, targetChapters: Number(e.target.value) },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Chapter</label>
            <input
              type="number"
              value={formData.goals.currentChapter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  goals: { ...formData.goals, currentChapter: Number(e.target.value) },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Current Phase</label>
            <select
              value={formData.goals.currentPhase}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  goals: { ...formData.goals, currentPhase: e.target.value },
                })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200"
            >
              {PHASES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 4: Global Project State & Backups */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 space-y-6">
        <h3 className="text-lg font-bold text-slate-100 border-b border-slate-800 pb-3">
          Data Management & State Backups
        </h3>
        <p className="text-xs text-slate-400">
          Save full JSON snapshots of all characters, lore, story graphs, comic pages, color palettes, and soundtracks.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* Download Backup */}
          <button
            onClick={handleExportFullBackup}
            className="flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold transition-all shadow-md"
          >
            <ExportIcon className="w-4 h-4 text-cyan-400" />
            <span>Download Backup (JSON)</span>
          </button>

          {/* Import Backup */}
          <label className="flex items-center justify-center gap-2 p-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-slate-200 text-xs font-bold cursor-pointer transition-all shadow-md">
            <LoadIcon className="w-4 h-4 text-cyan-400" />
            <span>Restore From File (JSON)</span>
            <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
          </label>

          {/* Reset Demo */}
          <button
            onClick={handleResetToDemo}
            className="flex items-center justify-center gap-2 p-4 bg-red-950/40 hover:bg-red-900/50 border border-red-800/60 rounded-xl text-red-300 text-xs font-bold transition-all shadow-md"
          >
            <ResetIcon className="w-4 h-4 text-red-400" />
            <span>Reset Demo Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSettingsView;
