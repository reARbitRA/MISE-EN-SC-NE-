import React, { useState, memo, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import { SceneNodeData } from '../views/StoryflowView';
import { CharactersIcon } from '../icons/CharactersIcon';
import { DeleteIcon } from '../icons/DeleteIcon';
import { SparklesIcon } from '../icons/SparklesIcon';

const CustomSceneNode: React.FC<NodeProps<SceneNodeData>> = ({ id, data, isConnectable }) => {
  const {
    title,
    summary,
    chapter,
    characterIds,
    allCharacters,
    updateNodeData,
    onDeleteNode,
    onGenerateScript,
    script,
  } = data;

  const [isEditing, setIsEditing] = useState(false);
  const [localTitle, setLocalTitle] = useState(title);
  const [localSummary, setLocalSummary] = useState(summary);
  const [showScriptDrawer, setShowScriptDrawer] = useState(false);

  useEffect(() => {
    setLocalTitle(title);
    setLocalSummary(summary);
  }, [title, summary]);

  const handleBlur = () => {
    setIsEditing(false);
    updateNodeData(id, { title: localTitle, summary: localSummary });
  };

  const handleCharacterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCharId = e.target.value;
    if (selectedCharId && !characterIds.includes(selectedCharId)) {
      updateNodeData(id, { characterIds: [...characterIds, selectedCharId] });
    }
  };

  const removeCharacter = (charId: string) => {
    updateNodeData(id, { characterIds: characterIds.filter((cid) => cid !== charId) });
  };

  const linkedCharacters = allCharacters.filter((c) => characterIds.includes(c.id));

  return (
    <div className="relative bg-[#181820] border-2 border-[#2E2E3A] shadow-[6px_6px_0px_#0A0A0F] w-80 transition-all duration-200 hover:border-[#FF2244] group">
      <Handle type="target" position={Position.Top} className="!bg-[#FF2244] !w-3 !h-3 !rounded-none" isConnectable={isConnectable} />

      {/* Red Pushpin Vector Dot */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#FF2244] border-2 border-[#0A0A0F] shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-20 flex items-center justify-center">
        <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
      </div>

      {/* Header Bar */}
      <div className="p-3 border-b-2 border-[#2E2E3A] flex items-center justify-between bg-[#12121A]">
        <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-[#FF2244]">
          📌 {chapter || 'SCENE BEAT'}
        </span>
        <div className="flex items-center gap-1">
          {onGenerateScript && (
            <button
              onClick={() => onGenerateScript(id)}
              className="p-1 text-[#8E8A84] hover:text-[#00E5FF] hover:bg-[#1A1A24] transition-colors"
              title="Generate Panel Script with AI"
            >
              <SparklesIcon className="w-3.5 h-3.5" />
            </button>
          )}
          {onDeleteNode && (
            <button
              onClick={() => onDeleteNode(id)}
              className="p-1 text-[#8E8A84] hover:text-[#FF2244] hover:bg-[#1A1A24] transition-colors"
              title="Delete Scene"
            >
              <DeleteIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isEditing ? (
          <input
            type="text"
            value={localTitle}
            onChange={(e) => setLocalTitle(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
            autoFocus
            className="font-display text-lg font-bold text-[#00E5FF] bg-[#0A0A0F] border border-[#2E2E3A] px-2 py-1 w-full focus:outline-none focus:border-[#00E5FF]"
          />
        ) : (
          <h3
            onDoubleClick={() => setIsEditing(true)}
            className="font-display text-xl font-bold text-[#F0EBE1] cursor-pointer hover:text-[#00E5FF] transition-colors tracking-wide uppercase"
            title="Double-click to edit title"
          >
            {title}
          </h3>
        )}

        {isEditing ? (
          <textarea
            value={localSummary}
            onChange={(e) => setLocalSummary(e.target.value)}
            onBlur={handleBlur}
            rows={3}
            className="font-sans text-xs text-[#C8C0B8] bg-[#0A0A0F] border border-[#2E2E3A] p-2 w-full mt-2 focus:outline-none focus:border-[#00E5FF] resize-none"
          />
        ) : (
          <p
            onDoubleClick={() => setIsEditing(true)}
            className="font-sans text-xs text-[#C8C0B8] mt-2 leading-relaxed cursor-pointer hover:text-[#F0EBE1]"
            title="Double-click to edit summary"
          >
            {summary}
          </p>
        )}

        {/* AI Generated Script Preview toggle */}
        {script && (
          <div className="mt-3 pt-2 border-t border-[#2E2E3A]">
            <button
              onClick={() => setShowScriptDrawer((p) => !p)}
              className="font-mono text-[11px] font-bold text-[#00E5FF] hover:text-[#00E5FF]/80 flex items-center gap-1"
            >
              <span>{showScriptDrawer ? 'Hide Script' : '📜 View Script & Dialogue'}</span>
            </button>
            {showScriptDrawer && (
              <pre className="mt-2 p-2.5 bg-[#0A0A0F] text-[10px] text-[#C8C0B8] font-mono border border-[#2E2E3A] whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                {script}
              </pre>
            )}
          </div>
        )}
      </div>

      {/* Linked Characters section */}
      <div className="border-t border-[#2E2E3A] p-3 bg-[#12121A] space-y-2">
        <div className="flex items-center justify-between font-mono text-[10px] text-[#8E8A84] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1.5">
            <CharactersIcon className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>Cast in Scene</span>
          </div>
          <span className="text-[#00E5FF]">{linkedCharacters.length}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {linkedCharacters.map((char) => (
            <div
              key={char.id}
              className="bg-[#0A0A0F] text-[#00E5FF] font-mono text-[10px] px-2 py-0.5 flex items-center gap-1 border border-[#00E5FF]/30"
            >
              <span>{char.name}</span>
              <button onClick={() => removeCharacter(char.id)} className="text-[#8E8A84] hover:text-[#FF2244]">
                ×
              </button>
            </div>
          ))}
        </div>

        {allCharacters.length > 0 && (
          <select
            value=""
            onChange={handleCharacterChange}
            className="w-full bg-[#0A0A0F] border border-[#2E2E3A] p-1 font-mono text-[10px] text-[#8E8A84] focus:border-[#00E5FF] focus:outline-none"
          >
            <option value="" disabled>
              + Link Character...
            </option>
            {allCharacters
              .filter((c) => !characterIds.includes(c.id))
              .map((char) => (
                <option key={char.id} value={char.id}>
                  {char.name} ({char.role || 'Cast'})
                </option>
              ))}
          </select>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-[#FF2244] !w-3 !h-3 !rounded-none" isConnectable={isConnectable} />
    </div>
  );
};

export default memo(CustomSceneNode);

