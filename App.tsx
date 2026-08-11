import React, { useState } from 'react';
import Header from './components/Header';
import PrimaryNavRail from './components/PrimaryNavRail';
import MainWorkspace from './components/MainWorkspace';
import ContextualSmartPanel, { ActivityItemProps } from './components/ContextualSmartPanel';
import FrameGeneratorView from './components/views/FrameGeneratorView';
import CharactersView from './components/views/CharactersView';
import LoreKeeperView from './components/views/LoreKeeperView';
import StyleAlchemistView from './components/views/StyleAlchemistView';
import PanelAssemblerView from './components/views/PanelAssemblerView';
import SoundtrackComposerView from './components/views/SoundtrackComposerView';
import StoryflowView from './components/views/StoryflowView';
import ProjectSettingsView from './components/views/ProjectSettingsView';
import ExportProjectView from './components/views/ExportProjectView';

import {
  Character,
  LoreEntry,
  ColorPalette,
  ArtStylePreset,
  ComicPage,
  ProjectSettingsData,
  SoundtrackTrack,
} from './types';
import {
  initialCharacters,
  initialLoreEntries,
  initialColorPalettes,
  initialArtStyles,
  initialComicPages,
  initialProjectSettings,
  initialSoundtracks,
} from './data/initialProjectData';

const initialActivityFeed: ActivityItemProps[] = [
  {
    imgSrc: 'https://picsum.photos/seed/user1/40/40',
    userName: 'Alex',
    action: 'generated a new cyberpunk frame for Chapter 3.',
    time: '5 minutes ago',
  },
  {
    imgSrc: 'https://picsum.photos/seed/user2/40/40',
    userName: 'Mia',
    action: 'updated the character dossier for "Kaira Vance".',
    time: '20 minutes ago',
  },
  {
    imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
    userName: 'Style Alchemist',
    action: 'synthesized Neon Dystopia palette.',
    time: '1 hour ago',
  },
  {
    imgSrc: 'https://picsum.photos/seed/user3/40/40',
    userName: 'Chen',
    action: 'assembled Page 1 layout in Panel Assembler.',
    time: '2 hours ago',
  },
];

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

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('Nexus');
  const [recentFrames, setRecentFrames] = useState<string[]>([
    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=600&auto=format&fit=crop&q=80',
  ]);
  const [activityFeed, setActivityFeed] = useState<ActivityItemProps[]>(initialActivityFeed);

  // Application Global State
  const [settings, setSettings] = useState<ProjectSettingsData>(initialProjectSettings);
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [loreEntries, setLoreEntries] = useState<LoreEntry[]>(initialLoreEntries);
  const [colorPalettes, setColorPalettes] = useState<ColorPalette[]>(initialColorPalettes);
  const [artStyles, setArtStyles] = useState<ArtStylePreset[]>(initialArtStyles);
  const [comicPages, setComicPages] = useState<ComicPage[]>(initialComicPages);
  const [soundtracks, setSoundtracks] = useState<SoundtrackTrack[]>(initialSoundtracks);

  const addRecentFrame = (imageUrl: string) => {
    setRecentFrames((prev) => [imageUrl, ...prev].slice(0, 8));
    addActivity({
      imgSrc: `https://picsum.photos/seed/user-avatar/40/40`,
      userName: 'You',
      action: 'generated a new graphic novel concept frame.',
    });
  };

  const addActivity = (activity: Omit<ActivityItemProps, 'time'>) => {
    setActivityFeed((prev) => [{ ...activity, time: 'Just now' }, ...prev]);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'Nexus':
        return (
          <MainWorkspace
            recentFrames={recentFrames}
            settings={settings}
            characters={characters}
            loreEntries={loreEntries}
            colorPalettes={colorPalettes}
            artStyles={artStyles}
            comicPages={comicPages}
            addActivity={addActivity}
            onNavigate={setActiveView}
          />
        );
      case 'Frame Generator':
        return (
          <FrameGeneratorView
            addRecentFrame={addRecentFrame}
            addActivity={addActivity}
          />
        );
      case 'Characters':
        return (
          <CharactersView
            characters={characters}
            setCharacters={setCharacters}
            addActivity={addActivity}
          />
        );
      case 'Storyflow':
        return (
          <StoryflowView
            characters={characters}
            addActivity={addActivity}
          />
        );
      case 'Lore Keeper':
        return (
          <LoreKeeperView
            loreEntries={loreEntries}
            setLoreEntries={setLoreEntries}
            addActivity={addActivity}
          />
        );
      case 'Style Alchemist':
        return (
          <StyleAlchemistView
            colorPalettes={colorPalettes}
            setColorPalettes={setColorPalettes}
            artStyles={artStyles}
            setArtStyles={setArtStyles}
            addActivity={addActivity}
          />
        );
      case 'Panel Assembler':
        return (
          <PanelAssemblerView
            comicPages={comicPages}
            setComicPages={setComicPages}
            characters={characters}
            recentFrames={recentFrames}
            addActivity={addActivity}
          />
        );
      case 'Soundtrack Composer':
        return (
          <SoundtrackComposerView
            soundtracks={soundtracks}
            setSoundtracks={setSoundtracks}
            addActivity={addActivity}
          />
        );
      case 'Project Settings':
        return (
          <ProjectSettingsView
            settings={settings}
            setSettings={setSettings}
            characters={characters}
            setCharacters={setCharacters}
            loreEntries={loreEntries}
            setLoreEntries={setLoreEntries}
            colorPalettes={colorPalettes}
            setColorPalettes={setColorPalettes}
            artStyles={artStyles}
            setArtStyles={setArtStyles}
            comicPages={comicPages}
            setComicPages={setComicPages}
            soundtracks={soundtracks}
            setSoundtracks={setSoundtracks}
            addActivity={addActivity}
          />
        );
      case 'Export Project':
        return (
          <ExportProjectView
            settings={settings}
            characters={characters}
            loreEntries={loreEntries}
            colorPalettes={colorPalettes}
            artStyles={artStyles}
            comicPages={comicPages}
            addActivity={addActivity}
          />
        );
      default:
        return (
          <MainWorkspace
            recentFrames={recentFrames}
            settings={settings}
            characters={characters}
            loreEntries={loreEntries}
            colorPalettes={colorPalettes}
            artStyles={artStyles}
            comicPages={comicPages}
            addActivity={addActivity}
            onNavigate={setActiveView}
          />
        );
    }
  };

  const totalPanels = comicPages.reduce((acc, p) => acc + p.panels.length, 0);

  return (
    <div className="min-h-screen w-full bg-slate-950 font-sans flex flex-col selection:bg-cyan-500 selection:text-slate-950 text-slate-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <PrimaryNavRail activeView={activeView} onNavigate={setActiveView} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950">
          {renderActiveView()}
        </main>
        <ContextualSmartPanel
          recentFrames={recentFrames}
          activityFeed={activityFeed}
          characterCount={characters.length}
          loreCount={loreEntries.length}
          paletteCount={colorPalettes.length}
          comicPageCount={comicPages.length}
          totalPanelsCount={totalPanels}
          soundtrackCount={soundtracks.length}
          currentPhase={settings.goals.currentPhase}
        />
      </div>
    </div>
  );
};

export default App;
