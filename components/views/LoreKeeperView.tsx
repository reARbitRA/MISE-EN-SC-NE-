import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { LoreKeeperIcon } from '../icons/LoreKeeperIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { CancelIcon } from '../icons/CancelIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ExportIcon } from '../icons/ExportIcon';
import { AlertIcon } from '../icons/AlertIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { LoreEntry, LoreCategory } from '../../types';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface LoreKeeperViewProps {
  loreEntries: LoreEntry[];
  setLoreEntries: React.Dispatch<React.SetStateAction<LoreEntry[]>>;
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

const CATEGORIES: LoreCategory[] = [
  'Locations & Districts',
  'Factions & Megacorps',
  'Tech & Cyberware',
  'Timeline & Events',
  'Culture & Slang',
];

const LoreKeeperView: React.FC<LoreKeeperViewProps> = ({
  loreEntries,
  setLoreEntries,
  addActivity,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiCategory, setAiCategory] = useState<LoreCategory>('Locations & Districts');
  const [aiPromptTopic, setAiPromptTopic] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New entry form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<LoreCategory>('Locations & Districts');
  const [newDescription, setNewDescription] = useState('');
  const [newSecrets, setNewSecrets] = useState('');
  const [newTags, setNewTags] = useState('');

  // Editing state
  const [editTitle, setEditTitle] = useState('');
  const [editCategory, setEditCategory] = useState<LoreCategory>('Locations & Districts');
  const [editDescription, setEditDescription] = useState('');
  const [editSecrets, setEditSecrets] = useState('');
  const [editTags, setEditTags] = useState('');

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleStartEdit = (entry: LoreEntry) => {
    setEditingId(entry.id);
    setEditTitle(entry.title);
    setEditCategory(entry.category);
    setEditDescription(entry.description);
    setEditSecrets(entry.secrets);
    setEditTags(entry.tags.join(', '));
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim()) {
      setError('Title cannot be empty');
      return;
    }
    const updatedTags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    const updatedEntries = loreEntries.map((e) =>
      e.id === id
        ? {
            ...e,
            title: editTitle.trim(),
            category: editCategory,
            description: editDescription.trim(),
            secrets: editSecrets.trim(),
            tags: updatedTags,
            lastUpdated: new Date().toISOString().split('T')[0],
          }
        : e
    );
    setLoreEntries(updatedEntries);
    setEditingId(null);
    setError(null);
    showNotification(`Updated lore entry "${editTitle}"`);
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `updated the lore entry "${editTitle}".`,
    });
  };

  const handleDelete = (id: string) => {
    const entry = loreEntries.find((e) => e.id === id);
    setLoreEntries((prev) => prev.filter((e) => e.id !== id));
    showNotification(`Deleted lore entry "${entry?.title || 'Item'}"`);
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `deleted lore entry "${entry?.title || 'Item'}".`,
    });
  };

  const handleCreateNew = () => {
    if (!newTitle.trim()) {
      setError('Please provide a title for the lore entry.');
      return;
    }
    const tagsArray = newTags.split(',').map((t) => t.trim()).filter(Boolean);
    const newEntry: LoreEntry = {
      id: `lore-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      description: newDescription.trim(),
      secrets: newSecrets.trim(),
      tags: tagsArray.length > 0 ? tagsArray : ['Custom'],
      lastUpdated: new Date().toISOString().split('T')[0],
    };

    setLoreEntries((prev) => [newEntry, ...prev]);
    setIsAddingNew(false);
    setNewTitle('');
    setNewDescription('');
    setNewSecrets('');
    setNewTags('');
    setError(null);
    showNotification(`Created new lore entry "${newEntry.title}"`);
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `created lore entry "${newEntry.title}".`,
    });
  };

  const handleAiGenerateLore = async () => {
    setIsAiGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const promptText = `Generate 2 compelling, high-concept worldbuilding lore entries for a cyberpunk comic book called 'Project: Midnight City'.
Category: "${aiCategory}".
${aiPromptTopic.trim() ? `Specific inspiration/topic: "${aiPromptTopic.trim()}"` : 'Make it distinct, atmospheric, and full of comic book narrative tension.'}`;

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
                title: { type: Type.STRING, description: 'Creative name of the lore element' },
                description: { type: Type.STRING, description: '2-3 sentences of vivid public knowledge and visual atmosphere' },
                secrets: { type: Type.STRING, description: 'A hidden plot hook, corporate conspiracy, or dangerous secret for the comic plot' },
                tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: '3-4 relevant keyword tags' },
              },
              required: ['title', 'description', 'secrets', 'tags'],
            },
          },
        },
      });

      const parsed: Array<Omit<LoreEntry, 'id' | 'category' | 'lastUpdated'>> = JSON.parse(
        response.text.trim()
      );

      const generatedEntries: LoreEntry[] = parsed.map((item, idx) => ({
        id: `lore-ai-${Date.now()}-${idx}`,
        title: item.title,
        category: aiCategory,
        description: item.description,
        secrets: item.secrets,
        tags: item.tags,
        lastUpdated: new Date().toISOString().split('T')[0],
      }));

      setLoreEntries((prev) => [...generatedEntries, ...prev]);
      setAiPromptTopic('');
      showNotification(`AI successfully generated ${generatedEntries.length} new lore entries!`);
      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Lore Keeper AI',
        action: `synthesized ${generatedEntries.length} new worldbuilding entries for [${aiCategory}].`,
      });
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to generate lore with AI.');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleExportBible = () => {
    let markdown = `# Project: Midnight City - Worldbuilding Bible\n\nGenerated on ${new Date().toLocaleDateString()}\n\n---\n\n`;

    CATEGORIES.forEach((cat) => {
      const items = loreEntries.filter((e) => e.category === cat);
      if (items.length > 0) {
        markdown += `## ${cat}\n\n`;
        items.forEach((item) => {
          markdown += `### ${item.title}\n`;
          markdown += `**Tags:** ${item.tags.join(', ')}\n\n`;
          markdown += `${item.description}\n\n`;
          if (item.secrets) {
            markdown += `> **Confidential Secrets / Plot Hooks:** ${item.secrets}\n\n`;
          }
          markdown += `---\n\n`;
        });
      }
    });

    const dataUri = 'data:text/markdown;charset=utf-8,' + encodeURIComponent(markdown);
    const link = document.createElement('a');
    link.href = dataUri;
    link.download = 'project_midnight_city_lore_bible.md';
    link.click();

    showNotification('Exported Worldbuilding Bible (Markdown)');
    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: 'exported the complete Lore Bible.',
    });
  };

  const filteredEntries = loreEntries.filter((entry) => {
    const matchesCategory = selectedCategory === 'All' || entry.category === selectedCategory;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      entry.title.toLowerCase().includes(q) ||
      entry.description.toLowerCase().includes(q) ||
      entry.secrets.toLowerCase().includes(q) ||
      entry.tags.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#2E2E3A] pb-3">
        <div className="flex items-center gap-3">
          <span className="w-3 h-8 bg-[#FF2244]"></span>
          <div>
            <h2 className="font-display text-4xl font-extrabold text-[#F0EBE1] uppercase tracking-wider">
              THE ARCHIVE VAULT // LORE KEEPER
            </h2>
            <p className="font-mono text-xs text-[#8E8A84] mt-0.5">
              The master worldbuilding archive and secrets bible for 'Project: Midnight City'.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportBible}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#F0EBE1] font-mono text-xs font-bold shadow-[4px_4px_0px_#0A0A0F] transition-all"
          >
            <ExportIcon className="w-4 h-4 text-[#00E5FF]" />
            <span>EXPORT MARKDOWN</span>
          </button>
          <button
            onClick={() => setIsAddingNew((prev) => !prev)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold shadow-[4px_4px_0px_#0A0A0F] transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{isAddingNew ? 'CLOSE FORM' : 'NEW LORE ENTRY'}</span>
          </button>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-[#00E5FF]/10 border-2 border-[#00E5FF] text-[#00E5FF] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F] animate-fade-in">
          <CheckIcon className="w-5 h-5 text-[#00E5FF]" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF2244]/10 border-2 border-[#FF2244] text-[#FF2244] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F]">
          <AlertIcon className="w-5 h-5 text-[#FF2244]" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Lore Synthesizer Card */}
      <div className="bg-[#12121A] border-2 border-[#2E2E3A] p-6 shadow-[8px_8px_0px_#0A0A0F] relative">
        <div className="flex items-center gap-2 mb-3">
          <SparklesIcon className="w-5 h-5 text-[#00E5FF]" />
          <h3 className="font-display text-xl font-bold text-[#F0EBE1] uppercase tracking-wider">AI WORLDBUILDING SYNTHESIZER</h3>
          <span className="font-mono text-[10px] px-2 py-0.5 bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]">
            GEMINI 2.5 FLASH
          </span>
        </div>
        <p className="font-mono text-xs text-[#8E8A84] mb-4">
          Instantly generate authentic cyberpunk lore, faction rivalries, black-market cyberware, or hidden district conspiracies.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-mono text-xs font-semibold uppercase text-[#8E8A84] mb-1">Target Category</label>
            <select
              value={aiCategory}
              onChange={(e) => setAiCategory(e.target.value as LoreCategory)}
              className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2.5 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block font-mono text-xs font-semibold uppercase text-[#8E8A84] mb-1">
              Custom Topic / Angle (Optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={aiPromptTopic}
                onChange={(e) => setAiPromptTopic(e.target.value)}
                placeholder="e.g. Rogue AI deity worship in the sewer grid, or illicit memory-trading tech"
                className="flex-1 bg-[#0A0A0F] border-2 border-[#2E2E3A] px-3 py-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                onKeyDown={(e) => e.key === 'Enter' && handleAiGenerateLore()}
              />
              <button
                onClick={handleAiGenerateLore}
                disabled={isAiGenerating}
                className="flex items-center justify-center gap-2 px-5 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-[4px_4px_0px_#0A0A0F] whitespace-nowrap"
              >
                {isAiGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>SYNTHESIZING...</span>
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-4 h-4" />
                    <span>GENERATE LORE</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* New Lore Entry Form */}
      {isAddingNew && (
        <div className="bg-[#12121A] border-2 border-[#00E5FF] p-6 space-y-4 shadow-[8px_8px_0px_#0A0A0F]">
          <div className="flex items-center justify-between border-b-2 border-[#2E2E3A] pb-3">
            <h3 className="font-display text-xl font-bold text-[#00E5FF] uppercase tracking-wider">CREATE NEW LORE DOSSIER</h3>
            <button
              onClick={() => setIsAddingNew(false)}
              className="text-[#8E8A84] hover:text-[#FF2244]"
            >
              <CancelIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-xs font-semibold uppercase text-[#8E8A84] mb-1">Entry Title</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Sub-Level 9 Data Haven"
                className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2.5 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-mono text-xs font-semibold uppercase text-[#8E8A84] mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as LoreCategory)}
                className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2.5 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase text-[#8E8A84] mb-1">Public Description</label>
            <textarea
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
              placeholder="Atmosphere, history, public perception, sensory details..."
              className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2.5 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none resize-y"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase text-[#FF2244] mb-1">
              Classified Secrets / Comic Plot Hook
            </label>
            <textarea
              value={newSecrets}
              onChange={(e) => setNewSecrets(e.target.value)}
              rows={2}
              placeholder="The twist, vulnerability, conspiracy, or key item hidden here..."
              className="w-full bg-[#0A0A0F] border-2 border-[#FF2244]/60 p-2.5 font-mono text-xs text-[#F0EBE1] focus:border-[#FF2244] focus:outline-none resize-y"
            />
          </div>

          <div>
            <label className="block font-mono text-xs font-semibold uppercase text-[#8E8A84] mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={newTags}
              onChange={(e) => setNewTags(e.target.value)}
              placeholder="e.g. Secret, Slums, Black Market, Defense"
              className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2.5 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#8E8A84] font-mono text-xs font-bold transition-all"
            >
              CANCEL
            </button>
            <button
              onClick={handleCreateNew}
              className="px-6 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold shadow-[4px_4px_0px_#0A0A0F] transition-all"
            >
              SAVE DOSSIER
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#12121A] border-2 border-[#2E2E3A] p-4 shadow-[6px_6px_0px_#0A0A0F]">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all ${
              selectedCategory === 'All'
                ? 'bg-[#FF2244] text-white border-2 border-[#FF2244] shadow-[3px_3px_0px_#0A0A0F]'
                : 'bg-[#1A1A24] text-[#8E8A84] hover:text-[#F0EBE1] border-2 border-[#2E2E3A]'
            }`}
          >
            ALL ({loreEntries.length})
          </button>
          {CATEGORIES.map((cat) => {
            const count = loreEntries.filter((e) => e.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-mono font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-[#FF2244] text-white border-2 border-[#FF2244] shadow-[3px_3px_0px_#0A0A0F]'
                    : 'bg-[#1A1A24] text-[#8E8A84] hover:text-[#F0EBE1] border-2 border-[#2E2E3A]'
                }`}
              >
                {cat.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="SEARCH LORE, SECRETS, TAGS..."
            className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] px-3 py-1.5 font-mono text-xs text-[#F0EBE1] placeholder-[#8E8A84] focus:outline-none focus:border-[#00E5FF]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8E8A84] hover:text-[#F0EBE1] font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lore Entries Grid */}
      {filteredEntries.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-[#2E2E3A] bg-[#12121A]">
          <LoreKeeperIcon className="w-12 h-12 mx-auto text-[#8E8A84] mb-3" />
          <h4 className="font-display text-xl font-bold text-[#F0EBE1] uppercase">NO DOSSIERS FOUND</h4>
          <p className="font-mono text-xs text-[#8E8A84] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No entries matched "${searchQuery}". Try a different term or clear the filter.`
              : 'Add your first entry or click Generate Lore above to synthesize worldbuilding with AI.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEntries.map((entry) => {
            const isEditingThis = editingId === entry.id;

            return (
              <div
                key={entry.id}
                className={`bg-[#12121A] border-2 p-6 flex flex-col justify-between transition-all ${
                  isEditingThis
                    ? 'border-[#00E5FF] shadow-[8px_8px_0px_#0A0A0F]'
                    : 'border-[#2E2E3A] hover:border-[#00E5FF] shadow-[6px_6px_0px_#0A0A0F]'
                }`}
              >
                {isEditingThis ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-[#2E2E3A] pb-2">
                      <h4 className="font-mono text-xs font-bold uppercase text-[#00E5FF]">EDITING DOSSIER</h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(entry.id)}
                          className="p-1.5 bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-[#0A0A0F] font-bold shadow-[2px_2px_0px_#0A0A0F]"
                          title="Save Changes"
                        >
                          <SaveIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 bg-[#1A1A24] hover:bg-[#2A2A38] border border-[#2E2E3A] text-[#8E8A84]"
                          title="Cancel"
                        >
                          <CancelIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] font-semibold text-[#8E8A84] mb-1">Title</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] font-semibold text-[#8E8A84] mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as LoreCategory)}
                        className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] font-semibold text-[#8E8A84] mb-1">Description</label>
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        rows={3}
                        className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none resize-y"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] font-semibold text-[#FF2244] mb-1">Secrets / Plot Hook</label>
                      <textarea
                        value={editSecrets}
                        onChange={(e) => setEditSecrets(e.target.value)}
                        rows={2}
                        className="w-full bg-[#0A0A0F] border-2 border-[#FF2244]/60 p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#FF2244] focus:outline-none resize-y"
                      />
                    </div>

                    <div>
                      <label className="block font-mono text-[11px] font-semibold text-[#8E8A84] mb-1">Tags</label>
                      <input
                        type="text"
                        value={editTags}
                        onChange={(e) => setEditTags(e.target.value)}
                        className="w-full bg-[#0A0A0F] border-2 border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#00E5FF] focus:outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3 mb-3 border-b-2 border-[#2E2E3A] pb-3">
                      <div>
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-[#0A0A0F] text-[#00E5FF] border border-[#00E5FF]">
                          {entry.category}
                        </span>
                        <h4 className="font-display text-2xl font-extrabold text-[#F0EBE1] uppercase tracking-wide mt-2">{entry.title}</h4>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleStartEdit(entry)}
                          className="p-1.5 text-[#8E8A84] hover:text-[#00E5FF] transition-colors"
                          title="Edit"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="p-1.5 text-[#8E8A84] hover:text-[#FF2244] transition-colors"
                          title="Delete"
                        >
                          <DeleteIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="font-sans text-xs text-[#F0EBE1]/90 leading-relaxed mb-4">{entry.description}</p>

                    {/* Secrets box */}
                    {entry.secrets && (
                      <div className="p-3 bg-[#FF2244]/10 border-2 border-[#FF2244] mb-4 relative">
                        <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-[#FF2244] mb-1 uppercase tracking-wider">
                          <span>🔒 CLASSIFIED PLOT HOOK</span>
                        </div>
                        <p className="font-mono text-xs text-[#F0EBE1] italic">{entry.secrets}</p>
                      </div>
                    )}

                    {/* Tags & Date */}
                    <div className="flex items-center justify-between pt-3 border-t-2 border-[#2E2E3A] mt-auto">
                      <div className="flex flex-wrap gap-1.5">
                        {entry.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[10px] px-2 py-0.5 bg-[#1A1A24] text-[#8E8A84] border border-[#2E2E3A]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <span className="font-mono text-[10px] text-[#8E8A84]">UPDATED {entry.lastUpdated}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LoreKeeperView;
