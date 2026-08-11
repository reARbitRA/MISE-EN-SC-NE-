import React, { useState, useEffect } from 'react';
import { Character } from '../../types';
import { EditIcon } from '../icons/EditIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { SaveIcon } from '../icons/SaveIcon';
import { CancelIcon } from '../icons/CancelIcon';
import { RotateIcon } from '../icons/RotateIcon';

interface CharacterCardProps {
  character: Character;
  onUpdate: (character: Character) => void;
  onDelete: (id: string) => void;
  onRegenerate: (id: string) => void;
  isRegenerating: boolean;
  isSomeActionLoading: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onUpdate,
  onDelete,
  onRegenerate,
  isRegenerating,
  isSomeActionLoading,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCharacter, setEditedCharacter] = useState<Character>(character);

  useEffect(() => {
    setEditedCharacter(character);
  }, [character]);

  const handleInputChange = (field: keyof Character, value: any) => {
    setEditedCharacter((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(editedCharacter);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedCharacter(character);
    setIsEditing(false);
  };

  return (
    <div
      className={`relative bg-[#181820] border-2 border-[#2E2E3A] shadow-[6px_6px_0px_#0A0A0F] transition-all duration-300 ${
        isEditing
          ? 'border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.2)]'
          : 'hover:border-[#FF2244]'
      }`}
    >
      {/* Top Folder Tab */}
      <div className="flex items-center justify-between bg-[#12121A] border-b-2 border-[#2E2E3A] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#FF2244] rounded-none"></span>
          <span className="font-mono text-[10px] uppercase text-[#8E8A84] tracking-widest">
            DOSSIER // #{character.id.slice(-6).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="border border-[#FF2244] text-[#FF2244] font-mono text-[9px] font-bold px-1.5 py-0.5 tracking-widest uppercase">
            CLASSIFIED
          </span>
          <span className="font-mono text-[10px] text-[#C8C0B8]/60">
            {character.alignment ? `[${character.alignment}]` : '[UNVERIFIED]'}
          </span>
        </div>
      </div>

      <div className="p-5 relative overflow-hidden">
        {/* Subtle Lineup Grid Backdrop Lines */}
        <div className="absolute inset-0 opacity-5 pointer-events-none flex flex-col justify-between py-2 px-4 font-mono text-[8px] text-white">
          <div>6'0" ——————————————————————————————</div>
          <div>5'6" ——————————————————————————————</div>
          <div>5'0" ——————————————————————————————</div>
        </div>

        {/* Header with Avatar & Name */}
        <div className="flex justify-between items-start gap-4 mb-4 relative z-10">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-shrink-0">
              {character.avatarUrl ? (
                <div className="relative group">
                  <img
                    src={character.avatarUrl}
                    alt={character.name}
                    className="w-16 h-16 object-cover border-2 border-[#00E5FF] shadow-[3px_3px_0px_#0A0A0F]"
                  />
                  <div className="absolute inset-0 bg-[#00E5FF]/10 mix-blend-color pointer-events-none"></div>
                </div>
              ) : (
                <div className="w-16 h-16 bg-[#12121A] border-2 border-[#2E2E3A] flex items-center justify-center text-[#FF2244] font-display text-2xl font-bold shadow-[3px_3px_0px_#0A0A0F]">
                  {character.name.charAt(0)}
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editedCharacter.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="font-display text-xl text-[#00E5FF] bg-[#0A0A0F] border border-[#2E2E3A] px-2 py-1 w-full focus:outline-none focus:border-[#00E5FF]"
                />
              ) : (
                <h4 className="font-display text-2xl font-bold text-[#F0EBE1] uppercase tracking-wide truncate">
                  {character.name}
                </h4>
              )}

              <div className="flex items-center gap-2 mt-1">
                {isEditing ? (
                  <select
                    value={editedCharacter.role || 'Protagonist'}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="font-mono text-xs bg-[#0A0A0F] border border-[#2E2E3A] px-2 py-0.5 text-[#00E5FF]"
                  >
                    <option value="Protagonist">Protagonist</option>
                    <option value="Antagonist">Antagonist</option>
                    <option value="Deuteragonist">Deuteragonist</option>
                    <option value="Anti-Hero">Anti-Hero</option>
                    <option value="Supporting">Supporting</option>
                  </select>
                ) : (
                  <span
                    className={`font-mono text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 border ${
                      character.role === 'Antagonist'
                        ? 'bg-[#FF2244]/10 text-[#FF2244] border-[#FF2244]'
                        : character.role === 'Protagonist'
                        ? 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]'
                        : 'bg-[#FFB800]/10 text-[#FFB800] border-[#FFB800]'
                    }`}
                  >
                    {character.role || 'Protagonist'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5 flex-shrink-0 relative z-10">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  className="p-1.5 bg-[#00E5FF] text-[#0A0A0F] font-bold hover:bg-[#00E5FF]/80 transition-colors"
                  title="Save Changes"
                >
                  <SaveIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={handleCancel}
                  className="p-1.5 bg-[#2E2E3A] text-[#C8C0B8] hover:bg-[#3E3E4A] transition-colors"
                  title="Cancel"
                >
                  <CancelIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => onRegenerate(character.id)}
                  disabled={isSomeActionLoading}
                  className="p-1.5 border border-[#2E2E3A] bg-[#12121A] text-[#8E8A84] hover:text-[#00E5FF] hover:border-[#00E5FF] transition-all disabled:opacity-40"
                  title="Synthesize Profile with AI"
                >
                  {isRegenerating ? (
                    <svg className="animate-spin h-4 w-4 text-[#00E5FF]" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <RotateIcon className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  disabled={isSomeActionLoading}
                  className="p-1.5 border border-[#2E2E3A] bg-[#12121A] text-[#8E8A84] hover:text-[#C8C0B8] hover:border-[#C8C0B8] transition-all disabled:opacity-40"
                  title="Edit Dossier"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onDelete(character.id)}
                  disabled={isSomeActionLoading}
                  className="p-1.5 border border-[#2E2E3A] bg-[#12121A] text-[#8E8A84] hover:text-[#FF2244] hover:border-[#FF2244] transition-all disabled:opacity-40"
                  title="Delete Dossier"
                >
                  <DeleteIcon className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Archetype */}
        <div className="mb-3 relative z-10">
          {isEditing ? (
            <input
              type="text"
              value={editedCharacter.archetype}
              onChange={(e) => handleInputChange('archetype', e.target.value)}
              className="font-mono text-xs text-[#C8C0B8] bg-[#0A0A0F] border border-[#2E2E3A] p-1.5 w-full"
              placeholder="Archetype"
            />
          ) : (
            <p className="font-sans text-xs italic text-[#00E5FF] font-medium">
              "{character.archetype}"
            </p>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-3 relative z-10">
          {/* Visuals */}
          <div className="bg-[#12121A] p-3 border border-[#2E2E3A]">
            <h5 className="font-mono text-[10px] font-bold uppercase text-[#FF2244] tracking-wider mb-1 flex items-center gap-1">
              <span>⚡ VISUAL PROFILE</span>
            </h5>
            {isEditing ? (
              <textarea
                value={editedCharacter.visuals}
                onChange={(e) => handleInputChange('visuals', e.target.value)}
                rows={2}
                className="font-sans text-xs text-[#C8C0B8] bg-[#0A0A0F] border border-[#2E2E3A] p-2 w-full resize-y"
              />
            ) : (
              <p className="font-sans text-xs text-[#C8C0B8] leading-relaxed">{character.visuals}</p>
            )}
          </div>

          {/* Backstory */}
          <div className="bg-[#12121A] p-3 border border-[#2E2E3A]">
            <h5 className="font-mono text-[10px] font-bold uppercase text-[#8E8A84] tracking-wider mb-1 flex items-center gap-1">
              <span>📜 OPERATIONAL HISTORY</span>
            </h5>
            {isEditing ? (
              <textarea
                value={editedCharacter.backstory}
                onChange={(e) => handleInputChange('backstory', e.target.value)}
                rows={2}
                className="font-sans text-xs text-[#C8C0B8] bg-[#0A0A0F] border border-[#2E2E3A] p-2 w-full resize-y"
              />
            ) : (
              <p className="font-sans text-xs text-[#8E8A84] leading-relaxed">{character.backstory}</p>
            )}
          </div>

          {/* Cyberware tags */}
          {character.cyberware && character.cyberware.length > 0 && !isEditing && (
            <div className="pt-1">
              <h5 className="font-mono text-[10px] font-bold uppercase text-[#8E8A84] tracking-wider mb-1.5">
                CYBERNETIC MODIFICATIONS
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {character.cyberware.map((c, i) => (
                  <span
                    key={i}
                    className="font-mono text-[10px] px-2 py-0.5 bg-[#0A0A0F] text-[#00E5FF] border border-[#00E5FF]/30"
                  >
                    ⚙ {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isEditing && (
            <div className="pt-1">
              <h5 className="font-mono text-[10px] font-bold uppercase text-[#8E8A84] tracking-wider mb-1">
                AVATAR IMAGE URL
              </h5>
              <input
                type="text"
                value={editedCharacter.avatarUrl || ''}
                onChange={(e) => handleInputChange('avatarUrl', e.target.value)}
                placeholder="https://..."
                className="font-mono text-xs text-[#C8C0B8] bg-[#0A0A0F] border border-[#2E2E3A] p-2 w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterCard;

