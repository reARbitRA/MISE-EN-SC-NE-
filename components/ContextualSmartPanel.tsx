import React from 'react';

const StatItem: React.FC<{ label: string; value: string | number; subtext?: string; accent?: 'crimson' | 'cyan' | 'amber' }> = ({
  label,
  value,
  subtext,
  accent = 'crimson',
}) => {
  const textColor = accent === 'crimson' ? 'text-[#FF2244]' : accent === 'cyan' ? 'text-[#00E5FF]' : 'text-[#FFB800]';
  return (
    <div className="flex justify-between items-baseline p-2.5 bg-[#1A1A24] border border-[#2E2E3A] shadow-[2px_2px_0px_#0A0A0F] hover:border-[#FF2244] transition-all">
      <div>
        <span className="text-[#C8C0B8] text-xs font-heading uppercase tracking-wide">{label}</span>
        {subtext && <span className="block text-[10px] text-[#8A8490] font-mono-code">{subtext}</span>}
      </div>
      <span className={`${textColor} font-display text-2xl font-bold`}>{value}</span>
    </div>
  );
};

export interface ActivityItemProps {
  imgSrc: string;
  userName: string;
  action: string;
  time: string;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ imgSrc, userName, action, time }) => (
  <div className="flex items-start space-x-3 py-2 border-b border-[#2E2E3A] last:border-0">
    <img src={imgSrc} alt={userName} className="w-6 h-6 border border-[#FF2244] flex-shrink-0 mt-0.5 object-cover" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-[#C8C0B8] leading-snug font-mono-code">
        <span className="font-bold text-[#FF2244] uppercase">{userName}</span> {action}
      </p>
      <p className="text-[9px] text-[#8A8490] mt-0.5 font-mono-code">{time}</p>
    </div>
  </div>
);

interface ContextualSmartPanelProps {
  recentFrames: string[];
  activityFeed: ActivityItemProps[];
  characterCount: number;
  loreCount?: number;
  paletteCount?: number;
  comicPageCount?: number;
  totalPanelsCount?: number;
  soundtrackCount?: number;
  currentPhase?: string;
}

const ContextualSmartPanel: React.FC<ContextualSmartPanelProps> = ({
  recentFrames,
  activityFeed,
  characterCount,
  loreCount = 0,
  paletteCount = 0,
  comicPageCount = 0,
  totalPanelsCount = 0,
  soundtrackCount = 0,
  currentPhase = 'CHAPTER 03: IN PRODUCTION',
}) => {
  return (
    <aside className="w-80 bg-[#0A0A0F] border-l-2 border-[#2E2E3A] p-4 hidden xl:flex flex-col space-y-5 overflow-y-auto custom-scrollbar halftone-bg shrink-0">
      {/* Studio Status Header */}
      <div>
        <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#2E2E3A]">
          <h3 className="text-xs font-heading uppercase tracking-widest text-[#FF2244] flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#FF2244]"></span>
            TELEMETRY & METRICS
          </h3>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00E5FF] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00E5FF]"></span>
          </span>
        </div>

        {/* Phase Badge */}
        <div className="p-2.5 bg-[#1A1A24] border-2 border-[#FF2244] mb-3 text-center shadow-[4px_4px_0px_#0A0A0F]">
          <span className="text-[9px] text-[#00E5FF] font-mono-code uppercase font-bold tracking-widest block mb-0.5">
            CURRENT PRODUCTION PHASE
          </span>
          <span className="text-xs font-display tracking-wider text-[#C8C0B8] uppercase">{currentPhase}</span>
        </div>

        {/* Production Metrics */}
        <div className="space-y-2">
          <StatItem label="Generated Frames" value={recentFrames.length} subtext="Concept projection cache" accent="crimson" />
          <StatItem label="Character Dossiers" value={characterCount} subtext="Active cast roster" accent="cyan" />
          <StatItem label="Lore & Worldbuilding" value={loreCount} subtext="Vault codex records" accent="amber" />
          <StatItem label="Comic Pages" value={comicPageCount} subtext={`${totalPanelsCount} assembled panels`} accent="crimson" />
          <StatItem label="Color Palettes" value={paletteCount} subtext="Shading & lighting presets" accent="cyan" />
          <StatItem label="Soundtrack Stems" value={soundtrackCount} subtext="Echo Chamber audio stems" accent="amber" />
        </div>
      </div>

      {/* Ink Consumption Gauge */}
      <div className="p-3 bg-[#1A1A24] border border-[#2E2E3A]">
        <div className="flex justify-between items-center text-xs font-heading text-[#C8C0B8] mb-1">
          <span>INK CONSUMPTION</span>
          <span className="text-[#FF2244] font-mono-code">1.82L / 3.00L</span>
        </div>
        <div className="w-full h-2.5 bg-[#0A0A0F] border border-[#2E2E3A] p-0.5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#FF2244] to-[#00E5FF] w-[60%]"></div>
        </div>
      </div>

      {/* Real-Time Activity Feed */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-heading uppercase tracking-widest text-[#8A8490]">
            LIVE STUDIO FEED
          </h3>
          <span className="text-[9px] text-[#00E5FF] font-mono-code">{activityFeed.length} EVENTS</span>
        </div>
        <div className="flex-1 overflow-y-auto bg-[#1A1A24] border border-[#2E2E3A] p-2.5 custom-scrollbar shadow-[2px_2px_0px_#0A0A0F]">
          {activityFeed.map((item, index) => (
            <ActivityItem key={index} {...item} />
          ))}
        </div>
      </div>
    </aside>
  );
};

export default ContextualSmartPanel;

