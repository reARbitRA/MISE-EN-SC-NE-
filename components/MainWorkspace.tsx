import React, { useState } from 'react';
import DashboardCard from './DashboardCard';
import { PlusIcon } from './icons/PlusIcon';
import { AlertIcon } from './icons/AlertIcon';
import { FrameGeneratorIcon } from './icons/FrameGeneratorIcon';
import { PanelAssemblerIcon } from './icons/PanelAssemblerIcon';
import { LoreKeeperIcon } from './icons/LoreKeeperIcon';
import { StyleAlchemistIcon } from './icons/StyleAlchemistIcon';
import { SoundtrackComposerIcon } from './icons/SoundtrackComposerIcon';
import { CharactersIcon } from './icons/CharactersIcon';
import { StoryflowIcon } from './icons/StoryflowIcon';
import { ExportIcon } from './icons/ExportIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { CheckIcon } from './icons/CheckIcon';
import { GoogleGenAI } from '@google/genai';
import type { ActivityItemProps } from './ContextualSmartPanel';
import { View } from '../App';
import {
  Character,
  LoreEntry,
  ColorPalette,
  ArtStylePreset,
  ComicPage,
  ProjectSettingsData,
} from '../types';

interface MainWorkspaceProps {
  recentFrames: string[];
  settings: ProjectSettingsData;
  characters: Character[];
  loreEntries: LoreEntry[];
  colorPalettes: ColorPalette[];
  artStyles: ArtStylePreset[];
  comicPages: ComicPage[];
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
  onNavigate: (view: View) => void;
}

const MainWorkspace: React.FC<MainWorkspaceProps> = ({
  recentFrames,
  settings,
  characters,
  loreEntries,
  colorPalettes,
  artStyles,
  comicPages,
  addActivity,
  onNavigate,
}) => {
  const [storySummary, setStorySummary] = useState('');
  const [isStoryLoading, setIsStoryLoading] = useState(false);

  const [continuityFix, setContinuityFix] = useState('');
  const [isContinuityLoading, setIsContinuityLoading] = useState(false);
  const [resolvedContinuity, setResolvedContinuity] = useState(false);

  const totalPanels = comicPages.reduce((acc, p) => acc + p.panels.length, 0);

  const handleGetStorySummary = async () => {
    if (storySummary) {
      setStorySummary('');
      return;
    }
    setIsStoryLoading(true);
    setStorySummary('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Provide a high-octane 3-sentence plot summary for '${settings.title}' (${settings.subtitle}), focusing on the clash between lead character ${characters[0]?.name || 'the protagonist'} and corporate security in Midnight City.`,
      });
      setStorySummary(response.text);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Nexus AI',
        action: 'summarized project story progression.',
      });
    } catch (e) {
      console.error(e);
      setStorySummary('Failed to generate summary. Please try again.');
    } finally {
      setIsStoryLoading(false);
    }
  };

  const handleResolveContinuity = async () => {
    setIsContinuityLoading(true);
    setContinuityFix('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `In a cyberpunk graphic novel, character "${characters[0]?.name || 'Kaira'}" is wearing a dark leather trench coat in Frame #117 but appears with a luminous neon windbreaker in Frame #118. Give an in-universe narrative justification (e.g. adaptive chameleonic polymer or secondary jacket) and an inking artist directive.`,
      });
      setContinuityFix(response.text);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Continuity Guardian',
        action: 'resolved outfit continuity mismatch.',
      });
    } catch (e) {
      console.error(e);
      setContinuityFix('Failed to get suggestion. Please try again.');
    } finally {
      setIsContinuityLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto halftone-bg">
      {/* "THE WAR ROOM" Hero Deck */}
      <div className="relative bg-[#1A1A24] border-2 border-[#FF2244] p-6 sm:p-8 shadow-[8px_8px_0px_#0A0A0F] glow-crimson">
        {/* Decorative corner stamps */}
        <div className="absolute top-2 right-2 text-[9px] font-mono-code text-[#FF2244] border border-[#FF2244] px-2 py-0.5 uppercase tracking-widest bg-[#0A0A0F]">
          CONFIDENTIAL // NEXUS DECK
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono-code font-bold uppercase tracking-widest text-[#00E5FF] flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#00E5FF] animate-ping"></span>
                PROJECT CONTROL DECK
              </span>
              <span className="text-[#2E2E3A]">•</span>
              <span className="text-xs text-[#C8C0B8] font-mono-code">{settings.goals.currentPhase}</span>
            </div>
            <h2 className="font-display text-4xl sm:text-5xl text-[#C8C0B8] tracking-wider uppercase leading-none">
              {settings.title} <span className="text-[#FF2244] font-normal block sm:inline">— {settings.subtitle}</span>
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-[#8A8490] font-mono-code max-w-2xl leading-relaxed">
              {settings.logline}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('Frame Generator')}
              className="flex items-center gap-2 px-5 py-3 bg-[#FF2244] hover:bg-[#FF2244]/90 text-[#0A0A0F] font-heading font-bold uppercase tracking-wider shadow-[4px_4px_0px_#0A0A0F] transition-all text-sm border border-[#FF2244] active:translate-x-0.5 active:translate-y-0.5"
            >
              <PlusIcon className="w-4 h-4 stroke-[3]" />
              <span>PROJECT FRAMES</span>
            </button>
            <button
              onClick={() => onNavigate('Export Project')}
              className="flex items-center gap-2 px-4 py-3 bg-[#0A0A0F] hover:bg-[#2E2E3A] border border-[#2E2E3A] text-[#C8C0B8] font-heading uppercase tracking-wider text-sm transition-all shadow-[4px_4px_0px_#0A0A0F]"
            >
              <ExportIcon className="w-4 h-4 text-[#00E5FF]" />
              <span>PRINT SHOP EXPORT</span>
            </button>
          </div>
        </div>
      </div>

      {/* Production Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div
          onClick={() => onNavigate('Characters')}
          className="bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] p-3.5 cursor-pointer transition-all hover:shadow-[4px_4px_0px_#0A0A0F] group"
        >
          <div className="flex items-center justify-between text-[#8A8490] mb-1">
            <span className="text-[10px] font-heading uppercase tracking-widest">Characters</span>
            <CharactersIcon className="w-4 h-4 text-[#FF2244] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-display text-[#C8C0B8]">{characters.length}</div>
          <div className="text-[9px] text-[#8A8490] mt-0.5 font-mono-code">Dossiers active</div>
        </div>

        <div
          onClick={() => onNavigate('Panel Assembler')}
          className="bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] p-3.5 cursor-pointer transition-all hover:shadow-[4px_4px_0px_#0A0A0F] group"
        >
          <div className="flex items-center justify-between text-[#8A8490] mb-1">
            <span className="text-[10px] font-heading uppercase tracking-widest">Pages & Panels</span>
            <PanelAssemblerIcon className="w-4 h-4 text-[#00E5FF] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-display text-[#C8C0B8]">
            {comicPages.length} <span className="text-xs font-mono-code text-[#8A8490]">({totalPanels} pnl)</span>
          </div>
          <div className="text-[9px] text-[#8A8490] mt-0.5 font-mono-code">Target: {settings.goals.targetPages} pgs</div>
        </div>

        <div
          onClick={() => onNavigate('Lore Keeper')}
          className="bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] p-3.5 cursor-pointer transition-all hover:shadow-[4px_4px_0px_#0A0A0F] group"
        >
          <div className="flex items-center justify-between text-[#8A8490] mb-1">
            <span className="text-[10px] font-heading uppercase tracking-widest">World Lore</span>
            <LoreKeeperIcon className="w-4 h-4 text-[#FFB800] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-display text-[#C8C0B8]">{loreEntries.length}</div>
          <div className="text-[9px] text-[#8A8490] mt-0.5 font-mono-code">Codex records</div>
        </div>

        <div
          onClick={() => onNavigate('Style Alchemist')}
          className="bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] p-3.5 cursor-pointer transition-all hover:shadow-[4px_4px_0px_#0A0A0F] group"
        >
          <div className="flex items-center justify-between text-[#8A8490] mb-1">
            <span className="text-[10px] font-heading uppercase tracking-widest">Palettes</span>
            <StyleAlchemistIcon className="w-4 h-4 text-[#00E5FF] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-display text-[#C8C0B8]">{colorPalettes.length}</div>
          <div className="text-[9px] text-[#8A8490] mt-0.5 font-mono-code">{artStyles.length} shaders</div>
        </div>

        <div
          onClick={() => onNavigate('Storyflow')}
          className="bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] p-3.5 cursor-pointer transition-all hover:shadow-[4px_4px_0px_#0A0A0F] group"
        >
          <div className="flex items-center justify-between text-[#8A8490] mb-1">
            <span className="text-[10px] font-heading uppercase tracking-widest">Plot Graph</span>
            <StoryflowIcon className="w-4 h-4 text-[#FF2244] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-display text-[#C8C0B8]">CH {settings.goals.currentChapter}</div>
          <div className="text-[9px] text-[#00E5FF] mt-0.5 font-mono-code">Nodes connected</div>
        </div>

        <div
          onClick={() => onNavigate('Soundtrack Composer')}
          className="bg-[#1A1A24] border border-[#2E2E3A] hover:border-[#FF2244] p-3.5 cursor-pointer transition-all hover:shadow-[4px_4px_0px_#0A0A0F] group"
        >
          <div className="flex items-center justify-between text-[#8A8490] mb-1">
            <span className="text-[10px] font-heading uppercase tracking-widest">Soundtrack</span>
            <SoundtrackComposerIcon className="w-4 h-4 text-[#2EFF6E] group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-display text-[#C8C0B8]">SYNTH</div>
          <div className="text-[9px] text-[#2EFF6E] mt-0.5 font-mono-code">Web Audio Active</div>
        </div>
      </div>

      {/* Main Grid: Studio Hub & AI Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Quick Start Studio Hub */}
        <DashboardCard
          className="xl:col-span-1 row-span-2 flex flex-col justify-between p-6 bg-[#1A1A24] border-2 border-[#2E2E3A] shadow-[6px_6px_0px_#0A0A0F]"
        >
          <div>
            <div className="flex items-center gap-3 mb-3 border-b border-[#2E2E3A] pb-3">
              <FrameGeneratorIcon className="w-7 h-7 text-[#FF2244]" />
              <h3 className="font-display text-2xl text-[#C8C0B8] uppercase">PRODUCTION STUDIOS</h3>
            </div>
            <p className="text-xs font-mono-code text-[#8A8490] leading-relaxed mb-5">
              Access the multi-modal generative creative pipeline tailored for graphic novel authors.
            </p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('Frame Generator')}
                className="w-full flex items-center justify-between p-3 bg-[#0A0A0F] hover:bg-[#2E2E3A] border border-[#2E2E3A] hover:border-[#FF2244] text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FrameGeneratorIcon className="w-5 h-5 text-[#FF2244]" />
                  <div>
                    <div className="text-xs font-heading uppercase text-[#C8C0B8] group-hover:text-[#FF2244]">Frame Generator</div>
                    <div className="text-[10px] font-mono-code text-[#8A8490]">AI Image projection booth</div>
                  </div>
                </div>
                <span className="text-[#8A8490] group-hover:text-[#FF2244] font-mono-code">→</span>
              </button>

              <button
                onClick={() => onNavigate('Panel Assembler')}
                className="w-full flex items-center justify-between p-3 bg-[#0A0A0F] hover:bg-[#2E2E3A] border border-[#2E2E3A] hover:border-[#00E5FF] text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <PanelAssemblerIcon className="w-5 h-5 text-[#00E5FF]" />
                  <div>
                    <div className="text-xs font-heading uppercase text-[#C8C0B8] group-hover:text-[#00E5FF]">Panel Assembler</div>
                    <div className="text-[10px] font-mono-code text-[#8A8490]">Cutting mat layout & lettering</div>
                  </div>
                </div>
                <span className="text-[#8A8490] group-hover:text-[#00E5FF] font-mono-code">→</span>
              </button>

              <button
                onClick={() => onNavigate('Style Alchemist')}
                className="w-full flex items-center justify-between p-3 bg-[#0A0A0F] hover:bg-[#2E2E3A] border border-[#2E2E3A] hover:border-[#FFB800] text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <StyleAlchemistIcon className="w-5 h-5 text-[#FFB800]" />
                  <div>
                    <div className="text-xs font-heading uppercase text-[#C8C0B8] group-hover:text-[#FFB800]">Style Alchemist</div>
                    <div className="text-[10px] font-mono-code text-[#8A8490]">Color darkroom & lighting theater</div>
                  </div>
                </div>
                <span className="text-[#8A8490] group-hover:text-[#FFB800] font-mono-code">→</span>
              </button>

              <button
                onClick={() => onNavigate('Soundtrack Composer')}
                className="w-full flex items-center justify-between p-3 bg-[#0A0A0F] hover:bg-[#2E2E3A] border border-[#2E2E3A] hover:border-[#2EFF6E] text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <SoundtrackComposerIcon className="w-5 h-5 text-[#2EFF6E]" />
                  <div>
                    <div className="text-xs font-heading uppercase text-[#C8C0B8] group-hover:text-[#2EFF6E]">Soundtrack Studio</div>
                    <div className="text-[10px] font-mono-code text-[#8A8490]">Oscilloscope & modular synth</div>
                  </div>
                </div>
                <span className="text-[#8A8490] group-hover:text-[#2EFF6E] font-mono-code">→</span>
              </button>
            </div>
          </div>

          <div className="pt-5 border-t border-[#2E2E3A]">
            <button
              onClick={() => onNavigate('Frame Generator')}
              className="w-full py-2.5 bg-[#FF2244] hover:bg-[#FF2244]/90 text-[#0A0A0F] font-heading font-bold text-sm uppercase tracking-wider transition-all shadow-[4px_4px_0px_#0A0A0F]"
            >
              LAUNCH FRAME GENERATOR
            </button>
          </div>
        </DashboardCard>

        {/* Recent Generated Frames */}
        <DashboardCard title="CONCEPT FRAME CACHE" className="xl:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {recentFrames.length > 0
              ? recentFrames.map((frame, index) => (
                  <div
                    key={index}
                    onClick={() => onNavigate('Frame Generator')}
                    className="relative group overflow-hidden aspect-video border-2 border-[#2E2E3A] hover:border-[#FF2244] bg-[#0A0A0F] cursor-pointer shadow-[2px_2px_0px_#0A0A0F]"
                  >
                    <img
                      src={frame}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[#0A0A0F]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 border-t border-[#FF2244]">
                      <span className="text-[10px] font-mono-code text-[#FF2244] font-bold">FRAME #{index + 1}</span>
                    </div>
                  </div>
                ))
              : [...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    onClick={() => onNavigate('Frame Generator')}
                    className="aspect-video bg-[#0A0A0F] border border-dashed border-[#2E2E3A] flex flex-col items-center justify-center text-[#8A8490] text-xs hover:border-[#FF2244] cursor-pointer"
                  >
                    <FrameGeneratorIcon className="w-5 h-5 mb-1 text-[#2E2E3A]" />
                    <span className="font-mono-code text-[10px]">FRAME SLOT {index + 1}</span>
                  </div>
                ))}
          </div>
        </DashboardCard>

        {/* Storyflow Narrative Progress */}
        <DashboardCard
          title="CHAPTER PROGRESSION"
          className="hover:border-[#00E5FF] transition-colors"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-heading uppercase text-[#C8C0B8]">
              CHAPTER {settings.goals.currentChapter}: {settings.subtitle}
            </h4>
            <span className="text-xs font-mono-code font-bold text-[#00E5FF]">65% COMPLETE</span>
          </div>

          <div className="w-full bg-[#0A0A0F] border border-[#2E2E3A] h-3 mb-4 overflow-hidden p-0.5">
            <div
              className="bg-[#FF2244] h-full transition-all duration-500"
              style={{ width: '65%' }}
            ></div>
          </div>

          {isStoryLoading ? (
            <div className="p-3 bg-[#0A0A0F] border border-[#2E2E3A] flex items-center gap-3">
              <svg className="animate-spin h-4 w-4 text-[#00E5FF]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-mono-code text-[#00E5FF]">SYNTHESIZING CHAPTER SYNOPSIS...</span>
            </div>
          ) : storySummary ? (
            <div className="text-xs text-[#C8C0B8] bg-[#0A0A0F] p-3 border border-[#2E2E3A] font-mono-code leading-relaxed">
              <div className="text-[10px] font-mono-code text-[#00E5FF] font-bold uppercase mb-1">
                AI NARRATIVE DIRECTIVE:
              </div>
              {storySummary}
            </div>
          ) : (
            <button
              onClick={handleGetStorySummary}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#1A1A24] hover:bg-[#2E2E3A] text-[#C8C0B8] text-xs font-heading uppercase tracking-wider border border-[#2E2E3A] hover:border-[#00E5FF] transition-all"
            >
              <SparklesIcon className="w-4 h-4 text-[#00E5FF]" />
              <span>GENERATE CHAPTER SUMMARY</span>
            </button>
          )}
        </DashboardCard>

        {/* Continuity Guardian Advisor */}
        <DashboardCard
          title="CONTINUITY GUARDIAN"
          className="border-[#FF2244]/40"
        >
          <div className="flex items-start space-x-3 mb-3">
            <div className="text-[#FF2244] mt-0.5">
              <AlertIcon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-heading text-xs text-[#FF2244] uppercase">WARDROBE DISCREPANCY FLAG</h4>
              <p className="text-xs text-[#8A8490] font-mono-code mt-0.5">
                "{characters[0]?.name || 'Protagonist'}" has coat variance between Frame #117 and #118.
              </p>
            </div>
          </div>

          {isContinuityLoading ? (
            <div className="p-3 bg-[#0A0A0F] border border-[#2E2E3A] flex items-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#FF2244]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-xs font-mono-code text-[#FF2244]">ANALYZING IN-UNIVERSE FIX...</span>
            </div>
          ) : continuityFix ? (
            <div className="space-y-2">
              <div className="text-xs text-[#C8C0B8] bg-[#0A0A0F] p-3 border border-[#2E2E3A] font-mono-code leading-relaxed">
                <h5 className="font-bold text-[10px] font-mono-code text-[#FF2244] uppercase mb-1">
                  CONTINUITY DIRECTIVE:
                </h5>
                {continuityFix}
              </div>
              <button
                onClick={() => setResolvedContinuity(true)}
                disabled={resolvedContinuity}
                className="w-full py-1.5 bg-[#2EFF6E]/10 hover:bg-[#2EFF6E]/20 border border-[#2EFF6E] text-[#2EFF6E] text-xs font-heading uppercase tracking-wider transition-all flex items-center justify-center gap-1.5"
              >
                <CheckIcon className="w-4 h-4 text-[#2EFF6E]" />
                <span>{resolvedContinuity ? 'FLAG RESOLVED' : 'MARK RESOLVED'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={handleResolveContinuity}
              className="w-full text-xs font-heading uppercase tracking-wider bg-[#FF2244]/10 hover:bg-[#FF2244]/20 text-[#FF2244] py-2.5 border border-[#FF2244] transition-colors"
            >
              RESOLVE CONTINUITY DIRECTIVE
            </button>
          )}
        </DashboardCard>
      </div>
    </div>
  );
};

export default MainWorkspace;

