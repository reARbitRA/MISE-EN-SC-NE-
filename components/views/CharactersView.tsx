import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { CharactersIcon } from '../icons/CharactersIcon';
import { PlusIcon } from '../icons/PlusIcon';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ExportIcon } from '../icons/ExportIcon';
import { AlertIcon } from '../icons/AlertIcon';
import { CheckIcon } from '../icons/CheckIcon';
import { Character } from '../../types';
import CharacterCard from './CharacterCard';
import type { ActivityItemProps } from '../ContextualSmartPanel';

interface CharactersViewProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  addActivity: (activity: Omit<ActivityItemProps, 'time'>) => void;
}

const ROLES = ['All', 'Protagonist', 'Antagonist', 'Deuteragonist', 'Anti-Hero', 'Supporting'];

const CharactersView: React.FC<CharactersViewProps> = ({ characters, setCharacters, addActivity }) => {
  const [selectedRole, setSelectedRole] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [aiCustomPrompt, setAiCustomPrompt] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New Character Form
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<Character['role']>('Protagonist');
  const [newArchetype, setNewArchetype] = useState('');
  const [newVisuals, setNewVisuals] = useState('');
  const [newBackstory, setNewBackstory] = useState('');
  const [newCyberware, setNewCyberware] = useState('');
  const [newAlignment, setNewAlignment] = useState('Chaotic Good');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const characterSchema = {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The character's unique cyberpunk name." },
      archetype: { type: Type.STRING, description: "The character's archetype (e.g. The Street Samurai, Rogue Netrunner)." },
      role: { type: Type.STRING, enum: ['Protagonist', 'Antagonist', 'Deuteragonist', 'Anti-Hero', 'Supporting'] },
      visuals: { type: Type.STRING, description: "Detailed visual description of clothing, cybernetic implants, hair, and aesthetic." },
      backstory: { type: Type.STRING, description: "Compelling motivation and history in Midnight City." },
      cyberware: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 cybernetic enhancements" },
      alignment: { type: Type.STRING, description: "Moral alignment (e.g. Chaotic Good, Lawful Evil)" }
    },
    required: ["name", "archetype", "role", "visuals", "backstory", "cyberware", "alignment"]
  };

  const handleGenerateCharacters = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const promptText = `Generate 3 diverse, high-concept character concepts for a cyberpunk comic book called 'Project: Midnight City'.
${aiCustomPrompt.trim() ? `Inspiration: "${aiCustomPrompt.trim()}"` : 'Ensure vivid contrasting visual styles, distinct factions, and high narrative stakes.'}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: characterSchema
          }
        }
      });

      const newCharacterData: Omit<Character, 'id'>[] = JSON.parse(response.text.trim());
      const newCharactersWithIds: Character[] = newCharacterData.map((char, idx) => ({
        ...char,
        id: `char-ai-${Date.now()}-${idx}`,
        avatarUrl: `https://images.unsplash.com/photo-${1570000000000 + idx * 50000}?w=300&auto=format&fit=crop&q=80`
      }));

      setCharacters((prev) => [...prev, ...newCharactersWithIds]);
      setAiCustomPrompt('');
      showToast(`AI successfully generated ${newCharactersWithIds.length} new characters!`);

      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Character AI',
        action: `generated ${newCharactersWithIds.length} new character dossiers.`
      });
    } catch (e) {
      console.error(e);
      const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
      setError(`Failed to generate characters: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateCharacter = async (idToRegenerate: string) => {
    setRegeneratingId(idToRegenerate);
    setError(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: "Generate a single unique cyberpunk comic character concept for 'Project Midnight City'.",
        config: {
          responseMimeType: 'application/json',
          responseSchema: characterSchema
        }
      });
      const newCharacterData: Omit<Character, 'id'> = JSON.parse(response.text.trim());
      const regeneratedCharacter: Character = {
        ...newCharacterData,
        id: idToRegenerate,
        avatarUrl: characters.find(c => c.id === idToRegenerate)?.avatarUrl
      };

      setCharacters((prev) => prev.map((c) => (c.id === idToRegenerate ? regeneratedCharacter : c)));
      showToast(`Regenerated "${newCharacterData.name}"!`);

      addActivity({
        imgSrc: 'https://picsum.photos/seed/ai-icon/40/40',
        userName: 'Character AI',
        action: `regenerated the character "${newCharacterData.name}".`
      });
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : 'Failed to regenerate character.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleCreateCharacter = () => {
    if (!newName.trim()) {
      setError('Character name cannot be empty.');
      return;
    }
    const cyberwareArray = newCyberware.split(',').map((c) => c.trim()).filter(Boolean);
    const newChar: Character = {
      id: `char-manual-${Date.now()}`,
      name: newName.trim(),
      role: newRole,
      archetype: newArchetype.trim() || 'Rogue Operative',
      visuals: newVisuals.trim() || 'Dark tactical coat, holographic visor.',
      backstory: newBackstory.trim() || 'Roaming the underlevels of Sector 4.',
      cyberware: cyberwareArray,
      alignment: newAlignment,
      avatarUrl: newAvatarUrl.trim() || undefined
    };

    setCharacters((prev) => [newChar, ...prev]);
    setIsAddingNew(false);
    setNewName('');
    setNewArchetype('');
    setNewVisuals('');
    setNewBackstory('');
    setNewCyberware('');
    setNewAvatarUrl('');
    setError(null);
    showToast(`Created new character "${newChar.name}"!`);

    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `created character dossier for "${newChar.name}".`
    });
  };

  const handleUpdateCharacter = (updated: Character) => {
    setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    showToast(`Updated "${updated.name}"`);
  };

  const handleDeleteCharacter = (idToDelete: string) => {
    const characterName = characters.find((c) => c.id === idToDelete)?.name || 'Character';
    setCharacters((prev) => prev.filter((c) => c.id !== idToDelete));
    showToast(`Deleted "${characterName}"`);

    addActivity({
      imgSrc: 'https://picsum.photos/seed/user-avatar/40/40',
      userName: 'You',
      action: `deleted the character "${characterName}".`
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(characters, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', 'project_midnight_city_characters.json');
    linkElement.click();
    showToast('Exported all character dossiers (JSON)!');
  };

  const filteredCharacters = characters.filter((c) => {
    const matchesRole = selectedRole === 'All' || c.role === selectedRole;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.archetype.toLowerCase().includes(q) ||
      c.visuals.toLowerCase().includes(q) ||
      c.backstory.toLowerCase().includes(q) ||
      c.cyberware?.some((cy) => cy.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#2E2E3A] pb-4">
        <div>
          <div className="flex items-center gap-3">
            <span className="w-3 h-8 bg-[#FF2244]"></span>
            <CharactersIcon className="w-8 h-8 text-[#00E5FF]" />
            <h2 className="font-display text-4xl font-extrabold text-[#F0EBE1] uppercase tracking-wider">
              THE LINEUP // CHARACTERS
            </h2>
          </div>
          <p className="mt-1 font-mono text-xs text-[#8E8A84]">
            POLICE LINEUP & CLASSIFIED DOSSIERS: Cast roster, cyberware specs, and narrative arcs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={characters.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A1A24] hover:bg-[#2A2A38] border-2 border-[#2E2E3A] text-[#C8C0B8] font-mono text-xs font-bold transition-all disabled:opacity-40 shadow-[3px_3px_0px_#0A0A0F]"
          >
            <ExportIcon className="w-4 h-4 text-[#00E5FF]" />
            <span>EXPORT DOSSIERS (JSON)</span>
          </button>
          <button
            onClick={() => setIsAddingNew((p) => !p)}
            className="flex items-center gap-2 px-4 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold shadow-[3px_3px_0px_#0A0A0F] transition-all"
          >
            <PlusIcon className="w-4 h-4" />
            <span>{isAddingNew ? 'CLOSE FORM' : 'CREATE DOSSIER'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-[#00E5FF]/10 border-2 border-[#00E5FF] text-[#00E5FF] font-mono text-xs animate-fade-in shadow-[4px_4px_0px_#0A0A0F]">
          <CheckIcon className="w-5 h-5" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FF2244]/10 border-2 border-[#FF2244] text-[#FF2244] font-mono text-xs shadow-[4px_4px_0px_#0A0A0F]">
          <AlertIcon className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* AI Character Synthesizer Card */}
      <div className="bg-[#1A1A24] border-2 border-[#00E5FF] p-5 shadow-[6px_6px_0px_#0A0A0F] space-y-3 relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-[#00E5FF] text-[#0A0A0F] font-mono text-[9px] font-bold px-2 py-0.5 uppercase tracking-widest">
          AI SYNTHESIS ENGINE // GEMINI 2.5
        </div>
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-[#00E5FF]" />
          <h3 className="font-display text-xl text-[#F0EBE1] uppercase tracking-wider">
            CHARACTER ENSEMBLE SYNTHESIZER
          </h3>
        </div>
        <p className="font-mono text-xs text-[#8E8A84]">
          Synthesize high-concept comic book protagonists, corporate enforcers, or underground street fixers.
        </p>

        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={aiCustomPrompt}
            onChange={(e) => setAiCustomPrompt(e.target.value)}
            placeholder="e.g. Rogue cyber-surgeon with prosthetic robotic spider arms, or ex-zaibatsu assassin"
            className="flex-1 bg-[#0A0A0F] border-2 border-[#2E2E3A] px-3 py-2 font-mono text-xs text-[#F0EBE1] placeholder-[#8E8A84]/50 focus:border-[#00E5FF] focus:outline-none"
            onKeyDown={(e) => e.key === 'Enter' && handleGenerateCharacters()}
          />
          <button
            onClick={handleGenerateCharacters}
            disabled={isGenerating || !!regeneratingId}
            className="flex items-center gap-2 px-6 py-2 bg-[#00E5FF] hover:bg-[#00E5FF]/80 text-[#0A0A0F] font-mono text-xs font-bold transition-all disabled:opacity-50 shadow-[3px_3px_0px_#0A0A0F] whitespace-nowrap"
          >
            {isGenerating ? (
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
                <span>GENERATE 3 CHARACTERS</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Create Character Manual Drawer */}
      {isAddingNew && (
        <div className="bg-[#1A1A24] border-2 border-[#FF2244] p-6 space-y-4 shadow-[8px_8px_0px_#0A0A0F]">
          <div className="flex items-center justify-between border-b-2 border-[#2E2E3A] pb-3">
            <h3 className="font-display text-xl text-[#FF2244] uppercase tracking-wider">
              NEW DOSSIER ENTRY
            </h3>
            <button onClick={() => setIsAddingNew(false)} className="text-[#8E8A84] hover:text-[#F0EBE1] font-mono text-sm">
              [✕]
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">Character Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Jax 'Razor' Thorne"
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#FF2244] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">Story Role</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Character['role'])}
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#00E5FF] focus:border-[#FF2244] focus:outline-none"
              >
                <option value="Protagonist">Protagonist</option>
                <option value="Antagonist">Antagonist</option>
                <option value="Deuteragonist">Deuteragonist</option>
                <option value="Anti-Hero">Anti-Hero</option>
                <option value="Supporting">Supporting</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">Archetype</label>
              <input
                type="text"
                value={newArchetype}
                onChange={(e) => setNewArchetype(e.target.value)}
                placeholder="e.g. Disillusioned Mercenary"
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#FF2244] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">Visual Appearance</label>
              <textarea
                value={newVisuals}
                onChange={(e) => setNewVisuals(e.target.value)}
                rows={3}
                placeholder="Clothing, silhouette, scars, hair, chromatic highlights..."
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#FF2244] focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">Backstory & Motivation</label>
              <textarea
                value={newBackstory}
                onChange={(e) => setNewBackstory(e.target.value)}
                rows={3}
                placeholder="Origin, grudge against zaibatsu, secret goal..."
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1] focus:border-[#FF2244] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">
                Installed Cyberware
              </label>
              <input
                type="text"
                value={newCyberware}
                onChange={(e) => setNewCyberware(e.target.value)}
                placeholder="e.g. Sub-dermal plating, Thermal visor"
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">Moral Alignment</label>
              <input
                type="text"
                value={newAlignment}
                onChange={(e) => setNewAlignment(e.target.value)}
                placeholder="e.g. Chaotic Good"
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] font-bold uppercase text-[#8E8A84] mb-1">
                Avatar Image URL (Optional)
              </label>
              <input
                type="text"
                value={newAvatarUrl}
                onChange={(e) => setNewAvatarUrl(e.target.value)}
                placeholder="https://..."
                className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-2 font-mono text-xs text-[#F0EBE1]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setIsAddingNew(false)}
              className="px-4 py-2 bg-[#2E2E3A] text-[#C8C0B8] font-mono text-xs font-bold"
            >
              CANCEL
            </button>
            <button
              onClick={handleCreateCharacter}
              className="px-6 py-2 bg-[#FF2244] hover:bg-[#FF2244]/80 text-white font-mono text-xs font-bold shadow-[3px_3px_0px_#0A0A0F]"
            >
              SAVE DOSSIER
            </button>
          </div>
        </div>
      )}

      {/* Role Filter & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#12121A] border-2 border-[#2E2E3A] p-3 shadow-[4px_4px_0px_#0A0A0F]">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {ROLES.map((role) => {
            const count =
              role === 'All' ? characters.length : characters.filter((c) => c.role === role).length;
            const isSelected = selectedRole === role;

            return (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'bg-[#00E5FF] text-[#0A0A0F] border-[#00E5FF] shadow-[2px_2px_0px_#0A0A0F]'
                    : 'bg-[#1A1A24] text-[#8E8A84] border-[#2E2E3A] hover:text-[#C8C0B8]'
                }`}
              >
                {role} ({count})
              </button>
            );
          })}
        </div>

        <div className="w-full md:w-72 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search dossiers, cyberware..."
            className="w-full bg-[#0A0A0F] border border-[#2E2E3A] px-3 py-1.5 font-mono text-xs text-[#F0EBE1] placeholder-[#8E8A84]/50 focus:outline-none focus:border-[#00E5FF]"
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

      {/* Character Grid */}
      {filteredCharacters.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
          <CharactersIcon className="w-12 h-12 mx-auto text-slate-600 mb-3" />
          <h4 className="text-lg font-bold text-slate-400">No Characters Found</h4>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No character matched "${searchQuery}". Try clearing your search.`
              : "Click 'Generate 3 Characters' or 'Create Character' to populate your cast."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredCharacters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onUpdate={handleUpdateCharacter}
              onDelete={handleDeleteCharacter}
              onRegenerate={handleRegenerateCharacter}
              isRegenerating={regeneratingId === char.id}
              isSomeActionLoading={isGenerating || !!regeneratingId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CharactersView;
