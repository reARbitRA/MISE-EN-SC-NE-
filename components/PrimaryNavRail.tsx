import React from 'react';
import { NexusIcon } from './icons/NexusIcon';
import { StoryflowIcon } from './icons/StoryflowIcon';
import { CharactersIcon } from './icons/CharactersIcon';
import { LoreKeeperIcon } from './icons/LoreKeeperIcon';
import { StyleAlchemistIcon } from './icons/StyleAlchemistIcon';
import { FrameGeneratorIcon } from './icons/FrameGeneratorIcon';
import { PanelAssemblerIcon } from './icons/PanelAssemblerIcon';
import { SoundtrackComposerIcon } from './icons/SoundtrackComposerIcon';
import { ExportIcon } from './icons/ExportIcon';
import { SettingsIcon } from './icons/SettingsIcon';
import { View } from '../App';

interface NavItemProps {
  icon: React.ReactNode;
  label: View;
  code: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, code, isActive = false, onClick }) => {
  const activeClasses = isActive
    ? 'bg-[#FF2244] text-[#0A0A0F] border-[#FF2244] shadow-[4px_4px_0px_#0A0A0F] glow-crimson font-bold'
    : 'bg-[#1A1A24] text-[#8A8490] border-[#2E2E3A] hover:text-[#FF2244] hover:border-[#FF2244] hover:bg-[#2E2E3A]';

  return (
    <div className="relative group w-full px-2 flex justify-center">
      <button
        onClick={onClick}
        className={`w-14 h-12 flex flex-col items-center justify-center border transition-all duration-150 relative ${activeClasses}`}
        aria-label={label}
      >
        <div className="flex items-center justify-center">
          {icon}
        </div>
        <span className="text-[9px] font-mono-code font-bold uppercase tracking-wider mt-0.5 leading-none">
          {code}
        </span>
        {isActive && (
          <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#00E5FF] shadow-[0_0_8px_#00E5FF]"></span>
        )}
      </button>

      {/* Expanded Hover Tooltip */}
      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#1A1A24] text-[#C8C0B8] border-2 border-[#FF2244] shadow-[4px_4px_0px_#0A0A0F] text-xs font-heading uppercase tracking-widest scale-0 group-hover:scale-100 transition-transform origin-left pointer-events-none z-50 whitespace-nowrap flex items-center gap-2">
        <span className="w-2 h-2 bg-[#FF2244]"></span>
        <span>{label}</span>
      </div>
    </div>
  );
};

interface PrimaryNavRailProps {
  activeView: View;
  onNavigate: (view: View) => void;
  onToggleAiConsole?: () => void;
}

const PrimaryNavRail: React.FC<PrimaryNavRailProps> = ({ activeView, onNavigate, onToggleAiConsole }) => {
  const mainNavItems: { icon: JSX.Element; label: View; code: string }[] = [
    { icon: <NexusIcon className="w-4 h-4" />, label: 'Nexus', code: 'NXS' },
    { icon: <StoryflowIcon className="w-4 h-4" />, label: 'Storyflow', code: 'SFG' },
    { icon: <CharactersIcon className="w-4 h-4" />, label: 'Characters', code: 'CHR' },
    { icon: <LoreKeeperIcon className="w-4 h-4" />, label: 'Lore Keeper', code: 'LOR' },
    { icon: <StyleAlchemistIcon className="w-4 h-4" />, label: 'Style Alchemist', code: 'STY' },
    { icon: <FrameGeneratorIcon className="w-4 h-4" />, label: 'Frame Generator', code: 'FRM' },
    { icon: <PanelAssemblerIcon className="w-4 h-4" />, label: 'Panel Assembler', code: 'PNL' },
    { icon: <SoundtrackComposerIcon className="w-4 h-4" />, label: 'Soundtrack Composer', code: 'SND' },
  ];

  const utilityNavItems: { icon: JSX.Element; label: View; code: string }[] = [
    { icon: <ExportIcon className="w-4 h-4" />, label: 'Export Project', code: 'EXP' },
    { icon: <SettingsIcon className="w-4 h-4" />, label: 'Project Settings', code: 'SET' },
  ];

  return (
    <nav className="w-20 bg-[#0A0A0F] border-r-2 border-[#2E2E3A] flex flex-col items-center py-4 justify-between h-full select-none halftone-bg shrink-0">
      {/* Spine Header */}
      <div className="w-full flex flex-col items-center mb-4 pb-2 border-b border-[#2E2E3A]">
        <span className="text-[10px] font-mono-code text-[#FF2244] uppercase tracking-widest rotate-180 [writing-mode:vertical-lr] font-bold py-1">
          ▌ SPINE ▐
        </span>
      </div>

      {/* Main Chapter Navigation Items */}
      <div className="flex-1 w-full flex flex-col items-center space-y-2 overflow-y-auto custom-scrollbar py-1">
        {mainNavItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            code={item.code}
            isActive={activeView === item.label}
            onClick={() => onNavigate(item.label)}
          />
        ))}
      </div>

      {/* Bottom Utility Items & AI Trigger */}
      <div className="w-full flex flex-col items-center space-y-2 pt-3 border-t border-[#2E2E3A]">
        {utilityNavItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            code={item.code}
            isActive={activeView === item.label}
            onClick={() => onNavigate(item.label)}
          />
        ))}

        {/* AI Console Whisper Bar Button */}
        {onToggleAiConsole && (
          <button
            onClick={onToggleAiConsole}
            className="w-14 h-10 mt-2 bg-[#1A1A24] border border-[#00E5FF] text-[#00E5FF] flex items-center justify-center hover:bg-[#00E5FF] hover:text-[#0A0A0F] transition-all group relative"
            title="Toggle AI Whisper Bar"
          >
            <span className="font-mono-code text-xs font-bold uppercase animate-pulse">
              AI ◈
            </span>
          </button>
        )}
      </div>
    </nav>
  );
};

export default PrimaryNavRail;
