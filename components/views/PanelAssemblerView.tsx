import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { PanelAssemblerIcon } from '../icons/PanelAssemblerIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { DownloadIcon } from '../icons/DownloadIcon';
import { EditIcon } from '../icons/EditIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { AlertIcon } from '../icons/AlertIcon';
import { ComicPage, ComicPanelSlot, ComicBubble, PanelLayoutType, Character } from '../../types';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface PanelAssemblerViewProps {
  comicPages: ComicPage[];
  setComicPages: React.Dispatch<React.SetStateAction<ComicPage[]>>;
  recentFrames: string[];
  characters: Character[];
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

const LAYOUT_DEFINITIONS: Record<
  PanelLayoutType,
  { label: string; panelCount: number; defaultSlots: Array<{ label: string }> }
> = {
  '4-grid': {
    label: '4-Panel Classic Grid (2x2)',
    panelCount: 4,
    defaultSlots: [
      { label: 'Panel 1: Establishing Beat' },
      { label: 'Panel 2: Reaction / Dialogue' },
      { label: 'Panel 3: Escalation' },
      { label: 'Panel 4: Cliffhanger / Climax' },
    ],
  },
  '6-dynamic': {
    label: '6-Panel Dynamic Action',
    panelCount: 6,
    defaultSlots: [
      { label: 'Panel 1: Top Wide Establishing Shot' },
      { label: 'Panel 2: Action Beat A' },
      { label: 'Panel 3: Action Beat B' },
      { label: 'Panel 4: Action Beat C' },
      { label: 'Panel 5: Bottom Left Climax' },
      { label: 'Panel 6: Bottom Right Impact' },
    ],
  },
  '3-tier': {
    label: '3-Panel Cinematic Horizontal Tiers',
    panelCount: 3,
    defaultSlots: [
      { label: 'Tier 1: Top Panorama' },
      { label: 'Tier 2: Midground Duel' },
      { label: 'Tier 3: Widescreen Resolution' },
    ],
  },
  '5-manga': {
    label: '5-Panel Manga Hero Splash',
    panelCount: 5,
    defaultSlots: [
      { label: 'Hero Splash (Left Giant)' },
      { label: 'Panel 2: Top Right Focus' },
      { label: 'Panel 3: Mid Right Counter' },
      { label: 'Panel 4: Bottom Right Impact' },
      { label: 'Panel 5: Accent Cut' },
    ],
  },
  'splash-inset': {
    label: 'Full Splash with 2 Inset Panels',
    panelCount: 3,
    defaultSlots: [
      { label: 'Full Page Background Splash' },
      { label: 'Inset Panel 1: Eye Close-Up' },
      { label: 'Inset Panel 2: Weapon Trigger' },
    ],
  },
};

const SFX_PRESETS = ['KRAK-THOOM!', 'BZZZZT!', 'SLASH!', 'PEW-PEW!', 'SHHHK!', 'BOOOM!', 'CLANG!'];

const PanelAssemblerView: React.FC<PanelAssemblerViewProps> = ({
  comicPages,
  setComicPages,
  recentFrames,
  characters,
  addActivity,
}) => {
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>(null);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [isImagePickerOpen, setIsImagePickerOpen] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');
  const [isAiGeneratingDialogue, setIsAiGeneratingDialogue] = useState(false);
  const [dialogueScenePrompt, setDialogueScenePrompt] = useState('');
  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const currentPage = comicPages[currentPageIndex] || comicPages[0];

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateCurrentPage = (updater: (prevPage: ComicPage) => ComicPage) => {
    setComicPages((prev) => {
      const copy = [...prev];
      if (copy[currentPageIndex]) {
        copy[currentPageIndex] = updater(copy[currentPageIndex]);
      }
      return copy;
    });
  };

  const handleAddNewPage = () => {
    const newPageNum = comicPages.length + 1;
    const newPage: ComicPage = {
      id: `page-${Date.now()}`,
      pageNumber: newPageNum,
      title: `Chapter 1 - Page ${newPageNum}`,
      layout: '4-grid',
      panels: LAYOUT_DEFINITIONS['4-grid'].defaultSlots.map((slot, i) => ({
        id: `p-${Date.now()}-${i}`,
        label: slot.label,
        imageUrl: null,
        zoom: 1,
        panX: 0,
        panY: 0,
      })),
      bubbles: [
        {
          id: `b-${Date.now()}-1`,
          type: 'caption',
          text: 'Scene narration goes here...',
          x: 10,
          y: 10,
          fontSize: 12,
        },
      ],
      backgroundColor: '#090d16',
      gutterColor: '#06b6d4',
    };

    setComicPages((prev) => [...prev, newPage]);
    setCurrentPageIndex(comicPages.length);
    showToast(`Added Page ${newPageNum}!`);
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `added Page ${newPageNum} to Comic Page Layouts.`,
    });
  };

  const handleDeleteCurrentPage = () => {
    if (comicPages.length <= 1) {
      setError('Cannot delete the only page in the project.');
      return;
    }
    const targetTitle = currentPage.title;
    setComicPages((prev) => prev.filter((_, idx) => idx !== currentPageIndex));
    setCurrentPageIndex(Math.max(0, currentPageIndex - 1));
    showToast(`Deleted ${targetTitle}`);
  };

  const handleChangeLayout = (layout: PanelLayoutType) => {
    const def = LAYOUT_DEFINITIONS[layout];
    const newPanels: ComicPanelSlot[] = def.defaultSlots.map((slot, i) => {
      const existing = currentPage.panels[i];
      return {
        id: `p-${Date.now()}-${i}`,
        label: slot.label,
        imageUrl: existing?.imageUrl || null,
        zoom: 1,
        panX: 0,
        panY: 0,
      };
    });

    updateCurrentPage((page) => ({
      ...page,
      layout,
      panels: newPanels,
    }));
    showToast(`Switched layout to ${def.label}`);
  };

  const handleAssignImageToPanel = (imageUrl: string) => {
    if (!selectedPanelId) return;
    updateCurrentPage((page) => ({
      ...page,
      panels: page.panels.map((p) => (p.id === selectedPanelId ? { ...p, imageUrl } : p)),
    }));
    setIsImagePickerOpen(false);
    showToast('Image assigned to panel slot!');
  };

  const handleAddBubble = (type: ComicBubble['type'], defaultText?: string) => {
    const newBubble: ComicBubble = {
      id: `bubble-${Date.now()}`,
      type,
      speaker: type === 'speech' ? 'Kaira' : undefined,
      text: defaultText || (type === 'sfx' ? 'KRAK!' : type === 'caption' ? 'Midnight City. 03:00 AM.' : 'Dialogue line...'),
      x: 30 + Math.random() * 30,
      y: 20 + Math.random() * 40,
      fontSize: type === 'sfx' ? 18 : 12,
      rotation: type === 'sfx' ? (Math.random() > 0.5 ? -8 : 8) : 0,
    };

    updateCurrentPage((page) => ({
      ...page,
      bubbles: [...page.bubbles, newBubble],
    }));
    setSelectedBubbleId(newBubble.id);
    showToast(`Added ${type.toUpperCase()} element!`);
  };

  const handleDeleteBubble = (bubbleId: string) => {
    updateCurrentPage((page) => ({
      ...page,
      bubbles: page.bubbles.filter((b) => b.id !== bubbleId),
    }));
    setSelectedBubbleId(null);
  };

  const handleAiGenerateDialogue = async () => {
    setIsAiGeneratingDialogue(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const prompt = `You are a professional comic book script letterer for 'Project Midnight City' (Cyberpunk Graphic Novel).
Page: "${currentPage.title}". Layout: "${currentPage.layout}".
Context / Action: "${dialogueScenePrompt.trim() || 'Kaira Vance infiltrates Kurogane Zaibatsu server room, confronted by Cipher-09 in the shadows.'}".
Cast: ${characters.map((c) => `${c.name} (${c.role})`).join(', ')}.

Generate 3-4 comic page speech bubbles, captions, and sound effects.
Specify:
- type: 'speech', 'thought', 'caption', or 'sfx'
- speaker: Character name (or 'Narrator' for captions)
- text: Punchy, comic-book style dialogue or onomatopoeia
- x: number from 10 to 80 (approx percentage position across page)
- y: number from 10 to 80 (approx percentage position down page)`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ['speech', 'thought', 'caption', 'sfx'] },
                speaker: { type: Type.STRING },
                text: { type: Type.STRING },
                x: { type: Type.NUMBER },
                y: { type: Type.NUMBER },
              },
              required: ['type', 'text', 'x', 'y'],
            },
          },
        },
      });

      const generatedBubbles: ComicBubble[] = JSON.parse(response.text.trim()).map(
        (b: any, idx: number) => ({
          id: `ai-bubble-${Date.now()}-${idx}`,
          type: b.type,
          speaker: b.speaker,
          text: b.text,
          x: Math.min(85, Math.max(10, b.x || 30)),
          y: Math.min(85, Math.max(10, b.y || 30)),
          fontSize: b.type === 'sfx' ? 18 : 12,
          rotation: b.type === 'sfx' ? -6 : 0,
        })
      );

      updateCurrentPage((page) => ({
        ...page,
        bubbles: [...page.bubbles, ...generatedBubbles],
      }));
      setDialogueScenePrompt('');
      showToast(`Generated ${generatedBubbles.length} comic dialogue bubbles with AI!`);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Script Letterer AI',
        action: `scripted ${generatedBubbles.length} dialogue elements for ${currentPage.title}.`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate dialogue.');
    } finally {
      setIsAiGeneratingDialogue(false);
    }
  };

  const handleExportPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 1600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = currentPage.backgroundColor || '#090d16';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw header title
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText(currentPage.title.toUpperCase(), 40, 50);

    // Helper to load image
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject();
        img.src = src;
      });
    };

    // Calculate grid positions for 4-grid
    const margin = 40;
    const headerOffset = 70;
    const gutter = 16;
    const w = (canvas.width - margin * 2 - gutter) / 2;
    const h = (canvas.height - margin * 2 - headerOffset - gutter) / 2;

    const panelCoords = [
      { x: margin, y: margin + headerOffset, w, h },
      { x: margin + w + gutter, y: margin + headerOffset, w, h },
      { x: margin, y: margin + headerOffset + h + gutter, w, h },
      { x: margin + w + gutter, y: margin + headerOffset + h + gutter, w, h },
    ];

    const renderPromises = currentPage.panels.map(async (panel, idx) => {
      const coord = panelCoords[idx] || panelCoords[0];
      // Draw panel border & bg
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(coord.x, coord.y, coord.w, coord.h);

      if (panel.imageUrl) {
        try {
          const img = await loadImage(panel.imageUrl);
          ctx.drawImage(img, coord.x, coord.y, coord.w, coord.h);
        } catch {
          ctx.fillStyle = '#334155';
          ctx.fillRect(coord.x, coord.y, coord.w, coord.h);
          ctx.fillStyle = '#94a3b8';
          ctx.font = '16px sans-serif';
          ctx.fillText(panel.label, coord.x + 20, coord.y + 40);
        }
      } else {
        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(panel.label, coord.x + 20, coord.y + coord.h / 2);
      }

      // Border outline
      ctx.strokeStyle = currentPage.gutterColor || '#06b6d4';
      ctx.lineWidth = 4;
      ctx.strokeRect(coord.x, coord.y, coord.w, coord.h);
    });

    Promise.all(renderPromises).then(() => {
      // Draw bubbles
      currentPage.bubbles.forEach((b) => {
        const bx = (b.x / 100) * canvas.width;
        const by = (b.y / 100) * canvas.height;

        ctx.save();
        ctx.translate(bx, by);
        if (b.rotation) {
          ctx.rotate((b.rotation * Math.PI) / 180);
        }

        if (b.type === 'sfx') {
          ctx.font = '900 36px Impact, sans-serif';
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 6;
          ctx.strokeText(b.text, 0, 0);
          ctx.fillText(b.text, 0, 0);
        } else if (b.type === 'caption') {
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-10, -20, 320, 60);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(-10, -20, 320, 60);
          ctx.fillStyle = '#0f172a';
          ctx.font = 'bold 14px monospace';
          ctx.fillText(b.text, 0, 0, 300);
        } else {
          // Speech bubble
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.roundRect(-10, -20, 240, 50, 16);
          ctx.fill();
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = '#000000';
          ctx.font = 'bold 14px sans-serif';
          if (b.speaker) {
            ctx.fillStyle = '#0284c7';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(b.speaker.toUpperCase(), 0, -6);
          }
          ctx.fillStyle = '#0f172a';
          ctx.font = '13px sans-serif';
          ctx.fillText(b.text, 0, 14, 220);
        }

        ctx.restore();
      });

      // Trigger download
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${currentPage.title.toLowerCase().replace(/\s+/g, '_')}_assembled.png`;
      a.click();
      showToast('Exported High-Resolution Comic Page (PNG)!');
    });
  };

  const selectedBubble = currentPage.bubbles.find((b) => b.id === selectedBubbleId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#2E2E3A] pb-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-8 bg-[#FF2244]"></span>
          <div>
            <h2 className="font-display text-4xl font-extrabold text-[#F0EBE1] uppercase tracking-wider">
              PAGE LAYOUT WORKBENCH // PANEL ASSEMBLER
            </h2>
            <p className="font-mono text-xs text-[#8E8A84] mt-0.5">
              Design multi-panel graphic novel spreads, position dialogue balloons, and export publication spreads.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPng}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#F0EBE1] font-mono text-xs font-bold shadow-[4px_4px_0px_#0A0A0F] transition-all"
          >
            <DownloadIcon className="w-4 h-4 text-[#00E5FF]" />
            <span>EXPORT PNG PAGE</span>
          </button>
          <button
            onClick={handleAddNewPage}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold shadow-[4px_4px_0px_#0A0A0F] transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>ADD NEW PAGE</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div className="flex items-center gap-2 p-3 bg-[#00E5FF]/10 border-2 border-[#00E5FF] text-[#00E5FF] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F] animate-fade-in">
          <CheckIcon className="w-5 h-5 text-[#00E5FF]" />
          <span>{notification}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF2244]/10 border-2 border-[#FF2244] text-[#FF2244] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F]">
          <AlertIcon className="w-5 h-5 text-[#FF2244]" />
          <span>{error}</span>
        </div>
      )}

      {/* Page Selector Tabs & Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#12121A] border-2 border-[#2E2E3A] p-4 shadow-[6px_6px_0px_#0A0A0F]">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {comicPages.map((page, idx) => (
            <button
              key={page.id}
              onClick={() => setCurrentPageIndex(idx)}
              className={`px-4 py-2 text-xs font-mono font-bold transition-all whitespace-nowrap ${
                currentPageIndex === idx
                  ? 'bg-[#FF2244] text-white border-2 border-[#FF2244] shadow-[3px_3px_0px_#0A0A0F]'
                  : 'bg-[#1A1A24] text-[#8E8A84] hover:text-[#F0EBE1] border-2 border-[#2E2E3A]'
              }`}
            >
              PAGE {page.pageNumber}: {page.title.split(':')[0]}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <select
            value={currentPage.layout}
            onChange={(e) => handleChangeLayout(e.target.value as PanelLayoutType)}
            className="bg-[#0A0A0F] border-2 border-[#2E2E3A] px-3 py-1.5 font-mono text-xs text-[#F0EBE1] focus:outline-none focus:border-[#00E5FF]"
          >
            {Object.entries(LAYOUT_DEFINITIONS).map(([key, val]) => (
              <option key={key} value={key}>
                {val.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleDeleteCurrentPage}
            disabled={comicPages.length <= 1}
            className="p-2 text-[#8E8A84] hover:text-[#FF2244] hover:bg-[#1A1A24] transition-colors disabled:opacity-40"
            title="Delete this page"
          >
            <DeleteIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* AI Dialogue & Script Letterer Drawer */}
      <div className="bg-[#12121A] border-2 border-[#2E2E3A] p-5 shadow-[6px_6px_0px_#0A0A0F] space-y-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-[#00E5FF]" />
          <h3 className="font-display text-xl font-bold text-[#F0EBE1] uppercase tracking-wider">AI DIALOGUE & LETTERING ENGINE</h3>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]">
            SCRIPT SYNTH
          </span>
        </div>
        <p className="font-mono text-xs text-[#8E8A84]">
          Describe scene beats and AI will synthesize character dialogue balloons and sound effects.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={dialogueScenePrompt}
            onChange={(e) => setDialogueScenePrompt(e.target.value)}
            placeholder="e.g. Kaira confronts Cipher in the neon alley. Gunfire erupts as security drones approach."
            className="flex-1 bg-[#0A0A0F] border-2 border-[#2E2E3A] px-3 py-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleAiGenerateDialogue()}
          />
          <button
            onClick={handleAiGenerateDialogue}
            disabled={isAiGeneratingDialogue}
            className="px-5 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-[4px_4px_0px_#0A0A0F] whitespace-nowrap"
          >
            {isAiGeneratingDialogue ? 'WRITING DIALOGUE...' : 'GENERATE DIALOGUE'}
          </button>
        </div>
      </div>

      {/* Main Assembly Studio: Canvas Worktable + Toolbar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Cols: Interactive Page Canvas */}
        <div className="lg:col-span-3 bg-[#0A0A0F] border-2 border-[#2E2E3A] p-6 shadow-[8px_8px_0px_#0A0A0F] relative min-h-[680px]">
          {/* Page Top Title */}
          <div className="flex items-center justify-between border-b-2 border-[#2E2E3A] pb-3 mb-4">
            <h4 className="font-display text-xl font-extrabold text-[#00E5FF] uppercase tracking-wider">{currentPage.title}</h4>
            <span className="font-mono text-xs text-[#8E8A84]">
              {LAYOUT_DEFINITIONS[currentPage.layout].label}
            </span>
          </div>

          {/* Panel Grid Rendering based on Layout */}
          <div
            className={`grid gap-3 ${
              currentPage.layout === '4-grid'
                ? 'grid-cols-2 grid-rows-2 h-[560px]'
                : currentPage.layout === '6-dynamic'
                ? 'grid-cols-3 grid-rows-3 h-[620px]'
                : currentPage.layout === '3-tier'
                ? 'grid-cols-1 grid-rows-3 h-[620px]'
                : 'grid-cols-2 grid-rows-2 h-[560px]'
            }`}
          >
            {currentPage.panels.map((panel, idx) => (
              <div
                key={panel.id}
                onClick={() => {
                  setSelectedPanelId(panel.id);
                  setIsImagePickerOpen(true);
                }}
                className={`relative overflow-hidden border-2 cursor-pointer transition-all flex flex-col items-center justify-center group ${
                  selectedPanelId === panel.id
                    ? 'border-[#00E5FF] ring-2 ring-[#00E5FF]/40 shadow-[4px_4px_0px_#0A0A0F]'
                    : 'border-[#2E2E3A] hover:border-[#00E5FF] bg-[#12121A]'
                }`}
              >
                {panel.imageUrl ? (
                  <>
                    <img
                      src={panel.imageUrl}
                      alt={panel.label}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-[#0A0A0F]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="font-mono text-xs px-3 py-1.5 bg-[#FF2244] text-white font-bold shadow-[2px_2px_0px_#0A0A0F]">
                        CHANGE FRAME
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <PlusIcon className="w-8 h-8 mx-auto text-[#8E8A84] group-hover:text-[#00E5FF] transition-colors mb-2" />
                    <p className="font-display text-lg font-bold text-[#F0EBE1] uppercase">{panel.label}</p>
                    <p className="font-mono text-[11px] text-[#8E8A84] mt-1">Click to assign frame</p>
                  </div>
                )}

                <span className="absolute top-2 left-2 font-mono text-[10px] font-bold px-2 py-0.5 bg-[#0A0A0F] text-[#00E5FF] border border-[#2E2E3A]">
                  P{idx + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Floating Comic Speech & Caption Bubbles */}
          {currentPage.bubbles.map((bubble) => {
            const isSelected = selectedBubbleId === bubble.id;

            return (
              <div
                key={bubble.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBubbleId(bubble.id);
                }}
                style={{
                  top: `${bubble.y}%`,
                  left: `${bubble.x}%`,
                  transform: `rotate(${bubble.rotation || 0}deg)`,
                }}
                className={`absolute cursor-pointer transition-all z-20 select-none ${
                  isSelected ? 'ring-2 ring-[#00E5FF] ring-offset-2 ring-offset-[#0A0A0F]' : ''
                }`}
              >
                {bubble.type === 'sfx' ? (
                  <div className="text-[#FFB800] font-black text-2xl tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.9)] animate-pulse uppercase">
                    {bubble.text}
                  </div>
                ) : bubble.type === 'caption' ? (
                  <div className="bg-[#FFB800] text-[#0A0A0F] border-2 border-[#0A0A0F] px-3 py-1.5 shadow-[4px_4px_0px_#0A0A0F] max-w-xs font-mono text-xs font-bold leading-tight">
                    {bubble.text}
                  </div>
                ) : bubble.type === 'thought' ? (
                  <div className="bg-[#F0EBE1] text-[#0A0A0F] border-2 border-dashed border-[#0A0A0F] px-3 py-2 rounded-2xl shadow-[4px_4px_0px_#0A0A0F] max-w-xs text-xs leading-tight">
                    {bubble.speaker && (
                      <span className="font-mono text-[10px] font-bold text-[#FF2244] block mb-0.5">
                        {bubble.speaker}
                      </span>
                    )}
                    <span className="italic">{bubble.text}</span>
                  </div>
                ) : (
                  <div className="bg-white text-[#0A0A0F] border-2 border-[#0A0A0F] px-3 py-2 rounded-2xl shadow-[4px_4px_0px_#0A0A0F] max-w-xs text-xs leading-tight relative">
                    {bubble.speaker && (
                      <span className="font-mono text-[10px] font-bold text-[#00E5FF] block mb-0.5 uppercase tracking-wide">
                        {bubble.speaker}
                      </span>
                    )}
                    <span>{bubble.text}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right 1 Col: Inspector & Bubble Toolbox */}
        <div className="space-y-6">
          {/* Add Elements Panel */}
          <div className="bg-[#12121A] border-2 border-[#2E2E3A] p-5 space-y-4 shadow-[6px_6px_0px_#0A0A0F]">
            <h4 className="font-mono text-xs font-bold uppercase tracking-wider text-[#00E5FF]">ADD COMIC ELEMENTS</h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleAddBubble('speech')}
                className="px-3 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#F0EBE1] font-mono text-xs font-bold transition-all text-left"
              >
                💬 Speech Bubble
              </button>
              <button
                onClick={() => handleAddBubble('thought')}
                className="px-3 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#F0EBE1] font-mono text-xs font-bold transition-all text-left"
              >
                💭 Thought Bubble
              </button>
              <button
                onClick={() => handleAddBubble('caption')}
                className="px-3 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#F0EBE1] font-mono text-xs font-bold transition-all text-left"
              >
                📜 Caption Box
              </button>
              <button
                onClick={() => handleAddBubble('sfx')}
                className="px-3 py-2 bg-[#FF2244]/10 hover:bg-[#FF2244]/20 border-2 border-[#FF2244] text-[#FF2244] font-mono text-xs font-bold transition-all text-left"
              >
                💥 Dynamic SFX
              </button>
            </div>

            {/* Quick SFX badges */}
            <div className="pt-2 border-t-2 border-[#2E2E3A]">
              <span className="font-mono text-[11px] font-semibold text-[#8E8A84] block mb-2">INSTANT SFX:</span>
              <div className="flex flex-wrap gap-1.5">
                {SFX_PRESETS.map((sfx) => (
                  <button
                    key={sfx}
                    onClick={() => handleAddBubble('sfx', sfx)}
                    className="font-mono text-[10px] font-extrabold px-2 py-1 bg-[#FFB800]/10 text-[#FFB800] border border-[#FFB800] hover:bg-[#FFB800]/30 transition-colors"
                  >
                    {sfx}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Bubble Editor */}
          {selectedBubble ? (
            <div className="bg-[#12121A] border-2 border-[#00E5FF] p-5 space-y-4 shadow-[6px_6px_0px_#0A0A0F]">
              <div className="flex items-center justify-between border-b-2 border-[#2E2E3A] pb-2">
                <span className="font-mono text-xs font-bold uppercase text-[#00E5FF]">
                  EDIT {selectedBubble.type.toUpperCase()}
                </span>
                <button
                  onClick={() => handleDeleteBubble(selectedBubble.id)}
                  className="text-[#FF2244] hover:text-[#FF2244]/80 font-mono text-xs flex items-center gap-1"
                >
                  <DeleteIcon className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>

              {selectedBubble.type === 'speech' && (
                <div>
                  <label className="block font-mono text-[11px] font-semibold uppercase text-[#8E8A84] mb-1">Speaker</label>
                  <input
                    type="text"
                    value={selectedBubble.speaker || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCurrentPage((p) => ({
                        ...p,
                        bubbles: p.bubbles.map((b) => (b.id === selectedBubble.id ? { ...b, speaker: val } : b)),
                      }));
                    }}
                    className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-mono text-[11px] font-semibold uppercase text-[#8E8A84] mb-1">Bubble Text</label>
                <textarea
                  value={selectedBubble.text}
                  onChange={(e) => {
                    const val = e.target.value;
                    updateCurrentPage((p) => ({
                      ...p,
                      bubbles: p.bubbles.map((b) => (b.id === selectedBubble.id ? { ...b, text: val } : b)),
                    }));
                  }}
                  rows={3}
                  className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none resize-y"
                />
              </div>

              {/* Position Sliders */}
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between font-mono text-[11px] text-[#8E8A84] mb-1">
                    <span>X Position ({Math.round(selectedBubble.x)}%)</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={90}
                    value={selectedBubble.x}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateCurrentPage((p) => ({
                        ...p,
                        bubbles: p.bubbles.map((b) => (b.id === selectedBubble.id ? { ...b, x: val } : b)),
                      }));
                    }}
                    className="w-full accent-[#00E5FF]"
                  />
                </div>

                <div>
                  <div className="flex justify-between font-mono text-[11px] text-[#8E8A84] mb-1">
                    <span>Y Position ({Math.round(selectedBubble.y)}%)</span>
                  </div>
                  <input
                    type="range"
                    min={5}
                    max={90}
                    value={selectedBubble.y}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      updateCurrentPage((p) => ({
                        ...p,
                        bubbles: p.bubbles.map((b) => (b.id === selectedBubble.id ? { ...b, y: val } : b)),
                      }));
                    }}
                    className="w-full accent-[#00E5FF]"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-5 text-center bg-[#12121A] border-2 border-[#2E2E3A] font-mono text-xs text-[#8E8A84]">
              Click any bubble on the canvas to adjust position, speaker, and text.
            </div>
          )}
        </div>
      </div>

      {/* Image Picker Modal / Drawer */}
      {isImagePickerOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-slate-100">Select Image for Panel Slot</h3>
              <button
                onClick={() => setIsImagePickerOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Custom URL Input */}
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Direct Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200"
                />
                <button
                  onClick={() => {
                    if (customImageUrl.trim()) handleAssignImageToPanel(customImageUrl.trim());
                  }}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold"
                >
                  Assign URL
                </button>
              </div>
            </div>

            {/* Character Portraits Section */}
            {characters.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Character Dossier Portraits
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {characters.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => c.avatarUrl && handleAssignImageToPanel(c.avatarUrl)}
                      className="group cursor-pointer rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all bg-slate-950 p-2"
                    >
                      {c.avatarUrl && (
                        <img src={c.avatarUrl} alt={c.name} className="w-full h-24 object-cover rounded mb-1" />
                      )}
                      <p className="text-[11px] font-bold text-slate-200 truncate">{c.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Frames */}
            {recentFrames.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2">
                  Generated Recent Frames
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {recentFrames.map((url, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleAssignImageToPanel(url)}
                      className="cursor-pointer rounded-lg overflow-hidden border border-slate-700 hover:border-cyan-400 transition-all"
                    >
                      <img src={url} alt={`Frame ${idx}`} className="w-full h-24 object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PanelAssemblerView;
